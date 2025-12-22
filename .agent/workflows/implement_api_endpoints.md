# Workflow: Implement API Endpoints for Leaves CRUD

## Prerequisites
- Node.js (>=18) installed.
- Run `npm install` in project root.
- Backend written in TypeScript; run with `npx ts-node backend/server.ts` or compile.

## Steps
1. **Start backend**
   ```bash
   npx ts-node backend/server.ts
   ```
   Server listens on `http://localhost:4000` (or PORT from `.env`).

2. **Verify health endpoint**
   ```bash
   curl http://localhost:4000/api/health
   ```
   Expect `{ "status": "ok" }`.

3. **Test Leaves CRUD**
   - Create a leave
     ```bash
     curl -X POST http://localhost:4000/api/leaves \
       -H "Content-Type: application/json" \
       -d '{"employee_id":1,"type":"vacation","start_date":"2025-01-01","end_date":"2025-01-05"}'
     ```
   - List leaves
     ```bash
     curl http://localhost:4000/api/leaves
     ```
   - Update a leave (replace `<id>`)
     ```bash
     curl -X PUT http://localhost:4000/api/leaves/<id> \
       -H "Content-Type: application/json" \
       -d '{"employee_id":1,"type":"sick","start_date":"2025-01-02","end_date":"2025-01-04"}'
     ```
   - Delete a leave
     ```bash
     curl -X DELETE http://localhost:4000/api/leaves/<id>
     ```

4. **Integrate with Frontend**
   - Add API client functions for the new endpoints.
   - Replace IndexedDB storage for leaves with server calls.
   - Test UI to ensure data is shared across browsers.

5. **Backup verification**
   ```bash
   curl -O -J http://localhost:4000/api/backup
   ```
   Confirm `ausencias_backup.sqlite` includes the `leaves` table.

## Cleanup
- Stop server with `Ctrl+C`.
- Commit changes:
  ```bash
  git add backend/server.ts .agent/workflows/implement_api_endpoints.md
  git commit -m "Add Leaves CRUD endpoints and workflow"
  ```
