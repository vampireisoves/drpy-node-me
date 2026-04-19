import { randomUUID } from "node:crypto";
import http from "node:http";
import fs from "fs-extra";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import Fastify from "fastify";
import cors from "@fastify/cors";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { prompts, promptHandlers } from "./tools/prompts.js";
import { tools, toolHandlers } from "./tools/toolDefinitions.js";
import { resolvePath } from "./utils/pathHelper.js";

const serverInfo = {
  name: "drpy-node-mcp",
  version: "1.0.6",
};

const serverCapabilities = {
  capabilities: {
    tools: {},
    prompts: {},
  },
};

function getMcpToken() {
  if (process.env.MCP_TOKEN) return process.env.MCP_TOKEN;
  try {
    const configPath = resolvePath("config/env.json");
    if (fs.pathExistsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      return config.MCP_TOKEN || "";
    }
  } catch (e) {}
  return "";
}

function checkBearerToken(req) {
  const token = getMcpToken();
  if (!token) return true;
  const auth = req.headers["authorization"] || "";
  if (auth.startsWith("Bearer ") && auth.slice(7).trim() === token) return true;
  return false;
}

function sendAuthError(res) {
  res.writeHead(401, {
    "Content-Type": "application/json",
    "WWW-Authenticate": 'Bearer realm="MCP Server"'
  });
  res.end(JSON.stringify({
    jsonrpc: "2.0",
    error: { code: -32001, message: "Authentication failed: MCP_TOKEN is configured on the server. Client must send Authorization: Bearer <MCP_TOKEN> header." },
    id: null
  }));
}

function setupServerHandlers(server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = toolHandlers[name];

    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }

    try {
      return await handler(args);
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: `Error executing ${name}: ${error.message}` }]
      };
    }
  });

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return { prompts };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = promptHandlers[name];

    if (!handler) {
      throw new Error(`Prompt not found: ${name}`);
    }

    return handler(args || {});
  });
}

function createServer() {
  const server = new Server(serverInfo, serverCapabilities);
  setupServerHandlers(server);
  return server;
}

async function runServer() {
  const mode = process.env.MCP_MODE || process.argv[2] || 'stdio';

  if (mode === 'stdio') {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Drpy Node MCP Server running on stdio");
  } else if (mode === 'sse') {
    const transports = new Map();

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);

      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "*");

      if (req.method === "OPTIONS") {
        res.writeHead(204).end();
        return;
      }

      if (!checkBearerToken(req)) {
        sendAuthError(res);
        return;
      }

      if (req.method === "GET" && url.pathname === "/sse") {
        const mcpServer = createServer();
        const transport = new SSEServerTransport("/message", res);
        transports.set(transport.sessionId, { server: mcpServer, transport });
        transport.onclose = () => {
          transports.delete(transport.sessionId);
          console.log(`SSE Client disconnected: ${transport.sessionId}`);
        };
        await mcpServer.connect(transport);
        console.log(`SSE Client connected: ${transport.sessionId}`);
        return;
      }

      if (req.method === "POST" && url.pathname === "/message") {
        const sessionId = url.searchParams.get("sessionId");
        const entry = sessionId ? transports.get(sessionId) : [...transports.values()].pop();
        if (!entry) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "No active SSE connection" }));
          return;
        }
        await entry.transport.handlePostMessage(req, res);
        return;
      }

      res.writeHead(404).end();
    });

    const port = process.env.PORT || 57579;
    httpServer.listen(Number(port), '0.0.0.0', () => {
      console.log(`Drpy Node MCP Server (SSE) running on http://localhost:${port}/sse`);
    });
  } else if (mode === 'http') {
    const fastify = Fastify({ logger: true });
    await fastify.register(cors, { origin: true });

    fastify.addHook('onRequest', async (request, reply) => {
      const token = getMcpToken();
      if (!token) return;
      const auth = request.headers["authorization"] || "";
      if (!auth.startsWith("Bearer ") || auth.slice(7).trim() !== token) {
        reply.code(401);
        reply.header("WWW-Authenticate", 'Bearer realm="MCP Server"');
        reply.send({
          jsonrpc: "2.0",
          error: { code: -32001, message: "Authentication failed: MCP_TOKEN is configured on the server. Client must send Authorization: Bearer <MCP_TOKEN> header." },
          id: null
        });
        return;
      }
    });

    const transports = new Map();

    fastify.all("/mcp", async (request, reply) => {
      const sessionId = request.headers['mcp-session-id'];

      if (sessionId && transports.has(sessionId)) {
        const entry = transports.get(sessionId);
        reply.hijack();
        await entry.transport.handleRequest(request.raw, reply.raw, request.body);
        return;
      }

      if (!sessionId && request.method === 'POST' && isInitializeRequest(request.body)) {
        const mcpServer = createServer();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => {
            transports.set(sid, { server: mcpServer, transport });
          },
        });
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports.has(sid)) {
            transports.delete(sid);
          }
        };
        await mcpServer.connect(transport);
        reply.hijack();
        await transport.handleRequest(request.raw, reply.raw, request.body);
        return;
      }

      reply.code(400);
      reply.send({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
    });

    fastify.all("/mcp/*", async (request, reply) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const sessionId = url.pathname.split('/mcp/')[1] || request.headers['mcp-session-id'];

      if (sessionId && transports.has(sessionId)) {
        const entry = transports.get(sessionId);
        reply.hijack();
        await entry.transport.handleRequest(request.raw, reply.raw, request.body);
        return;
      }

      reply.code(400);
      reply.send({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
    });

    const port = process.env.PORT || 57579;
    try {
      await fastify.listen({ port: Number(port), host: '0.0.0.0' });
      console.log(`Drpy Node MCP Server (StreamableHTTP) running on http://localhost:${port}/mcp`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  } else {
    console.error(`Unknown mode: ${mode}. Use 'stdio', 'sse', or 'http'`);
    process.exit(1);
  }
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
