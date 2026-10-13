import test from 'node:test';
import assert from 'node:assert';
import { parseSvdJson } from '../domain/svdParser.js';
import { resolveArmVectorTable } from '../engines/vectorTableResolver.js';

test('parseSvdJson extracts peripherals and registers', () => {
  const sample = {
    peripherals: [
      {
        name: 'GPIOA',
        baseAddress: '0x40020000',
        registers: [
          { name: 'MODER', addressOffset: '0x00', size: 32, access: 'read-write' },
          { name: 'ODR', addressOffset: '0x14', size: 32, access: 'read-write' },
        ],
      },
    ],
  };

  const periphs = parseSvdJson(sample);
  assert.strictEqual(periphs.length, 1);
  assert.strictEqual(periphs[0].name, 'GPIOA');
  assert.strictEqual(periphs[0].baseAddress, 0x40020000);
  assert.strictEqual(periphs[0].registers[1].addressOffset, 0x14);
});

test('resolveArmVectorTable parses Cortex-M vectors', () => {
  const buf = Buffer.alloc(64);
  buf.writeUInt32LE(0x20020000, 0); // SP
  buf.writeUInt32LE(0x08000101, 4); // Reset Handler (Thumb bit set)

  const meta = resolveArmVectorTable(buf);
  assert.strictEqual(meta.initialStackPointer, 0x20020000);
  assert.strictEqual(meta.resetHandlerAddress, 0x08000101);
  assert.strictEqual(meta.detectedArchitecture, 'ARM_CORTEX_M');
});
