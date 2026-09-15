#!/usr/bin/env python3
"""Render docs/Polityka_prywatnosci_aplikacji.md to media-upload/Polityka_prywatnosci_aplikacji.pdf.

    python3 docs/generate_polityka_aplikacji.py

Handles the Markdown subset the policy uses: #/##/### headings, paragraphs,
"- " bullets, pipe tables, **bold**, `code`. Publish with:

    gcloud storage cp media-upload/Polityka_prywatnosci_aplikacji.pdf \
        gs://wyjatkowe-serca.firebasestorage.app/
"""
from __future__ import annotations

import re
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable, ListItem, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "docs" / "Polityka_prywatnosci_aplikacji.md"
OUT = ROOT / "media-upload" / "Polityka_prywatnosci_aplikacji.pdf"

pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

RED = colors.HexColor("#EC1A3B")
GREY1 = colors.HexColor("#2E2E2E")
GREY2 = colors.HexColor("#616161")

S = {
    "title": ParagraphStyle("title", fontName="DejaVu-Bold", fontSize=16, leading=20, textColor=RED, spaceAfter=6),
    "h2": ParagraphStyle("h2", fontName="DejaVu-Bold", fontSize=11.5, leading=15, textColor=GREY1, spaceBefore=10, spaceAfter=4),
    "h3": ParagraphStyle("h3", fontName="DejaVu-Bold", fontSize=9.5, leading=13, textColor=GREY1, spaceBefore=6, spaceAfter=2),
    "body": ParagraphStyle("body", fontName="DejaVu", fontSize=9, leading=13, textColor=GREY1, spaceAfter=5),
    "cell": ParagraphStyle("cell", fontName="DejaVu", fontSize=8, leading=11, textColor=GREY1),
    "cellh": ParagraphStyle("cellh", fontName="DejaVu-Bold", fontSize=8, leading=11, textColor=GREY1),
    "foot": ParagraphStyle("foot", fontName="DejaVu", fontSize=7.5, leading=10, textColor=GREY2),
}


def inline(text: str) -> str:
    text = escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"`(.+?)`", r"<font color='#b45309'>\1</font>", text)
    return text


def table(rows: list[list[str]], width: float) -> Table:
    ncol = len(rows[0])
    widths = [width * 0.3] + [(width * 0.7) / (ncol - 1)] * (ncol - 1) if ncol > 1 else [width]
    data = [[Paragraph(inline(c), S["cellh"] if i == 0 else S["cell"]) for c in r] for i, r in enumerate(rows)]
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f3f4f6")),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d0d0d0")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3), ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    return t


def build(lines: list[str], width: float) -> list:
    story: list = []
    para: list[str] = []
    bullets: list[str] = []
    rows: list[list[str]] = []

    def flush():
        nonlocal para, bullets, rows
        if para:
            story.append(Paragraph(inline(" ".join(para)), S["body"]))
            para = []
        if bullets:
            story.append(ListFlowable(
                [ListItem(Paragraph(inline(b), S["body"]), leftIndent=10) for b in bullets],
                bulletType="bullet", bulletFontName="DejaVu", bulletFontSize=7, leftIndent=12,
            ))
            story.append(Spacer(1, 4))
            bullets = []
        if rows:
            story.append(table(rows, width))
            story.append(Spacer(1, 6))
            rows = []

    for raw in lines:
        line = raw.rstrip()
        if line.startswith("|"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if all(re.fullmatch(r"-+", c) for c in cells):
                continue
            if para or bullets:
                flush()
            rows.append(cells)
            continue
        if rows:
            flush()
        if not line:
            flush()
        elif line.startswith("# "):
            flush(); story.append(Paragraph(inline(line[2:]), S["title"]))
        elif line.startswith("## "):
            flush(); story.append(Paragraph(inline(line[3:]), S["h2"]))
        elif line.startswith("### "):
            flush(); story.append(Paragraph(inline(line[4:]), S["h3"]))
        elif line.startswith("- "):
            if para:
                flush()
            bullets.append(line[2:])
        elif line.startswith("  ") and bullets:
            bullets[-1] += " " + line.strip()
        else:
            if bullets:
                flush()
            para.append(line.strip())
    flush()
    return story


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("DejaVu", 7.5)
    canvas.setFillColor(GREY2)
    canvas.drawString(20 * mm, 12 * mm, "Fundacja Wyjątkowe Serca — Polityka prywatności aplikacji")
    canvas.drawRightString(A4[0] - 20 * mm, 12 * mm, str(doc.page))
    canvas.restoreState()


def main() -> None:
    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=20 * mm,
        title="Polityka prywatności aplikacji Wyjątkowe Serca – Pacjent", author="Fundacja Wyjątkowe Serca",
    )
    story = build(SRC.read_text(encoding="utf-8").splitlines(), A4[0] - 40 * mm)
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
