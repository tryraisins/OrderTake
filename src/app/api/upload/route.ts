import { NextRequest, NextResponse } from "next/server";
import { parseCSVContent, parseRawData, validateColumns } from "@/lib/csvParser";
import * as xlsx from "xlsx";
import prisma from "@/lib/db";
import { MAX_FILE_SIZE } from "@/lib/security/validation";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const discountStr = formData.get("discountAmount") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 },
      );
    }

    if (
      !file.name.toLowerCase().endsWith(".csv") &&
      !file.name.toLowerCase().endsWith(".xlsx")
    ) {
      return NextResponse.json(
        { error: "Only CSV and Excel files are allowed" },
        { status: 400 },
      );
    }

    // Validate discount amount
    const discountAmount = discountStr ? parseFloat(discountStr) : 7000;
    if (
      isNaN(discountAmount) ||
      discountAmount < 0 ||
      discountAmount > 1000000
    ) {
      return NextResponse.json(
        { error: "Invalid discount amount" },
        { status: 400 },
      );
    }

    // Parse file content
    let parseResult;

    if (file.name.toLowerCase().endsWith(".csv")) {
      const csvText = await file.text();
      if (!csvText.trim()) {
        return NextResponse.json(
          { error: "CSV file is empty" },
          { status: 400 },
        );
      }
      parseResult = parseCSVContent(csvText, discountAmount);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = xlsx.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet);

      if (rawData.length === 0) {
        return NextResponse.json(
          { error: "Excel file is empty or formatted incorrectly" },
          { status: 400 },
        );
      }
      parseResult = parseRawData(rawData, discountAmount);
    }

    // Validate file columns
    const columnValidation = validateColumns(parseResult.headers);
    if (!columnValidation.valid) {
      return NextResponse.json(
        {
          error: `Missing required columns: ${columnValidation.missingRequired.join(", ")}`,
          columnErrors: {
            missing: columnValidation.missingRequired,
            unknown: columnValidation.unknownColumns,
          },
        },
        { status: 400 },
      );
    }
    const columnWarnings = columnValidation.unknownColumns.length > 0
      ? [`Unexpected columns ignored: ${columnValidation.unknownColumns.join(", ")}`]
      : [];

    if (parseResult.orders.length === 0) {
      return NextResponse.json(
        { error: "No valid orders found in CSV" },
        { status: 400 },
      );
    }

    // Limit rows
    if (parseResult.orders.length > 500) {
      return NextResponse.json(
        { error: "Too many rows. Maximum 500 orders per upload." },
        { status: 400 },
      );
    }

    // Save to database
    const upload = await prisma.upload.create({
      data: {
        fileName: file.name.substring(0, 255),
        discountAmount,
        totalCost: parseResult.totalCost,
        totalExtraCost: parseResult.totalExtraCost,
        totalNubiavilleCost: parseResult.totalNubiavilleCost,
        orderCount: parseResult.orders.length,
        orders: {
          create: parseResult.orders.map((order) => ({
            name: order.name.substring(0, 255),
            nickname: order.nickname.substring(0, 255),
            email: order.email.substring(0, 255),
            vendor: order.vendor.substring(0, 255),
            foodItems: JSON.stringify(order.foodItems),
            totalCost: order.totalCost,
            discountAmount: order.discountAmount,
            extraCost: order.extraCost,
            nubiavilleCost: order.nubiavilleCost,
            startTime: order.startTime || null,
            completionTime: order.completionTime || null,
          })),
        },
      },
      include: {
        orders: true,
      },
    });

    return NextResponse.json({
      success: true,
      upload,
      warnings: [...parseResult.errors, ...columnWarnings],
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
