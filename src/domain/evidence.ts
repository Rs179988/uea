import crypto from 'node:crypto';
import { EvidenceKind, EvidenceRecord } from './types.js';

export class EvidenceLedger {
  private records: Map<string, EvidenceRecord> = new Map();

  addRecord(kind: EvidenceKind, source: string, summary: string, data: any, rawBytesForDigest?: Buffer | string): EvidenceRecord {
    let digest: string | undefined = undefined;
    if (rawBytesForDigest) {
      digest = crypto
        .createHash('sha256')
        .update(typeof rawBytesForDigest === 'string' ? Buffer.from(rawBytesForDigest) : rawBytesForDigest)
        .digest('hex');
    }

    const id = `ev-${this.records.size + 1}-${crypto.randomBytes(4).toString('hex')}`;
    const record: EvidenceRecord = {
      id,
      kind,
      source,
      sha256: digest,
      summary,
      data,
      timestamp: new Date().toISOString(),
    };

    this.records.set(id, record);
    return record;
  }

  getRecord(id: string): EvidenceRecord | undefined {
    return this.records.get(id);
  }

  getAllRecords(): EvidenceRecord[] {
    return Array.from(this.records.values());
  }

  filterByKind(kind: EvidenceKind): EvidenceRecord[] {
    return Array.from(this.records.values()).filter((r) => r.kind === kind);
  }
}
