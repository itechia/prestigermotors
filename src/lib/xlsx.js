import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function decodeXml(value) {
  return String(value ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function columnName(index) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const rem = (value - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function columnIndex(cellRef) {
  const letters = String(cellRef || "").match(/[A-Z]+/i)?.[0]?.toUpperCase() || "";
  return [...letters].reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function cellXml(value, rowIndex, colIndex, type) {
  const ref = `${columnName(colIndex)}${rowIndex + 1}`;
  if (value === null || value === undefined || value === "") {
    return `<c r="${ref}"/>`;
  }

  if (type === "number" && Number.isFinite(Number(value))) {
    return `<c r="${ref}"><v>${Number(value)}</v></c>`;
  }

  if (type === "boolean") {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }

  return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
}

export function buildXlsx({ sheetName = "Dados", columns, rows }) {
  const allRows = [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => row[column.key] ?? "")),
  ];

  const sheetRows = allRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, colIndex) => cellXml(value, rowIndex, colIndex, rowIndex === 0 ? "string" : columns[colIndex]?.type))
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  const maxCol = Math.max(columns.length - 1, 0);
  const dimension = `A1:${columnName(maxCol)}${Math.max(allRows.length, 1)}`;
  const safeSheetName = escapeXml(sheetName).slice(0, 31) || "Dados";

  const files = {
    "[Content_Types].xml": strToU8(`${XML_DECLARATION}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`${XML_DECLARATION}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`${XML_DECLARATION}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(`${XML_DECLARATION}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="1"><fill><patternFill patternType="none"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`),
    "xl/worksheets/sheet1.xml": strToU8(`${XML_DECLARATION}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="${dimension}"/><sheetData>${sheetRows}</sheetData></worksheet>`),
  };

  return zipSync(files);
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map(([si]) => {
    const parts = [...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeXml(match[1]));
    return parts.join("");
  });
}

function readCellValue(cellXml, sharedStrings) {
  const type = cellXml.match(/\st="([^"]+)"/)?.[1];
  if (type === "inlineStr") {
    const text = cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "";
    return decodeXml(text);
  }

  const raw = cellXml.match(/<v[^>]*>([\s\S]*?)<\/v>/)?.[1] || "";
  if (type === "s") return sharedStrings[Number(raw)] ?? "";
  if (type === "b") return raw === "1";
  return decodeXml(raw);
}

export function parseXlsx(buffer) {
  const archive = unzipSync(new Uint8Array(buffer));
  const sheetFile = archive["xl/worksheets/sheet1.xml"];
  if (!sheetFile) throw new Error("Planilha XLSX invalida: aba principal nao encontrada.");

  const sharedStrings = parseSharedStrings(
    archive["xl/sharedStrings.xml"] ? strFromU8(archive["xl/sharedStrings.xml"]) : ""
  );
  const sheetXml = strFromU8(sheetFile);
  const rows = [...sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>|<c([^>]*)\/>/g)) {
      const attrs = cellMatch[1] || cellMatch[3] || "";
      const content = cellMatch[0];
      const ref = attrs.match(/\sr="([^"]+)"/)?.[1] || "";
      const index = columnIndex(ref);
      if (index >= 0) values[index] = readCellValue(content, sharedStrings);
    }
    return values;
  });

  const headers = (rows.shift() || []).map((header) => String(header || "").trim());
  return rows
    .filter((row) => row.some((value) => value !== undefined && value !== ""))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]).filter(([header]) => header)));
}
