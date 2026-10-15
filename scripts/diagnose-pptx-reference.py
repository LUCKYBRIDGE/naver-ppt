"""Local-only source/PDF/render fingerprints and pixel diagnostics, no body output.

Usage: python scripts/diagnose-pptx-reference.py PPTX PDF VISUAL_RESULT_FOLDER
"""
import collections
import difflib
import hashlib
import json
import posixpath
import re
import sys
import unicodedata
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from PIL import Image
from pypdf import PdfReader

pptx_path, pdf_path, folder = map(Path, sys.argv[1:4])
report = json.loads((folder / "result.json").read_text(encoding="utf-8"))
assert report.get("executionPassed")
fingerprint = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
before = {"pptx": fingerprint(pptx_path), "pdf": fingerprint(pdf_path)}
assert before == report["fingerprints"]
normalize = lambda text: re.sub(r"[\s\u200b\u200c\u200d\ufeff]+", "", unicodedata.normalize("NFC", text))
digest = lambda text: hashlib.sha256(text.encode("utf-8")).hexdigest()
without_punctuation = lambda text: "".join(c for c in text if not unicodedata.category(c).startswith(("P", "S")))
reader = PdfReader(pdf_path)
assert len(reader.pages) <= 2000
rows = []
with zipfile.ZipFile(pptx_path) as archive:
    entries = archive.infolist()
    assert pptx_path.stat().st_size <= 128 * 1024 * 1024 and len(entries) <= 4000
    assert sum(entry.file_size for entry in entries) <= 256 * 1024 * 1024
    def xml(part):
        assert part.startswith("ppt/") and archive.getinfo(part).file_size <= 4 * 1024 * 1024
        raw = archive.read(part)
        assert not re.search(br"<!\s*(?:DOCTYPE|ENTITY)", raw, re.I)
        return ET.fromstring(raw)
    relations = {r.attrib["Id"]: r for r in xml("ppt/_rels/presentation.xml.rels")}
    order = xml("ppt/presentation.xml").find("{http://schemas.openxmlformats.org/presentationml/2006/main}sldIdLst")
    assert order is not None and len(order) == len(reader.pages)
    for rendered in report["rows"]:
        number = rendered["pageNumber"]
        relation = relations[order[number - 1].attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
        assert relation.attrib.get("TargetMode", "Internal") == "Internal"
        target = relation.attrib["Target"]
        part = posixpath.normpath(posixpath.join("ppt", target))
        assert part.startswith("ppt/slides/") and ".." not in part.split("/") and not target.startswith("/")
        source_root = xml(part)
        source = normalize("".join(e.text or "" for e in source_root.iter("{http://schemas.openxmlformats.org/drawingml/2006/main}t")))
        pdf = normalize(reader.pages[number - 1].extract_text() or "")
        changes = []
        for op, a, b, c, d in difflib.SequenceMatcher(None, source, pdf, autojunk=False).get_opcodes():
            if op == "equal":
                continue
            changes.append({"op": op, "sourceRange": [a, b], "pdfRange": [c, d], "sourceCategories": dict(collections.Counter(unicodedata.category(ch) for ch in source[a:b])), "pdfCategories": dict(collections.Counter(unicodedata.category(ch) for ch in pdf[c:d]))})
        # Numeric RGB aggregates only; image content stays on disk.
        image_stats = {}
        for kind in ("pdf", "pptx"):
            with Image.open(folder / f"{number:03d}-{kind}.png") as image:
                image = image.convert("RGB")
                assert image.size == (720, 540)
                counts = collections.Counter(image.get_flattened_data())
                dominant, count = counts.most_common(1)[0]
                image_stats[kind] = {"dominantRgb": dominant, "dominantFraction": count / (720 * 540), "darkPixelFraction": sum(count for color, count in counts.items() if max(color) < 64) / (720 * 540), "nearWhiteFraction240": sum(count for color, count in counts.items() if min(color) > 240) / (720 * 540)}
        shapes = []
        for shape in source_root.iter():
            kind = shape.tag.rsplit("}", 1)[-1]
            if kind not in ("sp", "pic"):
                continue
            counts = collections.Counter(e.tag.rsplit("}", 1)[-1] for e in shape.iter())
            colors = [e.attrib.get("val") for e in shape.iter() if e.tag.endswith("}srgbClr") and re.fullmatch(r"[A-Fa-f0-9]{6}", e.attrib.get("val", ""))]
            alpha = [int(e.attrib["val"]) for e in shape.iter() if e.tag.endswith("}alpha") and re.fullmatch(r"\d+", e.attrib.get("val", ""))]
            shapes.append({"kind": kind, "colors": colors, "alpha": alpha, "blipFill": counts["blipFill"], "noFill": counts["noFill"], "solidFill": counts["solidFill"], "gradientFill": counts["gradFill"], "pictureCrop": counts["srcRect"]})
        rows.append({"pageNumber": number, "sourceLength": len(source), "pdfLength": len(pdf), "renderLength": rendered["textLength"], "sourceEqualsRender": digest(source) == rendered["textSha256"], "sourceEqualsPdf": source == pdf, "sourceEqualsPdfWithoutPunctuation": without_punctuation(source) == without_punctuation(pdf), "sourcePdfChanges": changes, "pixels": image_stats, "sourceShapes": shapes})
assert before == {"pptx": fingerprint(pptx_path), "pdf": fingerprint(pdf_path)}
result = {"originalsUnchanged": True, "rows": rows, "sourceEqualsRenderPages": sum(r["sourceEqualsRender"] for r in rows), "sourceEqualsPdfPages": sum(r["sourceEqualsPdf"] for r in rows)}
(folder / "source-diagnosis.json").write_text(json.dumps(result, ensure_ascii=True, indent=2), encoding="utf-8")
print(json.dumps({"originalsUnchanged": True, "sourceEqualsRenderPages": result["sourceEqualsRenderPages"], "sourceEqualsPdfPages": result["sourceEqualsPdfPages"], "selected": [r for r in rows if r["pageNumber"] in (1, 17, 30, 33, 41, 43)]}, ensure_ascii=True))
