const fs = require("node:fs");
const path = require("node:path");
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
            text: "\u2022",
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
        // ── Title ──
        new Paragraph({
          heading: HeadingLevel.TITLE,
          children: [new TextRun("数据库设计文档")],
        }),

        // ── Section 1: Database Info ──
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("1. 数据库信息")],
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
                  children: [new Paragraph({ children: [new TextRun("{database}")] })],
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

        // ── Section 2: Tables ──
        new Paragraph({
          spacing: { before: 240 },
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun("2. 数据表设计")],
        }),

        // Tables loop start
        new Paragraph({ children: [new TextRun("{#tables}")] }),

        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun("{name}  {comment}")],
        }),

        // ── Columns table ──
        new Paragraph({
          spacing: { before: 60, after: 60 },
          children: [new TextRun({ text: "字段列表", bold: true })],
        }),
        new Table({
          columnWidths: [1404, 1170, 780, 780, 780, 936, 3150],
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          rows: [
            // Header row
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
                      children: [new TextRun({ text: "字段名", bold: true, color: "FFFFFF", size: 20 })],
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
                      children: [new TextRun({ text: "数据类型", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "允许空", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "主键", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "外键", bold: true, color: "FFFFFF", size: 20 })],
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
                      children: [new TextRun({ text: "默认值", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3150, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "字段说明", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
              ],
            }),
            // Data row with loop tags
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1404, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "{#columns}{colName}", size: 20 })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 1170, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "{colType}", size: 20 })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{colNullable}", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{colIsPrimary}", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 780, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{colIsForeign}", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 936, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{colDefault}", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3150, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "{colComment}{/columns}", size: 20 })] })],
                }),
              ],
            }),
          ],
        }),

        // ── Indexes (conditional) ──
        new Paragraph({ children: [new TextRun("{#hasIndexes}")] }),
        new Paragraph({
          spacing: { before: 120, after: 60 },
          children: [new TextRun({ text: "索引信息", bold: true })],
        }),
        new Table({
          columnWidths: [3120, 3120, 3120],
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "索引名", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "索引类型", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  shading: headerShading,
                  verticalAlign: VerticalAlign.CENTER,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "索引字段", bold: true, color: "FFFFFF", size: 20 })],
                    }),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "{#indexes}{idxName}", size: 20 })] })],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: "{idxType}", size: 20 })],
                    }),
                  ],
                }),
                new TableCell({
                  borders: cellBorders,
                  width: { size: 3120, type: WidthType.DXA },
                  children: [new Paragraph({ children: [new TextRun({ text: "{idxColumns}{/indexes}", size: 20 })] })],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [new TextRun("{/hasIndexes}")] }),

        // Tables loop end
        new Paragraph({ children: [new TextRun("{/tables}")] }),
      ],
    },
  ],
});

const outputPath = path.resolve(__dirname, "../assets/数据库设计文档模板.docx");

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("数据库设计文档模板（docxtemplater）创建成功！");
  console.log("输出路径:", outputPath);
});
