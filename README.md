# MSA Platform

This repository contains the backend API and frontend application for the MSA educational platform.

## Backend setup

1. Install dependencies:
   ```bash
   cd backend && npm install
   ```
2. Configure environment variables in `backend/.env` (see `MONGODB_ATLAS_SETUP.md`).
3. **Server port** – the backend listens on `PORT`. If this variable is not set, it defaults to `5000`.

Start the backend using:
```bash
npm start
```
