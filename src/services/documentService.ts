import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { readFile, writeFile } from '@tauri-apps/plugin-fs';
import * as yaml from 'js-yaml';
import { OpenAPIDocGenerator } from './docxGenerator';

/**
 * 文档生成服务
 */
export class DocumentService {
  /**
   * 选择 OpenAPI 文件
   */
  async selectOpenApiFile(): Promise<string | null> {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'OpenAPI',
        extensions: ['json', 'yaml', 'yml']
      }]
    });

    return selected as string | null;
  }

  /**
   * 选择模板文件
   */
  async selectTemplateFile(): Promise<string | null> {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Word Document',
        extensions: ['docx']
      }]
    });

    return selected as string | null;
  }

  /**
   * 选择输出路径
   */
  async selectOutputPath(defaultName: string): Promise<string | null> {
    const selected = await save({
      defaultPath: defaultName,
      filters: [{
        name: 'Word Document',
        extensions: ['docx']
      }]
    });

    return selected as string | null;
  }

  /**
   * 读取 OpenAPI 文件内容
   */
  async readOpenApiFile(filePath: string): Promise<any> {
    try {
      // 读取文件内容
      const contents = await readFile(filePath);
      const text = new TextDecoder().decode(contents);

      // 解析 JSON 或 YAML
      let spec: any;
      if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        // 解析 YAML
        spec = yaml.load(text);
      } else if (filePath.endsWith('.json')) {
        // 解析 JSON
        spec = JSON.parse(text);
      } else {
        // 尝试先解析 JSON，失败则尝试 YAML
        try {
          spec = JSON.parse(text);
        } catch {
          spec = yaml.load(text);
        }
      }

      // 简单验证
      const validation = await this.validateOpenApiSpec(spec);
      if (!validation.valid) {
        throw new Error('OpenAPI 规范验证失败: ' + validation.errors.join(', '));
      }

      return spec;
    } catch (error) {
      console.error('OpenAPI 解析失败:', error);
      throw new Error(`OpenAPI 文件解析失败: ${error}`);
    }
  }

  /**
   * 读取文件为 ArrayBuffer
   */
  async readFileAsArrayBuffer(filePath: string): Promise<ArrayBuffer> {
    try {
      // 使用 Tauri 的 fs 插件读取文件
      const contents = await readFile(filePath);
      return contents.buffer;
    } catch (error) {
      console.error('文件读取失败:', error);
      throw new Error(`文件读取失败: ${error}`);
    }
  }

  /**
   * 生成接口文档
   */
  async generateApiDocument(
    openApiSpec: any,
    outputPath: string,
    templatePath?: string,
    onProgress?: (message: string, percent: number) => void
  ): Promise<void> {
    try {
      onProgress?.('正在解析 OpenAPI 规范...', 10);

      // 如果没有指定模板，抛出错误
      if (!templatePath) {
        throw new Error('请先选择模板文件');
      }

      // 创建文档生成器
      const generator = new OpenAPIDocGenerator(openApiSpec);

      onProgress?.('正在生成文档内容...', 50);

      // 从模板生成文档
      const blob = await generator.generateFromTemplate(templatePath);

      onProgress?.('正在保存文档...', 80);

      // 将 Blob 转换为 ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // 保存文件
      await writeFile(outputPath, uint8Array);

      onProgress?.('文档生成完成！', 100);
    } catch (error) {
      console.error('文档生成失败:', error);
      throw new Error(`文档生成失败: ${error}`);
    }
  }

  /**
   * 从文本内容生成 OpenAPI 规范
   */
  parseOpenApiFromText(text: string): any {
    try {
      // 尝试解析 JSON
      return JSON.parse(text);
    } catch (jsonError) {
      // 如果 JSON 解析失败，尝试 YAML
      try {
        return yaml.load(text);
      } catch (yamlError) {
        throw new Error('无法解析内容，请确保是有效的 JSON 或 YAML 格式');
      }
    }
  }

  /**
   * 验证 OpenAPI 规范（简化版本，避免使用 swagger-parser）
   */
  async validateOpenApiSpec(spec: any): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // 基本结构验证
    if (!spec || typeof spec !== 'object') {
      errors.push('规范必须是一个对象');
      return { valid: false, errors };
    }

    // 检查 openapi 或 swagger 字段
    if (!spec.openapi && !spec.swagger) {
      errors.push('缺少 openapi 或 swagger 版本字段');
    }

    // 检查 info 对象
    if (!spec.info || typeof spec.info !== 'object') {
      errors.push('缺少 info 对象');
    } else {
      if (!spec.info.title) {
        errors.push('info.title 是必需的');
      }
      if (!spec.info.version) {
        errors.push('info.version 是必需的');
      }
    }

    // 检查 paths 对象
    if (!spec.paths || typeof spec.paths !== 'object') {
      errors.push('缺少 paths 对象');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// 导出单例
export const documentService = new DocumentService();
