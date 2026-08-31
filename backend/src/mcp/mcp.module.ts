import { Module } from '@nestjs/common';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { McpClientService } from './mcp-client.service';

@Module({
  controllers: [McpController],
  providers: [McpService, McpClientService],
  exports: [McpClientService, McpService],
})
export class McpModule {}
