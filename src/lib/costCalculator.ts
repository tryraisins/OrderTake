/**
 * Calculate the extra cost a person must pay.
 * If Total Cost > Discount Amount → Extra = Total - Discount
 * Otherwise → Extra = 0
 */
export function calculateExtraCost(
  totalCost: number,
  discountAmount: number,
): number {
  return Math.max(0, totalCost - discountAmount);
}

/**
 * Calculate what Nubiaville pays.
 * If Total Cost > Discount Amount → Nubiaville pays Discount Amount
 * Otherwise → Nubiaville pays Total Cost (the full bill)
 */
export function calculateNubiavilleCost(
  totalCost: number,
  discountAmount: number,
): number {
  return Math.min(totalCost, discountAmount);
}

/**
 * Parse a price string like "1500", "3,500", or "1,500.00" into a number.
 */
export function parsePrice(priceStr: string): number {
  if (!priceStr || priceStr.trim() === "") return 0;
  const cleaned = priceStr.replace(/,/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Extract price from a food item string like:
 * "4 Portions of Jollof Rice - 1500"
 * "Chicken - 3,500"
 * "Rice With Plantain & Chicken -4000"
 */
export function extractPriceFromItem(item: string): number {
  if (!item || item.trim() === "") return 0;

  // Match the last number (possibly with commas) after a dash
  const match = item.match(/-\s*([\d,]+(?:\.\d+)?)\s*$/);
  if (match) {
    return parsePrice(match[1]);
  }

  // Fallback: try to find any number
  const numbers = item.match(/[\d,]+(?:\.\d+)?/g);
  if (numbers && numbers.length > 0) {
    return parsePrice(numbers[numbers.length - 1]);
  }

  return 0;
}

/**
 * Parse a cell that may contain multiple items separated by semicolons.
 * e.g., "4 Portions of Jollof Rice - 1500;2 Portions of Fried Rice - 900;"
 * Returns total cost and array of item descriptions.
 */
export function parseFoodCell(cellValue: string): {
  total: number;
  items: string[];
} {
  if (!cellValue || cellValue.trim() === "") {
    return { total: 0, items: [] };
  }

  const items = cellValue
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  let total = 0;
  for (const item of items) {
    total += extractPriceFromItem(item);
  }

  return { total, items };
}
