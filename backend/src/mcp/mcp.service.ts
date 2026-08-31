import { Injectable } from '@nestjs/common';
import { HeuristicAiProvider } from '../ai/providers/heuristic.provider';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolCallParams,
  McpToolCallResult,
  McpToolDefinition,
  MCP_PROTOCOL_VERSION,
} from './mcp.types';

/**
 * A self-contained mock MCP server. It implements just enough of the
 * protocol (`initialize`, `tools/list`, `tools/call`) to stand in for a
 * real MCP server during development and for the take-home demo.
 *
 * Tools are backed by the offline heuristic provider so the mock has no
 * external dependencies.
 */
@Injectable()
export class McpService {
  private readonly ai = new HeuristicAiProvider();

  private readonly tools: McpToolDefinition[] = [
    {
      name: 'generate_excerpt',
      description:
        'Generate a short plain-text excerpt/summary from a blog post body.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          maxChars: { type: 'number', default: 200 },
        },
        required: ['text'],
      },
    },
    {
      name: 'suggest_tags',
      description: 'Suggest lowercase topic tags for a blog post body.',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          limit: { type: 'number', default: 5 },
        },
        required: ['text'],
      },
    },
    {
      name: 'moderate_content',
      description: 'Flag disallowed content in a blog post body.',
      inputSchema: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text'],
      },
    },
  ];

  listTools(): McpToolDefinition[] {
    return this.tools;
  }

  async callTool(params: McpToolCallParams): Promise<McpToolCallResult> {
    const args = params.arguments ?? {};
    const text = String(args.text ?? '');
    try {
      switch (params.name) {
        case 'generate_excerpt': {
          const out = await this.ai.summarize(
            text,
            Number(args.maxChars ?? 200),
          );
          return { content: [{ type: 'text', text: out }] };
        }
        case 'suggest_tags': {
          const out = await this.ai.suggestTags(
            text,
            Number(args.limit ?? 5),
          );
          return { content: [{ type: 'text', text: JSON.stringify(out) }] };
        }
        case 'moderate_content': {
          const out = await this.ai.moderate(text);
          return { content: [{ type: 'text', text: JSON.stringify(out) }] };
        }
        default:
          return {
            content: [{ type: 'text', text: `Unknown tool: ${params.name}` }],
            isError: true,
          };
      }
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Tool error: ${String(err)}` }],
        isError: true,
      };
    }
  }

  /** JSON-RPC 2.0 dispatch used by the HTTP controller. */
  async handleRpc(req: JsonRpcRequest): Promise<JsonRpcResponse> {
    const base = { jsonrpc: '2.0' as const, id: req.id ?? null };
    try {
      switch (req.method) {
        case 'initialize':
          return {
            ...base,
            result: {
              protocolVersion: MCP_PROTOCOL_VERSION,
              serverInfo: { name: 'blog-mock-mcp', version: '1.0.0' },
              capabilities: { tools: {} },
            },
          };
        case 'tools/list':
          return { ...base, result: { tools: this.tools } };
        case 'tools/call':
          return {
            ...base,
            result: await this.callTool(
              req.params as unknown as McpToolCallParams,
            ),
          };
        default:
          return {
            ...base,
            error: { code: -32601, message: `Method not found: ${req.method}` },
          };
      }
    } catch (err) {
      return {
        ...base,
        error: { code: -32603, message: String(err) },
      };
    }
  }
}
