import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");
    const vendor = searchParams.get("vendor");
    const name = searchParams.get("name");
    const hasExtraCost = searchParams.get("hasExtraCost") || "all";

    // Build filter conditions
    const where: Prisma.OrderWhereInput = {};

    if (uploadId) {
      where.uploadId = uploadId;
    }

    if (vendor && vendor.trim()) {
      where.vendor = {
        contains: vendor.trim(),
      };
    }

    if (name && name.trim()) {
      where.OR = [
        { name: { contains: name.trim() } },
        { nickname: { contains: name.trim() } },
      ];
    }

    if (hasExtraCost === "yes") {
      where.extraCost = { gt: 0 };
    } else if (hasExtraCost === "no") {
      where.extraCost = { equals: 0 };
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        upload: {
          select: {
            fileName: true,
            uploadDate: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
