import homepage from "./index.html";

const backend = new URL(
  process.env.BACKEND_URL ?? "http://127.0.0.1:8080",
);
const frontendPort = Number(process.env.PORT ?? 3001);

async function proxy(request: Request) {
  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, backend);

  try {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("content-length");
    headers.delete("connection");

    const body =
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer();

    return await fetch(target, {
      method: request.method,
      headers,
      body,
    });
  } catch (error) {
    console.error(`Proxy request failed: ${target}`, error);
    return Response.json({ error: "UNAVAILABLE" }, { status: 503 });
  }
}

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: frontendPort,
  routes: {
    "/": homepage,
    "/api/*": proxy,
    "/health": proxy,
  },
});

console.log(`Frontend listening on ${server.url}`);
console.log(`Proxying API requests to ${backend.origin}`);
