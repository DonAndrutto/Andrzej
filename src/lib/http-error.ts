import { NextResponse } from "next/server";

/**
 * An error that carries the HTTP status it should produce, so API routes
 * can translate a caught error into a response without pattern-matching
 * its message string.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Turn a caught error into a response: an `HttpError` keeps its own status
 * and message; anything else becomes a 500 with a generic fallback message,
 * so unexpected internals are never leaked to the client.
 */
export function errorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: fallback }, { status: 500 });
}
