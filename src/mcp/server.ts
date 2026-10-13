import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import fs from 'node:fs';
import { parseSvdJson } from '../domain/svdParser.js';
import { parseVcdContent } from '../domain/vcdParser.js';
import { resolveArmVectorTable } from '../engines/vectorTableResolver.js';
import { generateRenodeDigitalTwin } from '../engines/renodeEngine.js';
import { EvidenceLedger } from '../domain/evidence.js';

export function runMcpServer() {
  const ledger = new EvidenceLedger();

  const server = new Server(
    {
      name: 'uea-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'inspect_firmware_blob',
          description: 'Parses raw binary firmware, resolves ARM Cortex vector table (SP, Reset Handler, Fault Handlers), and records cryptographic evidence.',
          inputSchema: {
            type: 'object',
            properties: {
              firmwarePath: { type: 'string', description: 'Path to raw .bin firmware' },
            },
            required: ['firmwarePath'],
          },
        },
        {
          name: 'parse_silicon_svd',
          description: 'Ingests CMSIS-SVD JSON definitions and extracts register maps, bitfields, and peripheral memory blocks.',
          inputSchema: {
            type: 'object',
            properties: {
              svdPath: { type: 'string', description: 'Path to SVD JSON file' },
              peripheralFilter: { type: 'string', description: 'Optional peripheral name to filter (e.g. USART1)' },
            },
            required: ['svdPath'],
          },
        },
        {
          name: 'decode_vcd_bus_trace',
          description: 'Decodes Value Change Dump (VCD) logic analyzer files into timestamped bus packets (I2C/SPI/UART).',
          inputSchema: {
            type: 'object',
            properties: {
              vcdPath: { type: 'string', description: 'Path to .vcd logic capture' },
            },
            required: ['vcdPath'],
          },
        },
        {
          name: 'synthesize_digital_twin',
          description: 'Generates complete Renode platform definitions (.repl), execution script (.resc), and MMIO stubs for virtual execution.',
          inputSchema: {
            type: 'object',
            properties: {
              firmwarePath: { type: 'string' },
              svdPath: { type: 'string' },
              boardName: { type: 'string' },
              cpuModel: { type: 'string' },
            },
            required: ['firmwarePath', 'svdPath'],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'inspect_firmware_blob': {
        const fp = args?.firmwarePath as string;
        const buf = fs.readFileSync(fp);
        const meta = resolveArmVectorTable(buf);
        ledger.addRecord('observation', fp, `Resolved ARM vector table (${meta.sizeBytes} bytes)`, meta, buf);
        return { content: [{ type: 'text', text: JSON.stringify(meta, null, 2) }] };
      }

      case 'parse_silicon_svd': {
        const sp = args?.svdPath as string;
        const content = fs.readFileSync(sp, 'utf8');
        let periphs = parseSvdJson(content);
        if (args?.peripheralFilter) {
          periphs = periphs.filter((p) => p.name.toLowerCase() === (args.peripheralFilter as string).toLowerCase());
        }
        return { content: [{ type: 'text', text: JSON.stringify(periphs, null, 2) }] };
      }

      case 'decode_vcd_bus_trace': {
        const vp = args?.vcdPath as string;
        const content = fs.readFileSync(vp, 'utf8');
        const transactions = parseVcdContent(content);
        return { content: [{ type: 'text', text: JSON.stringify(transactions, null, 2) }] };
      }

      case 'synthesize_digital_twin': {
        const fp = args?.firmwarePath as string;
        const sp = args?.svdPath as string;
        const bName = (args?.boardName as string) || 'VirtualSoC';
        const cpu = (args?.cpuModel as string) || 'cortex-m4';

        const periphs = parseSvdJson(fs.readFileSync(sp, 'utf8'));
        const twin = generateRenodeDigitalTwin(bName, cpu, periphs, fp);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(twin, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  const transport = new StdioServerTransport();
  server.connect(transport);
}
