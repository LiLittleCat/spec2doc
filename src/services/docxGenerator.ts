import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell } from 'docx';

/**
 * OpenAPI 文档生成器
 */
export class OpenAPIDocGenerator {
  private openApiSpec: any;

  constructor(openApiSpec: any) {
    this.openApiSpec = openApiSpec;
  }

  /**
   * 从模板生成文档
   * @param templateBuffer 模板文件的 ArrayBuffer
   * @returns 生成的文档 Buffer
   */
  async generateFromTemplate(templateBuffer: ArrayBuffer): Promise<Blob> {
    // TODO: 实现从模板读取并替换占位符的逻辑
    // 目前 docx 库不支持直接读取和修改现有文档
    // 我们需要从头构建文档，但复用模板的样式

    return this.generateDocument();
  }

  /**
   * 生成完整文档
   */
  async generateDocument(): Promise<Blob> {
    const doc = this.buildDocument();
    return await Packer.toBlob(doc);
  }

  /**
   * 构建文档对象
   */
  private buildDocument(): Document {
    const sections = [{
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: this.buildDocumentContent()
    }];

    return new Document({
      styles: this.getDocumentStyles(),
      numbering: this.getNumberingConfig(),
      sections
    });
  }

  /**
   * 获取文档样式
   */
  private getDocumentStyles() {
    return {
      default: { document: { run: { font: "微软雅黑", size: 22 } } },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          run: { size: 56, bold: true, color: "000000", font: "微软雅黑" },
          paragraph: { spacing: { before: 240, after: 240 }, alignment: 'center' as const }
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, color: "2F5496", font: "微软雅黑" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 }
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 28, bold: true, color: "2F5496", font: "微软雅黑" },
          paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 }
        },
        {
          id: "Heading3",
          name: "Heading 3",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, color: "1F4E78", font: "微软雅黑" },
          paragraph: { spacing: { before: 120, after: 100 }, outlineLevel: 2 }
        }
      ]
    };
  }

  /**
   * 获取编号配置
   */
  private getNumberingConfig() {
    return {
      config: [
        {
          reference: "bullet-list",
          levels: [
            {
              level: 0,
              format: 'bullet' as const,
              text: "•",
              alignment: 'left' as const,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 }
                }
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * 构建文档内容
   */
  private buildDocumentContent(): any[] {
    const content: any[] = [];

    // 标题
    content.push(
      new Paragraph({
        heading: 'Title' as any,
        children: [new TextRun(this.openApiSpec.info?.title || "接口文档")]
      })
    );

    // 版本信息
    content.push(
      new Paragraph({
        spacing: { before: 120, after: 240 },
        alignment: 'center' as const,
        children: [
          new TextRun({
            text: `版本：${this.openApiSpec.info?.version || "1.0.0"}`,
            size: 24,
            color: "666666"
          })
        ]
      })
    );

    // 1. 文档说明
    content.push(
      new Paragraph({
        heading: 'Heading1' as any,
        children: [new TextRun("1. 文档说明")]
      })
    );

    content.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun(this.openApiSpec.info?.description || "本文档描述系统提供的API接口规范。")
        ]
      })
    );

    // 1.1 基本信息
    content.push(
      new Paragraph({
        heading: 'Heading2' as any,
        children: [new TextRun("1.1 基本信息")]
      })
    );

    content.push(this.createBasicInfoTable());

    // 2. 接口列表
    content.push(
      new Paragraph({
        spacing: { before: 240 },
        heading: 'Heading1' as any,
        children: [new TextRun("2. 接口列表")]
      })
    );

    // 按 tag 分组生成接口文档
    const apisByTag = this.groupApisByTag();
    let sectionIndex = 1;

    for (const [tag, apis] of Object.entries(apisByTag)) {
      content.push(
        new Paragraph({
          heading: 'Heading2' as any,
          children: [new TextRun(`2.${sectionIndex} ${tag}`)]
        })
      );

      let apiIndex = 1;
      for (const api of apis as any[]) {
        content.push(...this.buildApiSection(api, sectionIndex, apiIndex));
        apiIndex++;
      }

      sectionIndex++;
    }

    return content;
  }

  /**
   * 创建基本信息表格
   */
  private createBasicInfoTable(): Table {
    const border = { style: 'single' as const, size: 1, color: "CCCCCC" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };

    return new Table({
      columnWidths: [2340, 7020],
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              verticalAlign: 'center' as const,
              children: [new Paragraph({ children: [new TextRun({ text: "项目名称", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(this.openApiSpec.info?.title || "N/A")] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "服务地址", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(this.openApiSpec.servers?.[0]?.url || "N/A")] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "文档版本", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(this.openApiSpec.info?.version || "1.0.0")] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "更新日期", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(new Date().toLocaleDateString('zh-CN'))] })]
            })
          ]
        })
      ]
    });
  }

  /**
   * 按 tag 分组 API
   */
  private groupApisByTag(): Record<string, any[]> {
    const apisByTag: Record<string, any[]> = {};

    for (const [path, methods] of Object.entries(this.openApiSpec.paths || {})) {
      for (const [method, operation] of Object.entries(methods as any)) {
        const tag = (operation as any).tags?.[0] || '未分类';
        if (!apisByTag[tag]) {
          apisByTag[tag] = [];
        }
        apisByTag[tag].push({
          path,
          method: method.toUpperCase(),
          operation
        });
      }
    }

    return apisByTag;
  }

  /**
   * 构建单个 API 的文档部分
   */
  private buildApiSection(api: any, sectionIndex: number, apiIndex: number): any[] {
    const content: any[] = [];
    const { path, method, operation } = api;

    // API 标题
    content.push(
      new Paragraph({
        heading: 'Heading3' as any,
        children: [new TextRun(`2.${sectionIndex}.${apiIndex} ${operation.summary || path}`)]
      })
    );

    // 接口概述
    content.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "接口概述", bold: true })]
      })
    );

    content.push(this.createApiOverviewTable(path, method, operation));

    // 请求参数
    const paramTables = this.createParameterTables(operation);
    if (paramTables.length > 0) {
      content.push(
        new Paragraph({
          spacing: { before: 180 },
          children: [new TextRun({ text: "请求参数", bold: true, size: 24 })]
        })
      );
      content.push(...paramTables);
    }

    // 响应结果
    const responseTables = this.createResponseTables(operation);
    if (responseTables.length > 0) {
      content.push(
        new Paragraph({
          spacing: { before: 180 },
          children: [new TextRun({ text: "响应结果", bold: true, size: 24 })]
        })
      );
      content.push(...responseTables);
    }

    return content;
  }

  /**
   * 创建 API 概述表格
   */
  private createApiOverviewTable(path: string, method: string, operation: any): Table {
    const border = { style: 'single' as const, size: 1, color: "CCCCCC" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };

    const contentType = operation.requestBody?.content
      ? Object.keys(operation.requestBody.content)[0]
      : 'application/json';

    return new Table({
      columnWidths: [2340, 7020],
      margins: { top: 100, bottom: 100, left: 180, right: 180 },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "接口名称", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(operation.summary || path)] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "请求方法", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(method)] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "接口路径", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(path)] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "Content-Type", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(contentType)] })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 2340, type: 'dxa' as const },
              shading: { fill: "F2F2F2", type: 'clear' as const },
              children: [new Paragraph({ children: [new TextRun({ text: "功能描述", bold: true })] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 7020, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(operation.description || operation.summary || "")] })]
            })
          ]
        })
      ]
    });
  }

  /**
   * 创建参数表格
   */
  private createParameterTables(operation: any): any[] {
    const tables: any[] = [];

    // Path 参数
    const pathParams = operation.parameters?.filter((p: any) => p.in === 'path') || [];
    if (pathParams.length > 0) {
      tables.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "Path 参数", bold: true })]
        })
      );
      tables.push(this.createParameterTable(pathParams));
    }

    // Query 参数
    const queryParams = operation.parameters?.filter((p: any) => p.in === 'query') || [];
    if (queryParams.length > 0) {
      tables.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Query 参数", bold: true })]
        })
      );
      tables.push(this.createParameterTable(queryParams));
    }

    // Body 参数
    if (operation.requestBody?.content) {
      const bodyContent = Object.values(operation.requestBody.content)[0] as any;
      const bodySchema = bodyContent.schema;

      if (bodySchema?.properties) {
        tables.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: "Body 参数", bold: true })]
          })
        );
        tables.push(this.createBodyParameterTable(bodySchema));
      }
    }

    return tables;
  }

  /**
   * 创建参数表格（Path/Query）
   */
  private createParameterTable(params: any[]): Table {
    const border = { style: 'single' as const, size: 1, color: "CCCCCC" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };
    const headerShading = { fill: "4472C4", type: 'clear' as const };

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 1872, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "参数名", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1170, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 3510, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
            })]
          })
        ]
      })
    ];

    for (const param of params) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1872, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(param.name)] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(this.getSchemaType(param.schema))] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1170, type: 'dxa' as const },
              children: [new Paragraph({
                alignment: 'center' as const,
                children: [new TextRun(param.required ? '是' : '否')]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(param.example || param.schema?.example || '')] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 3510, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(param.description || '')] })]
            })
          ]
        })
      );
    }

    return new Table({
      columnWidths: [1872, 1404, 1170, 1404, 3510],
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      rows
    });
  }

  /**
   * 创建 Body 参数表格
   */
  private createBodyParameterTable(schema: any): Table {
    const border = { style: 'single' as const, size: 1, color: "CCCCCC" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };
    const headerShading = { fill: "4472C4", type: 'clear' as const };

    const fields = this.flattenProperties(schema);

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 1872, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1170, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 3510, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
            })]
          })
        ]
      })
    ];

    for (const field of fields) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1872, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.fieldName)] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.type)] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1170, type: 'dxa' as const },
              children: [new Paragraph({
                alignment: 'center' as const,
                children: [new TextRun(field.isRequired)]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(String(field.example || ''))] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 3510, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.description)] })]
            })
          ]
        })
      );
    }

    return new Table({
      columnWidths: [1872, 1404, 1170, 1404, 3510],
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      rows
    });
  }

  /**
   * 创建响应表格
   */
  private createResponseTables(operation: any): any[] {
    const tables: any[] = [];

    const response200 = operation.responses?.['200'];
    if (response200?.content) {
      const responseContent = Object.values(response200.content)[0] as any;
      let responseSchema = responseContent.schema;

      if (responseSchema?.$ref) {
        responseSchema = this.resolveSchema(responseSchema.$ref);
      }

      if (responseSchema) {
        tables.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: "成功响应（200）", bold: true })]
          })
        );
        tables.push(this.createResponseTable(responseSchema));
      }
    }

    return tables;
  }

  /**
   * 创建响应表格
   */
  private createResponseTable(schema: any): Table {
    const border = { style: 'single' as const, size: 1, color: "CCCCCC" };
    const cellBorders = { top: border, bottom: border, left: border, right: border };
    const headerShading = { fill: "4472C4", type: 'clear' as const };

    const fields = this.flattenProperties(schema);

    const rows = [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 1872, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 1404, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
            })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 4680, type: 'dxa' as const },
            shading: headerShading,
            verticalAlign: 'center' as const,
            children: [new Paragraph({
              alignment: 'center' as const,
              children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
            })]
          })
        ]
      })
    ];

    for (const field of fields) {
      rows.push(
        new TableRow({
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1872, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.fieldName)] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.type)] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(String(field.example || ''))] })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 4680, type: 'dxa' as const },
              children: [new Paragraph({ children: [new TextRun(field.description)] })]
            })
          ]
        })
      );
    }

    return new Table({
      columnWidths: [1872, 1404, 1404, 4680],
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      rows
    });
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
  private flattenProperties(schema: any, prefix = ''): Array<{
    fieldName: string;
    type: string;
    isRequired: string;
    description: string;
    example: string;
  }> {
    const results: Array<any> = [];
    if (!schema || !schema.properties) return results;

    for (const [key, prop] of Object.entries(schema.properties)) {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      const isRequired = schema.required?.includes(key) ? '是' : '否';
      const type = this.getSchemaType(prop);
      const description = (prop as any).description || '';
      const example = (prop as any).example || ((prop as any).enum ? (prop as any).enum.join(' | ') : '');

      results.push({ fieldName, type, isRequired, description, example });

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
