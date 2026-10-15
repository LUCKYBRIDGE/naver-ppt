// ASCII-only real PDFs with deterministic page colors and mixed aspect ratios.
export function createFixturePdf(label = 'A', count = 8) {
  const width = label === 'A' ? 1280 : 800, height = label === 'A' ? 720 : 1000;
  const objects = ['', '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds = [];
  for (let number = 1; number <= count; number++) {
    const id = objects.length; pageIds.push(id);
    const red = label === 'A' ? number / 10 : 0.1, green = label === 'B' ? number / 10 : 0.15;
    const content = `${red} ${green} 0.3 rg 0 0 ${width} ${height} re f\n1 1 1 rg BT /F1 64 Tf 60 ${height - 120} Td (${label} - Page ${number}) Tj ET\n1 1 1 RG 4 w 60 60 ${width - 120} ${height - 240} re S\n`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${id + 1} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`);
  }
  objects[2] = `<< /Type /Pages /Count ${count} /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] >>`;
  let pdf = '%PDF-1.7\n'; const offsets = [0];
  for (let id = 1; id < objects.length; id++) { offsets.push(Buffer.byteLength(pdf)); pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`; }
  const start = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(pdf);
}
