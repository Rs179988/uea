export type Architecture = 'ARM_CORTEX_M' | 'ARM_CORTEX_A' | 'RISCV32' | 'RISCV64' | 'MIPS' | 'ESP32';

export type AccessMode = 'read-only' | 'write-only' | 'read-write';

export interface BitField {
  name: string;
  description?: string;
  bitOffset: number;
  bitWidth: number;
}

export interface RegisterSpec {
  name: string;
  description?: string;
  addressOffset: number;
  sizeBits: number;
  access: AccessMode;
  resetValue: number;
  fields: BitField[];
}

export interface PeripheralSpec {
  name: string;
  description?: string;
  baseAddress: number;
  addressBlockSize: number;
  registers: RegisterSpec[];
}

export interface MemoryRegion {
  name: string;
  startAddress: number;
  sizeBytes: number;
  isExecutable: boolean;
  isWritable: boolean;
}

export interface VectorTableEntry {
  vectorIndex: number;
  address: number;
  name: string;
  handlerOffset: number;
}

export interface FirmwareMetadata {
  sha256: string;
  sizeBytes: number;
  initialStackPointer?: number;
  resetHandlerAddress?: number;
  detectedArchitecture: Architecture;
  vectorTable: VectorTableEntry[];
}

export interface BusTransaction {
  timestampNs: number;
  protocol: 'I2C' | 'SPI' | 'UART';
  direction: 'READ' | 'WRITE';
  address?: number;
  dataBytes: number[];
  asciiText?: string;
}

export type EvidenceKind = 'observation' | 'derivation' | 'inference' | 'unknown';

export interface EvidenceRecord {
  id: string;
  kind: EvidenceKind;
  source: string;
  sha256?: string;
  summary: string;
  data: any;
  timestamp: string;
}
