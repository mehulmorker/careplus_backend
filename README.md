# 🏥 CarePulse Backend

Express.js + GraphQL backend server for the CarePulse Healthcare Management System.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Database Setup](#database-setup)
- [Development](#development)
- [Testing](#testing)
- [GraphQL API](#graphql-api)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js:** 18.0 or higher
- **npm:** 9.0 or higher
- **PostgreSQL:** 14.0 or higher
- **Database:** A running PostgreSQL instance

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit with your database credentials
nano .env
```

### 3. Setup Database

```bash
# Create database (in psql)
psql -U postgres -c "CREATE DATABASE carepulse_dev;"

# Run migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Seed with sample data (optional)
npm run prisma:seed
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Access GraphQL Playground

Visit [http://localhost:4000/graphql](http://localhost:4000/graphql)

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
│   │   └── database.ts      # Prisma client
│   │
│   ├── graphql/              # GraphQL layer
│   │   ├── schema/          # Type definitions
│   │   │   └── index.ts
│   │   ├── resolvers/       # Query/Mutation handlers
│   │   │   └── index.ts
│   │   └── context.ts       # Request context
│   │
│   ├── services/             # Business logic
│   │   ├── user.service.ts
│   │   ├── auth.service.ts
│   │   ├── patient.service.ts
│   │   ├── appointment.service.ts
│   │   └── __tests__/       # Service tests
│   │
│   ├── repositories/         # Data access layer
│   │   ├── base.repository.ts
│   │   ├── user.repository.ts
│   │   └── __tests__/       # Repository tests
│   │
│   ├── middleware/           # Express middleware
│   │   └── auth.middleware.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   └── logger.ts        # Logging utility
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

### PostgreSQL Installation

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Create Databases

```bash
# Access PostgreSQL
sudo -u postgres psql

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
postgresql://postgres:password@localhost:5432/carepulse_dev
postgresql://carepulse_user:your_password@localhost:5432/carepulse_dev
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

# Push schema without creating migration
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

# Health check (after implementation)
query {
  health {
    status
    timestamp
  }
}
```

### Example Mutations

```graphql
# Register user (Phase 2+)
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

# Login (Phase 2+)
mutation {
  login(email: "patient@example.com", password: "password123") {
    token
    user {
      id
      email
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

# With authentication
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "{ me { id email } }"}'
```

---

## Environment Variables

### Required Variables

```env
# .env
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/carepulse_dev"

# JWT
JWT_SECRET="your-super-secret-jwt-key-at-least-32-characters-long"
JWT_EXPIRES_IN="7d"
```

### All Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | development | Environment mode |
| `PORT` | No | 4000 | Server port |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_EXPIRES_IN` | No | 7d | JWT expiration time |
| `SENDGRID_API_KEY` | Phase 6 | - | SendGrid API key |
| `FROM_EMAIL` | Phase 6 | - | Email sender address |

### Test Environment

```env
# .env.test
NODE_ENV=test
DATABASE_URL="postgresql://postgres:password@localhost:5432/carepulse_test"
JWT_SECRET="test-secret-key-for-testing-only"
```

---

## Troubleshooting

### Common Issues

#### 1. Port 4000 Already in Use

```bash
# Option 1: Use different port
npm run dev:port  # Uses port 4001

# Option 2: Kill process on port 4000
lsof -ti:4000 | xargs kill -9
npm run dev
```

#### 2. Database Connection Error

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -c "SELECT 1"

# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test with Prisma
npx prisma db pull
```

#### 3. Prisma Migration Error

```bash
# Reset database and migrations
npx prisma migrate reset --force

# Or push schema directly (dev only)
npx prisma db push
```

#### 4. TypeScript Errors

```bash
# Run type checking
npm run type-check

# Regenerate Prisma types
npx prisma generate
```

#### 5. Module Not Found

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma Client
npx prisma generate
```

### Health Check Commands

```bash
# Check server is running
npm run health

# Or manually
curl http://localhost:4000/graphql?query=%7B__typename%7D

# Expected: {"data":{"__typename":"Query"}}
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

---

## Learn More

- [Express.js Documentation](https://expressjs.com/)
- [Apollo Server Documentation](https://www.apollographql.com/docs/apollo-server/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [GraphQL Documentation](https://graphql.org/learn/)
- [Vitest Documentation](https://vitest.dev/)

---

**Part of the CarePulse Healthcare Management System**

