import { Body, Controller, Get, Post } from '@nestjs/common';
import { McpService } from './mcp.service';
import { JsonRpcRequest } from './mcp.types';

/**
 * HTTP surface of the mock MCP server. Lets you exercise the protocol with
 * plain curl, and lets an external MCP client point at this service via
 * MCP_SERVER_URL.
 */
@Controller('mcp')
export class McpController {
  constructor(private readonly mcp: McpService) {}

  /** Convenience: human-readable tool catalogue. */
  @Get('tools')
  tools() {
    return { tools: this.mcp.listTools() };
  }

  /** JSON-RPC 2.0 endpoint: initialize | tools/list | tools/call. */
  @Post('rpc')
  rpc(@Body() body: JsonRpcRequest) {
    return this.mcp.handleRpc(body);
  }
}
