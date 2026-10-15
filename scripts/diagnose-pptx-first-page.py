"""Read-only first-page shape/color/image geometry; no source text or picture output.

Usage: python scripts/diagnose-pptx-first-page.py PPTX PDF OUTPUT_JSON
"""
import hashlib
import io
import json
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path
from PIL import Image
from pypdf import PdfReader
from pypdf.generic import ContentStream

pptx_path, pdf_path, output_path = map(Path, sys.argv[1:4])
fingerprint = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
before = {"pptx": fingerprint(pptx_path), "pdf": fingerprint(pdf_path)}
local = lambda tag: tag.rsplit("}", 1)[-1]
with zipfile.ZipFile(pptx_path) as archive:
    entries = archive.infolist()
    assert pptx_path.stat().st_size <= 128 * 1024 * 1024 and len(entries) <= 4000 and sum(e.file_size for e in entries) <= 256 * 1024 * 1024
    def xml(part):
        assert part.startswith("ppt/") and archive.getinfo(part).file_size <= 4 * 1024 * 1024
        data = archive.read(part)
        assert not re.search(br"<!\s*(?:DOCTYPE|ENTITY)", data, re.I)
        return ET.fromstring(data)
    presentation = xml("ppt/presentation.xml")
    order = presentation.find("{http://schemas.openxmlformats.org/presentationml/2006/main}sldIdLst")
    relations = {r.attrib["Id"]: r for r in xml("ppt/_rels/presentation.xml.rels")}
    slide_relation = relations[order[0].attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]]
    assert slide_relation.attrib.get("TargetMode", "Internal") == "Internal"
    slide_part = posixpath.normpath(posixpath.join("ppt", slide_relation.attrib["Target"]))
    assert slide_part.startswith("ppt/slides/")
    slide = xml(slide_part)
    rels = {r.attrib["Id"]: r for r in xml(posixpath.join(posixpath.dirname(slide_part), "_rels", posixpath.basename(slide_part) + ".rels"))}
    shape_tree = next(e for e in slide.iter() if local(e.tag) == "spTree")
    shapes = []
    backgrounds = []
    def inspect_background(part, depth=0):
        assert depth <= 3
        root = xml(part)
        expected_relation = {"sld": "slideLayout", "sldLayout": "slideMaster", "sldMaster": "theme"}.get(local(root.tag))
        selected = [e for e in root.iter() if local(e.tag) in ("bg", "bgFillStyleLst")]
        backgrounds.append({"partKind": local(root.tag), "definitions": [[{"tag": local(e.tag), "attributes": {k: v for k, v in e.attrib.items() if k in ("val", "idx", "pos", "ang", "scaled", "path", "l", "t", "r", "b")}} for e in node.iter()] for node in selected]})
        rel_part = posixpath.join(posixpath.dirname(part), "_rels", posixpath.basename(part) + ".rels")
        if rel_part not in archive.namelist():
            return
        for r in xml(rel_part):
            if expected_relation is None or r.attrib.get("Type", "").rsplit("/", 1)[-1] != expected_relation:
                continue
            assert r.attrib.get("TargetMode", "Internal") == "Internal"
            target = posixpath.normpath(posixpath.join(posixpath.dirname(part), r.attrib["Target"]))
            assert target.startswith("ppt/")
            inspect_background(target, depth + 1)
    inspect_background(slide_part)
    for shape in shape_tree:
        if local(shape.tag) not in ("sp", "pic", "grpSp"):
            continue
        props = next((e for e in shape if local(e.tag) in ("spPr", "grpSpPr")), None)
        geometry = []
        if props is not None:
            for e in props.iter():
                tag = local(e.tag)
                if tag in ("off", "ext", "chOff", "chExt", "xfrm", "prstGeom", "srgbClr", "schemeClr", "alpha", "lumMod", "lumOff", "fillRef"):
                    attrs = {k: v for k, v in e.attrib.items() if k in ("x", "y", "cx", "cy", "rot", "flipH", "flipV", "prst", "val", "idx")}
                    geometry.append({"tag": tag, "attributes": attrs})
                elif tag in ("solidFill", "noFill", "gradFill", "blipFill"):
                    geometry.append({"tag": tag})
        item = {"kind": local(shape.tag), "shapeId": next((e.attrib.get("id") for e in shape.iter() if local(e.tag) == "cNvPr"), None), "geometry": geometry}
        for e in shape.iter():
            if local(e.tag) != "blip":
                continue
            ref = e.attrib.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
            relation = rels.get(ref)
            assert relation is not None and relation.attrib.get("TargetMode", "Internal") == "Internal"
            part = posixpath.normpath(posixpath.join(posixpath.dirname(slide_part), relation.attrib["Target"]))
            assert part.startswith("ppt/media/") and archive.getinfo(part).file_size <= 32 * 1024 * 1024
            data = archive.read(part)
            with Image.open(io.BytesIO(data)) as image:
                assert image.width * image.height <= 16_777_216
                alpha = image.getchannel("A").getextrema() if "A" in image.getbands() else None
                item["image"] = {"size": image.size, "mode": image.mode, "alphaRange": alpha, "sha256": hashlib.sha256(data).hexdigest()}
        shapes.append(item)
reader = PdfReader(pdf_path)
page = reader.pages[0]
objects = page["/Resources"].get_object().get("/XObject", {}).get_object()
pdf_objects = []
for value in objects.values():
    value = value.get_object()
    pdf_objects.append({"subtype": str(value.get("/Subtype")), "width": value.get("/Width"), "height": value.get("/Height"), "hasSoftMask": "/SMask" in value, "filter": str(value.get("/Filter"))})
# Numeric drawing operations only. Object names, text, and image bytes stay private.
drawing = []
for operands, op in ContentStream(page.get_contents(), reader).operations:
    if op in (b"cm", b"rg", b"RG", b"re"):
        drawing.append({"op": op.decode("ascii"), "values": [float(n) for n in operands]})
    elif op in (b"q", b"Q", b"Do", b"f", b"f*"):
        drawing.append({"op": op.decode("ascii")})
assert before == {"pptx": fingerprint(pptx_path), "pdf": fingerprint(pdf_path)}
result = {"fingerprints": before, "originalsUnchanged": True, "backgrounds": backgrounds, "sourceShapes": shapes, "pdfObjects": pdf_objects, "pdfDrawing": drawing}
output_path.parent.mkdir(parents=True, exist_ok=True)
output_path.write_text(json.dumps(result, ensure_ascii=True, indent=2), encoding="utf-8")
print(json.dumps(result, ensure_ascii=True))
