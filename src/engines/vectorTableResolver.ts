import crypto from 'node:crypto';
import { FirmwareMetadata, VectorTableEntry } from './types.js';

export function resolveArmVectorTable(buffer: Buffer): FirmwareMetadata {
  if (buffer.length < 32) {
    throw new Error('Firmware binary too small to contain a valid ARM Cortex-M vector table.');
  }

  const initialSP = buffer.readUInt32LE(0);
  const resetHandler = buffer.readUInt32LE(4);

  const vectors: VectorTableEntry[] = [
    { vectorIndex: 0, address: 0x00, name: 'Initial_Stack_Pointer', handlerOffset: initialSP },
    { vectorIndex: 1, address: 0x04, name: 'Reset_Handler', handlerOffset: resetHandler },
    { vectorIndex: 2, address: 0x08, name: 'NMI_Handler', handlerOffset: buffer.readUInt32LE(8) },
    { vectorIndex: 3, address: 0x0c, name: 'HardFault_Handler', handlerOffset: buffer.readUInt32LE(12) },
    { vectorIndex: 4, address: 0x10, name: 'MemManage_Handler', handlerOffset: buffer.readUInt32LE(16) },
    { vectorIndex: 5, address: 0x14, name: 'BusFault_Handler', handlerOffset: buffer.readUInt32LE(20) },
    { vectorIndex: 6, address: 0x18, name: 'UsageFault_Handler', handlerOffset: buffer.readUInt32LE(24) },
    { vectorIndex: 11, address: 0x2c, name: 'SVCall_Handler', handlerOffset: buffer.length >= 48 ? buffer.readUInt32LE(44) : 0 },
    { vectorIndex: 14, address: 0x38, name: 'PendSV_Handler', handlerOffset: buffer.length >= 60 ? buffer.readUInt32LE(56) : 0 },
    { vectorIndex: 15, address: 0x3c, name: 'SysTick_Handler', handlerOffset: buffer.length >= 64 ? buffer.readUInt32LE(60) : 0 },
  ];

  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    sha256,
    sizeBytes: buffer.length,
    initialStackPointer: initialSP,
    resetHandlerAddress: resetHandler,
    detectedArchitecture: 'ARM_CORTEX_M',
    vectorTable: vectors,
  };
}
