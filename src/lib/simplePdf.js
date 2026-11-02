function pdfEscape(value) {
  return String(value)
    .replace(/[\x00-\x1F\x7F]/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .slice(0, 150)
    .replace(/[\\()]/g, '\\$&');
}

export function createTextPdf(lines) {
  const pageLines = [];
  for (let index = 0; index < lines.length; index += 48) {
    pageLines.push(lines.slice(index, index + 48));
  }
  if (!pageLines.length) pageLines.push([]);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageLines.map((_, index) => `${4 + index * 2} 0 R`).join(' ')}] /Count ${pageLines.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
  ];

  for (const linesOnPage of pageLines) {
    const pageId = objects.length + 1;
    const contentId = pageId + 1;
    const commands = [
      'BT',
      '/F1 10 Tf',
      '48 744 Td',
      '14 TL',
      ...linesOnPage.map((line) => `(${pdfEscape(line)}) Tj T*`),
      'ET',
    ].join('\n');
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.push(`<< /Length ${Buffer.byteLength(commands, 'ascii')} >>\nstream\n${commands}\nendstream`);
  }

  let document = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(document, 'ascii'));
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(document, 'ascii');
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) {
    document += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(document, 'ascii');
}
