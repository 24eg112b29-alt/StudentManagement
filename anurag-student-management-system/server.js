require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const { clean, normalizeStudentPayload, ensureStudentTableSql, formatStudentRow } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "students.json");
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
let pool = null;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const initial = [
      { id: "AU2026001", name: "Aarav Sharma", email: "aarav.sharma@example.com", phone: "9876543210", department: "Computer Science", year: "2nd Year", status: "Active" },
      { id: "AU2026002", name: "Priya Reddy", email: "priya.reddy@example.com", phone: "9876543211", department: "Electronics", year: "3rd Year", status: "Active" },
      { id: "AU2026003", name: "Mohammed Faizan", email: "faizan@example.com", phone: "9876543212", department: "Information Technology", year: "1st Year", status: "Inactive" }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
  }
}

function readStudentsJson() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeStudentsJson(students) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(students, null, 2));
}

async function initializeDatabase() {
  if (!DATABASE_URL) return false;
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
  });
  await pool.query(ensureStudentTableSql());
  return true;
}

async function readStudentsFromDb(search = "") {
  if (!pool) return [];
  let query = "SELECT * FROM students";
  const params = [];
  if (search) {
    query += " WHERE LOWER(id) LIKE $1 OR LOWER(name) LIKE $1 OR LOWER(email) LIKE $1 OR LOWER(department) LIKE $1 OR LOWER(year) LIKE $1 OR LOWER(status) LIKE $1";
    params.push(`%${search.toLowerCase()}%`);
  }
  query += " ORDER BY created_at DESC";
  const { rows } = await pool.query(query, params);
  return rows.map(formatStudentRow);
}

async function insertStudentToDb(student) {
  const { rows } = await pool.query(
    `INSERT INTO students (id, name, email, phone, department, year, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [student.id, student.name, student.email, student.phone, student.department, student.year, student.status]
  );
  return formatStudentRow(rows[0]);
}

async function updateStudentInDb(studentId, student) {
  const { rows } = await pool.query(
    `UPDATE students
     SET name = $1, email = $2, phone = $3, department = $4, year = $5, status = $6
     WHERE id = $7
     RETURNING *`,
    [student.name, student.email, student.phone, student.department, student.year, student.status, studentId]
  );
  return rows[0] ? formatStudentRow(rows[0]) : null;
}

async function deleteStudentFromDb(studentId) {
  const { rowCount } = await pool.query("DELETE FROM students WHERE id = $1", [studentId]);
  return rowCount > 0;
}

function canUseDatabase() {
  return Boolean(DATABASE_URL && pool);
}

app.get("/api/health", async (_req, res) => {
  if (canUseDatabase()) {
    try {
      await pool.query("SELECT 1");
      return res.json({
        status: "ok",
        app: "Anurag University Student Management System",
        database: "neon-postgres"
      });
    } catch (error) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  }

  return res.json({ status: "ok", app: "Anurag University Student Management System", database: "json-file" });
});

app.get("/api/students", async (req, res) => {
  const q = clean(req.query.q);
  try {
    if (canUseDatabase()) {
      const students = await readStudentsFromDb(q);
      return res.json(students);
    }

    let students = readStudentsJson();
    if (q) {
      const lower = q.toLowerCase();
      students = students.filter(s =>
        [s.id, s.name, s.email, s.department, s.year, s.status].some(value => String(value || "").toLowerCase().includes(lower))
      );
    }
    return res.json(students);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/students", async (req, res) => {
  try {
    const student = normalizeStudentPayload(req.body);
    if (canUseDatabase()) {
      const duplicate = await pool.query(
        "SELECT id, email FROM students WHERE LOWER(id) = LOWER($1) OR LOWER(email) = LOWER($2)",
        [student.id, student.email]
      );
      if (duplicate.rows.length) {
        const row = duplicate.rows[0];
        if (row.id && row.id.toLowerCase() === student.id.toLowerCase()) {
          return res.status(409).json({ error: "A student with this ID already exists." });
        }
        return res.status(409).json({ error: "A student with this email already exists." });
      }
      const created = await insertStudentToDb(student);
      return res.status(201).json(created);
    }

    const students = readStudentsJson();
    if (students.some(s => s.id.toLowerCase() === student.id.toLowerCase())) {
      return res.status(409).json({ error: "A student with this ID already exists." });
    }
    if (students.some(s => s.email.toLowerCase() === student.email.toLowerCase())) {
      return res.status(409).json({ error: "A student with this email already exists." });
    }
    students.unshift(student);
    writeStudentsJson(students);
    return res.status(201).json(student);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.put("/api/students/:id", async (req, res) => {
  try {
    const student = normalizeStudentPayload({ ...req.body, id: req.params.id });
    if (canUseDatabase()) {
      const duplicate = await pool.query(
        "SELECT id, email FROM students WHERE LOWER(email) = LOWER($1) AND id != $2",
        [student.email, student.id]
      );
      if (duplicate.rows.length) {
        return res.status(409).json({ error: "Another student already uses this email." });
      }
      const updated = await updateStudentInDb(req.params.id, student);
      if (!updated) return res.status(404).json({ error: "Student not found." });
      return res.json(updated);
    }

    const students = readStudentsJson();
    const index = students.findIndex(s => s.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Student not found." });
    if (students.some((s, i) => i !== index && s.email.toLowerCase() === student.email.toLowerCase())) {
      return res.status(409).json({ error: "Another student already uses this email." });
    }
    students[index] = student;
    writeStudentsJson(students);
    return res.json(student);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

app.delete("/api/students/:id", async (req, res) => {
  try {
    if (canUseDatabase()) {
      const deleted = await deleteStudentFromDb(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Student not found." });
      return res.json({ success: true });
    }

    const students = readStudentsJson();
    const updated = students.filter(s => s.id !== req.params.id);
    if (updated.length === students.length) return res.status(404).json({ error: "Student not found." });
    writeStudentsJson(updated);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

ensureDataFile();
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Student Management System running at http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error("Database initialization failed:", error.message);
    app.listen(PORT, () => console.log(`Student Management System running at http://localhost:${PORT} (JSON fallback mode)`));
  });
