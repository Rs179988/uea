import { AccessMode, PeripheralSpec, RegisterSpec } from './types.js';

export function parseSvdJson(content: string | object): PeripheralSpec[] {
  const data = typeof content === 'string' ? JSON.parse(content) : content;
  const rawPeripherals = data.peripherals || data.device?.peripherals?.peripheral || [];

  const periphList = Array.isArray(rawPeripherals) ? rawPeripherals : [rawPeripherals];
  const results: PeripheralSpec[] = [];

  for (const p of periphList) {
    if (!p.name) continue;

    const baseAddress = typeof p.baseAddress === 'string' ? parseInt(p.baseAddress, 16) : p.baseAddress || 0;
    const rawRegisters = p.registers?.register || p.registers || [];
    const regList = Array.isArray(rawRegisters) ? rawRegisters : [rawRegisters];

    const registers: RegisterSpec[] = [];

    for (const r of regList) {
      if (!r.name) continue;

      const offset = typeof r.addressOffset === 'string' ? parseInt(r.addressOffset, 16) : r.addressOffset || 0;
      const sizeBits = r.size || 32;
      const resetVal = typeof r.resetValue === 'string' ? parseInt(r.resetValue, 16) : r.resetValue || 0;

      const rawFields = r.fields?.field || r.fields || [];
      const fieldList = Array.isArray(rawFields) ? rawFields : [rawFields];

      const fields = fieldList.map((f: any) => ({
        name: f.name,
        description: f.description,
        bitOffset: f.bitOffset !== undefined ? f.bitOffset : f.lsb || 0,
        bitWidth: f.bitWidth !== undefined ? f.bitWidth : (f.msb !== undefined ? f.msb - f.lsb + 1 : 1),
      }));

      let access: AccessMode = 'read-write';
      if (r.access === 'read-only' || r.access === 'RO') access = 'read-only';
      if (r.access === 'write-only' || r.access === 'WO') access = 'write-only';

      registers.push({
        name: r.name,
        description: r.description,
        addressOffset: offset,
        sizeBits,
        access,
        resetValue: resetVal,
        fields,
      });
    }

    results.push({
      name: p.name,
      description: p.description,
      baseAddress,
      addressBlockSize: p.addressBlock?.size || 0x1000,
      registers: registers.sort((a, b) => a.addressOffset - b.addressOffset),
    });
  }

  return results.sort((a, b) => a.baseAddress - b.baseAddress);
}
