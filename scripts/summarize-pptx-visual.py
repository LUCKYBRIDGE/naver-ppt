"""Join local pixel diagnostics and text hashes; report no document body text."""
import json
import statistics
import sys
from pathlib import Path

folder, reference_path = map(Path, sys.argv[1:3])
report = json.loads((folder / "result.json").read_text(encoding="utf-8"))
reference = json.loads(reference_path.read_text(encoding="utf-8"))
assert report.get("executionPassed") and report["pages"] == reference["pages"]
rows = []
for rendered, expected in zip(report["rows"], reference["rows"]):
    assert rendered["pageNumber"] == expected["pageNumber"]
    rows.append({"pageNumber": rendered["pageNumber"], "textHashEqual": rendered["textSha256"] == expected["textSha256"], "pptxTextLength": rendered["textLength"], "pdfTextLength": expected["textLength"], "mae": rendered["mae"], "changedPixelFraction24": rendered["changedPixelFraction24"]})
summary = {"pages": len(rows), "captureDimensions": sorted({str((r["pdfCaptured"], r["pptxCaptured"])) for r in report["rows"]}), "meanMae": statistics.mean(r["mae"] for r in rows), "medianChangedFraction24": statistics.median(r["changedPixelFraction24"] for r in rows), "textHashEqualPages": sum(r["textHashEqual"] for r in rows), "bothEmptyTextPages": sum(r["pptxTextLength"] == r["pdfTextLength"] == 0 for r in rows), "textMismatchPages": [r for r in rows if not r["textHashEqual"]], "worstPixels": report["worstByPixelDifference"], "cssFonts": sorted({font for row in report["rows"] for font in row["cssFonts"]}), "pdfFontNames": reference["pdfFontNames"], "creatorMentionsPowerPoint": reference["creatorMentionsPowerPoint"], "registrationFontMetadataShown": report.get("registrationFontMetadataShown", False), "executionPassed": report["executionPassed"], "externalRequests": report["externalRequests"], "originalsUnchanged": report["originalsUnchanged"], "visualAcceptance": report["visualAcceptance"]}
(folder / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({key: value for key, value in summary.items() if key not in ("cssFonts", "pdfFontNames")}, ensure_ascii=True, indent=2))
