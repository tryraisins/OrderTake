import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rateLimit";

// IP blocklist (can be extended)
const blockedIPs = new Set<string>();

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to API routes
  if (!pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const clientIP = getClientIP(request);

  // Check IP blocklist
  if (blockedIPs.has(clientIP)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Determine rate limit config based on route
  const config = pathname.includes("/upload")
    ? RATE_LIMITS.upload
    : RATE_LIMITS.api;

  const rateLimitResult = checkRateLimit(clientIP, config);

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(rateLimitResult.resetIn / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains",
  );
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:;",
  );
  response.headers.set(
    "X-RateLimit-Remaining",
    String(rateLimitResult.remaining),
  );

  // CORS - same-origin only
  const origin = request.headers.get("origin");
  if (origin) {
    const url = new URL(request.url);
    if (origin === url.origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS",
      );
      response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    }
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
