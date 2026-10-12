function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStudentPayload(body = {}) {
  const student = {
    id: clean(body.id),
    name: clean(body.name),
    email: clean(body.email),
    phone: clean(body.phone),
    department: clean(body.department),
    year: clean(body.year),
    status: clean(body.status) || "Active"
  };

  if (!student.id) throw new Error("Student ID is required.");
  if (!student.name) throw new Error("Student name is required.");
  if (!student.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) throw new Error("A valid email is required.");
  if (!student.department) throw new Error("Department is required.");
  if (!student.year) throw new Error("Academic year is required.");
  if (!["Active", "Inactive"].includes(student.status)) throw new Error("Status must be Active or Inactive.");

  return student;
}

function ensureStudentTableSql() {
  return `
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      department TEXT NOT NULL,
      year TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
}

function formatStudentRow(row = {}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    department: row.department,
    year: row.year,
    status: row.status
  };
}

module.exports = {
  clean,
  normalizeStudentPayload,
  ensureStudentTableSql,
  formatStudentRow
};
