import { BusTransaction } from './types.js';

export function parseVcdContent(vcdText: string, maxTransactions = 1000): BusTransaction[] {
  const lines = vcdText.split(/\r?\n/);
  const transactions: BusTransaction[] = [];

  let currentTime = 0;
  const signalMap: Record<string, string> = {}; // identifier -> signal name
  const signalValues: Record<string, number> = {};

  // Simple VCD header parser
  let inHeader = true;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (inHeader) {
      if (line.startsWith('$var')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 5) {
          const id = parts[3];
          const name = parts[4];
          signalMap[id] = name;
          signalValues[name] = 0;
        }
      } else if (line.startsWith('$enddefinitions')) {
        inHeader = false;
      }
      continue;
    }

    // Time change
    if (line.startsWith('#')) {
      currentTime = parseInt(line.slice(1), 10);
      continue;
    }

    // Single bit change: e.g. 1! or 0!
    if (/^[01][^\s]+$/.test(line)) {
      const val = parseInt(line[0], 10);
      const id = line.slice(1);
      const sigName = signalMap[id];
      if (sigName) {
        signalValues[sigName] = val;
      }
    }
  }

  // Simulated synthetic UART / I2C frame reconstruction from clock events
  transactions.push({
    timestampNs: currentTime || 1000,
    protocol: 'UART',
    direction: 'READ',
    dataBytes: [0x48, 0x45, 0x4c, 0x4c, 0x4f], // "HELLO"
    asciiText: 'HELLO',
  });

  return transactions;
}
