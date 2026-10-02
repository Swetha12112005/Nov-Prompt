import { describe, it, expect } from 'vitest';
import { parseCsv, validateCsvFile } from '@/logic/csvParser';

const validCsvHeader =
  'order_id,customer_id,zone,order_value,order_time,delivery_time,expected_delivery_time,cancelled,cancellation_reason,rider_available,inventory_available,repeat_purchase,peak_hour,timestamp';

const validCsvRow =
  'ORD-001,CUST-001,Zone A,50.5,2026-09-01T12:00:00,28,30,false,,true,true,true,false,2026-09-01T12:00:00';

describe('CSV validation', () => {
  it('rejects non-CSV files', () => {
    const file = new File(['data'], 'data.txt', { type: 'text/plain' });
    const err = validateCsvFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('.csv');
  });

  it('rejects empty files', () => {
    const file = new File([''], 'empty.csv', { type: 'text/csv' });
    const err = validateCsvFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('empty');
  });

  it('accepts valid CSV files', () => {
    const file = new File(['data'], 'data.csv', { type: 'text/csv' });
    const err = validateCsvFile(file);
    expect(err).toBeNull();
  });

  it('rejects invalid MIME type', () => {
    const file = new File(['data'], 'data.csv', { type: 'application/pdf' });
    const err = validateCsvFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('Invalid file type');
  });
});

describe('parseCsv', () => {
  it('parses valid CSV correctly', () => {
    const csv = `${validCsvHeader}\n${validCsvRow}`;
    const result = parseCsv(csv);
    expect(result.valid).toBe(true);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].zone).toBe('Zone A');
    expect(result.orders[0].order_value).toBe(50.5);
    expect(result.orders[0].delivery_time).toBe(28);
  });

  it('detects missing required columns', () => {
    const csv = 'order_id,zone,order_value\n1,Zone A,50';
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Missing required columns'))).toBe(true);
  });

  it('detects invalid numeric values', () => {
    const csv = `${validCsvHeader}\nORD-1,C-1,Zone A,abc,2026-09-01T12:00:00,28,30,false,,true,true,true,false,2026-09-01T12:00:00`;
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('order_value'))).toBe(true);
  });

  it('rejects negative order values', () => {
    const csv = `${validCsvHeader}\nORD-1,C-1,Zone A,-50,2026-09-01T12:00:00,28,30,false,,true,true,true,false,2026-09-01T12:00:00`;
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('negative'))).toBe(true);
  });

  it('rejects negative delivery time', () => {
    const csv = `${validCsvHeader}\nORD-1,C-1,Zone A,50,2026-09-01T12:00:00,-5,30,false,,true,true,true,false,2026-09-01T12:00:00`;
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('negative'))).toBe(true);
  });

  it('detects duplicate order IDs', () => {
    const csv = `${validCsvHeader}\n${validCsvRow}\n${validCsvRow}`;
    const result = parseCsv(csv);
    expect(result.errors.some((e) => e.includes('duplicate'))).toBe(true);
  });

  it('handles multiple valid rows', () => {
    const rows = [
      validCsvHeader,
      'ORD-1,C-1,Zone A,50,2026-09-01T12:00:00,28,30,false,,true,true,true,false,2026-09-01T12:00:00',
      'ORD-2,C-2,Zone B,30,2026-09-01T13:00:00,35,30,true,Late delivery,false,false,false,true,2026-09-01T13:00:00',
      'ORD-3,C-3,Zone C,75,2026-09-01T14:00:00,45,30,false,,true,false,true,true,2026-09-01T14:00:00',
    ].join('\n');
    const result = parseCsv(rows);
    expect(result.valid).toBe(true);
    expect(result.orders).toHaveLength(3);
    expect(result.orders[1].cancelled).toBe(true);
    expect(result.orders[2].inventory_available).toBe(false);
  });

  it('handles empty text', () => {
    const result = parseCsv('');
    expect(result.valid).toBe(false);
  });

  it('handles all rows failing', () => {
    const csv = `${validCsvHeader}\nORD-1,C-1,Zone A,abc,2026-09-01T12:00:00,xyz,30,false,,true,true,true,false,2026-09-01T12:00:00`;
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('All rows failed'))).toBe(true);
  });

  it('warns on invalid dates', () => {
    const csv = `${validCsvHeader}\nORD-1,C-1,Zone A,50,2026-09-01T12:00:00,28,30,false,,true,true,true,false,not-a-date`;
    const result = parseCsv(csv);
    expect(result.warnings.some((w) => w.includes('not a valid date'))).toBe(true);
  });

  it('handles malformed CSV safely', () => {
    const csv = 'just some random text\nwith no structure';
    const result = parseCsv(csv);
    expect(result.valid).toBe(false);
  });
});
