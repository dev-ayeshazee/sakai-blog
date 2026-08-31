import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpService } from './mcp.service';
import {
  JsonRpcRequest,
  JsonRpcResponse,
  McpToolCallResult,
} from './mcp.types';

/**
 * The single hook the rest of the app uses to talk to "an MCP server".
 *
 * - Default: dispatches in-process to the bundled mock (McpService).
 * - Set MCP_SERVER_URL: the exact same calls go out over HTTP JSON-RPC to
 *   a real MCP server with no other code changes.
 */
@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);
  private readonly serverUrl?: string;
  private rpcId = 0;

  constructor(
    private readonly config: ConfigService,
    private readonly localServer: McpService,
  ) {
    this.serverUrl = this.config.get<string>('mcp.serverUrl') || undefined;
    this.logger.log(
      this.serverUrl
        ? `MCP client -> remote ${this.serverUrl}`
        : 'MCP client -> in-process mock server',
    );
  }

  private async rpc(
    method: string,
    params?: Record<string, unknown>,
  ): Promise<JsonRpcResponse> {
    const req: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: ++this.rpcId,
      method,
      params,
    };
    if (!this.serverUrl) return this.localServer.handleRpc(req);

    const res = await fetch(`${this.serverUrl.replace(/\/$/, '')}/rpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!res.ok) throw new Error(`MCP server ${res.status}`);
    return (await res.json()) as JsonRpcResponse;
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolCallResult> {
    const resp = await this.rpc('tools/call', { name, arguments: args });
    if (resp.error) throw new Error(resp.error.message);
    return resp.result as McpToolCallResult;
  }

  /** Read the first text content block from a tool result. */
  text(result: McpToolCallResult): string {
    return result.content.find((c) => c.type === 'text')?.text ?? '';
  }
}
