"""Read-only PDF text fingerprints and PPTX font metadata; never print body text."""
import hashlib
import json
import re
import sys
import unicodedata
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from pypdf import PdfReader

pdf_path, pptx_path, output_path = map(Path, sys.argv[1:4])
reader = PdfReader(pdf_path)
if len(reader.pages) > 2000:
    raise ValueError("PDF_PAGE_LIMIT")
rows = []
pdf_fonts = set()
for index, page in enumerate(reader.pages):
    normalized = re.sub(r"[\s\u200b\u200c\u200d\ufeff]+", "", unicodedata.normalize("NFC", page.extract_text() or ""))
    rows.append({"pageNumber": index + 1, "textLength": len(normalized), "textSha256": hashlib.sha256(normalized.encode("utf-8")).hexdigest(), "sizePoints": [float(page.mediabox.width), float(page.mediabox.height)]})
    resources = page.get("/Resources")
    if resources:
        fonts = resources.get_object().get("/Font")
        if fonts:
            for font in fonts.get_object().values():
                name = str(font.get_object().get("/BaseFont", ""))[1:]
                pdf_fonts.add(re.sub(r"^[A-Z]{6}\+", "", name))
pptx_fonts = set()
with zipfile.ZipFile(pptx_path) as archive:
    entries = archive.infolist()
    if pptx_path.stat().st_size > 128 * 1024 * 1024 or len(entries) > 4000 or sum(entry.file_size for entry in entries) > 256 * 1024 * 1024:
        raise ValueError("PPTX_PACKAGE_LIMIT")
    for entry in entries:
        if not entry.filename.startswith("ppt/") or not entry.filename.endswith(".xml") or entry.file_size > 4 * 1024 * 1024:
            continue
        raw = archive.read(entry)
        if re.search(br"<!\s*(?:DOCTYPE|ENTITY)", raw, re.I):
            raise ValueError("PPTX_XML_DECLARATION_FORBIDDEN")
        root = ET.fromstring(raw)
        for element in root.iter():
            value = element.attrib.get("typeface")
            if value and len(value) <= 200 and not value.startswith("+"):
                pptx_fonts.add(value)
result = {"pages": len(rows), "rows": rows, "pptxFontNames": sorted(pptx_fonts), "pdfFontNames": sorted(pdf_fonts), "creatorMentionsPowerPoint": "powerpoint" in str((reader.metadata or {}).get("/Creator", "")).lower()}
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"pages": len(rows), "pptxFontCount": len(pptx_fonts), "pdfFontCount": len(pdf_fonts), "creatorMentionsPowerPoint": result["creatorMentionsPowerPoint"]}))
