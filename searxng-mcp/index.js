#!/usr/bin/env node

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { 
  CallToolRequestSchema, 
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} = require("@modelcontextprotocol/sdk/types.js");
const axios = require("axios");

/**
 * MCP Server for SearXNG Search
 */
class SearXNGServer {
  constructor() {
    this.server = new Server(
      {
        name: "searxng-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.SEARCH_URL = process.env.SEARXNG_URL || "https://search.meharadvisory.cloud/search";

    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupHandlers() {
    /**
     * List available tools.
     * Exposes the 'web_search' tool.
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "web_search",
            description: "Search the web using a private SearXNG instance. Use this for real-time information, technical docs, and image lookups.",
            inputSchema: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query",
                },
                limit: {
                  type: "number",
                  description: "Number of results to return (default 10)",
                  default: 10,
                },
              },
              required: ["query"],
            },
          },
        ],
      };
    });

    /**
     * Handle tool calls.
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== "web_search") {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
      }

      const { query, limit = 10 } = request.params.arguments;

      try {
        const response = await axios.get(this.SEARCH_URL, {
          params: {
            q: query,
            format: "json",
            language: "en-US",
            safesearch: 1,
          },
          headers: {
            "User-Agent": "MCP-Server/1.0.0 (Search Grounding)",
          },
        });

        const results = (response.data.results || [])
          .slice(0, limit)
          .map((r) => ({
            title: r.title,
            url: r.url,
            snippet: r.content || r.snippet,
            source: r.engine || "unknown",
            thumbnail: r.thumbnail || null
          }));

        if (results.length === 0) {
          return {
            content: [{ type: "text", text: "No search results found for this query." }],
          };
        }

        const formattedResults = results
          .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}\nSource: ${r.source}\n`)
          .join("\n---\n");

        return {
          content: [
            { 
              type: "text", 
              text: `Search results for: "${query}"\n\n${formattedResults}` 
            }
          ],
        };
      } catch (error) {
        console.error("SearXNG Search Error:", error.message);
        return {
          content: [
            { 
              type: "text", 
              text: `Search failed: ${error.message}${error.response ? ` (${error.response.status})` : ""}` 
            }
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SearXNG MCP Server running on stdio");
  }
}

const server = new SearXNGServer();
server.run().catch(console.error);
