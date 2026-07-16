const xmlEscape = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const columnLetter = (index) => {
  let value = index + 1;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
};

const safeTableName = (value) => {
  const normalized = String(value || 'Relatorio').replace(/[^A-Za-z0-9_]/g, '_');
  return /^[A-Za-z_]/.test(normalized) ? normalized.slice(0, 200) : `T_${normalized}`.slice(0, 200);
};

const inlineCell = (reference, value, style = 0) =>
  `<c r="${reference}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function buildExcelReportBlob({ sheetName, tableName, title, columns, rows }) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const safeSheetName = String(sheetName || 'Relatorio').replace(/[\\/*?:[\]]/g, ' ').slice(0, 31);
  const tableStartRow = 4;
  const tableEndRow = tableStartRow + rows.length;
  const lastColumn = columnLetter(columns.length - 1);
  const tableReference = `A${tableStartRow}:${lastColumn}${tableEndRow}`;
  const generatedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  const columnDefinitions = columns
    .map((column, index) => `<col min="${index + 1}" max="${index + 1}" width="${column.width || 18}" customWidth="1"/>`)
    .join('');
  const headerCells = columns.map((column, index) => inlineCell(`${columnLetter(index)}${tableStartRow}`, column.label)).join('');
  const dataRows = rows
    .map((row, rowIndex) => {
      const excelRow = tableStartRow + rowIndex + 1;
      const cells = columns.map((column, columnIndex) => inlineCell(`${columnLetter(columnIndex)}${excelRow}`, row[column.key])).join('');
      return `<row r="${excelRow}">${cells}</row>`;
    })
    .join('');

  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>${columnDefinitions}</cols>
  <sheetData>
    <row r="1" ht="27" customHeight="1">${inlineCell('A1', title, 1)}</row>
    <row r="2">${inlineCell('A2', `Gerado em ${generatedAt}`, 2)}</row>
    <row r="${tableStartRow}">${headerCells}</row>
    ${dataRows}
  </sheetData>
  <mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/></mergeCells>
  <tableParts count="1"><tablePart r:id="rId1"/></tableParts>
</worksheet>`;

  const tableColumns = columns
    .map((column, index) => `<tableColumn id="${index + 1}" name="${xmlEscape(column.label)}"/>`)
    .join('');
  const table = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" id="1" name="${safeTableName(tableName)}" displayName="${safeTableName(tableName)}" ref="${tableReference}" totalsRowShown="0">
  <autoFilter ref="${tableReference}"/>
  <tableColumns count="${columns.length}">${tableColumns}</tableColumns>
  <tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>
</table>`;

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>
</Types>`);
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
  zip.folder('xl').file('workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="${xmlEscape(safeSheetName)}" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
  zip.folder('xl').folder('_rels').file('workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
  zip.folder('xl').file('styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="16"/><color rgb="FF0F2A43"/><name val="Calibri"/></font><font><i/><sz val="10"/><color rgb="FF64748B"/><name val="Calibri"/></font></fonts>
  <fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`);
  zip.folder('xl').folder('worksheets').file('sheet1.xml', worksheet);
  zip.folder('xl').folder('worksheets').folder('_rels').file('sheet1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
</Relationships>`);
  zip.folder('xl').folder('tables').file('table1.xml', table);

  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export async function downloadExcelReport({ fileName, ...report }) {
  const blob = await buildExcelReportBlob(report);
  downloadBlob(blob, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}

export function filterItemsByPeriod(items, periodStart, periodEnd, dateAccessor) {
  return items.filter((item) => {
    const value = dateAccessor(item)?.slice(0, 10);
    return value && (!periodStart || value >= periodStart) && (!periodEnd || value <= periodEnd);
  });
}
