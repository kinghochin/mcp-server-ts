import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { z } from "zod";

// create the MCP server
const server = new McpServer({
  name: "AI Sommelier TS",
  version: "1.0.0",
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WINE_LIST: string = path.join(__dirname, "winelist.txt");

function ensureFile(): void {
  if (!fs.existsSync(WINE_LIST)) {
    fs.writeFileSync(WINE_LIST, "");
  }
}

server.tool(
  "add_wine",
  "Append a new wine to the wine list.",
  {
    wine: z.string().describe("Wine name like 1984 Chateau Lafite Rothschild"),
  },
  async ({ wine }) => {
    ensureFile();
    fs.appendFileSync(WINE_LIST, wine + "\n");

    return {
      content: [
        {
          type: "text",
          text: "Note saved!",
        },
      ],
    };
  }
);

server.tool(
  "get_wines",
  "Get and return all wines from the wine list.",
  {},
  async () => {
    /**
     * Get and return all wines from the wine list.
     *
     * @returns All wines separated by line breaks or default message.
     */
    ensureFile();
    const content: string = fs.readFileSync(WINE_LIST, "utf-8").trim();
    const result = content || "No wines yet.";

    return {
      content: [
        {
          type: "text",
          text: result,
        },
      ],
    };
  }
);

server.resource(
  "latest_wine", // name
  "wines://latest", // URI
  async () => {
    /**
     * Get the most recently added wine.
     *
     * @returns Last wine entry or default message.
     */
    ensureFile();
    const lines: string[] = fs.readFileSync(WINE_LIST, "utf-8").trim().split("\n");
    const result = lines.length > 0 ? lines[lines.length - 1] : "No wines yet.";

    return {
      contents: [
        {
          uri: "wines://latest",
          text: result,
          mimeType: "text/plain",
        },
      ],
    };
  }
);

server.prompt(
  "note_summary_prompt",
  "Generate a prompt asking the AI to summarize wines and match with food.",
  async (_extra) => {
    ensureFile();
    const content: string = fs.readFileSync(WINE_LIST, "utf-8").trim();

    const text =
      content.length > 0
        ? `Summarise the current wines and suggest the food matching: ${content}`
        : "There are no wines yet.";

    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text,
            _meta: {}, // required by MCP
          },
        },
      ],
    };
  }
);

// set transport
async function init(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// call the initialization
init();
