#!/usr/bin/env python3
"""PDF generator: patient app project description for Wyjątkowe Serca.

Grant-application annex. Run:
  python3 docs/generate_opis_aplikacji.py
"""

from __future__ import annotations

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)

# --- Paths ---
ROOT = Path(__file__).resolve().parent.parent
OUT_PDF = Path(__file__).resolve().parent / "Opis_aplikacji_pacjenta_Wyjatkowe_Serca v4.pdf"

# --- Brand (foundation colours) ---
BRAND_RED = colors.HexColor("#EC1A3B")
BRAND_BLUE = colors.HexColor("#2383C5")
GREY_TEXT = colors.HexColor("#2E2E2E")
GREY_MUTED = colors.HexColor("#616161")
GREY_LINE = colors.HexColor("#D0D5DD")
GREY_BG = colors.HexColor("#F5F7FA")
WHITE = colors.white

# --- Assets ---
LOGO_PNG = ROOT / "frontend" / "app" / "public" / "logo.png"
SHOTS_DIR = Path(__file__).resolve().parent / "screenshots"
# (filename, crop from top in px — status bar / unused header, caption)
# Missing files are skipped so the list can grow before screenshots exist.
# 140 px is the phone status-bar height — crop it, keep the in-app title bar
# so each shot is still labelled from inside the UI.
APP_SHOTS = [
    ("profil.png", 140, "Profil pacjenta"),
    ("leki.png", 140, "Leki i przypomnienia dawek"),
    ("pomiary.png", 140, "Pomiary – wykresy trendów"),
    ("inr.png", 140, "INR – rejestr wyników"),
    ("osoby_z_dostepem.png", 140, "Udostępnianie w rodzinie"),
    ("zaproszenie.png", 140, "Zaproszenie współopiekuna"),
    ("logowanie.png", 140, "Logowanie"),
    ("raport_pdf.png", 140, "Raport PDF na wizytę (eksport z aplikacji)"),
]
# Full text-column width, outside the grid. The PDF report is an A4 page
# photographed on the phone — unreadable in a narrow column.
FULL_WIDTH_SHOTS = {"raport_pdf.png"}
# Crop from bottom in px. For the report, cut the next-page preview so one
# complete page remains in frame.
SHOT_CROP_BOTTOM = {"raport_pdf.png": 1698}
# Start the report from document content, without the dark PDF chrome bar.
SHOT_CROP_TOP_OVERRIDE = {"raport_pdf.png": 300}
# Shots per row. At 3, the phone is ~5.3 cm wide (~75% of real screen size;
# previously 55% — field labels were hard to read). Rows flow to the next page.
SHOTS_PER_ROW = 3

# --- Fonts (Polish glyphs) ---
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
# Without a registered family, <b> tags in Paragraph are silently ignored
registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold", italic="DejaVu", boldItalic="DejaVu-Bold")

_LATO_DIR = Path("/usr/share/fonts/truetype/lato")
if (_LATO_DIR / "Lato-Regular.ttf").is_file():
    pdfmetrics.registerFont(TTFont("Lato", str(_LATO_DIR / "Lato-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Lato-Bold", str(_LATO_DIR / "Lato-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("Lato-Semibold", str(_LATO_DIR / "Lato-Semibold.ttf")))
    pdfmetrics.registerFont(TTFont("Lato-Black", str(_LATO_DIR / "Lato-Black.ttf")))
    registerFontFamily("Lato", normal="Lato", bold="Lato-Bold", italic="Lato", boldItalic="Lato-Bold")
    FONT_REG, FONT_BOLD = "Lato", "Lato-Bold"
    FONT_SEMI, FONT_BLACK = "Lato-Semibold", "Lato-Black"
else:
    FONT_REG, FONT_BOLD = "DejaVu", "DejaVu-Bold"
    FONT_SEMI, FONT_BLACK = "DejaVu", "DejaVu-Bold"
FONT_HEART = "DejaVu"  # Lato has no ♥ glyph

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm


def make_styles() -> dict:
    base = getSampleStyleSheet()
    styles = {}

    styles["cover_kicker"] = ParagraphStyle(
        "cover_kicker",
        fontName=FONT_SEMI,
        fontSize=10,
        leading=14,
        textColor=GREY_MUTED,
        alignment=TA_CENTER,
        spaceAfter=2,
    )
    styles["cover_title"] = ParagraphStyle(
        "cover_title",
        fontName=FONT_BLACK,
        fontSize=26,
        leading=32,
        textColor=GREY_TEXT,
        alignment=TA_CENTER,
    )
    styles["cover_title_red"] = ParagraphStyle(
        "cover_title_red",
        parent=styles["cover_title"],
        textColor=BRAND_RED,
        spaceAfter=12,
    )
    styles["cover_sub"] = ParagraphStyle(
        "cover_sub",
        fontName=FONT_REG,
        fontSize=11,
        leading=16.5,
        textColor=GREY_MUTED,
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    styles["cover_meta"] = ParagraphStyle(
        "cover_meta",
        fontName=FONT_REG,
        fontSize=9,
        leading=13,
        textColor=GREY_MUTED,
        alignment=TA_CENTER,
    )
    styles["sum_label"] = ParagraphStyle(
        "sum_label",
        fontName=FONT_SEMI,
        fontSize=8.5,
        leading=12,
        textColor=BRAND_BLUE,
    )
    styles["fact_label"] = ParagraphStyle(
        "fact_label",
        fontName=FONT_SEMI,
        fontSize=7.5,
        leading=10,
        textColor=BRAND_BLUE,
        alignment=TA_CENTER,
    )
    styles["fact_value"] = ParagraphStyle(
        "fact_value",
        fontName=FONT_BOLD,
        fontSize=10.5,
        leading=14,
        textColor=GREY_TEXT,
        alignment=TA_CENTER,
    )
    styles["chip"] = ParagraphStyle(
        "chip",
        fontName=FONT_BOLD,
        fontSize=11,
        leading=13,
        textColor=WHITE,
        alignment=TA_CENTER,
    )
    styles["h1"] = ParagraphStyle(
        "h1",
        fontName=FONT_BLACK,
        fontSize=13.5,
        leading=16,
        textColor=GREY_TEXT,
    )
    styles["h2"] = ParagraphStyle(
        "h2",
        fontName=FONT_BOLD,
        fontSize=11,
        leading=14,
        textColor=BRAND_BLUE,
        spaceBefore=8,
        spaceAfter=4,
    )
    styles["body"] = ParagraphStyle(
        "body",
        fontName=FONT_REG,
        fontSize=9.5,
        leading=13,
        textColor=GREY_TEXT,
        alignment=TA_JUSTIFY,
        spaceAfter=5,
    )
    styles["body_left"] = ParagraphStyle(
        "body_left",
        parent=styles["body"],
        alignment=TA_LEFT,
    )
    styles["bullet"] = ParagraphStyle(
        "bullet",
        fontName=FONT_REG,
        fontSize=9.5,
        leading=12.5,
        textColor=GREY_TEXT,
        leftIndent=2,
        spaceAfter=2,
    )
    styles["cell"] = ParagraphStyle(
        "cell",
        fontName=FONT_REG,
        fontSize=8,
        leading=10.5,
        textColor=GREY_TEXT,
    )
    styles["cell_b"] = ParagraphStyle(
        "cell_b",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10.5,
        textColor=GREY_TEXT,
    )
    styles["cell_header"] = ParagraphStyle(
        "cell_header",
        fontName=FONT_SEMI,
        fontSize=8,
        leading=10.5,
        textColor=WHITE,
    )
    styles["cell_header_right"] = ParagraphStyle(
        "cell_header_right",
        fontName=FONT_SEMI,
        fontSize=8,
        leading=10.5,
        textColor=WHITE,
        alignment=TA_RIGHT,
    )
    styles["cell_right"] = ParagraphStyle(
        "cell_right",
        fontName=FONT_REG,
        fontSize=8,
        leading=10.5,
        textColor=GREY_TEXT,
        alignment=TA_RIGHT,
    )
    styles["cell_b_right"] = ParagraphStyle(
        "cell_b_right",
        fontName=FONT_BOLD,
        fontSize=8,
        leading=10.5,
        textColor=GREY_TEXT,
        alignment=TA_RIGHT,
    )
    styles["note"] = ParagraphStyle(
        "note",
        fontName=FONT_REG,
        fontSize=8,
        leading=11,
        textColor=GREY_MUTED,
        alignment=TA_LEFT,
        spaceBefore=2,
        spaceAfter=4,
    )
    styles["footer"] = ParagraphStyle(
        "footer",
        fontName=FONT_REG,
        fontSize=7.5,
        leading=9,
        textColor=GREY_MUTED,
        alignment=TA_CENTER,
    )
    styles["toc_item"] = ParagraphStyle(
        "toc_item",
        fontName=FONT_REG,
        fontSize=9.5,
        leading=12.5,
        textColor=GREY_TEXT,
        leftIndent=4,
        spaceAfter=1,
    )
    styles["group_label"] = ParagraphStyle(
        "group_label",
        fontName=FONT_SEMI,
        fontSize=9.5,
        leading=13,
        textColor=GREY_TEXT,
        spaceBefore=7,
        spaceAfter=1,
    )
    styles["callout"] = ParagraphStyle(
        "callout",
        fontName=FONT_REG,
        fontSize=9,
        leading=12.5,
        textColor=GREY_TEXT,
        alignment=TA_LEFT,
    )
    _ = base  # silence unused
    return styles


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(text, style)


def hr() -> HRFlowable:
    return HRFlowable(width="100%", thickness=0.6, color=GREY_LINE, spaceBefore=2, spaceAfter=6)


def spaced(text: str) -> str:
    """Letter-spaced kicker text (Paragraph has no tracking API)."""
    return " &nbsp; ".join(" ".join(word) for word in text.split())


def section_title(num: str, title: str, styles: dict) -> list:
    usable = PAGE_W - 2 * MARGIN
    chip = Table(
        [[p(num, styles["chip"]), p(title, styles["h1"])]],
        colWidths=[9 * mm, usable - 9 * mm],
        rowHeights=[7 * mm],
    )
    chip.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), BRAND_RED),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (0, 0), 0),
                ("RIGHTPADDING", (0, 0), (0, 0), 0),
                ("LEFTPADDING", (1, 0), (1, 0), 7),
            ]
        )
    )
    return [Spacer(1, 14), chip, hr()]


def bullets(items: list[str], styles: dict) -> ListFlowable:
    flow = []
    for item in items:
        flow.append(ListItem(p(item, styles["bullet"]), leftIndent=12, value="•"))
    return ListFlowable(
        flow,
        bulletType="bullet",
        start="•",
        leftIndent=14,
        bulletFontName=FONT_BOLD,
        bulletFontSize=9,
        bulletColor=BRAND_RED,
        spaceBefore=1,
        spaceAfter=4,
    )


def make_table(
    rows: list[list],
    col_widths: list[float],
    styles: dict,
    header: bool = True,
) -> Table:
    """rows: list of lists of strings; first row is header if header=True."""
    data = []
    for i, row in enumerate(rows):
        line = []
        for j, cell in enumerate(row):
            if header and i == 0:
                line.append(p(str(cell), styles["cell_header"]))
            else:
                # right-align numeric-looking last columns when marked with »
                s = str(cell)
                if s.startswith("»"):
                    content = s[1:]
                    if content.endswith("**"):
                        line.append(p(content[:-2], styles["cell_b_right"]))
                    else:
                        line.append(p(content, styles["cell_right"]))
                elif s.startswith("«b»"):
                    line.append(p(s[3:], styles["cell_b"]))
                else:
                    line.append(p(s, styles["cell"]))
        data.append(line)

    t = Table(data, colWidths=col_widths, repeatRows=1 if header else 0)
    style_cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, GREY_LINE),
    ]
    if header:
        style_cmds += [
            ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREY_BG]),
            ("LINEBELOW", (0, 1), (-1, -2), 0.3, GREY_LINE),
        ]
    else:
        style_cmds += [
            ("LINEABOVE", (0, 0), (-1, 0), 0.8, GREY_LINE),
            ("LINEBELOW", (0, 0), (-1, -2), 0.3, GREY_LINE),
        ]
    t.setStyle(TableStyle(style_cmds))
    return t


def footer_canvas(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(GREY_LINE)
    canvas.setLineWidth(0.5)
    y = 12 * mm
    canvas.line(MARGIN, y + 7, PAGE_W - MARGIN, y + 7)
    draw_brand_heart(canvas, MARGIN, y, 7.5)
    canvas.setFont(FONT_REG, 7.5)
    canvas.setFillColor(GREY_MUTED)
    canvas.drawString(
        MARGIN + 11, y, "Fundacja Wyjątkowe Serca · opis projektu aplikacji pacjenta"
    )
    canvas.drawRightString(PAGE_W - MARGIN, y, f"Strona {doc.page}")
    canvas.restoreState()


def draw_brand_heart(canvas, x: float, y: float, size: float) -> None:
    """Foundation-logo heart: left half blue, right half red.

    Glyph drawn twice, clipped to each half.
    """
    w = pdfmetrics.stringWidth("♥", FONT_HEART, size)
    for color, (x0, x1) in (
        (BRAND_BLUE, (x, x + w / 2)),
        (BRAND_RED, (x + w / 2, x + w)),
    ):
        canvas.saveState()
        path = canvas.beginPath()
        path.rect(x0, y - 0.3 * size, x1 - x0, 1.3 * size)
        canvas.clipPath(path, stroke=0, fill=0)
        canvas.setFont(FONT_HEART, size)
        canvas.setFillColor(color)
        canvas.drawString(x, y, "♥")
        canvas.restoreState()


def cover_canvas(canvas, doc):
    """Cover page chrome: brand colour bars top and bottom, no footer."""
    canvas.saveState()
    canvas.setFillColor(BRAND_RED)
    canvas.rect(0, PAGE_H - 6 * mm, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, PAGE_H - 8 * mm, PAGE_W, 2 * mm, stroke=0, fill=1)
    canvas.setFillColor(BRAND_RED)
    canvas.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)
    canvas.setFillColor(BRAND_BLUE)
    canvas.rect(0, 6 * mm, PAGE_W, 2 * mm, stroke=0, fill=1)
    canvas.restoreState()


def cover_page(styles: dict) -> list:
    """Dedicated cover flow: foundation logo, title, key-fact strip."""
    usable = PAGE_W - 2 * MARGIN
    flow: list = [Spacer(1, 20 * mm)]

    if LOGO_PNG.is_file():
        iw, ih = ImageReader(str(LOGO_PNG)).getSize()
        w = 108 * mm
        logo = Image(str(LOGO_PNG), width=w, height=w * ih / iw)
        logo.hAlign = "CENTER"
        flow.append(logo)
        flow.append(Spacer(1, 8 * mm))

    flow.append(p(spaced("ZAŁĄCZNIK DO WNIOSKU O DOTACJĘ"), styles["cover_kicker"]))
    flow.append(Spacer(1, 4 * mm))
    flow.append(p("Aplikacja pacjenta", styles["cover_title"]))
    flow.append(p("„Wyjątkowe Serca”", styles["cover_title_red"]))
    flow.append(
        p(
            "Opis i założenia projektu. Mobilna aplikacja wspierająca rodziców i opiekunów<br/>"
            "dzieci z wrodzonymi wadami serca: profil medyczny, leki i przypomnienia dawek,<br/>"
            "pomiary, historia INR oraz bezpieczne udostępnianie danych w rodzinie.",
            styles["cover_sub"],
        )
    )
    flow.append(Spacer(1, 18 * mm))

    facts = Table(
        [
            [
                p("PLATFORMY", styles["fact_label"]),
                p("CENA DLA RODZIN", styles["fact_label"]),
                p("DLA KOGO", styles["fact_label"]),
                p("STATUS", styles["fact_label"]),
            ],
            [
                p("Android + iOS", styles["fact_value"]),
                p("aplikacja bezpłatna", styles["fact_value"]),
                p("rodziny dzieci z WWS", styles["fact_value"]),
                p("wersja robocza gotowa", styles["fact_value"]),
            ],
        ],
        colWidths=[usable / 4.0] * 4,
    )
    facts.setStyle(
        TableStyle(
            [
                ("LINEABOVE", (0, 0), (-1, 0), 0.8, GREY_LINE),
                ("LINEBELOW", (0, -1), (-1, -1), 0.8, GREY_LINE),
                ("LINEBEFORE", (1, 0), (-1, -1), 0.4, GREY_LINE),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
                ("TOPPADDING", (0, 1), (-1, 1), 1),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
            ]
        )
    )
    flow.append(facts)
    return flow


def _accent_box(text: str, styles: dict, bar: colors.Color, bg: colors.Color) -> Table:
    t = Table(
        [["", p(text, styles["callout"])]],
        colWidths=[1.6 * mm, PAGE_W - 2 * MARGIN - 1.6 * mm],
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), bar),
                ("BACKGROUND", (1, 0), (1, -1), bg),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 0),
                ("LEFTPADDING", (1, 0), (1, -1), 10),
                ("RIGHTPADDING", (1, 0), (1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return t


def summary_box(rows: list[tuple[str, str]], styles: dict) -> Table:
    """At-a-glance box: label–value list on light blue with accent bar."""
    bg = colors.HexColor("#F0F7FC")
    data = [
        ["", p(label, styles["sum_label"]), p(value, styles["callout"])]
        for label, value in rows
    ]
    t = Table(
        data,
        colWidths=[1.6 * mm, 30 * mm, PAGE_W - 2 * MARGIN - 1.6 * mm - 30 * mm],
    )
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), BRAND_BLUE),
                ("BACKGROUND", (1, 0), (-1, -1), bg),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (0, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 0),
                ("LEFTPADDING", (1, 0), (1, -1), 10),
                ("LEFTPADDING", (2, 0), (2, -1), 4),
                ("RIGHTPADDING", (2, 0), (2, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 2.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
                ("TOPPADDING", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 8),
            ]
        )
    )
    return t


def phone_shot(path: Path, crop_top: int, width: float, crop_bottom: int | None = None) -> Image:
    """Phone screenshot cropped from the top (status bar, etc.) and optionally bottom."""
    from io import BytesIO

    from PIL import Image as PILImage

    im = PILImage.open(path)
    if crop_top or crop_bottom:
        im = im.crop((0, crop_top, im.width, crop_bottom or im.height))
    buf = BytesIO()
    im.save(buf, "PNG")
    buf.seek(0)
    return Image(buf, width=width, height=width * im.height / im.width)


def annex_screens(styles: dict) -> list:
    """App screenshot annex; skipped when no files are present."""
    shots = [s for s in APP_SHOTS if (SHOTS_DIR / s[0]).is_file()]
    if not shots:
        return []
    grid_shots = [s for s in shots if s[0] not in FULL_WIDTH_SHOTS]
    wide_shots = [s for s in shots if s[0] in FULL_WIDTH_SHOTS]
    usable = PAGE_W - 2 * MARGIN
    col_w = usable / SHOTS_PER_ROW
    # 8 mm gap per column: with 3 shots/row, two rows fit on one page with annex title.
    img_w = col_w - 8 * mm

    def cell(name: str, crop: int, width: float) -> Image:
        top = SHOT_CROP_TOP_OVERRIDE.get(name, crop)
        return phone_shot(SHOTS_DIR / name, top, width, SHOT_CROP_BOTTOM.get(name))

    def captioned(cells: list, caps: list, widths: list) -> Table:
        t = Table([cells, caps], colWidths=widths)
        t.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, 0), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, 0), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
                    ("TOPPADDING", (0, 1), (-1, 1), 0),
                ]
            )
        )
        return t

    flow: list = [PageBreak()]
    flow.extend(section_title("A", "Załącznik: podgląd aplikacji (wersja robocza)", styles))
    flow.append(
        p(
            "Zrzuty z roboczej wersji aplikacji (Android), przed publikacją w sklepach; "
            "wszystkie dane są <b>fikcyjne</b>. Zakładka „Historia leczenia i hospitalizacji” "
            "(rozdz. 3.1 i 4) powstanie w ramach projektu.",
            styles["body"],
        )
    )
    flow.append(Spacer(1, 4))

    for start in range(0, len(grid_shots), SHOTS_PER_ROW):
        row = grid_shots[start : start + SHOTS_PER_ROW]
        imgs: list = [cell(f, crop, img_w) for f, crop, _ in row]
        caps: list = [p(cap, styles["fact_label"]) for _, _, cap in row]
        widths = [col_w] * len(row)
        # Centre a short last row with empty side columns (avoids a ragged right edge).
        side = (usable - len(row) * col_w) / 2
        if side > 0:
            imgs = [""] + imgs + [""]
            caps = [""] + caps + [""]
            widths = [side] + widths + [side]
        flow.append(KeepTogether(captioned(imgs, caps, widths)))
        flow.append(Spacer(1, 6))

    for f, crop, cap in wide_shots:
        wide = captioned([cell(f, crop, usable)], [p(cap, styles["fact_label"])], [usable])
        flow.append(KeepTogether(wide))
        flow.append(Spacer(1, 10))
    return flow


def callout_box(text: str, styles: dict) -> Table:
    return _accent_box(text, styles, BRAND_RED, colors.HexColor("#FFF5F6"))


def info_box(text: str, styles: dict) -> Table:
    return _accent_box(text, styles, BRAND_BLUE, colors.HexColor("#F0F7FC"))


def build_story(styles: dict) -> list:
    story: list = []
    usable = PAGE_W - 2 * MARGIN

    # ========== COVER ==========
    story.extend(cover_page(styles))
    story.append(PageBreak())

    # ========== ABOUT THIS DOCUMENT / TOC ==========
    story.append(
        p(
            "<b>Charakter dokumentu.</b> Niniejszy załącznik opisuje cele, zakres funkcjonalny, "
            "założenia techniczne i organizacyjne, ochronę danych o zdrowiu oraz powiązanie prac "
            "z kosztorysem wniosku. Projekt dotyczy dokończenia, publikacji w sklepach, "
            "dostosowania do wymogów RODO oraz utrzymania aplikacji pacjenta. Prace opierają "
            "się na istniejącym zapleczu cyfrowym fundacji (API, baza danych, działająca wersja robocza), "
            "a nie na budowie całego ekosystemu od zera.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 4))
    story.append(p("<b>O fundacji</b>", styles["h2"]))
    story.append(
        p(
            "Fundacja Wyjątkowe Serca (KRS 0001072904, NIP 7011177987; siedziba: "
            "Aleje Jerozolimskie 123A, 02-017 Warszawa) działa od grudnia 2023 r. i została "
            "założona przez rodziców dzieci z wrodzonymi wadami serca. Fundacja wspiera rodziny "
            "od diagnozy, przez leczenie, po rehabilitację: prowadzi zbiórki na rzecz podopiecznych, "
            "organizuje wydarzenia charytatywne dla małych pacjentów oraz dzieli się praktyczną "
            "wiedzą wynikającą z doświadczeń własnych rodziców. Merytorycznie fundację wspiera "
            "Rada Naukowa złożona z lekarzy kardiologów, kardiochirurgów i perinatologów. "
            "Fundacja zapewnia też rodzicom <b>bezpłatne wsparcie psychologiczne</b>, finansowane "
            "ze środków własnych i darowizn, niezależnie od niniejszego projektu. "
            "Statut i sprawozdania finansowe są publikowane "
            "w serwisie internetowym fundacji. Aplikacja pacjenta, której dotyczy niniejszy "
            "dokument, jest rozszerzeniem tej działalności statutowej o narzędzie cyfrowe.",
            styles["body"],
        )
    )

    story.append(Spacer(1, 4))
    story.append(p("<b>Dokument w skrócie</b>", styles["h2"]))
    story.append(
        summary_box(
            [
                ("Produkt", "Bezpłatna aplikacja mobilna (Android + iOS) dla rodziców i opiekunów dzieci z WWS."),
                (
                    "Zakres projektu",
                    "Dokończenie aplikacji, publikacja w Google Play i App Store, zgodność z RODO, utrzymanie przez 12 miesięcy.",
                ),
                (
                    "Wnioskowana kwota",
                    "<b>241 892 zł brutto</b> (196 660 zł netto + VAT 23%), w tym: rozwój aplikacji "
                    "152 914 zł brutto (592 h × 210 zł/h netto), koszty stałe okresu prac 14 022 zł brutto "
                    "(m.in. RODO i opinia MDR) oraz utrzymanie przez 12 miesięcy po wdrożeniu 74 956 zł brutto.",
                ),
                (
                    "Dane o zdrowiu",
                    "Art. 9 RODO, DPIA, przetwarzanie w UE. Kwalifikacja v1 poza wyrobem medycznym "
                    "(MDCG 2019-11); opinia prawna w dwóch etapach (F1 i F3).",
                ),
                (
                    "Wkład własny",
                    "Prace wykonane nieodpłatnie przed projektem: <b>97 440 zł</b> "
                    "(464 h × 210 zł/h, ok. 44% zakresu; wycena bez VAT). "
                    "Wartość prac nad produktem (netto): 221 760 zł = 97 440 zł wkładu "
                    "+ 124 320 zł rozwoju z dotacji; utrzymanie i VAT liczone osobno.",
                ),
            ],
            styles,
        )
    )
    story.append(Spacer(1, 6))
    story.append(p("<b>Spis treści</b>", styles["h2"]))
    toc = [
        "1. Cel projektu i grupa docelowa",
        "2. Problem i uzasadnienie",
        "3. Zakres funkcjonalny wersji 1 (v1) i poza zakresem",
        "4. Przepływ użytkownika",
        "5. Platformy, sklepy i architektura",
        "6. Ochrona danych osobowych i danych o zdrowiu (RODO)",
        "7. Harmonogram i kamienie milowe",
        "8. Powiązanie z budżetem projektu",
        "9. Utrzymanie po wdrożeniu",
        "10. Oczekiwane efekty i mierniki (ostrożne szacunki)",
        "11. Podsumowanie",
    ]
    if all((SHOTS_DIR / f).is_file() for f, _, _ in APP_SHOTS):
        toc.append("Załącznik A. Podgląd aplikacji (wersja robocza)")
    for item in toc:
        story.append(p(item, styles["toc_item"]))


    # ========== 1. CEL ==========
    story.append(PageBreak())
    story.extend(section_title("1", "Cel projektu i grupa docelowa", styles))
    story.append(
        p(
            "Celem projektu jest udostępnienie rodzicom i opiekunom dzieci z wrodzonymi wadami serca "
            "(WWS) wygodnej, bezpiecznej aplikacji mobilnej, która w jednym miejscu gromadzi "
            "najważniejsze informacje o stanie zdrowia dziecka, potrzebne w codziennej opiece i na wizytach "
            "lekarskich: profil medyczny, leki i przypomnienia dawek, pomiary (m.in. saturacja, tętno, "
            "ciśnienie, diureza), historię badań INR, przebieg leczenia i hospitalizacji wraz "
            "z dokumentacją medyczną oraz eksport czytelnego raportu PDF.",
            styles["body"],
        )
    )
    story.append(
        p(
            "Aplikacja jest elementem misji Fundacji Wyjątkowe Serca, czyli wspierania rodzin na ścieżce "
            "leczenia, a nie zastępowania personelu medycznego. Narzędzie ma charakter "
            "rejestru i asystenta organizacyjnego prowadzonego przez opiekuna, a nie systemu "
            "diagnostycznego ani dokumentacji prowadzonej przez podmiot leczniczy.",
            styles["body"],
        )
    )
    story.append(p("<b>Główna grupa docelowa</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "rodzice i opiekunowie prawni dzieci z wrodzonymi wadami serca;",
                "nastoletni pacjenci (od ok. 16 lat), samodzielnie korzystający z aplikacji "
                "pod opieką rodziny, przygotowujący się do przejęcia odpowiedzialności za własne leczenie;",
                "osoby współopiekujące się dzieckiem (np. drugi rodzic, babcia/dziadek), którym właściciel konta świadomie udostępni dostęp do tych samych danych;",
                "fundacja jako podmiot udostępniający narzędzie w ramach działalności statutowej (bez monetyzacji danych).",
            ],
            styles,
        )
    )
    story.append(p("<b>Usamodzielnianie nastoletnich pacjentów</b>", styles["h2"]))
    story.append(
        p(
            "Aplikacja pomaga wyrobić dobre nawyki u nastolatków: uczy pilnowania dawek leków, "
            "regularnych pomiarów i prowadzenia własnej historii leczenia. Celem jest przygotowanie "
            "pacjenta do samodzielnej opieki nad swoim zdrowiem po ukończeniu 18 lat, gdy przechodzi "
            "spod opieki pediatrycznej pod opiekę placówki dla dorosłych. Literatura kardiologiczna "
            "opisuje ten moment jako najsłabszy punkt systemu opieki nad pacjentem z WWS: badania "
            "pokazują, że znacząca część młodych dorosłych wypada wtedy z obserwacji "
            "specjalistycznej (Mackie i wsp., Circulation 2009), a wytyczne ESC 2020 dotyczące "
            "dorosłych z WWS zalecają ustrukturyzowany program przejścia rozpoczynany już "
            "w wieku nastoletnim. Rodziny bywają zagubione, "
            "nie wiedzą, kto odpowiada za dalsze leczenie, jakie obowiązują procedury i gdzie szukać "
            "pomocy, a część pacjentów wypada wtedy z regularnej obserwacji kardiologicznej. "
            "Prowadzona w aplikacji historia leczenia, hospitalizacji i dokumentacji jest w takiej "
            "sytuacji kompletem informacji, który pacjent zabiera ze sobą do nowego ośrodka. "
            "Po osiągnięciu pełnoletności przejmuje on kontrolę nad kontem "
            "i sam decyduje, czy zachować rodzicom dostęp do swoich danych (rozdz. 6).",
            styles["body"],
        )
    )
    story.append(p("<b>Język i dostępność</b>", styles["h2"]))
    story.append(
        p(
            "Interfejs aplikacji jest w języku polskim. Aplikacja działa na popularnych smartfonach "
            "z systemem Android; w ramach projektu finalizowana jest także publikacja na iOS, aby "
            "nie wykluczać rodzin korzystających z iPhone’ów. Interfejs projektowany jest z dbałością "
            "o czytelność (wyraźne kontrasty, duże elementy dotykowe, prosta nawigacja), a uwagi "
            "dotyczące dostępności zgłaszane przez użytkowników będą obsługiwane w ramach utrzymania.",
            styles["body"],
        )
    )

    # ========== 2. PROBLEM ==========
    story.extend(section_title("2", "Problem i uzasadnienie", styles))
    story.append(
        p(
            "Wrodzone wady serca są najczęstszymi z wad wrodzonych: występują u ok. 8–9 na 1000 "
            "żywych urodzeń (metaanaliza van der Linde i wsp., J Am Coll Cardiol 2011), czyli "
            "u ok. 1% noworodków. Przy ok. 250–300 tys. urodzeń rocznie w Polsce (GUS) oznacza to "
            "ok. 2,5–3 tys. dzieci z WWS każdego roku. "
            "Rodziny dzieci z WWS na co dzień zarządzają dużą ilością informacji medycznych: "
            "harmonogramami leków (często z różnymi dawkami i częstotliwościami), wynikami INR "
            "istotnymi przy leczeniu przeciwkrzepliwym, pomiarami domowymi, historią leczenia "
            "i kolejnych hospitalizacji oraz dokumentacją medyczną z wypisów i konsultacji. "
            "W praktyce dane te są rozproszone w notesach, zdjęciach wyników, arkuszach "
            "kalkulacyjnych i pamięci opiekunów. Utrudnia to przygotowanie do wizyty, przekazanie "
            "informacji drugiemu opiekunowi oraz zachowanie ciągłości opieki przy zmianie "
            "osoby sprawującej pieczę.",
            styles["body"],
        )
    )
    story.append(
        callout_box(
            "<b>Dlaczego aplikacja mobilna?</b> Opiekunowie korzystają ze smartfona w szpitalu, "
            "w domu i w drodze. Aplikacja mobilna umożliwia m.in. przypomnienia o dawkach "
            "i pomiarach, wygodne wprowadzanie danych oraz udostępnianie raportu PDF lekarzowi "
            "wprost z telefonu, bez szukania komputera w trudnych warunkach.",
            styles,
        )
    )

    story.append(
        p(
            "Przed rozpoczęciem prac fundacja sprawdziła dostępne rozwiązania (stan na lipiec 2026). "
            "<b>mojeIKP</b> udostępnia dokumenty systemu ochrony zdrowia (e-recepty, e-skierowania, "
            "elektroniczna dokumentacja medyczna), ale nie prowadzi domowego dziennika opiekuna: "
            "nie ma rejestru INR z parametrami laboratorium, harmonogramu i historii podań leków "
            "ani raportu na wizytę. <b>Apple Zdrowie</b> i <b>Google Health Connect</b> to ogólne "
            "magazyny danych powiązane z jednym ekosystemem telefonu, bez INR, bez profilu dziecka "
            "prowadzonego przez dwoje opiekunów i bez treści w języku polskim dopasowanych do WWS. "
            "Aplikacje do leków (np. Medisafe, MyTherapy) oraz do INR dla pacjentów "
            "przeciwkrzepliwych obejmują każda jeden wycinek potrzeb, są w większości "
            "anglojęzyczne i nastawione na dorosłego pacjenta, a część aplikacji INR podpowiada "
            "dawki, czego fundacja świadomie unika (rozdz. 6.3). Żadne z tych rozwiązań nie łączy "
            "w jednym miejscu tego, czego potrzebuje rodzina dziecka z wadą serca: INR, leków "
            "z przypomnieniami, historii hospitalizacji, udostępniania w rodzinie i eksportu "
            "karty na wizytę. Fundacja "
            "dysponuje już własnym zapleczem cyfrowym i działającą wersją roboczą aplikacji. "
            "Projekt dotacyjny pozwala ukończyć wersję mobilną, opublikować aplikację "
            "w oficjalnych sklepach, wzmocnić ochronę danych o zdrowiu oraz zapewnić rok "
            "stabilnego utrzymania.",
            styles["body"],
        )
    )
    # ========== 3. ZAKRES ==========
    story.extend(section_title("3", "Zakres funkcjonalny wersji 1 (v1) i poza zakresem", styles))
    story.append(p("<b>3.1. Zakres v1: co już działa, a co powstanie w projekcie</b>", styles["h2"]))
    story.append(
        p(
            "Tabela rozdziela dwie rzeczy: funkcje gotowe i przetestowane w roboczej wersji "
            "aplikacji (zrzuty ekranu w załączniku A), wytworzone nieodpłatnie jako wkład własny "
            "fundacji, oraz prace, które zostaną wykonane ze środków dotacji. Kolumna środkowa "
            "odpowiada ok. 44% docelowego zakresu produktu i podstawie wyceny wkładu własnego "
            "(rozdz. 8).",
            styles["body"],
        )
    )

    scope_rows = [
        ["Obszar", "Co już działa (wkład własny fundacji)", "Co powstanie ze środków dotacji"],
        [
            "Logowanie i konta",
            "Logowanie kontem Google bez osobnego hasła; token sesji weryfikowany po stronie API.",
            "Dostosowanie logowania do wymagań App Store, jednolity model sesji na Androidzie i iOS.",
        ],
        [
            "Profil pacjenta",
            "Imię i nazwisko, grupa krwi; słownik 51 wad serca z wyszukiwaniem i wielokrotnym wyborem; "
            "zaburzenia rytmu (9 typów z opisem), rozrusznik (7 rodzajów), przebyte operacje "
            "(typ, data, liczba dni na intensywnej terapii), powikłania, choroby współistniejące, "
            "zespoły genetyczne; zapis automatyczny.",
            "Panel danych opiekunów i rodziców, uzupełnienie słownika wad serca, "
            "przejęcie konta przez pacjenta po 18. roku życia.",
        ],
        [
            "Historia leczenia i hospitalizacji",
            "Funkcja nie istnieje.",
            "Rejestr pobytów szpitalnych i etapów leczenia (daty, placówka, powód, przebieg) "
            "jako oś czasu dostępna na wizycie i przy zmianie ośrodka.",
        ],
        [
            "Dokumentacja medyczna",
            "Funkcja nie istnieje.",
            "Wgrywanie dokumentów PDF (wypisy, wyniki, konsultacje) z datą dokumentu, limit wielkości "
            "pliku, wgrywanie dostępne dla kont zatwierdzonych przez fundację, bezpieczne przechowywanie.",
        ],
        [
            "Leki",
            "Lista leków z dawką, częstotliwością (od co 4 godziny do co 2 dni) i czasem trwania; "
            "harmonogram i historia podań, śledzenie kolejnej dawki, przypomnienia na urządzeniu.",
            "Przypomnienia na iOS, obsługa sytuacji brzegowych, testy na urządzeniach.",
        ],
        [
            "Pomiary",
            "Saturacja, tętno, ciśnienie skurczowe i rozkurczowe, diureza dobowa, notatki; historia "
            "wpisów, wykresy trendów (od 7 dni do całego okresu), codzienne przypomnienie "
            "o pomiarze. Aplikacja nie ocenia wartości pomiarów.",
            "Dopracowanie wykresów i interfejsu, testy na urządzeniach.",
        ],
        [
            "INR",
            "Rejestr wyników z czasem protrombinowym, normą laboratorium i wskaźnikiem ISI; "
            "historia wyników, zakresy odniesienia o charakterze informacyjnym.",
            "Stabilizacja modułu i ujednolicenie opisów (rejestr wyników, nie narzędzie diagnostyczne).",
        ],
        [
            "Raport PDF",
            "Eksport karty pacjenta z urządzenia: profil, leki, pomiary z wykresami oraz INR "
            "z tabelą parametrów badania.",
            "Uzupełnienie raportu o hospitalizacje i dokumentację, dopracowanie wydruku.",
        ],
        [
            "Udostępnianie w rodzinie",
            "Zaproszenie dla współopiekuna (token z terminem ważności), akceptacja zaproszenia, "
            "lista osób z dostępem, odwoływanie dostępu.",
            "Komunikaty informacyjne przy zaproszeniu (zakres udostępnianych danych), testy.",
        ],
        [
            "Zaplecze: API, baza, chmura",
            "API fundacji obsługujące profil, leki, pomiary, INR oraz dostępy; baza danych "
            "w regionie UE, uwierzytelnianie, kopie zapasowe.",
            "Wzmocnienie zabezpieczeń, limity zapytań i wgrywanych plików, dziennik dostępu, "
            "usuwanie konta i danych w całym systemie.",
        ],
        [
            "Ochrona danych (RODO)",
            "Dostęp do danych wyłącznie po zalogowaniu, połączenia szyfrowane, przetwarzanie "
            "w infrastrukturze w UE.",
            "Wyraźne zgody na dane o zdrowiu (art. 9 ust. 2 lit. a), aktualizacja polityki prywatności, prawo "
            "do usunięcia konta, ocena skutków (DPIA), dziennik dostępu.",
        ],
        [
            "Aplikacja mobilna i publikacja",
            "Wersja robocza na Androida (React Native) z kompletem powyższych ekranów, "
            "przed publikacją w sklepie.",
            "Stabilizacja, wersja iOS, testy z rodzinami, złożenie i weryfikacja w Google Play "
            "oraz App Store, materiały informacyjne.",
        ],
    ]
    story.append(
        make_table(scope_rows, [26 * mm, (usable - 26 * mm) * 0.5, (usable - 26 * mm) * 0.5], styles)
    )
    story.append(Spacer(1, 6))

    story.append(p("<b>3.2. Poza zakresem v1</b>", styles["h2"]))
    story.append(
        p(
            "Świadome ograniczenie zakresu pozwala ukończyć produkt użyteczny dla rodzin, "
            "bezpieczny pod kątem danych o zdrowiu i możliwy do utrzymania przez fundację. "
            "<b>Wymienione niżej elementy nie zostaną wykonane w ramach wnioskowanej dotacji "
            "i nie są objęte kosztorysem z rozdz. 8.</b> Podzielono je na trzy grupy, aby było "
            "jasne, co fundacja planuje w dalszej kolejności, a czego nie zamierza budować.",
            styles["body"],
        )
    )
    story.append(p("Możliwe kolejne etapy: po ukończeniu v1, w osobnym finansowaniu", styles["group_label"]))
    story.append(
        bullets(
            [
                "kalendarz i zapisy na konsultacje psychologiczne w aplikacji (wybór wolnego terminu "
                "przez rodzica);",
                "przekazywanie zanonimizowanych danych medycznych do celów naukowych; wymaga "
                "odrębnej analizy prawnej i osobnej, dobrowolnej zgody;",
                "tryb offline z pełną synchronizacją danych po odzyskaniu łączności;",
                "wersje językowe inne niż polski.",
            ],
            styles,
        )
    )
    story.append(p("Nieplanowane: poza kierunkiem rozwoju aplikacji", styles["group_label"]))
    story.append(
        bullets(
            [
                "diagnostyka medyczna i automatycznie generowane zalecenia terapeutyczne, "
                "czyli funkcje czyniące z aplikacji wyrób medyczny;",
                "panel lekarza lub placówki medycznej oraz integracja z systemami P1 "
                "i e-dokumentacją podmiotów leczniczych;",
                "powiadomienia push wysyłane z serwera; przypomnienia działają lokalnie "
                "na urządzeniu użytkownika.",
            ],
            styles,
        )
    )
    story.append(p("Istnieją niezależnie od projektu: utrzymywane poza tą linią budżetową", styles["group_label"]))
    story.append(
        bullets(
            [
                "publiczna strona internetowa fundacji;",
                "sklep charytatywny i płatności darowizn;",
                "bezpłatne konsultacje psychologiczne dla rodzin: fundacja prowadzi je w ramach "
                "działalności statutowej ze środków własnych i darowizn, a wnioskowana dotacja "
                "nie obejmuje ich finansowania.",
            ],
            styles,
        )
    )

    # ========== 4. USER FLOW ==========
    story.extend(section_title("4", "Przepływ użytkownika", styles))
    story.append(
        p(
            "Poniższy opis oddaje docelowy przebieg korzystania z aplikacji po publikacji "
            "w sklepach (z uwzględnieniem prac RODO i iOS przewidzianych w projekcie).",
            styles["body"],
        )
    )

    flow_rows = [
        ["Krok", "Działanie użytkownika", "Wynik"],
        [
            "1",
            "Logowanie kontem Google (na iOS zgodnie z wymaganiami App Store); akceptacja regulaminu i zgód RODO, w tym na dane o zdrowiu",
            "Utworzenie lub odtworzenie sesji; wejście do aplikacji",
        ],
        [
            "2",
            "Uzupełnienie profilu pacjenta (dane medyczne istotne dla opieki)",
            "Zapis w bezpiecznym magazynie danych powiązanym z kontem",
        ],
        [
            "3",
            "Dodawanie leków, oznaczanie dawek; włączenie przypomnień (opcjonalnie)",
            "Lokalne powiadomienia systemowe; historia podań",
        ],
        [
            "4",
            "Wprowadzanie pomiarów i wyników INR",
            "Historia, wykresy, etykiety informacyjne",
        ],
        [
            "5",
            "Eksport raportu PDF na wizytę lub do drugiego opiekuna",
            "Plik PDF do udostępnienia z urządzenia",
        ],
        [
            "6",
            "Utworzenie zaproszenia dla współopiekuna; druga osoba akceptuje link z zaproszenia",
            "Wspólny dostęp do danych; możliwość odwołania dostępu przez właściciela",
        ],
    ]
    story.append(
        make_table(
            flow_rows,
            [12 * mm, usable * 0.48, usable * 0.52 - 12 * mm],
            styles,
        )
    )
    story.append(Spacer(1, 6))
    nav_head = p("<b>Główne obszary nawigacji (zakładki)</b>", styles["h2"])
    nav_list = (
        bullets(
            [
                "<b>Profil pacjenta</b> – dane stałe, historia operacji / wad, panel opiekunów;",
                "<b>Historia leczenia i hospitalizacji</b> – oś czasu pobytów szpitalnych "
                "wraz z dołączoną dokumentacją medyczną (PDF);",
                "<b>Leki</b> – farmakoterapia i przypomnienia;",
                "<b>Pomiary</b> – rejestr parametrów domowych;",
                "<b>INR</b> – historia badań przeciwkrzepliwych;",
                "oraz ścieżki pomocnicze: logowanie, akceptacja zaproszenia, eksport PDF, zarządzanie dostępami.",
            ],
            styles,
        )
    )
    story.append(KeepTogether([nav_head, nav_list]))

    # ========== 5. PLATFORMY ==========
    story.extend(section_title("5", "Platformy, sklepy i architektura", styles))
    story.append(p("<b>5.1. Platformy i dystrybucja</b>", styles["h2"]))
    plat_rows = [
        ["Element", "Założenie"],
        ["Android", "Aplikacja pacjenta w sklepie z aplikacjami Google Play; konto deweloperskie fundacji; opłata rejestracyjna sklepu jest jednorazowa."],
        ["iOS", "Ta sama baza funkcjonalna; logowanie dostosowane do wymagań App Store; testy przedpremierowe i publikacja z konta deweloperskiego fundacji."],
        ["Cena dla użytkownika", "Aplikacja <b>bezpłatna</b>: pobranie i pełne korzystanie bez opłat. Brak zakupów w aplikacji, subskrypcji, reklam i jakiejkolwiek sprzedaży wewnątrz aplikacji; wzmianki o „sklepach” w tym dokumencie dotyczą wyłącznie sklepów z aplikacjami (Google Play, App Store)."],
        ["Materiały w sklepach", "Opisy i materiały po polsku; polityka prywatności i zastrzeżenie medyczne dostępne przed pobraniem aplikacji."],
    ]
    story.append(make_table(plat_rows, [32 * mm, usable - 32 * mm], styles))
    story.append(Spacer(1, 6))

    story.append(p("<b>5.2. Architektura (zarys bez szczegółów wdrożeniowych)</b>", styles["h2"]))
    story.append(
        p(
            "Aplikacja mobilna komunikuje się z własnym API fundacji, utrzymywanym w chmurze "
            "w regionie Europejskiego Obszaru Gospodarczego. Uwierzytelnianie opiera się na "
            "logowaniu przez zaufanego dostawcę tożsamości (token sesji weryfikowany po stronie "
            "API). Dane medyczne są zapisywane w bazie po stronie serwera i nie są publicznie "
            "dostępne bez zalogowania. Warstwa serwisowa jest współdzielona "
            "z istniejącym zapleczem cyfrowym fundacji, co ogranicza koszt i ryzyko dublowania infrastruktury.",
            styles["body"],
        )
    )
    story.append(
        info_box(
            "<b>Model dostępu:</b> urządzenie użytkownika → szyfrowane połączenie HTTPS → API "
            "(weryfikacja tokenu) → magazyn danych w UE. Aplikacja nie uzyskuje "
            "bezpośredniego, otwartego dostępu do całej bazy, a jedynie do zasobów wynikających "
            "z tożsamości i ewentualnego udostępnienia w rodzinie.",
            styles,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        p(
            "Technicznie aplikacja mobilna jest rozwijana w podejściu wieloplatformowym "
            "(wspólna logika biznesowa dla Android i iOS), co pozwala utrzymać jednakowy zestaw funkcji "
            "przy rozsądnym koszcie drugiej platformy oraz zachować bezpieczeństwo "
            "i utrzymywalność rozwiązania.",
            styles["body"],
        )
    )

    # ========== 6. RODO ==========
    story.extend(section_title("6", "Ochrona danych osobowych i danych o zdrowiu (RODO)", styles))
    story.append(
        p(
            "Aplikacja przetwarza <b>dane o zdrowiu</b> (szczególna kategoria danych w rozumieniu "
            "art. 9 RODO): m.in. informacje o wadach serca, lekach, pomiarach, wynikach INR, "
            "przebiegu leczenia i hospitalizacji oraz wgrywaną dokumentację medyczną. "
            "Z tego względu projekt przewiduje środki wyższe niż przy zwykłych danych kontaktowych.",
            styles["body"],
        )
    )
    story.append(p("<b>6.1. Podstawa i transparentność</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "administrator danych: Fundacja Wyjątkowe Serca (dane rejestrowe i kontakt RODO w polityce prywatności);",
                "podstawa: <b>art. 6 ust. 1 lit. b RODO</b>, czyli przetwarzanie niezbędne do świadczenia usługi, o którą prosi użytkownik (regulamin aplikacji), oraz <b>wyraźna zgoda</b> na dane o zdrowiu z <b>art. 9 ust. 2 lit. a RODO</b>, zbierana oddzielnie od zgód marketingowych;",
                "informacja o roli opiekuna prawnego przy danych dziecka;",
                "polityka prywatności zaktualizowana pod aplikację pacjenta, dostępna w aplikacji i w opisach sklepowych;",
                "jasna informacja przy zaproszeniu współopiekuna: druga osoba uzyska wgląd w pełny zakres danych medycznych udostępnionego profilu.",
            ],
            styles,
        )
    )
    story.append(p("<b>6.2. Środki techniczne i organizacyjne (w projekcie)</b>", styles["h2"]))
    rodo_rows = [
        ["Obszar", "Założenie w projekcie"],
        ["Dostęp", "Wyłącznie po zalogowaniu; autoryzacja po stronie API; brak publicznego odczytu kart pacjentów."],
        ["Szyfrowanie", "Połączenia HTTPS; szyfrowanie danych w spoczynku po stronie dostawcy chmury w UE."],
        ["Region", "Przetwarzanie w infrastrukturze w regionie EOG (centrum danych w UE)."],
        ["Kopie zapasowe", "Regularne kopie zapasowe bazy (retencja krótko- i średnioterminowa wg konfiguracji chmury)."],
        ["Zabezpieczenia API", "Ograniczenie publicznie zbędnej dokumentacji API, ochrona sekretów, limity zapytań, zawężenie uprawnień kont serwisowych."],
        ["Rozliczalność", "Podstawowy dziennik zdarzeń dostępu (kto / kiedy / jaki zasób, bez zbędnego logowania treści klinicznej)."],
        ["Prawa osoby", "Podgląd i edycja własnych danych w aplikacji; usunięcie konta i powiązanych danych medycznych w zakresie v1; eksport raportu PDF jako forma przenoszenia informacji na wizytę."],
        ["Dokumentacja medyczna", "Wgrywanie plików wyłącznie przez zalogowanych użytkowników zatwierdzonych przez fundację; limit wielkości pliku; pliki przechowywane w tym samym reżimie bezpieczeństwa co pozostałe dane o zdrowiu."],
        ["Pełnoletność pacjenta", "Po ukończeniu 18 lat dostęp rodziców zostaje wstrzymany; dalszy wgląd wymaga wyraźnej zgody pacjenta, którą może on w każdej chwili wycofać."],
        ["Ocena ryzyka", "Ocena skutków dla ochrony danych (DPIA) na podstawie art. 35 RODO; przetwarzanie łączy dane o zdrowiu, dane dzieci i aplikację mobilną, co wskazuje na obowiązek jej przeprowadzenia. Wersja robocza DPIA powstaje w fazie F1 (miesiące 1–2), zanim aplikacja zacznie przetwarzać dane rzeczywistych rodzin; do tego czasu wersja robocza działa wyłącznie na danych testowych. W fazie F3 DPIA jest aktualizowana po wdrożeniu zabezpieczeń."],
        ["Inspektor ochrony danych", "Fundacja oceniła obowiązek z art. 37 ust. 1 lit. c RODO: przetwarzanie danych o zdrowiu w skali ok. 200 kont, przez jeden podmiot i w jednym kraju, nie ma charakteru wielkoskalowego w rozumieniu motywu 91 RODO, więc wyznaczenie IOD nie jest obowiązkowe. Fundacja wyznacza osobę odpowiedzialną za ochronę danych (kontakt w polityce prywatności) i ponownie oceni obowiązek w ramach DPIA oraz przy istotnym wzroście liczby użytkowników."],
        ["Podmioty przetwarzające", "Umowy / warunki powierzenia z dostawcami chmury i tożsamości (dostawcy infrastruktury w UE); po stronie fundacji."],
    ]
    story.append(make_table(rodo_rows, [32 * mm, usable - 32 * mm], styles))
    story.append(Spacer(1, 6))
    story.append(p("<b>6.3. Zastrzeżenie medyczne i kwalifikacja względem wyrobu medycznego (MDR)</b>", styles["h2"]))
    story.append(
        p(
            "Aplikacja jest narzędziem organizacyjno-informacyjnym dla rodziców i opiekunów: "
            "porządkuje dane wpisane przez użytkownika (profil, leki, pomiary, wyniki INR, "
            "dokumentacja PDF) i ułatwia przygotowanie do wizyty. Nie służy do stawiania diagnoz, "
            "profilaktyki, przewidywania przebiegu choroby ani do generowania zaleceń dawkowania. "
            "Nie zastępuje konsultacji lekarskiej.",
            styles["body"],
        )
    )
    story.append(
        bullets(
            [
                "<b>Moduł INR:</b> rejestr wyników wprowadzonych przez użytkownika. Zakresy "
                "odniesienia mają charakter informacyjny i nie interpretują wyniku pacjenta;",
                "<b>Przypomnienia dawek:</b> według schematu podanego przez użytkownika "
                "(dawka, częstotliwość, godzina). Aplikacja nie wylicza dawek z INR ani protokołu "
                "terapeutycznego;",
                "<b>Teksty w interfejsie oraz w opisach w sklepach z aplikacjami</b> "
                "(Google Play, App Store) będą spójne z tym przeznaczeniem "
                "(bez zaleceń medycznych i bez obietnic skutków klinicznych).",
            ],
            styles,
        )
    )
    story.append(
        p(
            "Przy takim przeznaczeniu fundacja przyjmuje, że oprogramowanie v1 nie stanowi "
            "wyrobu medycznego w rozumieniu rozporządzenia (UE) 2017/745 i wytycznych MDCG 2019-11: "
            "brak przeznaczenia do celów medycznych z art. 2 MDR (m.in. diagnoza, leczenie, "
            "prognozowanie). Kwalifikację potwierdzi zewnętrzna opinia prawna w dwóch etapach "
            "(rozdz. 8): wstępna w fazie F1 (przeznaczenie v1, ryzyka INR i przypomnień dawek) "
            "oraz końcowa w fazie F3 po ustabilizowaniu funkcji i treści, przed publikacją "
            "w sklepach z aplikacjami (F4). Jeśli opinia wskaże ryzyko kwalifikacji jako wyrób, "
            "fundacja dostosuje funkcje i treści przed udostępnieniem rodzinom. W v1 nie "
            "przewiduje się automatycznego dawkowania ani interpretacji klinicznej INR.",
            styles["body"],
        )
    )

    # ========== 7. HARMONOGRAM ==========
    story.extend(section_title("7", "Harmonogram i kamienie milowe", styles))
    story.append(
        p(
            "Harmonogram ma charakter roboczy (miesiące liczone od startu finansowania). Prace rozwojowe "
            "rozłożono na osiem miesięcy (ok. 74 godzin miesięcznie, czyli ok. 3,5–4 godzin dziennie "
            "przy założeniu ok. 20 dni roboczych), a dwunastomiesięczny okres utrzymania zaczyna się "
            "po ich zakończeniu i publikacji.",
            styles["body"],
        )
    )
    harm_rows = [
        ["Faza", "Czas", "Kamienie milowe"],
        [
            "F1. Analiza zakresu i kwalifikacja MDR",
            "Miesiąc 1–2",
            "Utrwalenie założeń, priorytety sklepów, plan testów. "
            "Wersja robocza oceny skutków (DPIA, art. 35 RODO) przed przetwarzaniem danych "
            "rzeczywistych rodzin. "
            "Wstępna opinia prawna kwalifikacji MDR (MDCG 2019-11): przeznaczenie v1, "
            "ryzyka INR i przypomnień dawek.",
        ],
        [
            "F2. Produkt Android + iOS",
            "Miesiące 1–5",
            "Dokumentacja medyczna, historia hospitalizacji, panel opiekunów, przejęcie konta po 18. r.ż.; "
            "stabilizacja Androida, wersja iOS, testy na urządzeniach i z rodzinami-testerami. "
            "Treści w interfejsie zgodne z zastrzeżeniem medycznym (rozdz. 6.3).",
        ],
        [
            "F3. RODO i bezpieczeństwo",
            "Miesiące 2–6",
            "Zgody art. 9, usuwanie konta, wzmocnienie zabezpieczeń API, dziennik dostępu, aktualizacja DPIA "
            "po wdrożeniu zabezpieczeń, aktualizacja polityki. Końcowa opinia kwalifikacyjna MDR po ustabilizowaniu funkcji i treści; "
            "warunek startu publikacji w sklepach z aplikacjami (F4).",
        ],
        [
            "F4. Publikacja w sklepach",
            "Miesiące 6–8",
            "Konta deweloperskie fundacji, karty sklepowe PL, weryfikacja w Google Play i App Store, poprawki po weryfikacji "
            "(po pozytywnej końcowej opinii MDR z F3).",
        ],
        [
            "F5. Utrzymanie po wdrożeniu",
            "Miesiące 9–20",
            "Dwanaście miesięcy liczonych od zakończenia prac i publikacji: aktualizacje systemów, "
            "poprawki, monitoring hostingu, wsparcie fundacji (rozdz. 9).",
        ],
    ]
    story.append(make_table(harm_rows, [38 * mm, 28 * mm, usable - 66 * mm], styles))
    story.append(Spacer(1, 4))

    risk_head = p("<b>Ryzyka i ich ograniczanie</b>", styles["h2"])
    risk_rows = [
        ["Ryzyko", "Sposób ograniczania"],
        [
            "Wydłużona weryfikacja aplikacji przez sklepy (szczególnie App Store przy treściach zdrowotnych)",
            "Bufor na poprawki w harmonogramie; zastrzeżenie medyczne i polityka prywatności przygotowane przed zgłoszeniem.",
        ],
        [
            "Brak zwolnienia z opłaty Apple Developer dla organizacji non-profit",
            "Koszt awaryjny (ok. 500 zł/rok) możliwy do pokrycia w ramach środków utrzymaniowych.",
        ],
        [
            "Niska adopcja narzędzia przez rodziny",
            "Aplikacja bezpłatna; promocja kanałami fundacji (rozdz. 10); rozwój na podstawie opinii rodzin.",
        ],
        [
            "Zależność od jednego wykonawcy",
            "Kod w repozytorium fundacji z bieżącym dostępem. Prawa majątkowe do kodu i dokumentacji "
            "przeniesione na fundację umową, dzięki czemu można zlecić kontynuację innemu wykonawcy. "
            "Konta sklepowe i infrastruktura chmurowa po stronie fundacji. Dokumentacja uruchomienia "
            "i utrzymania (wdrożenie, sekrety poza repozytorium, kopie zapasowe, procedura incydentu) "
            "powstaje w ramach prac. Ryczałt z uzgodnionym SLA. Wykonawca jest autorem wersji roboczej.",
        ],
        [
            "Zmiany wymogów sklepów lub przepisów",
            "Dwunastomiesięczne utrzymanie obejmuje aktualizacje zgodnościowe.",
        ],
        [
            "Kwalifikacja aplikacji jako wyrób medyczny (MDR)",
            "Przeznaczenie v1: narzędzie organizacyjno-informacyjne, bez zaleceń dawkowania "
            "i bez interpretacji klinicznej INR. Opinia MDR w dwóch etapach (F1 wstępna, F3 końcowa "
            "przed sklepami; rozdz. 6.3, kosztorys). Przy ryzyku kwalifikacji: dostosowanie funkcji.",
        ],
    ]
    story.append(
        KeepTogether([risk_head, make_table(risk_rows, [usable * 0.42, usable * 0.58], styles)])
    )

    # ========== 8. BUDGET ==========
    story.extend(section_title("8", "Powiązanie z budżetem projektu", styles))
    story.append(
        p(
            "Poniższa tabela łączy bloki merytoryczne z kosztorysem wniosku. "
            "<b>Stawka prac programistycznych: 210 zł/h netto</b> (258,30 zł/h brutto przy VAT 23%). "
            "<b>Kwoty w tabeli są netto;</b> na końcu podano VAT 23% i sumę brutto. "
            "Fundacja w działalności statutowej nie odlicza VAT, więc koszt rzeczywisty to kwota brutto. "
            "Narzędzia warsztatu wykonawcy (środowisko, oprogramowanie deweloperskie) nie są ujęte osobno: "
            "są wliczone w stawkę. W budżecie są koszty produktu: prace, RODO, MDR, hosting, opłaty sklepowe. "
            "Opłata Google Play (25 USD ≈ 100 zł) to szacunek kosztu w PLN; dla uproszczenia wliczono ją "
            "do podstawy VAT razem z pozostałymi pozycjami.",
            styles["body"],
        )
    )
    bud_rows = [
        ["Lp.", "Pozycja", "Godz.", "Kwota netto (zł)"],
        ["", "«b»A. Rozwój aplikacji (pozostały zakres)", "", ""],
        ["1", "Analiza i projekt rozszerzonego zakresu funkcjonalnego", "»24", "»5 040"],
        [
            "2",
            "Dokończenie i stabilizacja aplikacji Android: obsługa błędów, testy na urządzeniach, "
            "dopracowanie interfejsu (profil, leki, pomiary, INR, raport PDF, udostępnianie)",
            "»88",
            "»18 480",
        ],
        [
            "3",
            "Dokumentacja medyczna: wgrywanie plików PDF z datą dokumentu, limity wielkości, "
            "zatwierdzanie użytkowników, bezpieczne przechowywanie",
            "»56",
            "»11 760",
        ],
        [
            "4",
            "Panel danych opiekunów oraz historia leczenia i hospitalizacji",
            "»64",
            "»13 440",
        ],
        [
            "5",
            "Usamodzielnienie pacjenta po 18. roku życia (przejęcie konta, zgody na dostęp rodziców)",
            "»24",
            "»5 040",
        ],
        [
            "6",
            "Testy z rodzinami-testerami przed publikacją; poprawki po testach",
            "»32",
            "»6 720",
        ],
        ["7", "Implementacja i testy iOS", "»96", "»20 160"],
        [
            "8",
            "Publikacja w Google Play i App Store (materiały, zastrzeżenie medyczne) "
            "oraz materiały informacyjne dla rodzin",
            "»32",
            "»6 720",
        ],
        ["", "«b»Suma A", "»416", "»87 360"],
        ["", "«b»B. Zgodność RODO / dane o zdrowiu", "", ""],
        [
            "9",
            "Zgody art. 9, dane opiekunów, polityka prywatności pod aplikację, komunikaty przy zaproszeniach",
            "»48",
            "»10 080",
        ],
        [
            "10",
            "Usunięcie konta i danych w całym systemie (aplikacja i API) "
            "wraz z testami kasowania kaskadowego",
            "»40",
            "»8 400",
        ],
        [
            "11",
            "Wzmocnienie zabezpieczeń API (sekrety, limity zapytań i uploadu, konta serwisowe)",
            "»40",
            "»8 400",
        ],
        [
            "12",
            "Dziennik dostępu, ocena skutków (DPIA: wersja robocza w F1, aktualizacja w F3), sprawdzenie wdrożenia wymogów RODO w działającej aplikacji",
            "»48",
            "»10 080",
        ],
        ["", "«b»Suma B", "»176", "»36 960"],
        ["", "«b»C. Koszty stałe w okresie prac", "", ""],
        [
            "13",
            "Konsultacja prawna RODO (zewnętrzny prawnik): polityka prywatności, wzorce zgód art. 9, "
            "komunikaty przy udostępnianiu w rodzinie, wsparcie przy DPIA (ok. 10–12 h)",
            "»–",
            "»4 000",
        ],
        [
            "14",
            "Opinia prawna kwalifikacji względem wyrobu medycznego (MDR, rozp. UE 2017/745, MDCG 2019-11): "
            "etap wstępny (F1: przeznaczenie v1, INR i przypomnienia dawek) oraz etap końcowy "
            "(F3: weryfikacja po ustabilizowaniu funkcji i treści, przed publikacją w sklepach z aplikacjami)",
            "»–",
            "»7 000",
        ],
        [
            "15",
            "Hosting i chmura w okresie prac (ok. 8 mies. × 50 zł netto/mies.): API, baza, storage, "
            "kopie zapasowe w UE, obciążenie testowe (szacunek z zapasem względem bieżącego zużycia GCP)",
            "»–",
            "»400",
        ],
        ["", "«b»Suma C", "»–", "»11 400"],
        ["", "«b»D. Utrzymanie po wdrożeniu (12 miesięcy)", "", ""],
        [
            "16",
            "Ryczałt utrzymaniowy: 5 000 zł netto/mies. (6 150 zł brutto/mies.) × 12 mies. "
            "(gotowość programisty, SLA, monitoring, do 10 h prac miesięcznie w cenie)",
            "»120",
            "»60 000",
        ],
        [
            "17",
            "Hosting i chmura po wdrożeniu (12 mies. × 70 zł netto/mies.): API, baza, backupy, "
            "PDF przy ok. 200 aktywnych kontach (szacunek z zapasem, ok. 30–70 zł/mies. wg GCP)",
            "»–",
            "»840",
        ],
        [
            "18",
            "Google Play Console, opłata rejestracyjna jednorazowa (25 USD ≈ 100 zł, koszt w PLN)",
            "»–",
            "»100",
        ],
        [
            "19",
            "Apple Developer Program (zwolnienie z opłaty dla non-profit; awaryjnie ok. 99 USD/rok "
            "poza kosztorysem lub ze środków utrzymaniowych)",
            "»–",
            "»0",
        ],
        ["", "«b»Suma D", "»120", "»60 940"],
        ["", "«b»RAZEM NETTO", "»712", "»196 660"],
        ["", "«b»VAT 23%", "»–", "»45 232"],
        ["", "«b»RAZEM BRUTTO: WNIOSKOWANA DOTACJA", "»–", "»241 892"],
    ]
    # Custom table with stronger total rows (netto / VAT / brutto).
    # Footer match must be on the row label only (after «b»), not substring of position
    # Match footer labels only; substring "VAT 23%" in position text would wrongly
    # style that row as a footer (white text on light background).
    def _budget_row_label(row: list) -> str:
        raw = str(row[1]) if len(row) > 1 else ""
        return raw[3:] if raw.startswith("«b»") else raw

    def _is_budget_footer(label: str) -> bool:
        return label.startswith("RAZEM") or label.startswith("VAT 23%")

    data = []
    for i, row in enumerate(bud_rows):
        label = _budget_row_label(row)
        is_footer = _is_budget_footer(label)
        line = []
        for cell in row:
            s = str(cell)
            if i == 0:
                line.append(p(s, styles["cell_header"]))
            elif is_footer:
                content = s[3:] if s.startswith("«b»") else s.lstrip("»")
                style = styles["cell_header_right"] if s.startswith("»") else styles["cell_header"]
                line.append(p(content, style))
            elif s.startswith("«b»"):
                line.append(p(s[3:], styles["cell_b"]))
            elif s.startswith("»"):
                content = s[1:]
                if "Suma" in label:
                    line.append(p(content, styles["cell_b_right"]))
                else:
                    line.append(p(content, styles["cell_right"]))
            else:
                line.append(p(s, styles["cell"]))
        data.append(line)

    col_w = [12 * mm, usable - 12 * mm - 20 * mm - 32 * mm, 20 * mm, 32 * mm]
    bt = Table(data, colWidths=col_w, repeatRows=1)
    n = len(data)
    cmds = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 3.2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3.2),
        ("BACKGROUND", (0, 0), (-1, 0), BRAND_BLUE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, GREY_BG]),
        ("LINEBELOW", (0, 1), (-1, -2), 0.3, GREY_LINE),
        ("BACKGROUND", (0, n - 3), (-1, n - 2), colors.HexColor("#2E6A96")),
        ("BACKGROUND", (0, n - 1), (-1, n - 1), colors.HexColor("#1A5F8F")),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, GREY_LINE),
    ]
    # Emphasize section header / suma rows (not footer totals)
    for idx, row in enumerate(bud_rows):
        label = _budget_row_label(row)
        if str(row[1]).startswith("«b»") and idx > 0 and not _is_budget_footer(label):
            cmds.append(("BACKGROUND", (0, idx), (-1, idx), colors.HexColor("#E7EFF6")))
    bt.setStyle(TableStyle(cmds))
    story.append(bt)
    story.append(Spacer(1, 6))
    fin_head = p("<b>Jak czytać powyższe kwoty</b>", styles["h2"])
    fin_rows = [
        ["Składnik", "Kwota"],
        ["Prace rozwojowe (bloki A i B) z dotacji, brutto", "»152 914 zł"],
        ["Koszty stałe okresu prac (blok C) z dotacji, brutto", "»14 022 zł"],
        ["Utrzymanie 12 mies. po wdrożeniu (blok D) z dotacji, brutto", "»74 956 zł"],
        ["«b»Razem: wnioskowana dotacja, brutto", "»241 892 zł**"],
        ["Wkład własny (prace przed projektem), wycena bez VAT", "»97 440 zł"],
        ["«b»Wartość prac nad produktem, netto (wkład + rozwój A+B)", "»221 760 zł**"],
    ]
    story.append(
        KeepTogether([fin_head, make_table(fin_rows, [usable - 34 * mm, 34 * mm], styles)])
    )
    story.append(Spacer(1, 6))
    story.append(
        info_box(
            "Wkład własny to wycena nieodpłatnych prac przed projektem stawką 210 zł/h "
            "(464 h = 97 440 zł), bez VAT: nie jest to faktura, tylko wartość pracy. "
            "Wartość prac nad produktem w ujęciu netto: 97 440 zł wkładu + 124 320 zł rozwoju "
            "z dotacji (592 h) = 221 760 zł (wykaz funkcji wkładu w rozdz. 3). "
            "Utrzymanie, koszty stałe okresu prac i VAT od usług fakturowanych nie wchodzą "
            "do tej sumy. Kod i prawa majątkowe należą do fundacji; konta sklepowe i infrastruktura też. "
            "Wykonawca jest autorem wersji roboczej, co ułatwia kontynuację prac.",
            styles,
        )
    )
    story.append(Spacer(1, 6))

    story.append(p("<b>Mapowanie opisu → budżet</b>", styles["h2"]))
    map_rows = [
        ["Część opisu projektu", "Pozycje kosztorysu"],
        ["Analiza i projekt zakresu (rozdz. 1–5, 7)", "Lp. 1"],
        ["Zakres v1 Android, przepływ, funkcje medyczne, testy z rodzinami", "Lp. 2–6"],
        ["iOS, sklepy, zastrzeżenie medyczne, materiały dla rodzin (rozdz. 10)", "Lp. 7–8"],
        ["Ochrona danych RODO (rozdz. 6.1–6.2) oraz kwalifikacja MDR (rozdz. 6.3)", "Lp. 9–14"],
        ["Hosting w okresie prac", "Lp. 15"],
        ["Utrzymanie i hosting produkcyjny (rozdz. 9)", "Lp. 16–19"],
    ]
    story.append(make_table(map_rows, [usable * 0.55, usable * 0.45], styles))
    story.append(
        p(
            "Szczegółowy kosztorys w formularzu wniosku powinien być tożsamy z powyższymi kwotami.",
            styles["body"],
        )
    )

    # ========== 9. MAINTENANCE (KeepTogether — avoid orphan heading) ==========
    maintain = []
    maintain.extend(section_title("9", "Utrzymanie po wdrożeniu", styles))
    maintain.append(
        p(
            "Publikacja w sklepach nie kończy odpowiedzialności za narzędzie przetwarzające dane "
            "o zdrowiu. W ramach 12 miesięcy projektu przewidziano aktualizacje pod nowe wersje "
            "systemów Android i iOS, usuwanie zgłaszanych błędów, utrzymanie hostingu API i bazy "
            "wraz z kopiami zapasowymi, drobne zmiany interfejsu i treści (w tym komunikaty RODO) "
            "oraz wsparcie fundacji w komunikacji z rodzinami, zgodnie z zakresem z rozdz. 3 "
            "i pozycjami 16–19 kosztorysu. Okres utrzymania liczy się od zakończenia prac "
            "nad aplikacją, a nie od startu projektu.",
            styles["body"],
        )
    )
    maintain.append(
        p(
            "<b>Model rozliczenia.</b> Ryczałt miesięczny <b>5 000 zł netto</b> (6 150 zł brutto) "
            "obejmuje gotowość programisty, uzgodnione czasy reakcji (SLA), monitoring, kopie zapasowe "
            "oraz do 10 godzin prac miesięcznie. Prace ponad ten limit (np. nowe moduły) są wyceniane "
            "osobno, poza budżetem projektu, na pisemne zlecenie fundacji.",
            styles["body"],
        )
    )
    maintain.append(
        bullets(
            [
                "<b>Czasy reakcji (SLA):</b> awaria krytyczna (aplikacja niedostępna, incydent "
                "bezpieczeństwa): reakcja w 1 dzień roboczy, rozwiązanie lub obejście w 3 dni; "
                "pozostałe zgłoszenia do 5 dni roboczych;",
                "<b>w ryczałcie:</b> aktualizacje pod nowe wersje Android/iOS i zależności, "
                "poprawki błędów, monitoring dostępności, kopie zapasowe, drobne zmiany treści "
                "i komunikatów RODO;",
                "<b>poza ryczałtem:</b> nowe moduły i funkcje, wyceniane odrębnie, poza "
                "budżetem projektu.",
            ],
            styles,
        )
    )
    maintain.append(
        p(
            "Model długoterminowy: fundacja pozostaje właścicielem kont sklepowych, polityk "
            "i relacji z użytkownikami; prace programistyczne mogą być kontynuowane w trybie "
            "utrzymaniowym po zakończeniu okresu dotacji.",
            styles["body"],
        )
    )
    story.append(KeepTogether(maintain))

    # ========== 10. EFEKTY ==========
    story.extend(section_title("10", "Oczekiwane efekty i mierniki (ostrożne szacunki)", styles))
    story.append(
        p(
            "Projekt ma charakter wsparcia organizacyjnego i informacyjnego dla rodzin, "
            "a nie interwencji medycznej. Poniższe mierniki służą rozliczeniu działania narzędzia "
            "cyfrowego, bez obietnic skutków klinicznych.",
            styles["body"],
        )
    )
    eff_rows = [
        ["Obszar", "Miernik i wartość docelowa", "Sposób weryfikacji"],
        [
            "Dostępność",
            "Aplikacja opublikowana i bezpłatnie dostępna w Google Play oraz (docelowo) "
            "w App Store",
            "Publiczne strony aplikacji w sklepach; data publikacji",
        ],
        [
            "Zasięg",
            "Co najmniej 400 pobrań i 200 aktywnych kont w ciągu 12 miesięcy od publikacji",
            "Statystyki Google Play Console i App Store Connect",
        ],
        [
            "Realne korzystanie",
            "Co najmniej 40% aktywnych kont zapisuje w miesiącu przynajmniej jeden wpis "
            "(dawka leku, pomiar lub wynik INR)",
            "Zagregowane statystyki użycia, bez dostępu do treści medycznych",
        ],
        [
            "Zgodność z RODO",
            "Wdrożone zgody art. 9, działające usuwanie konta i danych, zaktualizowana "
            "polityka prywatności, sporządzona ocena skutków (DPIA)",
            "Lista kontrolna fazy F3, dokument DPIA, opublikowana polityka prywatności",
        ],
        [
            "Wsparcie rodzin",
            "Rodziny poznane dzięki aplikacji korzystają z bezpłatnych konsultacji "
            "psychologicznych (działanie własne fundacji, poza budżetem dotacji)",
            "Liczba konsultacji udzielonych rodzinom zgłoszonym przez aplikację",
        ],
    ]
    story.append(make_table(eff_rows, [28 * mm, usable * 0.42, usable * 0.58 - 28 * mm], styles))
    story.append(Spacer(1, 6))
    story.append(
        p(
            "<b>Wsparcie psychologiczne.</b> Rodziny, które fundacja pozna dzięki aplikacji, uzyskują "
            "dostęp do <b>bezpłatnych konsultacji psychologicznych</b>. Narzędzie cyfrowe pełni tu "
            "funkcję pomostu: pozwala dotrzeć ze wsparciem do rodzin, które inaczej pozostałyby poza "
            "zasięgiem fundacji. Same konsultacje prowadzone są w ramach działalności statutowej "
            "i finansowane ze środków własnych fundacji oraz darowizn; <b>wnioskowana dotacja nie "
            "obejmuje ich kosztów</b> (rozdz. 3.2).",
            styles["body"],
        )
    )
    story.append(
        p(
            "<b>Dotarcie do rodzin.</b> Aplikacja będzie promowana kanałami własnymi fundacji "
            "(serwis internetowy, media społecznościowe, społeczność podopiecznych i ich rodzin) "
            "oraz przez materiały informacyjne przekazywane rodzicom, m.in. w ośrodkach "
            "kardiologii dziecięcej.",
            styles["body"],
        )
    )
    story.append(
        callout_box(
            "<b>Czego projekt nie obiecuje:</b> poprawy wskaźników klinicznych, skrócenia hospitalizacji "
            "ani zastąpienia opieki medycznej. Sukcesem jest dostępne, zrozumiałe i bezpieczne narzędzie, "
            "z którego rodziny korzystają na co dzień przy organizacji opieki nad dzieckiem z WWS.",
            styles,
        )
    )

    # ========== 11. PODSUMOWANIE ==========
    story.extend(section_title("11", "Podsumowanie", styles))
    story.append(
        p(
            "Aplikacja pacjenta „Wyjątkowe Serca” porządkuje dane o zdrowiu i leczeniu dzieci "
            "z wrodzonymi wadami serca w jednym narzędziu mobilnym. Projekt obejmuje ukończenie "
            "produktu na Androidzie i iOS, publikację w sklepach, zgodność z RODO, opinię prawną "
            "MDR (MDCG 2019-11) oraz dwunastomiesięczne utrzymanie. Rodziny poznane dzięki aplikacji "
            "mogą skorzystać z bezpłatnych konsultacji psychologicznych fundacji (poza budżetem "
            "tego projektu).",
            styles["body"],
        )
    )
    story.append(
        p(
            "Wnioskowana kwota to <b>241 892 zł brutto</b> (196 660 zł netto + VAT 23%): "
            "152 914 zł brutto na prace rozwojowe (592 h × 210 zł/h netto), "
            "14 022 zł brutto kosztów stałych okresu prac (RODO, opinia MDR, hosting) "
            "oraz 74 956 zł brutto na 12 miesięcy utrzymania po wdrożeniu "
            "(ryczałt 5 000 zł netto/mies. i hosting). "
            "Wartość prac nad produktem (netto): 221 760 zł "
            "(124 320 zł rozwoju z dotacji + <b>97 440 zł wkładu własnego</b>, "
            "464 h × 210 zł/h, bez VAT, ok. 44% zakresu). Dotacja finansuje wyłącznie prace przyszłe.",
            styles["body"],
        )
    )

    # ========== ANNEX: SCREENSHOTS ==========
    story.extend(annex_screens(styles))

    story.append(
        KeepTogether(
            [
                HRFlowable(width="100%", thickness=0.6, color=GREY_LINE, spaceBefore=4, spaceAfter=4),
                p(
                    "Dokument przygotowany jako załącznik merytoryczny do wniosku o dofinansowanie. "
                    "Nie stanowi pełnej dokumentacji prawnej (DPIA, umowy powierzenia, polityka prywatności, "
                    "opinia MDR) ani dokumentacji technicznej dla zespołu deweloperskiego.",
                    styles["note"],
                ),
                p(
                    "Fundacja Wyjątkowe Serca · aplikacja pacjenta · opis projektu pod wniosek o dotację",
                    styles["note"],
                ),
            ]
        )
    )

    return story


def main() -> Path:
    styles = make_styles()
    doc = SimpleDocTemplate(
        str(OUT_PDF),
        pagesize=A4,
        leftMargin=MARGIN,
        rightMargin=MARGIN,
        topMargin=14 * mm,
        bottomMargin=16 * mm,
        title="Opis i założenia projektu. Aplikacja pacjenta Wyjątkowe Serca",
        author="Fundacja Wyjątkowe Serca",
        subject="Załącznik do wniosku o dotację: opis aplikacji pacjenta",
        creator="docs/generate_opis_aplikacji.py",
    )
    story = build_story(styles)
    doc.build(story, onFirstPage=cover_canvas, onLaterPages=footer_canvas)
    print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size} bytes)")
    return OUT_PDF


if __name__ == "__main__":
    main()
