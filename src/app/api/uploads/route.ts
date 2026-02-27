import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fileName: true,
        uploadDate: true,
        discountAmount: true,
        totalCost: true,
        totalExtraCost: true,
        totalNubiavilleCost: true,
        orderCount: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Error fetching uploads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
