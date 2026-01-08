# Orange Cab - Vehicle Fleet Dashboard

A vehicle fleet management dashboard for tracking vehicles, drivers, and maintenance.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker & Docker Compose

## First-Run Setup

### 1. Start infrastructure services

```bash
docker compose up -d
```

This starts:

- **MySQL 8.0** on port 3306
- **MinIO** (S3-compatible storage) on port 9000 (API) and 9001 (Console)

### 2. Configure environment

```bash
cp .env.example .env
```

Default values in `.env.example` work with the docker-compose setup.

### 3. Install dependencies

```bash
pnpm install
```

### 4. Initialize database schema

```bash
pnpm db:push
```

### 5. Start development server

```bash
pnpm dev
```

The app will be available at http://localhost:5000

## Available Scripts

| Command        | Description                              |
| -------------- | ---------------------------------------- |
| `pnpm dev`     | Start development server with hot reload |
| `pnpm build`   | Build for production                     |
| `pnpm start`   | Run production build                     |
| `pnpm check`   | TypeScript type checking                 |
| `pnpm lint`    | Check code formatting with Prettier      |
| `pnpm format`  | Auto-format code with Prettier           |
| `pnpm test`    | Run tests                                |
| `pnpm db:push` | Generate and run database migrations     |

## Docker Services

### MySQL

- Host: `localhost`
- Port: `3306`
- User: `root`
- Password: `dev_password`
- Database: `orange_cab`

### MinIO

- API: http://localhost:9000
- Console: http://localhost:9001
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

## CI Pipeline

The GitHub Actions CI pipeline runs on every push and PR:

1. Install dependencies
2. Type check (`pnpm check`)
3. Lint (`pnpm lint`)
4. Test (`pnpm test`)

## Railway Deployment

### Quick Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template)

### Manual Setup

1. **Create a Railway project**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Initialize project
   railway init
   ```

2. **Add MySQL database**
   - In Railway dashboard, click "New" → "Database" → "MySQL"
   - Copy the `DATABASE_URL` from the MySQL service variables

3. **Add MinIO/S3 storage** (optional)
   - Use Railway's S3-compatible storage or an external S3 provider
   - Set `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`

4. **Configure environment variables**

   In Railway dashboard, set these variables for your app service:

   ```
   DATABASE_URL=<from MySQL service>
   NODE_ENV=production
   JWT_SECRET=<generate a secure random string>
   VITE_APP_ID=orange-cab
   OAUTH_SERVER_URL=<your OAuth server URL>
   OWNER_OPEN_ID=<admin user open ID>
   ```

5. **Deploy**

   ```bash
   railway up
   ```

   Or connect your GitHub repo for automatic deployments.

### Environment Variables Reference

| Variable                 | Required | Description                    |
| ------------------------ | -------- | ------------------------------ |
| `DATABASE_URL`           | Yes      | MySQL connection string        |
| `JWT_SECRET`             | Yes      | Secret for JWT token signing   |
| `NODE_ENV`               | Yes      | Set to `production`            |
| `VITE_APP_ID`            | Yes      | Application identifier         |
| `OAUTH_SERVER_URL`       | Yes      | OAuth provider URL             |
| `OWNER_OPEN_ID`          | No       | Open ID for admin user         |
| `BUILT_IN_FORGE_API_URL` | No       | S3-compatible storage endpoint |
| `BUILT_IN_FORGE_API_KEY` | No       | S3 access key                  |
