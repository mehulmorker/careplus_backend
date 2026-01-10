# 🏥 CarePulse Backend

Express.js + GraphQL backend server for the CarePulse Healthcare Management System.

> **Note:** This repository contains the **backend** of the CarePulse application. The frontend is a separate repository. See the [Frontend Repository](#frontend-repository) section below.

## 📋 Table of Contents

- [Frontend Repository](#frontend-repository)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Cloning and Setup](#cloning-and-setup)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [GraphQL API](#graphql-api)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Frontend Repository

The frontend is a separate Next.js application. You can find it here:

- **Frontend Repo:** [https://github.com/mehulmorker/careplus_frontend](https://github.com/mehulmorker/careplus_frontend)

### Full Stack Setup

To run the complete CarePulse application, you need both repositories:

1. **Backend** (this repository) - GraphQL API server
2. **Frontend** - Next.js web application

See the [Cloning and Setup](#cloning-and-setup) section for step-by-step instructions on setting up both.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** 18.0 or higher ([Download](https://nodejs.org/))
- **npm:** 9.0 or higher (comes with Node.js)
- **PostgreSQL:** 14.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git:** For cloning the repository

### Database Options

You can use either:
- **Local PostgreSQL** installation
- **Neon DB** (cloud PostgreSQL) - Recommended for easier setup

---

## Getting Started

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehulmorker/careplus_backend
   cd careplus_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit with your settings
   nano .env
   ```

4. **Setup database**
   ```bash
   # Run migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access GraphQL Playground**
   - Visit [http://localhost:4000/graphql](http://localhost:4000/graphql)

---

## Cloning and Setup

### Step-by-Step Setup Guide

This guide will help you set up both the backend and frontend repositories.

#### 1. Clone Both Repositories

```bash
# Clone backend repository
git clone https://github.com/mehulmorker/careplus_backend
cd careplus_backend

# Clone frontend repository (in a separate directory)
cd ..
git clone https://github.com/mehulmorker/careplus_frontend
```

Your directory structure should look like:
```
careplus/
├── careplus_backend/    # Backend (this repo)
└── careplus_frontend/   # Frontend
```

#### 2. Setup Backend

```bash
cd careplus_backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

#### 3. Configure Backend Environment

Edit the `.env` file with your configuration:

```env
# .env
NODE_ENV=development
PORT=4000

# Database - Use Neon DB or local PostgreSQL
# For Neon DB (recommended):
DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"

# For local PostgreSQL:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/carepulse_dev"

# JWT Secrets (generate strong random strings)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-at-least-32-characters-long"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS - Frontend URL
CORS_ORIGIN="http://localhost:3000"

# Email (SendGrid) - Optional for development
SENDGRID_API_KEY="your-sendgrid-api-key"
FROM_EMAIL="noreply@careplus.com"

# Cloudinary (for file uploads) - Optional for development
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### 4. Setup Database

**Option A: Using Neon DB (Recommended)**

1. Sign up at [Neon](https://neon.tech/)
2. Create a new project
3. Copy the connection string
4. Paste it into your `.env` file as `DATABASE_URL`

**Option B: Using Local PostgreSQL**

```bash
# Create database
psql -U postgres -c "CREATE DATABASE carepulse_dev;"

# Or using psql
sudo -u postgres psql
CREATE DATABASE carepulse_dev;
\q
```

#### 5. Run Database Migrations

```bash
cd careplus_backend

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# (Optional) Seed with sample data
npm run prisma:seed
```

#### 6. Start Backend Server

```bash
cd careplus_backend
npm run dev
```

The backend should start on `http://localhost:4000`

Verify it's working:
```bash
curl http://localhost:4000/graphql?query=%7B__typename%7D
# Should return: {"data":{"__typename":"Query"}}
```

#### 7. Setup Frontend

Open a new terminal window:

```bash
cd careplus_frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

#### 8. Configure Frontend Environment

Edit `frontend/.env.local`:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
```

#### 9. Start Frontend Server

```bash
cd careplus_frontend
npm run dev
```

The frontend should start on `http://localhost:3000`

#### 10. Verify Complete Setup

1. Open [http://localhost:3000](http://localhost:3000) in your browser
2. You should see the CarePulse homepage
3. Try registering a new patient to verify the connection
4. Check backend terminal for GraphQL requests

---

## Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run dev:port` | Start on port 4001 (if 4000 is busy) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint and auto-fix issues |
| `npm run type-check` | Run TypeScript type checking |
| `npm run check` | Run lint + type-check |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once (CI mode) |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:integration` | Run integration tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run verify` | Run lint + type-check + tests |

### Database

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:migrate:reset` | Reset database (CAUTION!) |
| `npm run prisma:studio` | Open Prisma Studio GUI |
| `npm run prisma:seed` | Seed database with sample data |
| `npm run prisma:push` | Push schema without migration |
| `npm run db:reset` | Reset and reseed database |

### Health Check

| Command | Description |
|---------|-------------|
| `npm run health` | Check if server is running |

---

## Project Structure

```
backend/
├── src/
│   ├── index.ts              # Application entry point
│   │
│   ├── config/               # Configuration
│   │   ├── index.ts         # Config exports
│   │   ├── environment.ts   # Environment variables
│   │   ├── database.ts     # Prisma client
│   │   ├── email.ts         # SendGrid email service
│   │   └── cloudinary.ts    # Cloudinary file upload
│   │
│   ├── graphql/              # GraphQL layer
│   │   ├── schema/          # Type definitions
│   │   │   └── index.ts
│   │   ├── resolvers/       # Query/Mutation handlers
│   │   │   ├── index.ts
│   │   │   ├── auth.resolver.ts
│   │   │   ├── user.resolver.ts
│   │   │   ├── patient.resolver.ts
│   │   │   └── appointment.resolver.ts
│   │   └── context.ts       # Request context
│   │
│   ├── services/             # Business logic
│   │   ├── user.service.ts
│   │   ├── auth.service.ts
│   │   ├── patient.service.ts
│   │   ├── appointment.service.ts
│   │   ├── admin.service.ts
│   │   ├── token-blacklist.service.ts
│   │   └── __tests__/       # Service tests
│   │
│   ├── repositories/         # Data access layer
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   ├── patient.repository.ts
│   │   └── __tests__/       # Repository tests
│   │
│   ├── middleware/           # Express middleware
│   │   └── auth.middleware.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   ├── logger.ts        # Logging utility
│   │   ├── cookies.ts       # Cookie utilities
│   │   └── email-verification.ts
│   │
│   └── __tests__/            # Integration tests
│       └── integration/
│
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── seed.ts              # Seed script
│   └── migrations/          # Migration files
│
├── vitest.config.ts         # Unit test config
├── vitest.integration.config.ts  # Integration test config
├── vitest.setup.ts          # Test setup
└── package.json
```

---

## Database Setup

### Using Neon DB (Recommended)

1. **Sign up** at [https://neon.tech/](https://neon.tech/)
2. **Create a new project**
3. **Copy the connection string** from the dashboard
4. **Add to `.env` file:**
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```
5. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```

### Using Local PostgreSQL

#### Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Create Databases

```bash
# Access PostgreSQL
sudo -u postgres psql  # Linux
psql -U postgres        # macOS/Windows

# Create development database
CREATE DATABASE carepulse_dev;

# Create test database (for testing)
CREATE DATABASE carepulse_test;

# Create user (optional)
CREATE USER carepulse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE carepulse_dev TO carepulse_user;
GRANT ALL PRIVILEGES ON DATABASE carepulse_test TO carepulse_user;

# Exit psql
\q
```

### Database URL Format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public

# Examples:
# Local:
postgresql://postgres:password@localhost:5432/carepulse_dev

# Neon DB:
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### Prisma Commands

```bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create and run migrations
npx prisma migrate dev --name your_migration_name

# View database in browser
npx prisma studio

# Reset database (DELETES ALL DATA)
npx prisma migrate reset --force

# Push schema without creating migration (dev only)
npx prisma db push
```

---

## Development

### Architecture Pattern

This backend follows **SOLID principles** with a layered architecture:

```
┌─────────────────────────────────────────┐
│           GraphQL Resolvers              │  ← Thin! Only call services
├─────────────────────────────────────────┤
│            Service Layer                 │  ← ALL business logic here
├─────────────────────────────────────────┤
│          Repository Layer                │  ← ALL data access here
├─────────────────────────────────────────┤
│            Prisma ORM                    │  ← Database operations
└─────────────────────────────────────────┘
```

### Creating a New Feature

1. **Define Prisma Model** (if needed)
   ```prisma
   // prisma/schema.prisma
   model NewEntity {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. **Create Repository**
   ```typescript
   // src/repositories/new-entity.repository.ts
   export class NewEntityRepository {
     constructor(private prisma: PrismaClient) {}
     
     async findById(id: string) {
       return this.prisma.newEntity.findUnique({ where: { id } });
     }
   }
   ```

3. **Create Service**
   ```typescript
   // src/services/new-entity.service.ts
   export class NewEntityService {
     constructor(private repository: NewEntityRepository) {}
     
     async getById(id: string) {
       const entity = await this.repository.findById(id);
       if (!entity) throw new NotFoundError('Entity not found');
       return entity;
     }
   }
   ```

4. **Add GraphQL Schema**
   ```graphql
   type NewEntity {
     id: ID!
     name: String!
   }
   
   type Query {
     newEntity(id: ID!): NewEntity
   }
   ```

5. **Add Resolver**
   ```typescript
   export const newEntityResolvers = {
     Query: {
       newEntity: (_: any, { id }: { id: string }, context: Context) => {
         return context.services.newEntity.getById(id);
       },
     },
   };
   ```

---

## Testing

### Running Tests

```bash
# Run all unit tests
npm test

# Run once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run specific test file
npm test -- user.service

# Full verification
npm run verify
```

### Writing Unit Tests

```typescript
// src/services/__tests__/user.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../user.service';
import { UserRepository } from '../../repositories/user.repository';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = {
      findByEmail: vi.fn(),
      create: vi.fn(),
    } as any;
    service = new UserService(mockRepository);
  });

  describe('createUser', () => {
    it('should create user with valid input', async () => {
      const input = { email: 'test@example.com', name: 'Test' };
      mockRepository.create.mockResolvedValue({ id: '1', ...input });

      const result = await service.createUser(input);

      expect(result.email).toBe(input.email);
      expect(mockRepository.create).toHaveBeenCalledWith(input);
    });

    it('should throw error for duplicate email', async () => {
      mockRepository.findByEmail.mockResolvedValue({ id: '1' } as any);

      await expect(
        service.createUser({ email: 'existing@test.com', name: 'Test' })
      ).rejects.toThrow('Email already exists');
    });
  });
});
```

### Writing Integration Tests

```typescript
// src/__tests__/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';

describe('Auth Integration', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/graphql')
      .send({
        query: `
          mutation {
            register(input: {
              email: "test@example.com"
              name: "Test User"
              phone: "+1234567890"
            }) {
              user { id email }
              errors { message }
            }
          }
        `,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.register.user).toBeDefined();
  });
});
```

### Test Coverage Goals

| Area | Minimum | Target |
|------|---------|--------|
| Services | 80% | 90% |
| Repositories | 75% | 85% |
| Resolvers | 70% | 85% |
| Utilities | 90% | 100% |

---

## GraphQL API

### Accessing GraphQL Playground

With the server running, visit: [http://localhost:4000/graphql](http://localhost:4000/graphql)

### Example Queries

```graphql
# Check if API is working
{
  __typename
}

# Get current user
query {
  me {
    id
    email
    name
    role
  }
}

# Get all appointments (admin only)
query {
  appointments {
    appointments {
      id
      schedule
      reason
      status
      patient {
        name
        email
      }
    }
  }
}
```

### Example Mutations

```graphql
# Register user
mutation {
  register(input: {
    email: "patient@example.com"
    name: "John Doe"
    phone: "+1234567890"
  }) {
    user {
      id
      email
      name
    }
    errors {
      field
      message
    }
  }
}

# Login
mutation {
  login(email: "patient@example.com", password: "password123") {
    user {
      id
      email
      role
    }
    errors {
      message
    }
  }
}

# Refresh token
mutation {
  refreshToken {
    user {
      id
      email
    }
    errors {
      message
    }
  }
}
```

### Testing GraphQL with cURL

```bash
# Basic introspection
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ __typename }"}'

# With cookies (after login)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=YOUR_TOKEN" \
  -d '{"query": "{ me { id email } }"}'
```

---

## Environment Variables

### Required Variables

Create a `.env` file in the root directory:

```env
# .env
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/carepulse_dev"

# JWT Secrets (generate strong random strings, at least 32 characters)
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-at-least-32-characters-long"
JWT_REFRESH_EXPIRES_IN="7d"

# CORS - Frontend URL
CORS_ORIGIN="http://localhost:3000"
```

### All Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 4000 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | 15m | Access token expiration |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret (32+ chars) |
| `JWT_REFRESH_EXPIRES_IN` | No | 7d | Refresh token expiration |
| `CORS_ORIGIN` | Yes | - | Frontend URL for CORS |
| `SENDGRID_API_KEY` | No | - | SendGrid API key for emails |
| `FROM_EMAIL` | No | - | Email sender address |
| `CLOUDINARY_CLOUD_NAME` | No | - | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | No | - | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | No | - | Cloudinary API secret |

### Test Environment

```env
# .env.test
NODE_ENV=test
DATABASE_URL="postgresql://postgres:password@localhost:5432/carepulse_test"
JWT_SECRET="test-secret-key-for-testing-only"
JWT_REFRESH_SECRET="test-refresh-secret-key-for-testing-only"
CORS_ORIGIN="http://localhost:3000"
```

### Environment File Setup

```bash
# Copy example file (if exists)
cp .env.example .env

# Or create manually
touch .env

# Edit with your configuration
nano .env
```

---

## Troubleshooting

### Common Issues

#### 1. Port 4000 Already in Use

```bash
# Option 1: Use different port
npm run dev:port  # Uses port 4001

# Option 2: Kill process on port 4000
# On Linux/Mac:
lsof -ti:4000 | xargs kill -9

# On Windows:
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Then restart
npm run dev
```

#### 2. Database Connection Error

**Symptoms:** "Can't reach database server" or Prisma connection errors

**Solutions:**

```bash
# Check PostgreSQL is running
# Linux:
sudo systemctl status postgresql

# macOS:
brew services list | grep postgresql

# Check connection
psql -U postgres -c "SELECT 1"

# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test with Prisma
npx prisma db pull

# For Neon DB: Verify connection string includes ?sslmode=require
```

#### 3. Prisma Migration Error

```bash
# Reset database and migrations (CAUTION: Deletes all data)
npx prisma migrate reset --force

# Or push schema directly (dev only, no migration history)
npx prisma db push

# Check migration status
npx prisma migrate status
```

#### 4. TypeScript Errors

```bash
# Run type checking
npm run type-check

# Regenerate Prisma types
npx prisma generate

# Clear TypeScript cache
rm -rf tsconfig.tsbuildinfo
```

#### 5. Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate
```

#### 6. CORS Errors

**Symptoms:** Frontend can't connect to backend

**Solutions:**

1. **Check CORS_ORIGIN in `.env`:**
   ```env
   CORS_ORIGIN="http://localhost:3000"
   ```

2. **For multiple origins (production):**
   ```env
   CORS_ORIGIN="http://localhost:3000,https://your-frontend.vercel.app"
   ```

3. **Restart backend after changing CORS_ORIGIN**

#### 7. JWT Token Errors

**Symptoms:** "Invalid token" or authentication failures

**Solutions:**

1. **Verify JWT secrets are set:**
   ```bash
   # Check .env file
   grep JWT_SECRET .env
   ```

2. **Ensure secrets are at least 32 characters:**
   ```env
   JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
   ```

3. **Clear browser cookies and try again**

### Health Check Commands

```bash
# Check server is running
npm run health

# Or manually
curl http://localhost:4000/graphql?query=%7B__typename%7D

# Expected: {"data":{"__typename":"Query"}}

# Check database connection
npx prisma studio  # Should open without errors

# Full verification
npm run verify
```

### Full Verification

```bash
# Run complete verification
npm run verify

# This runs:
# 1. ESLint
# 2. TypeScript type-check
# 3. All tests
```

---

## Manual Integration Verification

### Check Backend Is Working

```bash
# 1. Server starts without errors
npm run dev

# 2. GraphQL responds
curl http://localhost:4000/graphql?query=%7B__typename%7D

# 3. Database is connected
npx prisma studio  # Should open without errors

# 4. All tests pass
npm run test:run

# 5. Full verification
npm run verify
```

### Check Database Schema

```bash
# View current schema
npx prisma db pull --print

# Validate schema
npx prisma validate

# Check migration status
npx prisma migrate status
```

### Verify Frontend Connection

1. Start backend: `npm run dev` (should be on port 4000)
2. Start frontend: `cd ../careplus_frontend && npm run dev` (should be on port 3000)
3. Open browser: [http://localhost:3000](http://localhost:3000)
4. Try registering a patient
5. Check backend terminal for GraphQL requests

---

## Learn More

### Documentation

- [Express.js Documentation](https://expressjs.com/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Vitest Documentation](https://vitest.dev/)

### Related Resources

- [Frontend Repository](https://github.com/mehulmorker/careplus_frontend)
- [Neon Database Guide](https://neon.tech/docs/)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is part of the CarePulse Healthcare Management System.

---

**Part of the CarePulse Healthcare Management System**
