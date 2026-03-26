# Nexus - Serverless Dropshipping Store

Nexus is a full-stack, serverless-ready dropshipping platform built with Vanilla JS, CSS, Node.js, and Neon PostgreSQL. It is optimized for direct deployment on Vercel without a long-running Node.js server.

## Features
- **Frontend**: Clean, minimal Apple-style UI with Vanilla JS and CSS (No Frameworks).
- **Backend Architecture**: Fully serverless. Uses Vercel Serverless Functions (`/api/*`).
- **Database**: Neon (PostgreSQL) integrated natively.
- **Authentication**: JWT-based sign up / sign in securely hashed using bcrypt.
- **Admin Dashboard**: Manage products and view orders from all customers globally.
- **Cart & Fake Checkout**: Complete mocked payment flow mapping directly to database execution logs.

## 🚀 Setup Instructions

### 1. Requirements
- Node.js installed locally.
- A Neon PostgreSQL Database connection string (`postgres://...`).
- A Vercel account.

### 2. Environment Variables
In your root folder, create a `.env` file (for local development via Vercel dev) and add your connection string:
```
DATABASE_URL=postgres://[user]:[password]@[host]/[dbname]?sslmode=require
JWT_SECRET=super_secret_dropship_key_2026
```

### 3. Initialize Database
Run the setup script to create tables and seed default products (including the default admin account).
If you have node installed, simply run:
```bash
node setup-db.js
```
*(Alternative: Copy the SQL syntax inside `setup-db.js` directly to your Neon SQL editor)*

The setup script creates a default admin:
- Email: `admin@dropship.com`
- User: `admin123`

### 4. Running Locally
To test the serverless functions locally, install Vercel CLI globally:
```bash
npm i -g vercel
```
Then run inside the `dropship` folder:
```bash
vercel dev
```

### 5. Deploying to Vercel
This project uses the `vercel.json` config mapping API folders and static assets automatically. 
On your Vercel Dashboard, create a new project, select your Git repository (containing this folder), and set the Environment Variables:
- `DATABASE_URL` (Required)
- `JWT_SECRET` (Required)

Vercel will build and route the root domain to the HTML files and map `/api/*` seamlessly.
