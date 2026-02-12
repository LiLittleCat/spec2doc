const fs = require("node:fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  HeadingLevel,
  LevelFormat,
  PageNumber,
  Header,
  Footer,
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: border, bottom: border, left: border, right: border };
const headerShading = { fill: "4472C4", type: ShadingType.CLEAR };

const doc = new Document({
  styles: {
    default: { document: { run: { font: "微软雅黑", size: 22 } } },
    paragraphStyles: [
      {
        id: "Title",
        name: "Title",
        basedOn: "Normal",
        run: { size: 56, bold: true, color: "000000", font: "微软雅黑" },
        paragraph: { spacing: { before: 240, after: 240 }, alignment: AlignmentType.CENTER },
      },
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, color: "2F5496", font: "微软雅黑" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, color: "2F5496", font: "微软雅黑" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, color: "1F4E78", font: "微软雅黑" },
        paragraph: { spacing: { before: 120, after: 100 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: "bullet-list",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: "接口文档", size: 20, color: "666666" })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "第 ", size: 20 }),
                new TextRun({ children: [PageNumber.CURRENT], size: 20 }),
                new TextRun({ text: " 页，共 ", size: 20 }),
                new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 20 }),
                new TextRun({ text: " 页", size: 20 }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun("{title}")],
        }),
        new Paragraph({
          spacing: { before: 120, after: 240 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "版本：{version}", size: 24, color: "666666" })],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("1. 文档说明")],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("{description}")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.1 基本信息")],
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
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "项目名称", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{title}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "服务地址", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{baseUrl}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "文档版本", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{version}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "更新日期", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{updateDate}")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("2. 接口列表")],
        }),

        // API Groups Loop
        new Paragraph({
          children: [new TextRun("{#apiGroups}")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("{tagName}")],
        }),

        // APIs Loop
        new Paragraph({
          children: [new TextRun("{#apis}")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("{summary}")],
        }),

        new Paragraph({
          spacing: { before: 60 },
          children: [new TextRun({ text: "接口概述", bold: true })],
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
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "请求方法", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{method}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "接口路径", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{path}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: "Content-Type", bold: true })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{contentType}")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "功能描述", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{description}")] })],
                }),
              ],
            }),
          ],
        }),

        // Path Parameters
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Path 参数", bold: true })],
        }),
        new Table({
          columnWidths: [1872, 1404, 1170, 1404, 3510],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "参数名", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{#pathParams}{name}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{type}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("{required}")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{example}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("{description}{/pathParams}")] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Query Parameters
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Query 参数", bold: true })],
        }),
        new Table({
          columnWidths: [1872, 1404, 1170, 1404, 3510],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "参数名", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{#queryParams}{name}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{type}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("{required}")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{example}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("{description}{/queryParams}")] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Body Parameters
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "Body 参数（JSON）", bold: true })],
        }),
        new Table({
          columnWidths: [1872, 1404, 1170, 1404, 3510],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "必填", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{#bodyParams}{name}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{type}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("{required}")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{example}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("{description}{/bodyParams}")] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Request body example
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "请求 Body 示例", bold: true })],
        }),
        new Paragraph({
          children: [new TextRun("{requestBodyExample}")],
        }),

        // Response
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "响应结果", bold: true })],
        }),
        new Paragraph({
          children: [new TextRun("{#responses}")],
        }),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "状态码 {statusCode} - {description}", bold: true })],
        }),
        new Table({
          columnWidths: [1872, 1404, 1404, 4680],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "类型", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "示例值", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "说明", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{#fields}{name}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{type}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{example}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{description}{/fields}")] })],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "响应 Body 示例", bold: true })],
        }),
        new Paragraph({
          children: [new TextRun("{bodyExample}")],
        }),
        new Paragraph({
          children: [new TextRun("{/responses}")],
        }),

        // End APIs loop
        new Paragraph({
          children: [new TextRun("{/apis}")],
        }),

        // End API Groups loop
        new Paragraph({
          children: [new TextRun("{/apiGroups}")],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("D:/dev/my-project/spec2doc/assets/接口文档模板.docx", buffer);
  console.log("接口文档模板（docxtemplater）创建成功！");
});
