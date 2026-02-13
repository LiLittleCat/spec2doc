import { readGenerationSettings } from "@/lib/generationSettings";
import { readFile } from "@tauri-apps/plugin-fs";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

interface DocxtemplaterSubError {
  properties?: {
    id?: string;
    explanation?: string;
    context?: string;
    xtag?: string;
  };
}

interface DocxtemplaterError extends Error {
  properties?: {
    errors?: DocxtemplaterSubError[];
    id?: string;
    explanation?: string;
    context?: string;
    xtag?: string;
  };
}

const templateErrorMessages: Record<string, (tag: string) => string> = {
  unclosed_tag: (tag) => `占位符 "{${tag}" 缺少关闭符号 "}"`,
  unopened_tag: (tag) => `占位符 "${tag}}" 缺少开始符号 "{"`,
  duplicate_open_tag: (tag) => `占位符 "${tag}" 出现了连续的 "{{"，缺少对应的 "}"`,
  duplicate_close_tag: (tag) => `占位符 "${tag}" 出现了连续的 "}}"，缺少对应的 "{"`,
  unclosed_loop: (tag) => `循环标签 "{#${tag}}" 缺少对应的结束标签 "{/${tag}}"`,
  unopened_loop: (tag) => `结束标签 "{/${tag}}" 缺少对应的开始标签 "{#${tag}}"`,
  closing_tag_does_not_match_opening_tag: (tag) =>
    `结束标签 "{/${tag}}" 与开始标签不匹配，请检查标签名是否一致`,
  raw_xml_tag_should_be_only_text_in_paragraph: (tag) =>
    `原始 XML 标签 "{@${tag}}" 必须单独占一个段落`,
};

function formatTemplateError(error: DocxtemplaterError): string {
  const subErrors = error.properties?.errors;

  if (subErrors && subErrors.length > 0) {
    const messages = subErrors.map((subError) => {
      const id = subError.properties?.id;
      const tag = subError.properties?.xtag || subError.properties?.context || "?";
      const explanation = subError.properties?.explanation;

      if (id && templateErrorMessages[id]) {
        return templateErrorMessages[id](tag.trim());
      }

      if (explanation) {
        return explanation;
      }

      return `未知模板错误: ${JSON.stringify(subError.properties || subError)}`;
    });

    const header = `模板语法错误（共 ${messages.length} 处）：`;
    return `${header}\n${messages.map((m, i) => `${i + 1}. ${m}`).join("\n")}`;
  }

  if (error.properties?.explanation) {
    return `模板语法错误：${error.properties.explanation}`;
  }

  return `模板错误：${error.message}`;
}

/**
 * 基于模板的 OpenAPI 文档生成器
 */
export class OpenAPIDocGenerator {
  private openApiSpec: any;

  constructor(openApiSpec: any) {
    this.openApiSpec = openApiSpec;
  }

  /**
   * 从模板生成文档
   * @param templatePath 模板文件路径
   * @returns 生成的文档 Blob
   */
  async generateFromTemplate(templatePath: string): Promise<Blob> {
    try {
      // 读取模板文件
      const templateContent = await readFile(templatePath);
      const templateBuffer = templateContent.buffer;

      // 加载模板
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // 准备模板数据
      const templateData = this.prepareTemplateData();

      // 渲染模板
      doc.render(templateData);

      const generationSettings = readGenerationSettings();
      if (!generationSettings.repeatTableHeaderOnPageBreak) {
        this.removeRepeatTableHeaders(doc.getZip());
      }

      // 生成文档
      const output = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      return output;
    } catch (error) {
      console.error("模板生成失败:", error);

      const docxError = error as DocxtemplaterError;
      if (docxError.properties?.errors || docxError.properties?.id) {
        throw new Error(formatTemplateError(docxError));
      }

      if (error instanceof Error) {
        const msg = error.message;
        if (msg.includes("not a valid zip") || msg.includes("Corrupted")) {
          throw new Error("模板文件无效：不是有效的 .docx 文件，请检查文件是否损坏");
        }
        throw new Error(`模板生成失败: ${msg}`);
      }
      throw new Error(`模板生成失败: ${error}`);
    }
  }

  /**
   * 准备模板数据
   */
  private prepareTemplateData(): any {
    const spec = this.openApiSpec;

    // 基本信息
    const info = {
      title: spec.info?.title || "未命名 API",
      version: spec.info?.version || "1.0.0",
      description: spec.info?.description || "",
      baseUrl: spec.servers?.[0]?.url || "N/A",
      updateDate: new Date().toLocaleDateString("zh-CN"),
    };

    // 按 tag 分组接口
    const apiGroups = this.groupApisByTag();

    return {
      ...info,
      apiGroups,
    };
  }

  /**
   * 按 tag 分组 API
   */
  private groupApisByTag(): any[] {
    const groups: Record<string, any> = {};

    for (const [path, methods] of Object.entries(this.openApiSpec.paths || {})) {
      for (const [method, operation] of Object.entries(methods as any)) {
        const tag = (operation as any).tags?.[0] || "未分类";

        if (!groups[tag]) {
          groups[tag] = {
            tagName: tag,
            apis: [],
          };
        }

        groups[tag].apis.push(this.parseApiOperation(path, method.toUpperCase(), operation));
      }
    }

    return Object.values(groups);
  }

  /**
   * 解析单个 API 操作
   */
  private parseApiOperation(path: string, method: string, operation: any): any {
    const contentType = operation.requestBody?.content
      ? Object.keys(operation.requestBody.content)[0]
      : "application/json";

    const pathParams = this.extractParameters(operation.parameters, "path");
    const queryParams = this.extractParameters(operation.parameters, "query");
    const headerParams = this.extractParameters(operation.parameters, "header");
    const bodyParams = this.extractBodyParameters(operation.requestBody);

    return {
      summary: operation.summary || path,
      method,
      path,
      contentType,
      description: operation.description || operation.summary || "",
      pathParams,
      queryParams,
      headerParams,
      bodyParams,
      hasPathParams: pathParams.length > 0,
      hasQueryParams: queryParams.length > 0,
      hasBodyParams: bodyParams.length > 0,
      requestBodyExample: this.extractRequestBodyExample(operation.requestBody),
      responses: this.extractResponses(operation.responses),
    };
  }

  /**
   * 提取参数
   */
  private extractParameters(parameters: any[] | undefined, paramType: string): any[] {
    if (!parameters) return [];

    return parameters
      .filter((p: any) => p.in === paramType)
      .map((p: any) => ({
        name: p.name,
        type: this.getSchemaType(p.schema),
        required: p.required ? "是" : "否",
        description: p.description || "",
        example: p.example || p.schema?.example || "",
      }));
  }

  /**
   * 提取 Body 参数
   */
  private extractBodyParameters(requestBody: any): any[] {
    if (!requestBody?.content) return [];

    const bodyContent = Object.values(requestBody.content)[0] as any;
    const bodySchema = bodyContent.schema;

    if (!bodySchema?.properties) return [];

    return this.flattenProperties(bodySchema);
  }

  /**
   * 提取请求 Body 示例
   */
  private extractRequestBodyExample(requestBody: any): string {
    if (!requestBody?.content) return "";

    const bodyContent = Object.values(requestBody.content)[0] as any;
    let bodySchema = bodyContent?.schema;

    if (bodySchema?.$ref) {
      bodySchema = this.resolveSchema(bodySchema.$ref);
    }

    return this.extractExampleFromContent(bodyContent, bodySchema);
  }

  /**
   * 提取响应信息
   */
  private extractResponses(responses: any): any[] {
    if (!responses) return [];

    const result: any[] = [];
    for (const [statusCode, response] of Object.entries(responses)) {
      const responseItem = response as any;
      let responseSchema = null;
      let bodyExample = "";

      if (responseItem?.content) {
        const responseContent = Object.values(responseItem.content)[0] as any;
        responseSchema = responseContent?.schema;

        if (responseSchema?.$ref) {
          responseSchema = this.resolveSchema(responseSchema.$ref);
        }

        bodyExample = this.extractExampleFromContent(responseContent, responseSchema);
      }

      result.push({
        statusCode,
        description: responseItem?.description || this.getDefaultErrorMessage(statusCode),
        fields: responseSchema ? this.flattenProperties(responseSchema) : [],
        bodyExample,
      });
    }

    return result;
  }

  /**
   * 获取默认错误消息
   */
  private getDefaultErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      "200": "成功",
      "400": "请求参数错误",
      "401": "未授权，Token无效或已过期",
      "403": "无权限访问该资源",
      "404": "请求的资源不存在",
      "500": "服务器内部错误",
    };
    return messages[code] || "未知错误";
  }

  /**
   * 解析 schema 类型
   */
  private getSchemaType(schema: any): string {
    if (!schema) return "any";
    if (schema.$ref) {
      return schema.$ref.split("/").pop();
    }
    if (schema.type === "array") {
      return `array<${this.getSchemaType(schema.items)}>`;
    }
    if (schema.type === "object") {
      return "object";
    }
    if (schema.format) {
      return `${schema.type}(${schema.format})`;
    }
    if (schema.enum) {
      return schema.enum.join(" | ");
    }
    return schema.type || "any";
  }

  /**
   * 解析 $ref 引用
   */
  private resolveSchema(ref: string): any {
    if (!ref || !ref.startsWith("#/components/schemas/")) return null;
    const schemaName = ref.split("/").pop();
    return this.openApiSpec.components?.schemas?.[schemaName];
  }

  /**
   * 从 content 中提取示例（example/examples/schema.example）
   */
  private extractExampleFromContent(content: any, schema?: any): string {
    const contentExample = content?.example;
    const examplesExample = this.extractFirstExampleValue(content?.examples);
    const schemaExample = schema?.example;
    const generatedExample = this.buildExampleFromSchema(schema);

    return this.stringifyExample(
      contentExample ?? examplesExample ?? schemaExample ?? generatedExample,
    );
  }

  /**
   * 提取 examples 的第一个示例值
   */
  private extractFirstExampleValue(examples: any): any {
    if (!examples || typeof examples !== "object") return undefined;
    const firstExample = Object.values(examples)[0] as any;
    if (!firstExample) return undefined;
    if (typeof firstExample === "object" && "value" in firstExample) {
      return firstExample.value;
    }
    return firstExample;
  }

  /**
   * 将示例值转为文档可展示文本
   */
  private stringifyExample(value: any): string {
    if (value === undefined || value === null) return "";

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      try {
        const parsed = JSON.parse(trimmed);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return value;
      }
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  /**
   * 根据 schema 生成兜底示例
   */
  private buildExampleFromSchema(schema: any, depth = 0): any {
    if (!schema || depth > 5) return undefined;

    if (schema.$ref) {
      return this.buildExampleFromSchema(this.resolveSchema(schema.$ref), depth + 1);
    }

    if (schema.example !== undefined) {
      return schema.example;
    }

    if (Array.isArray(schema.enum) && schema.enum.length > 0) {
      return schema.enum[0];
    }

    if (Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
      return this.buildExampleFromSchema(schema.oneOf[0], depth + 1);
    }

    if (Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
      return this.buildExampleFromSchema(schema.anyOf[0], depth + 1);
    }

    if (Array.isArray(schema.allOf) && schema.allOf.length > 0) {
      const merged: Record<string, any> = {};
      schema.allOf.forEach((item: any) => {
        const example = this.buildExampleFromSchema(item, depth + 1);
        if (example && typeof example === "object" && !Array.isArray(example)) {
          Object.assign(merged, example);
        }
      });
      return Object.keys(merged).length > 0 ? merged : undefined;
    }

    if (schema.type === "object" || schema.properties) {
      const result: Record<string, any> = {};
      const properties = schema.properties || {};
      Object.entries(properties).forEach(([key, prop]) => {
        const example = this.buildExampleFromSchema(prop, depth + 1);
        if (example !== undefined) {
          result[key] = example;
        }
      });
      return Object.keys(result).length > 0 ? result : undefined;
    }

    if (schema.type === "array") {
      const itemExample = this.buildExampleFromSchema(schema.items, depth + 1);
      return itemExample === undefined ? [] : [itemExample];
    }

    if (schema.type === "string") return "string";
    if (schema.type === "integer") return 0;
    if (schema.type === "number") return 0;
    if (schema.type === "boolean") return false;

    return undefined;
  }

  /**
   * 扁平化对象属性
   */
  private flattenProperties(schema: any, prefix = ""): any[] {
    const results: any[] = [];
    if (!schema || !schema.properties) return results;

    for (const [key, prop] of Object.entries(schema.properties)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const isRequired = schema.required?.includes(key) ? "是" : "否";
      const type = this.getSchemaType(prop);
      const description = (prop as any).description || "";
      const example =
        (prop as any).example || ((prop as any).enum ? (prop as any).enum.join(" | ") : "");

      results.push({ name: fieldName, type, required: isRequired, description, example });

      // 如果是嵌套对象，递归展开
      if ((prop as any).type === "object" && (prop as any).properties) {
        results.push(...this.flattenProperties(prop, fieldName));
      }

      // 如果引用了其他 schema
      if ((prop as any).$ref) {
        const refSchema = this.resolveSchema((prop as any).$ref);
        if (refSchema) {
          results.push(...this.flattenProperties(refSchema, fieldName));
        }
      }
    }

    return results;
  }

  /**
   * 移除 Word 表格跨页重复表头标记（w:tblHeader）
   */
  private removeRepeatTableHeaders(zip: PizZip): void {
    const tableHeaderSelfClosingPattern = /<w:tblHeader(?:\s+[^>]*)?\/>/g;
    const tableHeaderOpenClosePattern = /<w:tblHeader(?:\s+[^>]*)?>\s*<\/w:tblHeader>/g;

    Object.keys(zip.files)
      .filter((fileName) => fileName.startsWith("word/") && fileName.endsWith(".xml"))
      .forEach((fileName) => {
        const file = zip.file(fileName);
        if (!file) return;

        const xml = file.asText();
        const patchedXml = xml
          .replace(tableHeaderSelfClosingPattern, "")
          .replace(tableHeaderOpenClosePattern, "");

        if (patchedXml !== xml) {
          zip.file(fileName, patchedXml);
        }
      });
  }
}
