import Papa from "papaparse";
import {
  parseFoodCell,
  calculateExtraCost,
  calculateNubiavilleCost,
} from "./costCalculator";

// The food-related columns from the CSV
const FOOD_COLUMNS = [
  "Select a Main Meal",
  "Choose a Shawarma",
  "What Type of Rice",
  "Choose a Shawarma (Optional)",
  "Choose a Side (Optional)",
  "More Side Options (Optional)",
  "Choose an Extra",
  "Select a Main Meal1",
  "Select second Option",
  "Select Combo (Optional)",
  "Choose a Protein",
  "Choose a Side",
];

export interface ParsedOrder {
  name: string;
  nickname: string;
  email: string;
  vendor: string;
  foodItems: { column: string; items: string[]; cost: number }[];
  totalCost: number;
  discountAmount: number;
  extraCost: number;
  nubiavilleCost: number;
  startTime: string;
  completionTime: string;
}

export interface ParseResult {
  orders: ParsedOrder[];
  totalCost: number;
  totalExtraCost: number;
  totalNubiavilleCost: number;
  errors: string[];
}

export function parseCSVContent(
  csvText: string,
  discountAmount: number,
): ParseResult {
  const errors: string[] = [];

  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      errors.push(`Row ${err.row}: ${err.message}`);
    }
  }

  return parseRawData(
    parsed.data as Record<string, string>[],
    discountAmount,
    errors,
  );
}

export function parseRawData(
  data: Record<string, any>[],
  discountAmount: number,
  initialErrors: string[] = [],
): ParseResult {
  const errors = [...initialErrors];
  const orders: ParsedOrder[] = [];
  let grandTotalCost = 0;
  let grandTotalExtra = 0;
  let grandTotalNubiaville = 0;

  for (const rawRow of data) {
    const row: Record<string, any> = {};
    for (const key in rawRow) {
      row[key.trim()] = rawRow[key];
    }

    // Skip rows without an Id (these are totals rows or empty)
    const id = (row["Id"]?.toString() || "").trim();
    if (!id || id === "") continue;

    const name = (row["Name"]?.toString() || "").trim();
    const nickname = (row["Name1"]?.toString() || "").trim();
    const email = (row["Email"]?.toString() || "").trim();
    const vendor = (row["Choose Your Food Vendor"]?.toString() || "").trim();
    const startTime = (row["Start time"]?.toString() || "").trim();
    const completionTime = (row["Completion time"]?.toString() || "").trim();

    // Parse all food columns and calculate total
    const foodItems: { column: string; items: string[]; cost: number }[] = [];
    let rowTotal = 0;

    for (const col of FOOD_COLUMNS) {
      const cellValue = (row[col]?.toString() || "").trim();
      if (cellValue) {
        const parsed = parseFoodCell(cellValue);
        if (parsed.items.length > 0) {
          foodItems.push({
            column: col,
            items: parsed.items,
            cost: parsed.total,
          });
          rowTotal += parsed.total;
        }
      }
    }

    const extraCost = calculateExtraCost(rowTotal, discountAmount);
    const nubiavilleCost = calculateNubiavilleCost(rowTotal, discountAmount);

    orders.push({
      name,
      nickname,
      email,
      vendor,
      foodItems,
      totalCost: rowTotal,
      discountAmount,
      extraCost,
      nubiavilleCost,
      startTime,
      completionTime,
    });

    grandTotalCost += rowTotal;
    grandTotalExtra += extraCost;
    grandTotalNubiaville += nubiavilleCost;
  }

  return {
    orders,
    totalCost: grandTotalCost,
    totalExtraCost: grandTotalExtra,
    totalNubiavilleCost: grandTotalNubiaville,
    errors,
  };
}
