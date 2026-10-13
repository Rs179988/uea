#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { parseSvdJson } from './domain/svdParser.js';
import { parseVcdContent } from './domain/vcdParser.js';
import { resolveArmVectorTable } from './engines/vectorTableResolver.js';
import { generateRenodeDigitalTwin } from './engines/renodeEngine.js';
import { runMcpServer } from './mcp/server.js';

const program = new Command();

program
  .name('uea')
  .description('Universal Emulation Anything: Silicon digital twin, firmware virtualization & bus decoding.')
  .version('1.0.0');

program
  .command('firmware <file>')
  .description('Resolve firmware entrypoint and ARM Cortex vector table')
  .action((file) => {
    const buf = fs.readFileSync(file);
    const meta = resolveArmVectorTable(buf);

    console.log(`\n⚡ UEA Firmware Inspection: ${file}`);
    console.log(`===============================================`);
    console.log(`SHA-256:          ${meta.sha256}`);
    console.log(`Size:             ${meta.sizeBytes} bytes`);
    console.log(`Architecture:     ${meta.detectedArchitecture}`);
    console.log(`Initial SP:       0x${meta.initialStackPointer?.toString(16).toUpperCase()}`);
    console.log(`Reset Handler:    0x${meta.resetHandlerAddress?.toString(16).toUpperCase()}\n`);

    console.log('Vector Table:');
    for (const v of meta.vectorTable) {
      console.log(`  [+0x${v.address.toString(16).padStart(2, '0')}] ${v.name.padEnd(24)} -> 0x${v.handlerOffset.toString(16).toUpperCase()}`);
    }
    console.log();
  });

program
  .command('svd <file>')
  .description('Parse CMSIS-SVD peripheral memory maps')
  .option('-p, --peripheral <name>', 'Filter by peripheral name')
  .action((file, opts) => {
    const content = fs.readFileSync(file, 'utf8');
    let periphs = parseSvdJson(content);
    if (opts.peripheral) {
      periphs = periphs.filter((p) => p.name.toLowerCase() === opts.peripheral.toLowerCase());
    }

    console.log(`\n🔬 UEA Silicon Memory Maps: ${file}`);
    console.log(`===============================================`);
    for (const p of periphs) {
      console.log(`\nPeripheral: ${p.name} @ 0x${p.baseAddress.toString(16).toUpperCase()} (${p.registers.length} registers)`);
      for (const r of p.registers.slice(0, 10)) {
        console.log(`  └─ [+0x${r.addressOffset.toString(16).padStart(4, '0')}] ${r.name.padEnd(12)} (${r.sizeBits}-bit ${r.access})`);
      }
      if (p.registers.length > 10) {
        console.log(`  ... and ${p.registers.length - 10} more registers`);
      }
    }
    console.log();
  });

program
  .command('renode <firmware>')
  .description('Synthesize Renode digital twin simulation platform')
  .requiredOption('-s, --svd <svdFile>', 'CMSIS-SVD file')
  .option('-b, --board <name>', 'Board name', 'VirtualBoard')
  .option('-c, --cpu <model>', 'CPU model', 'cortex-m4')
  .option('-o, --output-dir <dir>', 'Output directory', './digital_twin')
  .action((firmware, opts) => {
    const periphs = parseSvdJson(fs.readFileSync(opts.svd, 'utf8'));
    const { repl, resc } = generateRenodeDigitalTwin(opts.board, opts.cpu, periphs, firmware);

    fs.mkdirSync(opts.outputDir, { recursive: true });
    fs.writeFileSync(path.join(opts.outputDir, `${opts.board.toLowerCase()}.repl`), repl, 'utf8');
    fs.writeFileSync(path.join(opts.outputDir, `${opts.board.toLowerCase()}.resc`), resc, 'utf8');

    console.log(`✅ Renode Digital Twin platform synthesized in: ${opts.outputDir}`);
  });

program
  .command('mcp')
  .description('Start UEA Model Context Protocol (MCP) server over stdio')
  .action(() => {
    runMcpServer();
  });

program.parse(process.argv);
