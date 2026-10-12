# Student Management System — Backend API

This backend is designed to work with the frontend from `Anurag_University_Student_Management_System.zip`.

## Run in VS Code

1. Extract this backend ZIP.
2. Open the extracted `anurag-student-management-backend` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:

   ```bash
   npm install
   npm start
   ```

5. Keep the terminal running. The API listens at `http://localhost:3000`.

## Connect to the frontend

The original combined project frontend uses relative API calls (`/api/students`) and is served by its own Express server. If you run this backend as a separate project, update `public/app.js` in the frontend project to use the backend base URL:

```js
const API = "http://localhost:3000/api/students";
```

Then open the frontend through a local web server (for example VS Code Live Server). The backend includes CORS support for cross-origin frontend requests. Do not open `index.html` directly with a `file://` URL if browser requests fail.

**Important:** If using the original combined full-stack ZIP, do not run both Express servers on port 3000 simultaneously. Either run the combined project as originally supplied, or run this backend separately with the frontend served by Live Server.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/students` | List students; optional `?q=search` |
| POST | `/api/students` | Create a student |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

## Data storage

Records are stored in `data/students.json`. This is a simple educational backend, not production-ready. Add authentication, authorization, and a database before using real student information.
