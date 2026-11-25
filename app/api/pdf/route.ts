
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const fileUrl = request.nextUrl.searchParams.get("url");

    if (!fileUrl) {
      return new Response("PDF URL missing", { status: 400 });
    }

    const url = new URL(fileUrl);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "share.deepstorage.dev"
    ) {
      return new Response("Invalid PDF URL", { status: 400 });
    }

    if (!url.pathname.toLowerCase().endsWith(".pdf")) {
      return new Response("Only PDF files are supported", {
        status: 400,
      });
    }

    const headers: HeadersInit = {};
    const range = request.headers.get("range");

    if (range) {
      headers.Range = range;
    }

    const upstream = await fetch(url.toString(), {
      headers,
      cache: "no-store",
    });

    if (!upstream.ok && upstream.status !== 206) {
      return new Response("Unable to fetch PDF from DeepStorage", {
        status: upstream.status,
      });
    }

    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("text/html")) {
      return new Response(
        "DeepStorage returned a webpage instead of a PDF file",
        { status: 502 }
      );
    }

    const responseHeaders = new Headers();

    responseHeaders.set("Content-Type", "application/pdf");
    responseHeaders.set("Content-Disposition", "inline");
    responseHeaders.set("Cache-Control", "private, no-store");

    const contentLength = upstream.headers.get("content-length");
    const contentRange = upstream.headers.get("content-range");
    const acceptRanges = upstream.headers.get("accept-ranges");

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }

    if (acceptRanges) {
      responseHeaders.set("Accept-Ranges", acceptRanges);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("PDF viewer error:", error);

    return new Response("PDF could not be opened", {
      status: 500,
    });
  }
}
