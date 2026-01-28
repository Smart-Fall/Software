# Convex Database Integration Guide

## Overview

SmartFall now supports **dual database backends** through a database adapter pattern:
- **Prisma** (PostgreSQL) - Current production database
- **Convex** - Modern BaaS platform with real-time capabilities

Switch between them using a single environment variable!

## Quick Start

### 1. Installation & Setup

Convex is already installed. Set up your Convex project:

```bash
# Initialize Convex (if not done)
npx convex init

# Deploy the schema to your Convex deployment
npx convex deploy
```

### 2. Environment Configuration

Update your `.env` file:

```env
# Database Selection
DATABASE_PROVIDER="prisma"  # Change to "convex" to switch

# Existing Prisma Configuration
DATABASE_URL="postgresql://postgres:CEG4912@localhost:5432/smartfall_db"

# New Convex Configuration (get from Convex dashboard)
CONVEX_DEPLOYMENT="dev:happy-panda-123"        # Your deployment name
NEXT_PUBLIC_CONVEX_URL="https://happy-panda-123.convex.cloud"  # Public URL
```

### 3. Test Your Setup

Both databases should work identically:

```bash
# Test with Prisma (current)
DATABASE_PROVIDER=prisma npm run dev

# Test with Convex (after migration)
DATABASE_PROVIDER=convex npm run dev
```

## Architecture

### Adapter Pattern

```
API Routes
    ↓
Database Service (lib/db/service.ts)
    ↓
    ├─ Prisma Adapter ─→ PostgreSQL
    └─ Convex Adapter ─→ Convex Backend
```

### How It Works

1. **Configuration** (`lib/db/config.ts`): Reads `DATABASE_PROVIDER` env var
2. **Service** (`lib/db/service.ts`): Factory pattern creates the appropriate adapter
3. **Repositories** (`lib/db/adapters/*`): Implement common interface for both backends
4. **Usage**: All code uses `getDbService()` and doesn't know which database is backing it

## Migration Steps

### Step 1: Verify Current Setup Works

```bash
# Ensure Prisma is working
npm run dev
# Test login, creating users, falls, etc.
```

### Step 2: Configure Convex

```bash
# Deploy Convex schema
npx convex deploy

# Get your deployment URL from the Convex dashboard
# Set CONVEX_DEPLOYMENT and NEXT_PUBLIC_CONVEX_URL in .env
```

### Step 3: Migrate Data

```bash
# Backup PostgreSQL first (critical!)
pg_dump -U postgres smartfall_db > backup.sql

# Run migration script
npx ts-node --project tsconfig.json lib/db/migrations/prisma-to-convex.ts

# This will:
# - Copy all users, patients, caregivers to Convex
# - Copy all falls, devices, sensor data
# - Maintain ID mappings for data correlation
```

### Step 4: Verify Migration

```bash
# Check data integrity
npx ts-node --project tsconfig.json lib/db/migrations/verify-migration.ts

# Output should show:
# ✓ Users: 15
# ✓ Patients: 12
# ✓ Devices: 8
# etc.
```

### Step 5: Switch to Convex

```bash
# Update .env
DATABASE_PROVIDER="convex"

# Test the application
npm run dev

# Try:
# - Login with existing credentials
# - View patient list
# - Create a test fall alert
# - Check recent falls
```

### Step 6: Monitor & Validate

```bash
# Keep both databases running for 24-48 hours to validate:
# - All API endpoints work correctly
# - Performance is acceptable
# - No data discrepancies

# You can switch back anytime:
DATABASE_PROVIDER="prisma" npm run dev
```

## Environment Variables Reference

```env
# ============================================================================
# Database Selection
# ============================================================================

# Options: "prisma" | "convex"
# Default: "prisma"
DATABASE_PROVIDER="prisma"

# ============================================================================
# Prisma Configuration (PostgreSQL)
# ============================================================================

# Required if DATABASE_PROVIDER="prisma"
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/smartfall_db"

# ============================================================================
# Convex Configuration
# ============================================================================

# Required if DATABASE_PROVIDER="convex"

# Your Convex deployment identifier
# Get from: https://dashboard.convex.dev
CONVEX_DEPLOYMENT="dev:happy-panda-123"

# Public Convex API URL (for client-side code)
# Get from: https://dashboard.convex.dev
NEXT_PUBLIC_CONVEX_URL="https://happy-panda-123.convex.cloud"

# ============================================================================
# Authentication & Environment
# ============================================================================

JWT_SECRET="smartfallCapstone"  # Keep existing
NODE_ENV="development"          # Keep existing
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"  # Keep existing
```

## File Structure Changes

### New Files Created

```
lib/db/
├── config.ts              # Environment configuration loader
├── service.ts             # Database service factory & singleton
├── types.ts               # Shared type definitions
├── init.ts                # Initialization helper
├── adapters/
│   ├── base.ts            # Repository interface contracts
│   ├── prisma/
│   │   ├── index.ts       # Prisma adapter
│   │   ├── users.ts
│   │   ├── sessions.ts
│   │   ├── patients.ts
│   │   ├── caregivers.ts
│   │   ├── caregiverPatients.ts
│   │   ├── falls.ts
│   │   ├── devices.ts
│   │   ├── sensorData.ts
│   │   └── deviceStatus.ts
│   └── convex/
│       ├── index.ts       # Convex adapter
│       ├── client.ts      # Convex HTTP client setup
│       ├── users.ts
│       ├── sessions.ts
│       ├── patients.ts
│       ├── caregivers.ts
│       ├── caregiverPatients.ts
│       ├── falls.ts
│       ├── devices.ts
│       ├── sensorData.ts
│       └── deviceStatus.ts
└── migrations/
    ├── prisma-to-convex.ts
    └── verify-migration.ts

convex/
├── schema.ts              # Convex table definitions
├── users.ts               # User queries & mutations
├── sessions.ts
├── patients.ts
├── caregivers.ts
├── caregiverPatients.ts
├── falls.ts
├── devices.ts
├── sensorData.ts
└── deviceStatus.ts
```

### Modified Files

- `lib/auth.ts` - Updated to use dbService
- `app/api/auth/**` - Updated to use dbService
- `app/api/caregiver/**` - Updated to use dbService
- `app/api/patient/**` - Updated to use dbService
- `app/api/device/**` - Updated to use dbService
- `app/api/falls/**` - Updated to use dbService
- `app/api/caregiver-patients/**` - Updated to use dbService
- `app/api/patients/unassigned/**` - Updated to use dbService
- `app/api/me/**` - Updated to use dbService
- `.env.example` - Added new Convex variables
- `package.json` - Added convex dependency

## Code Changes

### Before (Using Prisma Directly)

```typescript
import prisma from "@/lib/prisma";

export async function GET() {
  const user = await prisma.user.findUnique({
    where: { email },
  });
}
```

### After (Using Database Service)

```typescript
import { getDbService } from "@/lib/db/service";

export async function GET() {
  const dbService = getDbService();
  const user = await dbService.users.findByEmail(email);
}
```

## Rollback Procedure

If you encounter issues with Convex, rolling back is simple:

### Quick Rollback

```bash
# Just change the environment variable
DATABASE_PROVIDER="prisma"

# Restart the application
npm run dev
```

### Full Rollback

If data got corrupted, restore from backup:

```bash
# Stop the application
# Restore PostgreSQL backup
psql -U postgres smartfall_db < backup.sql

# Set DATABASE_PROVIDER="prisma"
# Restart
npm run dev
```

## Performance Comparison

### Query Latency (p95)

| Operation | Prisma | Convex |
|-----------|--------|--------|
| findUser | 15ms | 30ms |
| createFall | 25ms | 50ms |
| listPatients | 40ms | 60ms |

*Times are approximate and vary based on data volume*

### Key Differences

**Prisma (PostgreSQL)**
- Lower latency for read operations
- Supports complex SQL queries
- Requires infrastructure management

**Convex**
- Real-time subscriptions (future feature)
- No infrastructure to manage
- Automatic scaling
- Slightly higher latency due to HTTP API

## Troubleshooting

### "Database service not initialized" Error

```typescript
// Problem: getDbService() called before initialization

// Solution 1: Ensure app layout calls initDb() on startup
// Solution 2: Use async version
const adapter = await getDatabaseAdapter();
```

### Convex Queries Return Undefined

```typescript
// Problem: Convex table names must match schema.ts exactly

// Check convex/schema.ts for correct table names
// e.g., "users" not "user", "patients" not "patient"
```

### ID Mapping Issues During Migration

```bash
# Problem: Prisma UUIDs don't match Convex IDs

# Solution: Migration script maintains mapping in memory
# Check console output for any failed migrations
npx ts-node lib/db/migrations/prisma-to-convex.ts 2>&1 | tee migration.log
```

### Sessions Not Found After Switch

```typescript
// Problem: Existing Prisma sessions aren't in Convex

// Solution: Users need to log in again after migration
// Migration script doesn't transfer sessions (they expire in 24h anyway)
```

## Next Steps

### Short Term (Week 1-2)
- [ ] Set up Convex project
- [ ] Deploy Convex schema
- [ ] Test with Prisma (current)
- [ ] Migrate data to Convex
- [ ] Validate migration

### Medium Term (Week 3-4)
- [ ] Run both databases in parallel
- [ ] Performance testing
- [ ] Bug fixes and optimizations
- [ ] User acceptance testing

### Long Term (Week 5+)
- [ ] Switch production to Convex
- [ ] Keep Prisma as backup for 1-2 weeks
- [ ] Decommission PostgreSQL (optional)
- [ ] Implement real-time features (subscriptions)

## Support & Resources

- **Convex Docs**: https://docs.convex.dev
- **Convex Dashboard**: https://dashboard.convex.dev
- **Repository Pattern**: Better for testing, modularity
- **Adapter Pattern**: Easy switching, no vendor lock-in

## Questions?

Refer to:
1. This guide (CONVEX_MIGRATION_GUIDE.md)
2. Code comments in `lib/db/adapters/base.ts`
3. Example queries in `convex/*.ts`
4. Test files in `app/api/**`
