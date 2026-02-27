import { z } from "zod";

export const uploadSchema = z.object({
  discountAmount: z.number().min(0).max(1000000),
});

export const queryOrdersSchema = z.object({
  uploadId: z.string().optional(),
  vendor: z.string().optional(),
  name: z.string().optional(),
  hasExtraCost: z.enum(["all", "yes", "no"]).optional().default("all"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// File validation
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ["text/csv", "application/vnd.ms-excel"];

export function validateCSVFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size exceeds 5MB limit" };
  }

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith(".csv")) {
    return { valid: false, error: "Only CSV files are allowed" };
  }

  return { valid: true };
}

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
