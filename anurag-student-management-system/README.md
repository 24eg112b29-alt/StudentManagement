# Anurag University Student Management System

A starter full-stack student management system designed as an academic/demo project. It is **not an official Anurag University system** and is not connected to university records.

## Features

- Dashboard totals for all, active, inactive, and represented departments
- View student records in a responsive table
- Search by name, student ID, email, department, year, or status
- Filter by enrollment status
- Add, edit, and delete student records
- Server-side validation and duplicate ID/email checks
- JSON-file persistence in `data/students.json`
- Express backend and plain HTML/CSS/JavaScript frontend

## Requirements

- Node.js 18 or newer
- Visual Studio Code (or another code editor)

## Run the project

1. Extract the ZIP file.
2. Open the extracted `anurag-student-management-system` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Install the backend dependency:

   ```bash
   npm install
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open this URL in your browser:

   `http://localhost:3000`

Keep the terminal open while using the application. Press `Ctrl+C` in the terminal to stop the server.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server status |
| GET | `/api/students` | List students; optional `?q=search` |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

Example student JSON:

```json
{
  "id": "AU2026010",
  "name": "Student Name",
  "email": "student@example.com",
  "phone": "9876543210",
  "department": "Computer Science",
  "year": "1st Year",
  "status": "Active"
}
```

## Project structure

```text
anurag-student-management-system/
├── data/
│   └── students.json
├── public/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── .gitignore
├── package.json
├── README.md
└── server.js
```

## Notes

- The included students are fictional sample records. Replace them with authorized data before any real use.
- This is a learning/demo project. It does not include authentication, role permissions, audit logs, or production database hardening. Do not put real student personal information into a public deployment.
- For a production or final-year project, consider adding login/roles and moving records to PostgreSQL or MySQL.
