import * as xlsx from "xlsx";
import { parseRawData } from "./src/lib/csvParser";

const workbook = xlsx.readFile("February TGIF 2026.xlsx");
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const json = xlsx.utils.sheet_to_json(sheet, {defval: ""});

// Normalize keys to fix \xA0
const normalizedJson = json.map((row: any) => {
  const newRow: any = {};
  for(let key in row) {
    newRow[key.replace(/\s+/g, ' ').trim()] = row[key];
  }
  return newRow;
});

const result = parseRawData(normalizedJson, 7000);
console.log(result.orders.find(o => o.name === 'Magdalene Edozie'));
