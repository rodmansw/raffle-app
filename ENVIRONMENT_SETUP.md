# Environment Setup for Raffle Admin App

## Environment Variables

The Raffle Admin app uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

### Required Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3000/api/admin
EXPO_PUBLIC_ADMIN_EMAIL=test@test.com

# Environment
NODE_ENV=development
```

### Variable Descriptions

- **EXPO_PUBLIC_API_URL**: The base URL for the Next.js API endpoints
  - Development: `http://localhost:3000/api/admin`
  - Production: `https://your-domain.com/api/admin`

- **EXPO_PUBLIC_ADMIN_EMAIL**: The admin email used for authentication
  - Default: `test@test.com`

- **NODE_ENV**: The environment mode
  - Development: `development`
  - Production: `production`

## Setup Instructions

1. **Create Environment File**:
   ```bash
   cp .env.example .env
   ```

2. **Update Values**:
   Edit the `.env` file with your specific values:
   ```bash
   # For local development
   EXPO_PUBLIC_API_URL=http://localhost:3000/api/admin
   EXPO_PUBLIC_ADMIN_EMAIL=test@test.com
   NODE_ENV=development
   ```

3. **For Production**:
   ```bash
   # For production deployment
   EXPO_PUBLIC_API_URL=https://your-domain.com/api/admin
   EXPO_PUBLIC_ADMIN_EMAIL=test@test.com
   NODE_ENV=production
   ```

## Important Notes

- All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the Expo app
- The `.env` file should be added to `.gitignore` to keep sensitive data out of version control
- Environment variables are loaded at build time, so changes require a restart of the development server

## Configuration File

The app uses a centralized configuration file at `config/env.ts` that provides:

- Environment variable access
- Helper functions for API URLs
- Environment detection utilities

## Usage in Code

```typescript
import { getApiUrl, getAdminEmail, ENV } from "@/config/env";

// Get API URL
const apiUrl = getApiUrl("/raffles");

// Get admin email
const adminEmail = getAdminEmail();

// Check environment
if (ENV.IS_DEVELOPMENT) {
  console.log("Running in development mode");
}
```
