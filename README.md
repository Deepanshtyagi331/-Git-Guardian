# GitHub Security Scanner

## Setup

1.  **Backend**
    ```bash
    cd backend
    npm install
    cp .env.example .env # (If provided)
    n
2.  **Frontend**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

## Environment Variables
Ensure `backend/.env` has:
```
MONGO_URI=mongodb://localhost:27017/github-scanner
JWT_SECRET=your_secret
GITHUB_CLIENT_ID=...
inyer


## Features
- Scan public GitHub repos for secrets and code issues.
- Dashboard with history.
- Detailed report view.
