#!/usr/bin/env python3
"""Test the grant-application PDF generator (real entry point → real PDF)."""

from __future__ import annotations

import re
import sys
import unittest
from pathlib import Path

DOCS = Path(__file__).resolve().parent
ROOT = DOCS.parent
sys.path.insert(0, str(DOCS))

from generate_opis_aplikacji import OUT_PDF, main  # noqa: E402


class TestOpisAplikacjiPdf(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        path = main()
        cls.pdf_path = Path(path)
        cls.assertTrue(cls, cls.pdf_path.is_file())

        try:
            import pdfplumber
            from pypdf import PdfReader
        except ImportError as e:
            raise unittest.SkipTest(f"pdf deps missing: {e}") from e

        cls.reader = PdfReader(str(cls.pdf_path))
        parts: list[str] = []
        with pdfplumber.open(str(cls.pdf_path)) as doc:
            for page in doc.pages:
                parts.append(page.extract_text() or "")
        cls.text = "\n".join(parts)
        cls.n_pages = len(cls.reader.pages)

    def test_output_path_and_nonempty(self) -> None:
        self.assertEqual(self.pdf_path, OUT_PDF)
        self.assertGreater(self.pdf_path.stat().st_size, 10_000)

    def test_page_count_in_grant_range(self) -> None:
        self.assertGreaterEqual(self.n_pages, 4)
        self.assertLessEqual(self.n_pages, 10)

    def test_required_sections(self) -> None:
        required = [
            "Cel projektu",
            "Problem",
            "Zakres",
            "Przepływ",
            "Platformy",
            "RODO",
            "Harmonogram",
            "budżet",
            "Utrzymanie",
            "efekty",
            "131 500",
            "Analiza i projekt",
            "5 250",
            "dane o zdrowiu",
            "Google Play",
            "App Store",
            "usunięcie konta",
            "dokończenia",
            "wkład własny",
            "KRS 0001072904",
        ]
        low = self.text.lower()
        missing = [k for k in required if k.lower() not in low]
        self.assertEqual(missing, [], f"missing sections: {missing}")

    def test_no_secrets_or_screenshots(self) -> None:
        forbidden = [
            "service-account",
            "BEGIN PRIVATE",
            "apiKey",
            "ACCESS_PASSWORD",
            "screenshot",
            "assets/icon",
            "AIza",
            "node_modules",
        ]
        low = self.text.lower()
        found = [k for k in forbidden if k.lower() in low]
        self.assertEqual(found, [], f"forbidden content: {found}")

    def test_polish_and_budget_totals(self) -> None:
        self.assertIn("ł", self.text)
        self.assertIn("ę", self.text)
        for amount in ("68 250", "29 250", "34 000", "131 500"):
            self.assertIn(amount, self.text)

    def test_metadata(self) -> None:
        meta = self.reader.metadata
        self.assertIsNotNone(meta)
        title = (meta.title or "") if meta else ""
        self.assertIn("Wyjątkowe Serca", title)


if __name__ == "__main__":
    unittest.main()
