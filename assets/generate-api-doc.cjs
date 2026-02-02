const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign,
        HeadingLevel, LevelFormat, PageNumber, Header, Footer } = require('docx');

// 读取 OpenAPI 文件
const openApiPath = 'D:/dev/my-project/spec2doc/assets/sample_openapi.json';
const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf-8'));

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "4472C4", type: ShadingType.CLEAR };

// 辅助函数：解析 schema 的类型
function getSchemaType(schema) {
  if (!schema) return 'any';
  if (schema.$ref) {
    return schema.$ref.split('/').pop();
  }
  if (schema.type === 'array') {
    return `array<${getSchemaType(schema.items)}>`;
  }
  if (schema.type === 'object') {
    return 'object';
  }
  if (schema.format) {
    return `${schema.type}(${schema.format})`;
  }
  return schema.type || 'any';
}

// 辅助函数：从 $ref 解析 schema
function resolveSchema(ref) {
  if (!ref || !ref.startsWith('#/components/schemas/')) return null;
  const schemaName = ref.split('/').pop();
  return openApiSpec.components?.schemas?.[schemaName];
}

// 辅助函数：扁平化对象属性
function flattenProperties(schema, prefix = '') {
  const results = [];
  if (!schema || !schema.properties) return results;

  for (const [key, prop] of Object.entries(schema.properties)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;
    const isRequired = schema.required?.includes(key) ? '是' : '否';
    const type = getSchemaType(prop);
    const description = prop.description || '';
    const example = prop.example || (prop.enum ? prop.enum.join(' | ') : '');

    results.push({ fieldName, type, isRequired, description, example });

    // 如果是嵌套对象，递归展开
    if (prop.type === 'object' && prop.properties) {
      results.push(...flattenProperties(prop, fieldName));
    }

    // 如果引用了其他 schema
    if (prop.$ref) {
      const refSchema = resolveSchema(prop.$ref);
      if (refSchema) {
        results.push(...flattenProperties(refSchema, fieldName));
      }
    }
  }

  return results;
}

// 生成文档内容
const children = [
  new Paragraph({
    heading: HeadingLevel.TITLE,
    children: [new TextRun(openApiSpec.info.title || "接口文档")]
  }),
  new Paragraph({
    spacing: { before: 120, after: 240 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: `版本：${openApiSpec.info.version}`, size: 24, color: "666666" })]
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("1. 文档说明")]
  }),
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun(openApiSpec.info.description || "本文档描述系统提供的API接口规范。")]
  }),

  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun("1.1 基本信息")]
  }),
  new Table({
    columnWidths: [2340, 7020],
    margins: { top: 100, bottom: 100, left: 180, right: 180 },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ children: [new TextRun({ text: "项目名称", bold: true })] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 7020, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(openApiSpec.info.title)] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "服务地址", bold: true })] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 7020, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(openApiSpec.servers?.[0]?.url || 'N/A')] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "文档版本", bold: true })] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 7020, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(openApiSpec.info.version)] })]
          })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 2340, type: WidthType.DXA },
            shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
            children: [new Paragraph({ children: [new TextRun({ text: "更新日期", bold: true })] })]
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 7020, type: WidthType.DXA },
            children: [new Paragraph({ children: [new TextRun(new Date().toLocaleDateString('zh-CN'))] })]
          })
        ]
      })
    ]
  }),

  new Paragraph({
    spacing: { before: 240 },
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun("2. 接口列表")]
  })
];

// 按 tag 分组接口
const apisByTag = {};
for (const [path, methods] of Object.entries(openApiSpec.paths)) {
  for (const [method, operation] of Object.entries(methods)) {
    const tag = operation.tags?.[0] || '未分类';
    if (!apisByTag[tag]) apisByTag[tag] = [];
    apisByTag[tag].push({ path, method: method.toUpperCase(), operation });
  }
}

// 生成每个接口的文档
let sectionIndex = 1;
for (const [tag, apis] of Object.entries(apisByTag)) {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(`2.${sectionIndex} ${tag}`)]
    })
  );

  let apiIndex = 1;
  for (const { path, method, operation } of apis) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_3,
        children: [new TextRun(`2.${sectionIndex}.${apiIndex} ${operation.summary || path}`)]
      })
    );

    // 接口概述表
    const contentType = operation.requestBody?.content
      ? Object.keys(operation.requestBody.content)[0]
      : 'application/json';

    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text: "接口概述", bold: true })]
      }),
      new Table({
        columnWidths: [2340, 7020],
        margins: { top: 100, bottom: 100, left: 180, right: 180 },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "接口名称", bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 7020, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(operation.summary)] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "请求方法", bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 7020, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(method)] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "接口路径", bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 7020, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(path)] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "Content-Type", bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 7020, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(contentType)] })]
              })
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 2340, type: WidthType.DXA },
                shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                children: [new Paragraph({ children: [new TextRun({ text: "功能描述", bold: true })] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 7020, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(operation.description || operation.summary)] })]
              })
            ]
          })
        ]
      })
    );

    // 请求参数
    children.push(
      new Paragraph({
        spacing: { before: 180 },
        children: [new TextRun({ text: "请求参数", bold: true, size: 24 })]
      })
    );

    // Path 参数
    const pathParams = operation.parameters?.filter(p => p.in === 'path') || [];
    if (pathParams.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "Path 参数", bold: true })]
        })
      );

      const pathParamRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1872, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "参数名", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1170, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 3510, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
              })]
            })
          ]
        })
      ];

      for (const param of pathParams) {
        pathParamRows.push(
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 1872, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.name)] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(getSchemaType(param.schema))] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1170, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(param.required ? '是' : '否')] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.example || param.schema?.example || '')] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 3510, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.description || '')] })]
              })
            ]
          })
        );
      }

      children.push(
        new Table({
          columnWidths: [1872, 1404, 1170, 1404, 3510],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: pathParamRows
        })
      );
    }

    // Query 参数
    const queryParams = operation.parameters?.filter(p => p.in === 'query') || [];
    if (queryParams.length > 0) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Query 参数", bold: true })]
        })
      );

      const queryParamRows = [
        new TableRow({
          tableHeader: true,
          children: [
            new TableCell({
              borders: cellBorders,
              width: { size: 1872, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "参数名", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1170, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 1404, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
              })]
            }),
            new TableCell({
              borders: cellBorders,
              width: { size: 3510, type: WidthType.DXA },
              shading: headerShading,
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
              })]
            })
          ]
        })
      ];

      for (const param of queryParams) {
        queryParamRows.push(
          new TableRow({
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 1872, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.name)] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(getSchemaType(param.schema))] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1170, type: WidthType.DXA },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(param.required ? '是' : '否')] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.example || param.schema?.example || '')] })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 3510, type: WidthType.DXA },
                children: [new Paragraph({ children: [new TextRun(param.description || '')] })]
              })
            ]
          })
        );
      }

      children.push(
        new Table({
          columnWidths: [1872, 1404, 1170, 1404, 3510],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: queryParamRows
        })
      );
    }

    // Body 参数
    if (operation.requestBody?.content) {
      const bodyContent = Object.values(operation.requestBody.content)[0];
      const bodySchema = bodyContent.schema;

      if (bodySchema && bodySchema.properties) {
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [new TextRun({ text: "Body 参数", bold: true })]
          })
        );

        const bodyFields = flattenProperties(bodySchema);
        const bodyRows = [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 1872, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1170, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 3510, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
                })]
              })
            ]
          })
        ];

        for (const field of bodyFields) {
          bodyRows.push(
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.fieldName)] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.type)] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun(field.isRequired)] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(String(field.example || ''))] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.description)] })]
                })
              ]
            })
          );
        }

        children.push(
          new Table({
            columnWidths: [1872, 1404, 1170, 1404, 3510],
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            rows: bodyRows
          })
        );
      }
    }

    // 响应结果
    children.push(
      new Paragraph({
        spacing: { before: 180 },
        children: [new TextRun({ text: "响应结果", bold: true, size: 24 })]
      })
    );

    const response200 = operation.responses?.['200'];
    if (response200?.content) {
      const responseContent = Object.values(response200.content)[0];
      const responseSchema = responseContent.schema;

      if (responseSchema) {
        children.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [new TextRun({ text: "成功响应（200）", bold: true })]
          })
        );

        // 解析响应 schema
        let actualSchema = responseSchema;
        if (responseSchema.$ref) {
          actualSchema = resolveSchema(responseSchema.$ref);
        }

        const responseFields = flattenProperties(actualSchema);
        const responseRows = [
          new TableRow({
            tableHeader: true,
            children: [
              new TableCell({
                borders: cellBorders,
                width: { size: 1872, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 1404, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })]
                })]
              }),
              new TableCell({
                borders: cellBorders,
                width: { size: 4680, type: WidthType.DXA },
                shading: headerShading,
                verticalAlign: VerticalAlign.CENTER,
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })]
                })]
              })
            ]
          })
        ];

        for (const field of responseFields) {
          responseRows.push(
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.fieldName)] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.type)] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(String(field.example || ''))] })]
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun(field.description)] })]
                })
              ]
            })
          );
        }

        children.push(
          new Table({
            columnWidths: [1872, 1404, 1404, 4680],
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            rows: responseRows
          })
        );
      }
    }

    apiIndex++;
  }

  sectionIndex++;
}

// 创建文档
const doc = new Document({
  styles: {
    default: { document: { run: { font: "微软雅黑", size: 22 } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "微软雅黑" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, color: "2F5496", font: "微软雅黑" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, color: "2F5496", font: "微软雅黑" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, color: "1F4E78", font: "微软雅黑" },
        paragraph: { spacing: { before: 120, after: 100 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: "bullet-list",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: "接口文档", size: 20, color: "666666" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "第 ", size: 20 }),
            new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
            new TextRun({ text: " 页，共 ", size: 20 }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
            new TextRun({ text: " 页", size: 20 })
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:/dev/my-project/spec2doc/output/设备管理平台接口文档.docx", buffer);
  console.log("✅ 接口文档生成成功！文件保存至: output/设备管理平台接口文档.docx");
});
