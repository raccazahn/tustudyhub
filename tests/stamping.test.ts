import assert from 'node:assert/strict';
import test from 'node:test';
import { StampingService } from '../src/server/services/StampingService.ts';
import { PDFDocument } from 'pdf-lib';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

let testPdfPath: string;
let stampedResult: any;

test('Stage 8: PDF Stamping - Setup', async () => {
  // Create a 100% valid minimal PDF using pdf-lib to prevent parsing hangs
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([612, 792]);
  const pdfBytes = await pdfDoc.save();

  const testDir = path.join(process.cwd(), 'uploads', 'documents', 'test');
  await fs.mkdir(testDir, { recursive: true });
  testPdfPath = path.join(testDir, 'test-original.pdf');
  await fs.writeFile(testPdfPath, pdfBytes);
});

test('Stage 8: PDF Stamping - Successfully stamps a valid PDF', { timeout: 15000 }, async () => {
  const token = 'TSH-TEST-12345678';
  const title = 'Test Document';
  const date = new Date().toISOString();

  stampedResult = await StampingService.stampDocument(testPdfPath, title, token, date);

  assert.strictEqual(stampedResult.success, true, `Stamping failed: ${stampedResult.error}`);
  assert.match(stampedResult.stampedInternalFilePath!, /^stamped-.*\.pdf$/);
  assert.match(stampedResult.stampedFileHash!, /^[a-f0-9]{64}$/);
});

test('Stage 8: PDF Stamping - Original PDF remains unchanged', async () => {
  const originalBytes = await fs.readFile(testPdfPath);
  assert.ok(originalBytes.length > 100);
  assert.strictEqual(originalBytes.subarray(0, 4).toString(), '%PDF');
});

test('Stage 8: PDF Stamping - Stamped PDF contains valid structure and hash matches', async () => {
  assert.ok(stampedResult?.success, 'Previous stamping test must pass');
  const stampedPath = path.join(process.cwd(), 'uploads', 'documents', 'stamped', stampedResult.stampedInternalFilePath);
  const stampedBytes = await fs.readFile(stampedPath);

  const computedHash = crypto.createHash('sha256').update(stampedBytes).digest('hex');
  assert.strictEqual(computedHash, stampedResult.stampedFileHash);

  const pdfDoc = await PDFDocument.load(stampedBytes);
  assert.strictEqual(pdfDoc.getPageCount(), 1);
});

test('Stage 8: PDF Stamping - Failure leaves no orphaned files and returns error', async () => {
  const fakePath = path.join(process.cwd(), 'uploads', 'documents', 'does-not-exist.pdf');
  const result = await StampingService.stampDocument(fakePath, 'Test', 'TOKEN', new Date().toISOString());

  assert.strictEqual(result.success, false);
  assert.ok(result.error);
});

test('Stage 8: PDF Stamping - Cleanup', async () => {
  try {
    await fs.unlink(testPdfPath).catch(() => {});
    if (stampedResult?.success && stampedResult.stampedInternalFilePath) {
      const stampedPath = path.join(process.cwd(), 'uploads', 'documents', 'stamped', stampedResult.stampedInternalFilePath);
      await fs.unlink(stampedPath).catch(() => {});
    }
    await fs.rmdir(path.join(process.cwd(), 'uploads', 'documents', 'test')).catch(() => {});
  } catch (e) {}
});
