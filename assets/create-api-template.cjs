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
          children: [new TextRun("接口文档")],
        }),
        new Paragraph({
          spacing: { before: 120, after: 240 },
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "版本：V1.0.0", size: 24, color: "666666" })],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("1. 文档说明")],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun(
              "本文档描述系统提供的API接口规范，包括接口地址、请求参数、响应数据等详细信息。",
            ),
          ],
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
                  children: [new Paragraph({ children: [new TextRun("【项目名称】")] })],
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
                  children: [new Paragraph({ children: [new TextRun("【API基础地址】")] })],
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
                  children: [new Paragraph({ children: [new TextRun("V1.0.0")] })],
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
                  children: [new Paragraph({ children: [new TextRun("【日期】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.2 认证方式")],
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [new TextRun("接口采用以下认证方式：")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("【认证方式说明，如：Bearer Token / API Key / OAuth 2.0等】")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("【Token放置位置，如：请求头 Authorization: Bearer {token}】")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("2. 接口列表")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("2.1 【接口名称】")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.1 接口概述")],
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
                    new Paragraph({ children: [new TextRun({ text: "接口名称", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【接口名称】")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "请求方法", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("【GET / POST / PUT / DELETE】")] }),
                  ],
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
                  children: [new Paragraph({ children: [new TextRun("【/api/v1/example】")] })],
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
                  children: [new Paragraph({ children: [new TextRun("application/json")] })],
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
                  children: [new Paragraph({ children: [new TextRun("【接口功能的详细描述】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.2 请求参数")],
        }),

        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "Header 参数", bold: true })],
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
                  children: [new Paragraph({ children: [new TextRun("Authorization")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("string")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("是")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("Bearer xxx")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("访问令牌")] })],
                }),
              ],
            }),
          ],
        }),

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
                  children: [new Paragraph({ children: [new TextRun("【参数名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【类型】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【是/否】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【示例】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【说明】")] })],
                }),
              ],
            }),
          ],
        }),

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
                  children: [new Paragraph({ children: [new TextRun("【字段名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【类型】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【是/否】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【示例】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3510, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【说明】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.3 响应结果")],
        }),

        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "成功响应（200）", bold: true })],
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
                  children: [new Paragraph({ children: [new TextRun("code")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("integer")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("200")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("响应状态码")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("message")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("string")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("success")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("响应消息")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("data")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("object")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("{...}")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("响应数据")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "错误响应", bold: true })],
        }),
        new Table({
          columnWidths: [1872, 7488],
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
                      children: [new TextRun({ text: "状态码", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
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
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("400")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("请求参数错误")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("401")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("未授权，Token无效或已过期")] }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("403")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("无权限访问该资源")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("404")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("请求的资源不存在")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("500")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("服务器内部错误")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.4 请求示例")],
        }),
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun("【请求示例代码，如 curl 命令或代码片段】")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("3. 数据模型")],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("本节描述接口中使用的通用数据模型和对象结构。")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("4. 错误码说明")],
        }),
        new Table({
          columnWidths: [1872, 7488],
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
                      children: [new TextRun({ text: "错误码", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "错误说明", bold: true, color: "FFFFFF" })],
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
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【错误码】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7488, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【错误说明】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("5. 附录")],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("5.1 更新历史")],
        }),
        new Table({
          columnWidths: [1872, 1872, 1872, 3744],
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
                      children: [new TextRun({ text: "版本", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "日期", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "修订人", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3744, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "修订内容", bold: true, color: "FFFFFF" })],
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
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("V1.0.0")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【日期】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【姓名】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3744, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("初始版本")] })],
                }),
              ],
            }),
          ],
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("D:/dev/my-project/spec2doc/assets/接口文档模板.docx", buffer);
  console.log("接口文档模板创建成功！");
});
