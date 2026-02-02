import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFile } from '@tauri-apps/plugin-fs';

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

      // 生成文档
      const output = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      return output;
    } catch (error) {
      console.error('模板生成失败:', error);
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
      title: spec.info?.title || '未命名 API',
      version: spec.info?.version || '1.0.0',
      description: spec.info?.description || '',
      baseUrl: spec.servers?.[0]?.url || 'N/A',
      updateDate: new Date().toLocaleDateString('zh-CN'),
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
        const tag = (operation as any).tags?.[0] || '未分类';

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
      : 'application/json';

    return {
      summary: operation.summary || path,
      method,
      path,
      contentType,
      description: operation.description || operation.summary || '',
      pathParams: this.extractParameters(operation.parameters, 'path'),
      queryParams: this.extractParameters(operation.parameters, 'query'),
      headerParams: this.extractParameters(operation.parameters, 'header'),
      bodyParams: this.extractBodyParameters(operation.requestBody),
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
        required: p.required ? '是' : '否',
        description: p.description || '',
        example: p.example || p.schema?.example || '',
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
   * 提取响应信息
   */
  private extractResponses(responses: any): any[] {
    if (!responses) return [];

    const result: any[] = [];

    // 成功响应
    const response200 = responses['200'];
    if (response200?.content) {
      const responseContent = Object.values(response200.content)[0] as any;
      let responseSchema = responseContent.schema;

      if (responseSchema?.$ref) {
        responseSchema = this.resolveSchema(responseSchema.$ref);
      }

      if (responseSchema) {
        const fields = this.flattenProperties(responseSchema);
        result.push({
          statusCode: '200',
          description: response200.description || '成功',
          fields,
        });
      }
    }

    // 错误响应
    const errorCodes = ['400', '401', '403', '404', '500'];
    const errors: any[] = [];
    errorCodes.forEach((code) => {
      if (responses[code]) {
        errors.push({
          code,
          description: responses[code].description || this.getDefaultErrorMessage(code),
        });
      }
    });

    if (errors.length > 0) {
      result.push({
        statusCode: 'errors',
        errors,
      });
    }

    return result;
  }

  /**
   * 获取默认错误消息
   */
  private getDefaultErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      '400': '请求参数错误',
      '401': '未授权，Token无效或已过期',
      '403': '无权限访问该资源',
      '404': '请求的资源不存在',
      '500': '服务器内部错误',
    };
    return messages[code] || '未知错误';
  }

  /**
   * 解析 schema 类型
   */
  private getSchemaType(schema: any): string {
    if (!schema) return 'any';
    if (schema.$ref) {
      return schema.$ref.split('/').pop();
    }
    if (schema.type === 'array') {
      return `array<${this.getSchemaType(schema.items)}>`;
    }
    if (schema.type === 'object') {
      return 'object';
    }
    if (schema.format) {
      return `${schema.type}(${schema.format})`;
    }
    if (schema.enum) {
      return schema.enum.join(' | ');
    }
    return schema.type || 'any';
  }

  /**
   * 解析 $ref 引用
   */
  private resolveSchema(ref: string): any {
    if (!ref || !ref.startsWith('#/components/schemas/')) return null;
    const schemaName = ref.split('/').pop();
    return this.openApiSpec.components?.schemas?.[schemaName];
  }

  /**
   * 扁平化对象属性
   */
  private flattenProperties(schema: any, prefix = ''): any[] {
    const results: any[] = [];
    if (!schema || !schema.properties) return results;

    for (const [key, prop] of Object.entries(schema.properties)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const isRequired = schema.required?.includes(key) ? '是' : '否';
      const type = this.getSchemaType(prop);
      const description = (prop as any).description || '';
      const example = (prop as any).example || ((prop as any).enum ? (prop as any).enum.join(' | ') : '');

      results.push({ name: fieldName, type, required: isRequired, description, example });

      // 如果是嵌套对象，递归展开
      if ((prop as any).type === 'object' && (prop as any).properties) {
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
}
