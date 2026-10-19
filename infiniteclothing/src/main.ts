import { createGateway } from "@mit-sdg/sync-engine/boundary";
import { createHttpHandler } from "@mit-sdg/sync-engine-http/handler";
import { assembleApplication } from "./assembly.ts";
import { connectDatabase } from "./db.ts";
import { policy } from "../web/edge.ts";

await connectDatabase();

const application = assembleApplication();
const gateway = createGateway({ application });
const handler = createHttpHandler({ application, gateway, policy });
const backendPort = Number(process.env.PORT ?? 8080);

const server = Bun.serve({
  hostname: process.env.HOST ?? "127.0.0.1",
  port: backendPort,
  fetch: (request) => {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ status: "ok" });
    }
    return handler(request);
  },
});

console.log(`Backend listening on ${server.url}`);
