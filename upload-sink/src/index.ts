const ALLOWED_ORIGINS = new Set([
  "https://bufferbloat.org",
  "https://www.bufferbloat.org",
  "http://localhost:3000",
]);

const MAX_UPLOAD_BYTES = 300 * 1024 * 1024;

const ipHits = new Map<string, number[]>();

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get("Origin");

    if (!origin || !ALLOWED_ORIGINS.has(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    const ip =
      request.headers.get("CF-Connecting-IP") || "unknown";

    const now = Date.now();

    const recent =
      (ipHits.get(ip) || []).filter(
        (t) => now - t < 60_000
      );

    if (recent.length >= 20) {
      return new Response("Rate limit exceeded", {
        status: 429,
      });
    }

    recent.push(now);
    ipHits.set(ip, recent);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: cors(origin),
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", {
        status: 405,
        headers: cors(origin),
      });
    }

    if (!request.body) {
      return new Response("Missing request body", {
        status: 400,
        headers: cors(origin),
      });
    }

    const reader = request.body.getReader();

    let bytes = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      bytes += value.byteLength;

      if (bytes > MAX_UPLOAD_BYTES) {
        return new Response("Upload too large", {
          status: 413,
          headers: cors(origin),
        });
      }
    }

    return Response.json(
      {
        ok: true,
        receivedBytes: bytes,
      },
      {
        headers: cors(origin),
      }
    );
  },
};

function cors(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}
