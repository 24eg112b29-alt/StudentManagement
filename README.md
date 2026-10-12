# Anurag Student Management System

This repository contains the full-stack student management project for academic demo deployment.

## Project folders

- `anurag-student-management-system/` — main application with the UI and Express API served from the same server.
- `anurag-student-management-backend/` — standalone API version for use with a separate frontend.

## Deployment target

This project is configured for deployment on Render with a Neon PostgreSQL database.

### Render setup

1. Push this folder to a public GitHub repository.
2. Create a new Render Web Service.
3. Connect the GitHub repo.
4. Set the service root to `anurag-student-management-system` if using the main app.
5. Add the environment variable:
   - `DATABASE_URL` = your Neon connection string
6. Deploy.

### Neon database setup

1. Create a Neon project.
2. Copy the connection string from the Neon dashboard.
3. Add it to Render as a `DATABASE_URL` environment variable.
4. Use `sslmode=require` in the connection string.

## Local development

```bash
cd anurag-student-management-system
npm install
cp .env.example .env
npm start
```

If `DATABASE_URL` is not set, the app falls back to a local JSON file so it still runs on a developer machine.

## GitHub public repo steps

```bash
git init
git add .
git commit -m "Initial deployment-ready project"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Then set the repository to Public in GitHub.
