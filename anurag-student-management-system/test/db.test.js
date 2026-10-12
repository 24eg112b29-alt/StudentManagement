const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStudentPayload, ensureStudentTableSql } = require('../db');

test('normalizeStudentPayload trims required values and defaults status', () => {
  const output = normalizeStudentPayload({
    id: '  AU2026001  ',
    name: '  Alice Smith  ',
    email: ' alice@example.com ',
    phone: ' 9876543210 ',
    department: ' Computer Science ',
    year: ' 2nd Year ',
    status: '   '
  });

  assert.deepEqual(output, {
    id: 'AU2026001',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '9876543210',
    department: 'Computer Science',
    year: '2nd Year',
    status: 'Active'
  });
});

test('ensureStudentTableSql creates the expected schema', () => {
  const sql = ensureStudentTableSql();
  assert.match(sql, /CREATE TABLE IF NOT EXISTS students/i);
  assert.match(sql, /id TEXT PRIMARY KEY/i);
  assert.match(sql, /email.*UNIQUE/i);
});
