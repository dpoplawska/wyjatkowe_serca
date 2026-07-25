#!/usr/bin/env python3
"""Generator PDF: Opis / założenia projektu aplikacji pacjenta Wyjątkowe Serca.

Załącznik pod wniosek o dotację. Uruchomienie:
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
OUT_PDF = Path(__file__).resolve().parent / "Opis_aplikacji_pacjenta_Wyjatkowe_Serca.pdf"

# --- Brand (fundacja) ---
BRAND_RED = colors.HexColor("#EC1A3B")
BRAND_BLUE = colors.HexColor("#2383C5")
GREY_TEXT = colors.HexColor("#2E2E2E")
GREY_MUTED = colors.HexColor("#616161")
GREY_LINE = colors.HexColor("#D0D5DD")
GREY_BG = colors.HexColor("#F5F7FA")
WHITE = colors.white

# --- Assets ---
LOGO_PNG = ROOT / "frontend" / "app" / "public" / "logo.png"

# --- Fonts (Polish glyphs) ---
pdfmetrics.registerFont(TTFont("DejaVu", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))
# Bez rejestracji rodziny znaczniki <b> w Paragraph są po cichu ignorowane
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
FONT_HEART = "DejaVu"  # Lato nie ma glifu ♥

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
    """Rozstrzelone litery dla nagłówka-kickera (Paragraph nie ma trackingu)."""
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
    return [Spacer(1, 8), chip, hr()]


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
                    line.append(p(s[1:], styles["cell_b_right"] if s.endswith("**") else styles["cell_right"]))
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
    canvas.setFont(FONT_HEART, 7.5)
    canvas.setFillColor(BRAND_RED)
    canvas.drawString(MARGIN, y, "♥")
    canvas.setFont(FONT_REG, 7.5)
    canvas.setFillColor(GREY_MUTED)
    canvas.drawString(
        MARGIN + 11, y, "Fundacja Wyjątkowe Serca — opis projektu aplikacji pacjenta"
    )
    canvas.drawRightString(PAGE_W - MARGIN, y, f"Strona {doc.page}")
    canvas.restoreState()


def cover_canvas(canvas, doc):
    """Strona tytułowa: pasy w barwach fundacji u góry i u dołu, bez stopki."""
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
    """Dedykowana strona tytułowa: logo fundacji, tytuł, pasek kluczowych faktów."""
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
            "Opis i założenia projektu — mobilna aplikacja wspierająca rodziców i opiekunów<br/>"
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
                p("KOSZT ROKU 1", styles["fact_label"]),
                p("UTRZYMANIE", styles["fact_label"]),
            ],
            [
                p("Android + iOS", styles["fact_value"]),
                p("aplikacja bezpłatna", styles["fact_value"]),
                p("131 500 zł", styles["fact_value"]),
                p("12 miesięcy", styles["fact_value"]),
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
    flow.append(Spacer(1, 10 * mm))
    flow.append(
        p(
            "Interfejs w języku polskim · Publikacja w Google Play i App Store · "
            "Dokument spójny z kosztorysem projektu",
            styles["cover_meta"],
        )
    )
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
    """Ramka „w skrócie”: lista etykieta–wartość na jasnoniebieskim tle z paskiem akcentu."""
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

    # ========== O DOKUMENCIE / SPIS TREŚCI ==========
    story.append(
        p(
            "<b>Charakter dokumentu.</b> Niniejszy załącznik opisuje cele, zakres funkcjonalny, "
            "założenia techniczne i organizacyjne, ochronę danych o zdrowiu oraz powiązanie prac "
            "z kosztorysem wniosku. Projekt dotyczy <b>dokończenia, publikacji w sklepach, "
            "dostosowania do wymogów RODO oraz utrzymania</b> aplikacji pacjenta — prace opierają "
            "się na istniejącym zapleczu cyfrowym fundacji (serwis, API, logika aplikacji pacjenta), "
            "a nie na budowie całego ekosystemu od zera.",
            styles["body"],
        )
    )
    story.append(Spacer(1, 6))
    story.append(p("<b>Dokument w skrócie</b>", styles["h2"]))
    story.append(
        summary_box(
            [
                ("Produkt", "Bezpłatna aplikacja mobilna (Android + iOS) dla rodziców i opiekunów dzieci z WWS."),
                (
                    "Zakres projektu",
                    "Dokończenie aplikacji, publikacja w Google Play i App Store, zgodność z RODO, utrzymanie przez 12 miesięcy.",
                ),
                ("Koszt roku 1", "<b>131 500 zł</b> (600 h × 210 zł/h + koszty stałe)."),
                (
                    "Dane o zdrowiu",
                    "Art. 9 RODO — wyraźne zgody, ocena skutków (DPIA), przetwarzanie w UE.",
                ),
                (
                    "Wkład własny",
                    "Robocza wersja aplikacji wraz z backendem wytworzona nieodpłatnie (<b>ok. 180 h ≈ 38 tys. zł</b>).",
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
        "10. Oczekiwane efekty i mierniki — ostrożne szacunki",
        "11. Podsumowanie",
    ]
    for item in toc:
        story.append(p(item, styles["toc_item"]))

    # ========== 1. CEL ==========
    story.extend(section_title("1", "Cel projektu i grupa docelowa", styles))
    story.append(
        p(
            "Celem projektu jest udostępnienie rodzicom i opiekunom dzieci z wrodzonymi wadami serca "
            "(WWS) <b>wygodnej, bezpiecznej aplikacji mobilnej</b>, która w jednym miejscu gromadzi "
            "kluczowe informacje o stanie zdrowia dziecka potrzebne w codziennej opiece i na wizytach "
            "lekarskich: profil medyczny, leki i przypomnienia dawek, pomiary (m.in. saturacja, tętno, "
            "ciśnienie, diureza), historię badań INR oraz eksport czytelnego raportu PDF.",
            styles["body"],
        )
    )
    story.append(
        p(
            "Aplikacja jest elementem misji Fundacji Wyjątkowe Serca — wspierania rodzin na ścieżce "
            "leczenia, a nie zastępowania personelu medycznego. Narzędzie ma charakter "
            "<b>rejestru i asystenta organizacyjnego</b> prowadzonego przez opiekuna, a nie systemu "
            "diagnostycznego ani dokumentacji prowadzonej przez podmiot leczniczy.",
            styles["body"],
        )
    )
    story.append(p("<b>Główna grupa docelowa</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "rodzice i opiekunowie prawni dzieci z wrodzonymi wadami serca (oraz — w razie potrzeby — starsi pacjenci korzystający z konta pod opieką rodziny);",
                "osoby współopiekujące się dzieckiem (np. drugi rodzic, babcia/dziadek), którym właściciel konta świadomie udostępni dostęp do tych samych danych;",
                "fundacja jako podmiot udostępniający narzędzie w ramach działalności statutowej (bez monetyzacji danych).",
            ],
            styles,
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
            "Wrodzone wady serca są najczęstszymi z wad wrodzonych — w Polsce co roku rodzi się "
            "ok. 3 tys. dzieci z WWS (ok. 1% urodzeń). "
            "Rodziny dzieci z WWS na co dzień zarządzają dużą ilością informacji medycznych: "
            "harmonogramami leków (często z różnymi dawkami i częstotliwościami), wynikami INR "
            "istotnymi przy leczeniu przeciwkrzepliwym, pomiarami domowymi oraz historią operacji "
            "i wad. W praktyce dane te są rozproszone w notesach, zdjęciach wyników, arkuszach "
            "kalkulacyjnych i pamięci opiekunów. Utrudnia to przygotowanie do wizyty, przekazanie "
            "informacji drugiemu opiekunowi oraz zachowanie ciągłości opieki przy zmianie "
            "osoby sprawującej pieczę.",
            styles["body"],
        )
    )
    story.append(
        p(
            "Istnieją ogólne aplikacje zdrowotne i notatniki, jednak <b>nie są one dopasowane</b> "
            "do specyfiki opieki nad dzieckiem z wadą serca (słownik wad i operacji, INR, leki "
            "z przypomnieniami, udostępnianie w rodzinie, eksport karty na wizytę). Fundacja "
            "dysponuje już zapleczem cyfrowym (strona, API, logika aplikacji pacjenta). "
            "Projekt dotacyjny pozwala <b>ukończyć wersję mobilną</b>, opublikować aplikację "
            "w oficjalnych sklepach, wzmocnić ochronę danych o zdrowiu oraz zapewnić rok "
            "stabilnego utrzymania.",
            styles["body"],
        )
    )
    story.append(
        callout_box(
            "<b>Dlaczego aplikacja mobilna?</b> Opiekunowie korzystają ze smartfona w szpitalu, "
            "w domu i w drodze. Natywna aplikacja umożliwia m.in. lokalne przypomnienia o dawkach "
            "i pomiarach, wygodne wprowadzanie danych oraz udostępnianie raportu PDF lekarzowi "
            "bez konieczności logowania się do wersji przeglądarkowej w trudnych warunkach.",
            styles,
        )
    )

    # ========== 3. ZAKRES ==========
    story.extend(section_title("3", "Zakres funkcjonalny wersji 1 (v1) i poza zakresem", styles))
    story.append(p("<b>3.1. W zakresie v1 (przedmiot projektu)</b>", styles["h2"]))

    scope_rows = [
        ["Obszar", "Opis funkcjonalny"],
        [
            "Logowanie",
            "Bezpieczne logowanie kontem Google (Android; spójnie z istniejącym API fundacji). "
            "Na iOS — logowanie Apple (wymóg sklepu przy logowaniu społecznościowym) oraz spójny model sesji.",
        ],
        [
            "Profil pacjenta",
            "Dane identyfikacyjne i medyczne istotne dla WWS: m.in. imię i nazwisko dziecka, grupa krwi, "
            "wady serca, zaburzenia rytmu, rozrusznik, przebyte operacje, powikłania, choroby współistniejące, "
            "zespoły genetyczne — z automatycznym zapisem.",
        ],
        [
            "Leki",
            "Lista leków, dawki, częstotliwość, historia podań, śledzenie kolejnej dawki, "
            "lokalne przypomnienia na urządzeniu (za zgodą użytkownika na powiadomienia systemowe).",
        ],
        [
            "Pomiary",
            "Rejestr pomiarów domowych (m.in. saturacja, tętno, ciśnienie, diureza), notatki, "
            "przegląd historii i uproszczone wykresy, opcjonalne przypomnienie o pomiarach.",
        ],
        [
            "INR",
            "Historia wyników INR / parametrów powiązanych, etykiety informacyjne "
            "(rejestr wyników, nie narzędzie diagnostyczne), przegląd trendów.",
        ],
        [
            "Raport PDF",
            "Eksport czytelnej karty pacjenta (profil, leki, pomiary, INR) do udostępnienia "
            "np. na wizycie — generowany na żądanie użytkownika.",
        ],
        [
            "Udostępnianie w rodzinie",
            "Właściciel konta tworzy zaproszenie (token z terminem ważności); druga osoba po zalogowaniu "
            "może dołączyć do tych samych danych. Właściciel widzi listę osób z dostępem i może go odwołać.",
        ],
        [
            "Publikacja",
            "Przygotowanie i złożenie aplikacji w Google Play oraz App Store: materiały sklepowe, "
            "polityka prywatności, zastrzeżenie medyczne, proces weryfikacji aplikacji w sklepach.",
        ],
        [
            "RODO / dane o zdrowiu",
            "Wyraźne zgody (w tym na dane o zdrowiu), aktualizacja dokumentacji pod aplikację pacjenta, "
            "prawo do usunięcia konta i danych, wzmocnienie zabezpieczeń API, podstawowy dziennik dostępu, ocena skutków (DPIA).",
        ],
        [
            "Utrzymanie 12 mies.",
            "Aktualizacje systemów (Android/iOS), poprawki błędów, drobne dostosowania interfejsu, "
            "utrzymanie hostingu w UE, wsparcie merytoryczne dla fundacji.",
        ],
    ]
    story.append(make_table(scope_rows, [28 * mm, usable - 28 * mm], styles))
    story.append(Spacer(1, 6))

    story.append(p("<b>3.2. Poza zakresem v1</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "diagnostyka medyczna, zalecenia terapeutyczne generowane automatycznie, „aplikacja medyczna” w rozumieniu wyrobu medycznego;",
                "panel lekarza / placówki medycznej, integracja z systemami P1 / e-dokumentacją medyczną podmiotów leczniczych;",
                "publiczna strona fundacji, sklep charytatywny i płatności darowizn (istnieją osobno; nie są przedmiotem tej linii budżetowej);",
                "tryb offline z pełną synchronizacją konfliktów (może być rozważany w przyszłości);",
                "powiadomienia push wysyłane z serwera — w v1 przypomnienia lokalne na urządzeniu;",
                "wersje językowe inne niż polski.",
            ],
            styles,
        )
    )
    story.append(
        p(
            "Świadome ograniczenie zakresu pozwala ukończyć produkt użyteczny dla rodzin, "
            "bezpieczny pod kątem danych o zdrowiu i możliwy do utrzymania przez fundację.",
            styles["body"],
        )
    )

    # ========== 4. PRZEPŁYW ==========
    story.extend(section_title("4", "Przepływ użytkownika", styles))
    story.append(
        p(
            "Poniższy opis oddaje docelowy, spójny przebieg korzystania z aplikacji po publikacji "
            "w sklepach (z uwzględnieniem prac RODO i iOS przewidzianych w projekcie).",
            styles["body"],
        )
    )

    flow_rows = [
        ["Krok", "Działanie użytkownika", "Wynik"],
        [
            "1",
            "Logowanie (Google lub Apple — zależnie od platformy); akceptacja regulaminu / zgód RODO (w tym na dane o zdrowiu)",
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
    story.append(p("<b>Główne obszary nawigacji (zakładki)</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "<b>Profil pacjenta</b> — dane stałe i historia operacji / wad;",
                "<b>Leki</b> — farmakoterapia i przypomnienia;",
                "<b>Pomiary</b> — rejestr parametrów domowych;",
                "<b>INR</b> — historia badań przeciwkrzepliwych;",
                "oraz ścieżki pomocnicze: logowanie, akceptacja zaproszenia, eksport PDF, zarządzanie dostępami.",
            ],
            styles,
        )
    )

    # ========== 5. PLATFORMY ==========
    story.extend(section_title("5", "Platformy, sklepy i architektura", styles))
    story.append(p("<b>5.1. Platformy i dystrybucja</b>", styles["h2"]))
    plat_rows = [
        ["Element", "Założenie"],
        ["Android", "Aplikacja pacjenta w Google Play; pakiet aplikacji fundacji; opłata deweloperska sklepu — jednorazowa."],
        ["iOS", "Ta sama baza funkcjonalna; logowanie Apple; testy przedpremierowe i publikacja w App Store z konta deweloperskiego fundacji."],
        ["Cena dla użytkownika", "Aplikacja bezpłatna; brak zakupów w aplikacji i subskrypcji."],
        ["Język sklepów", "Opisy i materiały po polsku; polityka prywatności i zastrzeżenie medyczne dostępne przed pobraniem."],
    ]
    story.append(make_table(plat_rows, [32 * mm, usable - 32 * mm], styles))
    story.append(Spacer(1, 6))

    story.append(p("<b>5.2. Architektura (zarys dla recenzenta, bez szczegółów wdrożeniowych)</b>", styles["h2"]))
    story.append(
        p(
            "Aplikacja mobilna komunikuje się z <b>dedykowanym API</b> fundacji hostowanym w chmurze "
            "w regionie Europejskiego Obszaru Gospodarczego. Uwierzytelnianie opiera się na "
            "<b>logowaniu przez zaufanego dostawcę tożsamości</b> (token sesji weryfikowany po stronie "
            "API). Dane medyczne są zapisywane w bazie po stronie serwera i nie są publicznie "
            "dostępne bez zalogowania. Warstwa serwisowa jest współdzielona "
            "z istniejącym zapleczem cyfrowym fundacji, co ogranicza koszt i ryzyko dublowania infrastruktury.",
            styles["body"],
        )
    )
    story.append(
        info_box(
            "<b>Model dostępu:</b> urządzenie użytkownika → szyfrowane połączenie HTTPS → API "
            "(weryfikacja tokenu) → magazyn danych w UE. Klienci mobilni i webowi nie uzyskują "
            "bezpośredniego, otwartego dostępu do całej bazy — tylko do zasobów wynikających "
            "z tożsamości i ewentualnego udostępnienia w rodzinie.",
            styles,
        )
    )
    story.append(Spacer(1, 4))
    story.append(
        p(
            "Technicznie aplikacja mobilna jest rozwijana w podejściu wieloplatformowym "
            "(wspólna logika biznesowa dla Android i iOS), co pozwala utrzymać spójność funkcji "
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
            "art. 9 RODO): m.in. informacje o wadach serca, lekach, pomiarach i wynikach INR. "
            "Z tego względu projekt przewiduje środki wyższe niż przy zwykłych danych kontaktowych.",
            styles["body"],
        )
    )
    story.append(p("<b>6.1. Podstawa i transparentność</b>", styles["h2"]))
    story.append(
        bullets(
            [
                "administrator danych: Fundacja Wyjątkowe Serca (dane rejestrowe i kontakt RODO w polityce prywatności);",
                "podstawa: świadczenie usługi aplikacji (art. 6 RODO) oraz <b>wyraźna zgoda</b> na przetwarzanie danych o zdrowiu (art. 9 ust. 2 lit. a), zbierana w aplikacji w sposób oddzielny od marketingu;",
                "informacja o roli opiekuna prawnego przy danych dziecka;",
                "polityka prywatności zaktualizowana pod aplikację pacjenta — dostępna w aplikacji i w kartach sklepowych;",
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
        ["Rozliczalność", "Podstawowy dziennik zdarzeń dostępu (kto / kiedy / jaki zasób — bez zbędnego logowania treści klinicznej)."],
        ["Prawa osoby", "Podgląd i edycja własnych danych w aplikacji; <b>usunięcie konta i powiązanych danych medycznych</b> jako funkcja docelowa v1; eksport raportu PDF jako forma przenoszenia informacji na wizytę."],
        ["Ocena ryzyka", "Ocena skutków dla ochrony danych (DPIA) dla przetwarzania danych o zdrowiu w aplikacji pacjenta."],
        ["Podmioty przetwarzające", "Umowy / warunki powierzenia z dostawcami chmury i tożsamości (dostawcy infrastruktury w UE) — po stronie fundacji."],
    ]
    story.append(make_table(rodo_rows, [32 * mm, usable - 32 * mm], styles))
    story.append(Spacer(1, 6))
    story.append(
        p(
            "<b>Zastrzeżenie medyczne.</b> Aplikacja nie stawia diagnoz i nie zastępuje konsultacji lekarskiej. "
            "Moduł INR i etykiety wynikowe mają charakter pomocniczy / edukacyjny. Sformułowania w interfejsie "
            "i w opisach sklepowych będą spójne z tą zasadą, aby nie wprowadzać użytkowników w błąd "
            "co do charakteru narzędzia.",
            styles["body"],
        )
    )

    # ========== 7. HARMONOGRAM ==========
    story.extend(section_title("7", "Harmonogram i kamienie milowe", styles))
    story.append(
        p(
            "Poniższy harmonogram ma charakter roboczy (miesiące od startu finansowania). "
            "Część prac produktowych jest już zaawansowana; projekt koncentruje się na ukończeniu prac, "
            "zgodności, publikacji i utrzymaniu.",
            styles["body"],
        )
    )
    harm_rows = [
        ["Faza", "Czas", "Kamienie milowe"],
        [
            "F1 — Analiza i doprecyzowanie zakresu",
            "Miesiąc 1",
            "Utrwalenie założeń (niniejszy opis), priorytety RODO i sklepów, plan testów na urządzeniach.",
        ],
        [
            "F2 — Produkt Android + iOS",
            "Miesiące 1–3",
            "Ukończenie funkcji v1, logowanie Apple, testy na urządzeniach, stabilizacja.",
        ],
        [
            "F3 — RODO i bezpieczeństwo",
            "Miesiące 2–4",
            "Zgody art. 9, usuwanie konta, wzmocnienie zabezpieczeń API, dziennik dostępu, ocena skutków (DPIA), aktualizacja polityki.",
        ],
        [
            "F4 — Publikacja w sklepach",
            "Miesiące 3–5",
            "Konta deweloperskie fundacji, karty sklepowe PL, weryfikacja w Google Play i App Store, poprawki po weryfikacji.",
        ],
        [
            "F5 — Utrzymanie",
            "Miesiące 1–12",
            "Utrzymanie zaplecza od startu projektu, opublikowanej aplikacji — od publikacji; "
            "aktualizacje systemów, poprawki, monitoring hostingu, wsparcie fundacji.",
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
            "Ograniczona dostępność wykonawcy",
            "Wykonawca jest autorem wersji roboczej (pełna znajomość kodu); harmonogram z buforami; kod w repozytorium fundacji.",
        ],
        [
            "Zmiany wymogów sklepów lub przepisów",
            "Dwunastomiesięczne utrzymanie obejmuje aktualizacje zgodnościowe.",
        ],
    ]
    story.append(
        KeepTogether([risk_head, make_table(risk_rows, [usable * 0.42, usable * 0.58], styles)])
    )

    # ========== 8. BUDŻET ==========
    story.extend(section_title("8", "Powiązanie z budżetem projektu", styles))
    story.append(
        p(
            "Poniższa tabela łączy bloki merytoryczne z kosztorysem wniosku. "
            "<b>Stawka referencyjna prac programistycznych: 210 zł/h.</b> "
            "W budżecie <b>nie ujęto</b> kosztów narzędzi warsztatu wykonawcy (środowisko programistyczne, "
            "oprogramowanie wspomagające prace deweloperskie itp.) — są wliczone w stawkę. Ujęto koszty "
            "bezpośrednio związane z produktem fundacji: prace, RODO, hosting, opłaty sklepowe.",
            styles["body"],
        )
    )
    bud_rows = [
        ["Lp.", "Pozycja", "Godz.", "Kwota (zł)"],
        ["", "«b»A. Wytworzenie aplikacji", "", ""],
        ["1", "Analiza i projekt aplikacji mobilnej pacjenta", "»25", "»5 250"],
        [
            "2",
            "Implementacja Android (profil, leki, pomiary, INR, uwierzytelnianie, PDF, udostępnianie)",
            "»160",
            "»33 600",
        ],
        ["3", "Implementacja i testy iOS + logowanie Apple", "»60", "»12 600"],
        ["4", "Integracja z API i usługami chmurowymi, stabilizacja", "»40", "»8 400"],
        [
            "5",
            "Publikacja Google Play + App Store (karty sklepowe, materiały, zastrzeżenie medyczne)",
            "»40",
            "»8 400",
        ],
        ["", "«b»Suma A", "»325", "»68 250"],
        ["", "«b»B. Zgodność RODO / dane o zdrowiu", "", ""],
        [
            "6",
            "Zgody art. 9, opiekun, polityka prywatności pod aplikację, komunikaty przy zaproszeniach",
            "»40",
            "»8 400",
        ],
        [
            "7",
            "Usunięcie konta i danych w całym systemie (API, web, aplikacja mobilna)",
            "»25",
            "»5 250",
        ],
        [
            "8",
            "Wzmocnienie zabezpieczeń API (sekrety, dokumentacja, limity zapytań, konta serwisowe)",
            "»30",
            "»6 300",
        ],
        ["9", "Dziennik dostępu, ocena skutków (DPIA), testy zgodności", "»30", "»6 300"],
        ["10", "Konsultacja / przegląd dokumentacji RODO (prawnik)", "»—", "»3 000"],
        ["", "«b»Suma B", "»125", "»29 250"],
        ["", "«b»C. Utrzymanie i infrastruktura (12 miesięcy)", "", ""],
        [
            "11",
            "Praca programisty — utrzymanie, poprawki, aktualizacje platform",
            "»150",
            "»31 500",
        ],
        ["12", "Hosting i chmura (API, baza, uwierzytelnianie, kopie zapasowe)", "»—", "»2 400"],
        ["13", "Google Play Console (opłata jednorazowa w roku 1)", "»—", "»100"],
        [
            "14",
            "Apple Developer Program (zwolnienie z opłaty dla organizacji non-profit — założenie)",
            "»—",
            "»0",
        ],
        ["", "«b»Suma C", "»150", "»34 000"],
        ["", "«b»RAZEM ROK 1", "»600", "»131 500"],
    ]
    # Custom table with stronger total row
    data = []
    for i, row in enumerate(bud_rows):
        label = str(row[1]) if len(row) > 1 else ""
        is_total = "RAZEM" in label
        line = []
        for cell in row:
            s = str(cell)
            if i == 0:
                line.append(p(s, styles["cell_header"]))
            elif is_total:
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

    col_w = [12 * mm, usable - 12 * mm - 22 * mm - 28 * mm, 22 * mm, 28 * mm]
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
        ("BACKGROUND", (0, n - 1), (-1, n - 1), colors.HexColor("#1A5F8F")),
        ("LINEBELOW", (0, -1), (-1, -1), 0.8, GREY_LINE),
    ]
    # Emphasize section header / suma rows
    for idx, row in enumerate(bud_rows):
        label = str(row[1]) if len(row) > 1 else ""
        if label.startswith("«b»") and idx > 0 and "RAZEM" not in label:
            cmds.append(("BACKGROUND", (0, idx), (-1, idx), colors.HexColor("#E7EFF6")))
    bt.setStyle(TableStyle(cmds))
    story.append(bt)
    story.append(Spacer(1, 6))
    story.append(
        info_box(
            "<b>Wkład własny fundacji — prace wykonane przed projektem.</b> Robocza wersja aplikacji "
            "pacjenta (sekcja webowa, aplikacja mobilna i backend/API — zakres opisany w rozdz. 3) "
            "powstała w całości <b>nieodpłatnie</b>; na podstawie historii repozytorium kodu szacujemy "
            "ten wkład ostrożnie na <b>ok. 180 godzin</b> pracy o wartości <b>ok. 38 tys. zł</b> "
            "(wg stawki referencyjnej 210 zł/h). Autor wersji roboczej zrealizuje także prace objęte "
            "kosztorysem, co ogranicza ryzyko wdrożenia — kosztorys powyżej obejmuje wyłącznie prace przyszłe.",
            styles,
        )
    )
    story.append(Spacer(1, 6))

    story.append(p("<b>Mapowanie opisu → budżet</b>", styles["h2"]))
    map_rows = [
        ["Część opisu projektu", "Pozycje kosztorysu"],
        ["Niniejszy dokument / analiza i projekt (rozdz. 1–5, 7)", "Lp. 1"],
        ["Zakres v1 Android, przepływ, funkcje medyczne", "Lp. 2, 4"],
        ["iOS, sklepy, zastrzeżenie medyczne, materiały", "Lp. 3, 5"],
        ["Ochrona danych (rozdz. 6)", "Lp. 6–10"],
        ["Utrzymanie i hosting (rozdz. 9)", "Lp. 11–14"],
    ]
    story.append(make_table(map_rows, [usable * 0.55, usable * 0.45], styles))
    story.append(
        p(
            "Szczegółowy kosztorys w formularzu wniosku powinien być tożsamy z powyższymi kwotami. "
            "W kolejnych latach szacowany koszt utrzymania (bez ponownego wytworzenia) wynosi "
            "ok. <b>36 000 zł rocznie</b> (ok. 160 h utrzymania i drobnych prac zgodnościowych + hosting).",
            styles["body"],
        )
    )

    # ========== 9. UTRZYMANIE (KeepTogether — bez osieroconego nagłówka) ==========
    maintain = []
    maintain.extend(section_title("9", "Utrzymanie po wdrożeniu", styles))
    maintain.append(
        p(
            "Publikacja w sklepach nie kończy odpowiedzialności za narzędzie przetwarzające dane "
            "o zdrowiu. W ramach 12 miesięcy projektu przewidziano aktualizacje pod nowe wersje "
            "systemów Android i iOS, usuwanie zgłaszanych błędów, utrzymanie hostingu API i bazy "
            "wraz z kopiami zapasowymi, drobne zmiany interfejsu i treści (w tym komunikaty RODO) "
            "oraz wsparcie fundacji w komunikacji z rodzinami — zgodnie z zakresem z rozdz. 3 "
            "i pozycjami 11–12 kosztorysu.",
            styles["body"],
        )
    )
    maintain.append(
        p(
            "Model długoterminowy: fundacja pozostaje właścicielem kont sklepowych, polityk "
            "i relacji z użytkownikami; prace programistyczne mogą być kontynuowane w trybie "
            "utrzymaniowym po zakończeniu okresu dotacji (szacunek — patrz rozdz. 8).",
            styles["body"],
        )
    )
    story.append(KeepTogether(maintain))

    # ========== 10. EFEKTY ==========
    story.extend(section_title("10", "Oczekiwane efekty i mierniki — ostrożne szacunki", styles))
    story.append(
        p(
            "Projekt ma charakter <b>wsparcia organizacyjnego i informacyjnego</b> dla rodzin, "
            "a nie interwencji medycznej. Poniższe mierniki służą rozliczeniu działania narzędzia "
            "cyfrowego — bez obietnic skutków klinicznych.",
            styles["body"],
        )
    )
    eff_rows = [
        ["Obszar", "Przykładowy miernik", "Uwagi"],
        [
            "Dostępność",
            "Publikacja w Google Play i (docelowo) App Store; aplikacja bezpłatna",
            "Tak / nie + data publikacji",
        ],
        [
            "Zasięg",
            "Co najmniej 200 instalacji i 100 aktywnych kont w 12 mies. od publikacji",
            "Wartości docelowe ostrożne; wynik zależny od promocji fundacji",
        ],
        [
            "Użyteczność",
            "Korzystanie z kluczowych funkcji (profil, leki, pomiary/INR, PDF)",
            "Na podstawie statystyk zagregowanych, bez treści medycznej w raportach publicznych",
        ],
        [
            "Bezpieczeństwo / RODO",
            "Wdrożone zgody, usuwanie konta, zaktualizowana polityka, DPIA",
            "Lista kontrolna ukończenia fazy F3",
        ],
    ]
    story.append(make_table(eff_rows, [28 * mm, usable * 0.42, usable * 0.58 - 28 * mm], styles))
    story.append(Spacer(1, 6))
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
            "z którego rodziny realnie korzystają przy organizacji opieki nad dzieckiem z WWS.",
            styles,
        )
    )

    # ========== 11. PODSUMOWANIE ==========
    story.extend(section_title("11", "Podsumowanie", styles))
    story.append(
        p(
            "Aplikacja pacjenta „Wyjątkowe Serca” odpowiada na konkretną potrzebę rodzin dzieci "
            "z wrodzonymi wadami serca: <b>uporządkowanie danych o zdrowiu i leczeniu w jednym, "
            "mobilnym, bezpiecznym narzędziu</b>. Projekt grantowy obejmuje ukończenie produktu "
            "na Androidzie i iOS, publikację w oficjalnych sklepach, wzmocnienie zgodności "
            "z RODO przy danych o zdrowiu oraz dwunastomiesięczne utrzymanie.",
            styles["body"],
        )
    )
    story.append(
        p(
            "Całkowity koszt roku 1 według kosztorysu spójnego z niniejszym opisem wynosi "
            "<b>131 500 zł</b> (600 godzin prac programistycznych w stawce 210 zł/h oraz koszty "
            "stałe: prawnik RODO, hosting, Google Play). Dotychczasowa robocza wersja aplikacji wraz "
            "z backendem powstała w całości nieodpłatnie — to wkład własny fundacji szacowany na "
            "ok. 180 godzin pracy (ok. 38 tys. zł); dotacja finansuje wyłącznie prace przyszłe. "
            "Inwestycja wzmacnia "
            "misję fundacji w obszarze codziennego wsparcia rodziców — w sposób mierzalny, "
            "odpowiedzialny i możliwy do kontynuacji po zakończeniu dofinansowania.",
            styles["body"],
        )
    )
    story.append(
        KeepTogether(
            [
                HRFlowable(width="100%", thickness=0.6, color=GREY_LINE, spaceBefore=4, spaceAfter=4),
                p(
                    "Dokument przygotowany jako załącznik merytoryczny do wniosku o dofinansowanie. "
                    "Nie stanowi pełnej dokumentacji prawnej (DPIA, umowy powierzenia, polityka prywatności "
                    "— jako odrębne dokumenty fundacji) ani dokumentacji technicznej dla zespołu deweloperskiego.",
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
        title="Opis i założenia projektu — Aplikacja pacjenta Wyjątkowe Serca",
        author="Fundacja Wyjątkowe Serca",
        subject="Załącznik do wniosku o dotację — opis aplikacji pacjenta",
        creator="docs/generate_opis_aplikacji.py",
    )
    story = build_story(styles)
    doc.build(story, onFirstPage=cover_canvas, onLaterPages=footer_canvas)
    print(f"Wrote {OUT_PDF} ({OUT_PDF.stat().st_size} bytes)")
    return OUT_PDF


if __name__ == "__main__":
    main()
