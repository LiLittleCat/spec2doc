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
const headerShading = { fill: "70AD47", type: ShadingType.CLEAR };

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
        run: { size: 32, bold: true, color: "375623", font: "微软雅黑" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, color: "375623", font: "微软雅黑" },
        paragraph: { spacing: { before: 180, after: 120 }, outlineLevel: 1 },
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 24, bold: true, color: "548235", font: "微软雅黑" },
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
              children: [new TextRun({ text: "数据库设计文档", size: 20, color: "666666" })],
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
          children: [new TextRun("数据库设计文档")],
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
              "本文档描述系统数据库的设计方案，包括数据表结构、字段定义、索引设计、关系说明等内容。",
            ),
          ],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.1 数据库基本信息")],
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
                    new Paragraph({ children: [new TextRun({ text: "数据库名称", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【数据库名称】")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "数据库类型", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun("【MySQL / PostgreSQL / Oracle / SQL Server】")],
                    }),
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
                    new Paragraph({ children: [new TextRun({ text: "数据库版本", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【版本号】")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "字符集", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("utf8mb4")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "排序规则", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("utf8mb4_general_ci")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "存储引擎", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("InnoDB")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("1.2 命名规范")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("表名：使用小写字母和下划线，如 user_info、order_detail")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("字段名：使用小写字母和下划线，如 user_id、create_time")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("索引名：idx_字段名（普通索引）、uk_字段名（唯一索引）")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("主键：统一使用 id 作为主键字段名")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("2. 数据表设计")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("2.1 【表名】")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.1 表基本信息")],
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
                    new Paragraph({ children: [new TextRun({ text: "表名", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【表名，如：user_info】")] })],
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
                    new Paragraph({ children: [new TextRun({ text: "表注释", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("【表功能说明，如：用户信息表】")] }),
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
                    new Paragraph({ children: [new TextRun({ text: "存储引擎", bold: true })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("InnoDB")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.2 字段设计")],
        }),
        new Table({
          columnWidths: [1404, 1170, 936, 936, 702, 702, 936, 2214],
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "字段名", bold: true, color: "FFFFFF", size: 20 }),
                      ],
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
                      children: [
                        new TextRun({ text: "数据类型", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "长度", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "允许空", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "主键", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "外键", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "默认值", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2214, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new TextRun({ text: "字段说明", bold: true, color: "FFFFFF", size: 20 }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "id", size: 20 })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "BIGINT", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "20", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "是", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "AUTO", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2214, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "主键ID，自增", size: 20 })] }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "【字段名】", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "【类型】", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "【长度】", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "【是/否】", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "【是/否】", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "【是/否】", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "【值】", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2214, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "【说明】", size: 20 })] }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "create_time", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "DATETIME", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "-", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "NOW()", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2214, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "创建时间", size: 20 })] }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "update_time", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "DATETIME", size: 20 })] }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "-", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 702, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "否", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "NOW()", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2214, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "更新时间", size: 20 })] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.3 索引设计")],
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
                      children: [new TextRun({ text: "索引名", bold: true, color: "FFFFFF" })],
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
                      children: [new TextRun({ text: "索引类型", bold: true, color: "FFFFFF" })],
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
                      children: [new TextRun({ text: "索引字段", bold: true, color: "FFFFFF" })],
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
                      children: [new TextRun({ text: "索引说明", bold: true, color: "FFFFFF" })],
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
                  children: [new Paragraph({ children: [new TextRun("PRIMARY")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("主键索引")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("id")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3744, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("主键")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【索引名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【普通/唯一/全文】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1872, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【字段名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3744, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【索引用途说明】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun("2.1.4 外键关系")],
        }),
        new Table({
          columnWidths: [2340, 2340, 2340, 2340],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "外键字段", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "关联表", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "关联字段", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "关系说明", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【外键字段】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【关联的表名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【关联表的字段】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【关系描述】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("3. 表关系图")],
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun("【此处可插入 ER 图或表关系示意图】")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("4. 数据字典")],
        }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("4.1 枚举值定义")],
        }),
        new Table({
          columnWidths: [2340, 2340, 4680],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "字段", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "枚举值", bold: true, color: "FFFFFF" })],
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
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【字段名】")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun("【枚举值】")],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 4680, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("【枚举值含义】")] })],
                }),
              ],
            }),
          ],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("5. 性能优化建议")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("合理设计索引，避免过度索引")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("大文本字段考虑独立存储")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("适当使用分区表处理海量数据")],
        }),
        new Paragraph({
          numbering: { reference: "bullet-list", level: 0 },
          children: [new TextRun("定期清理历史数据，保持表规模合理")],
        }),

        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("6. 附录")],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("6.1 变更历史")],
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
                      children: [new TextRun({ text: "变更内容", bold: true, color: "FFFFFF" })],
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

        new Paragraph({
          spacing: { before: 180 },
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("6.2 常用数据类型说明")],
        }),
        new Table({
          columnWidths: [2340, 7020],
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "数据类型", bold: true, color: "FFFFFF" })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
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
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("BIGINT")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("大整数，常用于主键ID")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("VARCHAR(n)")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({ children: [new TextRun("可变长度字符串，n为最大长度")] }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("TEXT")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("长文本，最大65535字节")] })],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("DATETIME")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun("日期时间，格式：YYYY-MM-DD HH:MM:SS")],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("DECIMAL(m,d)")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun("定点数，m为总位数，d为小数位数，常用于金额")],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 2340, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun("TINYINT")] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 7020, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      children: [new TextRun("小整数（-128到127），常用于状态字段")],
                    }),
                  ],
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
  fs.writeFileSync("D:/dev/my-project/spec2doc/assets/数据库设计文档模板.docx", buffer);
  console.log("数据库设计文档模板创建成功！");
});
