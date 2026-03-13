#!/usr/bin/env python3
"""
Spec2Doc document generator.

Generates .docx files from structured data by populating OOXML templates.
Uses only Python standard library - no external dependencies.

Usage:
    from generate import DocxBuilder

    builder = DocxBuilder(title="My API Doc", date="2024-01-01")
    builder.add_heading1("Users API")
    builder.add_heading2("GET /users")
    builder.add_paragraph("Get all users.")
    builder.add_table(headers=["Name", "Type"], rows=[["id", "integer"]], col_widths=[4680, 4680])
    builder.add_code_block('{"id": 1}')
    builder.add_page_break()
    builder.save("output.docx")
"""

import shutil
import tempfile
import xml.sax.saxutils as saxutils
import zipfile
from datetime import datetime, timezone
from pathlib import Path

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

# Colors
HEADER_BG = "EFF6FF"
METHOD_COLORS = {
    "GET": "059669", "POST": "2563EB", "PUT": "D97706",
    "DELETE": "DC2626", "PATCH": "7C3AED",
}


def _esc(text):
    """Escape XML special characters."""
    if text is None:
        return "-"
    return saxutils.escape(str(text))


def _preserve(text):
    """Wrap text in w:t with xml:space=preserve if it has leading/trailing spaces."""
    escaped = _esc(text)
    if text and (text[0] == " " or text[-1] == " "):
        return f'<w:t xml:space="preserve">{escaped}</w:t>'
    return f"<w:t>{escaped}</w:t>"


class DocxBuilder:
    """Builds a .docx document from structured content using OOXML XML templates."""

    def __init__(self, title="Document", date=None):
        self.title = title
        self.date = date or datetime.now().strftime("%Y-%m-%d")
        self._content = []

    # ── Paragraphs ──

    def add_title(self, text):
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>'
            f"<w:r>{_preserve(text)}</w:r></w:p>"
        )

    def add_subtitle(self, text):
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="Subtitle"/></w:pPr>'
            f"<w:r>{_preserve(text)}</w:r></w:p>"
        )

    def add_heading1(self, text):
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>'
            f"<w:r>{_preserve(text)}</w:r></w:p>"
        )

    def add_heading2(self, text):
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr>'
            f"<w:r>{_preserve(text)}</w:r></w:p>"
        )

    def add_heading3(self, text):
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr>'
            f"<w:r>{_preserve(text)}</w:r></w:p>"
        )

    def add_paragraph(self, text, bold=False, center=False, color=None, size=None, font=None):
        ppr = ""
        if center:
            ppr = '<w:pPr><w:jc w:val="center"/></w:pPr>'

        rpr_parts = []
        if bold:
            rpr_parts.append("<w:b/><w:bCs/>")
        if color:
            rpr_parts.append(f'<w:color w:val="{color}"/>')
        if size:
            rpr_parts.append(f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>')
        if font:
            rpr_parts.append(f'<w:rFonts w:ascii="{font}" w:eastAsia="{font}" w:hAnsi="{font}"/>')
        rpr = f'<w:rPr>{"".join(rpr_parts)}</w:rPr>' if rpr_parts else ""

        self._content.append(
            f"<w:p>{ppr}<w:r>{rpr}{_preserve(text)}</w:r></w:p>"
        )

    def add_empty_paragraph(self):
        self._content.append("<w:p/>")

    # ── Table of Contents ──

    def add_toc(self, title="目录"):
        """Add a Table of Contents field. Word will populate it on open."""
        self._content.append(
            f'<w:p><w:pPr><w:pStyle w:val="TOCHeading"/></w:pPr>'
            f"<w:r>{_preserve(title)}</w:r></w:p>"
        )
        # TOC field code: instructs Word to build TOC from headings 1-3
        self._content.append(
            '<w:p>'
            '<w:r><w:fldChar w:fldCharType="begin"/></w:r>'
            '<w:r><w:instrText xml:space="preserve"> TOC \\o "1-3" \\h \\z \\u </w:instrText></w:r>'
            '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
            '<w:r><w:rPr><w:color w:val="6B7280"/></w:rPr>'
            '<w:t>（请在 Word 中右键此处，选择"更新域"以生成目录）</w:t></w:r>'
            '<w:r><w:fldChar w:fldCharType="end"/></w:r>'
            '</w:p>'
        )

    # ── Tables ──

    def add_table(self, headers, rows, col_widths=None):
        """
        Add a table with header row and data rows.

        Args:
            headers: list of header strings
            rows: list of lists, each inner list is a row of cell values.
                  Each cell can be a string or a dict with keys:
                  {text, bold, center, mono, color}
            col_widths: list of column widths in DXA (optional, auto-calculated if None)
        """
        n = len(headers)
        if col_widths is None:
            col_widths = [9360 // n] * n

        # Table properties + grid
        grid = "".join(f'<w:gridCol w:w="{w}"/>' for w in col_widths)
        xml = (
            f"<w:tbl>"
            f'<w:tblPr><w:tblStyle w:val="TableGrid"/>'
            f'<w:tblW w:w="{sum(col_widths)}" w:type="dxa"/>'
            f"<w:tblLook w:val=\"04A0\" w:firstRow=\"1\"/>"
            f"</w:tblPr>"
            f"<w:tblGrid>{grid}</w:tblGrid>"
        )

        # Header row
        xml += '<w:tr><w:trPr><w:tblHeader/></w:trPr>'
        for i, h in enumerate(headers):
            xml += self._header_cell(h, col_widths[i])
        xml += "</w:tr>"

        # Data rows
        for row in rows:
            xml += "<w:tr>"
            for i, cell in enumerate(row):
                w = col_widths[i] if i < len(col_widths) else col_widths[-1]
                if isinstance(cell, dict):
                    xml += self._data_cell(w=w, **cell)
                else:
                    xml += self._data_cell(text=cell, w=w)
            xml += "</w:tr>"

        xml += "</w:tbl>"
        self._content.append(xml)

    def add_kv_table(self, items, key_width=2400, val_width=6960):
        """Add a 2-column key-value table. items: list of (key, value) or (key, value, val_opts)."""
        rows = []
        for item in items:
            key, val = item[0], item[1]
            val_opts = item[2] if len(item) > 2 else {}
            if isinstance(val_opts, dict):
                rows.append([{"text": key, "bold": True}, {"text": val, **val_opts}])
            else:
                rows.append([{"text": key, "bold": True}, val])
        self.add_table(
            headers=[],
            rows=rows,
            col_widths=[key_width, val_width],
        )

    def _header_cell(self, text, w):
        return (
            f"<w:tc>"
            f'<w:tcPr><w:tcW w:w="{w}" w:type="dxa"/>'
            f'<w:shd w:val="clear" w:color="auto" w:fill="{HEADER_BG}"/>'
            f"<w:vAlign w:val=\"center\"/></w:tcPr>"
            f'<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40"/></w:pPr>'
            f"<w:r><w:rPr><w:b/><w:bCs/>"
            f'<w:sz w:val="20"/><w:szCs w:val="20"/>'
            f"</w:rPr>{_preserve(text)}</w:r></w:p></w:tc>"
        )

    def _data_cell(self, text="", w=4680, bold=False, center=False, mono=False, color=None):
        text = text if text else "-"
        rpr_parts = ['<w:sz w:val="20"/><w:szCs w:val="20"/>']
        if bold:
            rpr_parts.append("<w:b/><w:bCs/>")
        if mono:
            rpr_parts.append('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>')
        if color:
            rpr_parts.append(f'<w:color w:val="{color}"/>')
        rpr = f'<w:rPr>{"".join(rpr_parts)}</w:rPr>'

        jc = '<w:jc w:val="center"/>' if center else ""
        return (
            f"<w:tc>"
            f'<w:tcPr><w:tcW w:w="{w}" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>'
            f"<w:p><w:pPr>{jc}<w:spacing w:before=\"40\" w:after=\"40\"/></w:pPr>"
            f"<w:r>{rpr}{_preserve(text)}</w:r></w:p></w:tc>"
        )

    # ── Code Block ──

    def add_code_block(self, text):
        """Add a code block (monospace, small font, indented)."""
        if not text:
            return
        lines = str(text).split("\n")
        for line in lines:
            self._content.append(
                "<w:p>"
                '<w:pPr><w:spacing w:before="0" w:after="0" w:line="260" w:lineRule="auto"/>'
                '<w:ind w:left="360"/></w:pPr>'
                '<w:r><w:rPr>'
                '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>'
                '<w:sz w:val="18"/><w:szCs w:val="18"/>'
                '<w:color w:val="6B7280"/>'
                f"</w:rPr>{_preserve(line)}</w:r></w:p>"
            )

    # ── Page Break ──

    def add_page_break(self):
        self._content.append(
            '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'
        )

    # ── Raw XML ──

    def add_raw(self, xml_str):
        """Add raw OOXML content."""
        self._content.append(xml_str)

    # ── Build & Save ──

    def save(self, output_path):
        """Build the .docx file from templates + generated content."""
        output_path = Path(output_path)
        content_xml = "\n".join(self._content)

        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)

            # Copy template structure
            shutil.copytree(TEMPLATE_DIR, tmp_path / "docx")

            # Write document.xml with content
            doc_xml = self._build_document_xml(content_xml)
            (tmp_path / "docx" / "word" / "document.xml").write_text(doc_xml, encoding="utf-8")

            # Update core.xml with title and date
            now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            core_xml = (tmp_path / "docx" / "docProps" / "core.xml").read_text(encoding="utf-8")
            core_xml = core_xml.replace(
                "Spec2Doc Generated Document", _esc(self.title)
            ).replace(
                "2024-01-01T00:00:00Z", now
            )
            (tmp_path / "docx" / "docProps" / "core.xml").write_text(core_xml, encoding="utf-8")

            # Zip into .docx
            output_path.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
                for f in (tmp_path / "docx").rglob("*"):
                    if f.is_file():
                        zf.write(f, f.relative_to(tmp_path / "docx"))

        print(f"Generated: {output_path}")

    def _build_document_xml(self, content):
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas"'
            ' xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"'
            ' xmlns:o="urn:schemas-microsoft-com:office:office"'
            ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
            ' xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"'
            ' xmlns:v="urn:schemas-microsoft-com:vml"'
            ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"'
            ' xmlns:w10="urn:schemas-microsoft-com:office:word"'
            ' xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
            ' xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml"'
            ' mc:Ignorable="w14 wpc">\n'
            "<w:body>\n"
            f"{content}\n"
            "<w:sectPr>"
            '<w:pgSz w:w="11906" w:h="16838"/>'
            '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"'
            ' w:header="720" w:footer="720"/>'
            '<w:cols w:space="720"/>'
            "</w:sectPr>\n"
            "</w:body>\n"
            "</w:document>"
        )
