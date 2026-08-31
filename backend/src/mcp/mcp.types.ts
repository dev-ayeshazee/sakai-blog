/** Minimal subset of the Model Context Protocol shapes we mock. */

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface McpToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface McpToolCallResult {
  /** MCP returns content blocks; we only use text blocks here. */
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}

export const MCP_PROTOCOL_VERSION = '2024-11-05';
