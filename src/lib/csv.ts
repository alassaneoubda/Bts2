/** CSV compatible Excel (séparateur `;`, BOM UTF-8 pour les accents). */
export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [headers.join(";"), ...rows.map((r) => r.map(esc).join(";"))].join("\r\n");
  return "﻿" + body;
}

export function csvResponse(filename: string, content: string) {
  return new Response(content, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
