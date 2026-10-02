import type { Order } from '@/types';

export interface CsvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  orders: Order[];
  rowCount: number;
}

const REQUIRED_COLUMNS = [
  'order_id',
  'customer_id',
  'zone',
  'order_value',
  'delivery_time',
  'expected_delivery_time',
  'cancelled',
  'rider_available',
  'inventory_available',
  'repeat_purchase',
  'peak_hour',
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024;

function parseBoolean(value: string): boolean {
  const v = value.toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseNumber(value: string): number | null {
  const v = parseFloat(value);
  return isNaN(v) ? null : v;
}

function isValidDate(value: string): boolean {
  if (!value) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

export function validateCsvFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'File must have a .csv extension.';
  }
  const validMimeTypes = ['text/csv', 'application/csv', 'text/plain', ''];
  if (file.type && !validMimeTypes.includes(file.type)) {
    return `Invalid file type: ${file.type}. Expected CSV.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.`;
  }
  if (file.size === 0) {
    return 'File is empty.';
  }
  return null;
}

export function parseCsv(text: string): CsvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const orders: Order[] = [];

  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    return {
      valid: false,
      errors: ['CSV must contain a header row and at least one data row.'],
      warnings: [],
      orders: [],
      rowCount: 0,
    };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !headers.includes(col)
  );
  if (missingColumns.length > 0) {
    return {
      valid: false,
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
      warnings: [],
      orders: [],
      rowCount: 0,
    };
  }

  const colIndex: Record<string, number> = {};
  headers.forEach((h, i) => (colIndex[h] = i));

  let validRows = 0;
  let invalidRows = 0;
  const seenIds = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',');
    if (cells.length < headers.length) {
      invalidRows++;
      errors.push(
        `Row ${i + 1}: has ${cells.length} columns, expected ${headers.length}.`
      );
      continue;
    }

    const getCol = (name: string): string =>
      (cells[colIndex[name]] ?? '').trim();

    const orderId = getCol('order_id');
    if (orderId && seenIds.has(orderId)) {
      errors.push(`Row ${i + 1}: duplicate order_id "${orderId}".`);
      invalidRows++;
      continue;
    }
    if (orderId) seenIds.add(orderId);

    const orderValue = parseNumber(getCol('order_value'));
    const deliveryTime = parseNumber(getCol('delivery_time'));
    const expectedDeliveryTime = parseNumber(getCol('expected_delivery_time'));

    if (orderValue === null) {
      errors.push(`Row ${i + 1}: order_value is not a valid number.`);
      invalidRows++;
      continue;
    }
    if (orderValue < 0) {
      errors.push(`Row ${i + 1}: order_value is negative (${orderValue}).`);
      invalidRows++;
      continue;
    }
    if (deliveryTime === null) {
      errors.push(`Row ${i + 1}: delivery_time is not a valid number.`);
      invalidRows++;
      continue;
    }
    if (deliveryTime < 0) {
      errors.push(`Row ${i + 1}: delivery_time is negative (${deliveryTime}).`);
      invalidRows++;
      continue;
    }
    if (expectedDeliveryTime === null) {
      errors.push(
        `Row ${i + 1}: expected_delivery_time is not a valid number.`
      );
      invalidRows++;
      continue;
    }
    if (expectedDeliveryTime < 0) {
      errors.push(
        `Row ${i + 1}: expected_delivery_time is negative (${expectedDeliveryTime}).`
      );
      invalidRows++;
      continue;
    }

    const zone = getCol('zone');
    if (!zone) {
      errors.push(`Row ${i + 1}: zone is missing.`);
      invalidRows++;
      continue;
    }

    const cancelledCell = getCol('cancelled').toLowerCase();
    if (!['true', 'false', '1', '0', 'yes', 'no'].includes(cancelledCell)) {
      errors.push(`Row ${i + 1}: cancelled must be true/false.`);
      invalidRows++;
      continue;
    }

    const timestamp = getCol('timestamp');
    if (timestamp && !isValidDate(timestamp)) {
      warnings.push(`Row ${i + 1}: timestamp "${timestamp}" is not a valid date; using default.`);
    }

    const orderTime = getCol('order_time') || timestamp;

    const order: Order = {
      order_id: orderId || `ORD-${String(i).padStart(5, '0')}`,
      customer_id: getCol('customer_id') || `CUST-${String(i).padStart(4, '0')}`,
      zone,
      order_value: orderValue,
      order_time: orderTime || `2026-09-${String((i % 30) + 1).padStart(2, '0')}T12:00:00`,
      delivery_time: deliveryTime,
      expected_delivery_time: expectedDeliveryTime,
      cancelled: parseBoolean(getCol('cancelled')),
      cancellation_reason: getCol('cancellation_reason') || null,
      rider_available: parseBoolean(getCol('rider_available')),
      inventory_available: parseBoolean(getCol('inventory_available')),
      repeat_purchase: parseBoolean(getCol('repeat_purchase')),
      peak_hour: parseBoolean(getCol('peak_hour')),
      timestamp: timestamp || `2026-09-${String((i % 30) + 1).padStart(2, '0')}T12:00:00`,
    };

    orders.push(order);
    validRows++;
  }

  if (invalidRows > 0 && validRows === 0) {
    return {
      valid: false,
      errors: ['All rows failed validation.', ...errors.slice(0, 10)],
      warnings,
      orders: [],
      rowCount: 0,
    };
  }

  return {
    valid: validRows > 0,
    errors: errors.slice(0, 10),
    warnings: warnings.slice(0, 10),
    orders,
    rowCount: validRows,
  };
}
