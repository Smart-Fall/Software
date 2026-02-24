# SmartFall - Advanced Fall Detection System

A modern fall detection and health monitoring system built with **Next.js**, **TypeScript**, and **Prisma ORM**.

## Live Demo

The SmartFall application is live and accessible at: **https://smartfall.vercel.app/**

## What's New

- **Next.js 16** - Modern React framework with App Router
- **TypeScript** - Full type safety across the application
- **Dual Database Support** - Switch between Prisma (PostgreSQL) and Convex via environment variable
- **Database Adapter Pattern** - Unified interface for multiple database backends
- **Health Monitoring Dashboard** - User dashboard with health scores, fall statistics, and analytics
- **JWT Authentication** - Secure session management
- **React 19** - Latest React features and performance improvements
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling
- **Faker.js** - Random test data generation for development

## Project Structure

```
.
├── app/                                  # Next.js App Router directory
│   ├── layout.tsx                        # Root layout component
│   ├── page.tsx                          # Home page
│   ├── globals.css                       # Global styles
│   ├── lib/
│   │   ├── prisma.ts                     # Prisma client instance
│   │   ├── auth.ts                       # Authentication utilities
│   │   ├── db/
│   │   │   ├── service.ts                # Database service factory
│   │   │   ├── config.ts                 # Database configuration
│   │   │   ├── types.ts                  # Shared type definitions
│   │   │   ├── adapters/
│   │   │   │   ├── base.ts               # Repository interfaces
│   │   │   │   ├── prisma/               # Prisma adapter implementations
│   │   │   │   └── convex/               # Convex adapter implementations
│   │   │   └── migrations/               # Database migration scripts
│   │   └── types.ts                      # TypeScript type definitions
│   ├── api/                              # API routes
│   │   ├── auth/                         # Authentication endpoints
│   │   ├── user/                         # User dashboard endpoints
│   │   ├── caregiver/                    # Caregiver endpoints
│   │   ├── patient/                      # Patient endpoints
│   │   ├── falls/                        # Fall incident endpoints
│   │   └── health/                       # Health check endpoint
│   ├── signup/                           # Sign-up page with multi-step form
│   ├── login/                            # Login page
│   ├── user-dashboard/                   # Patient dashboard
│   ├── caregiver-dashboard/              # Caregiver dashboard
│   └── navbar/                           # Navigation component
├── convex/                               # Convex backend-as-service functions
│   ├── schema.ts                         # Convex table definitions
│   ├── users.ts                          # User queries/mutations
│   ├── patients.ts                       # Patient queries/mutations
│   ├── caregivers.ts                     # Caregiver queries/mutations
│   ├── falls.ts                          # Fall queries/mutations
│   ├── healthLogs.ts                     # Health log queries/mutations
│   ├── devices.ts                        # Device queries/mutations
│   └── _generated/                       # Auto-generated Convex API types
├── prisma/
│   ├── schema.prisma                     # Prisma schema definition
│   └── migrations/                       # Database migration history
├── components/                           # Reusable UI components
│   ├── ui/                               # shadcn/ui components
│   └── dashboard/                        # Dashboard-specific components
├── public/                               # Static assets
├── lib/
│   ├── utils.ts                          # Utility functions
│   └── hooks/                            # Custom React hooks
├── .env                                  # Environment variables (not in git)
├── .env.example                          # Environment template
├── CONVEX_MIGRATION_GUIDE.md             # Convex setup and migration guide
├── next.config.js                        # Next.js configuration
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.js                    # Tailwind CSS config
└── package.json                          # Dependencies and scripts
```

## Getting Started

### Quick Access

To access the application immediately, visit: **https://smartfall.vercel.app/**

For local development, follow the installation steps below.

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+

### Installation

```bash
# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/smartfall_db"
JWT_SECRET="your-secret-key-change-in-production"
NODE_ENV="development"
```

### Database Setup

```bash
# Sync Prisma schema with your database
npm run prisma:push

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

### Development

```bash
# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Production Build

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Available Scripts

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start development server                 |
| `npm run build`           | Build for production                     |
| `npm run start`           | Start production server                  |
| `npm run lint`            | Run ESLint                               |
| `npm run tsc`             | Run TypeScript compiler (type checking)  |
| `npm run prisma:generate` | Generate Prisma Client                   |
| `npm run prisma:push`     | Push schema changes to database          |
| `npm run prisma:migrate`  | Create a new migration                   |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI)        |

## Database Schema

The application supports **dual database backends**:
- **Prisma ORM** with PostgreSQL (default)
- **Convex** BaaS (modern serverless alternative)

Key models (available in both backends):

- **User** - Base user accounts (patients and caregivers)
- **Session** - Authentication sessions
- **Patient** - Patient-specific health data and risk scores
- **Caregiver** - Caregiver profiles, specializations, and facility name
- **CaregiverPatient** - Patient-caregiver assignments
- **Fall** - Fall incident records with location and severity
- **HealthLog** - Historical health score tracking
- **Device** - IoT fall detection device information
- **SensorData** - Time-series sensor readings (accelerometer, gyroscope)
- **DeviceStatus** - Device connectivity and battery status

View the Prisma schema in `prisma/schema.prisma` or Convex schema in `convex/schema.ts`.

## Key Features

### Authentication & User Management
- **Multi-Step Signup** - Guided registration process with role-specific fields
- **Secure JWT Authentication** - Session-based login with secure tokens
- **Role-Based Access Control** - Separate dashboards for patients and caregivers
- **Facility Management** - Caregivers can specify facility/organization name

### Patient Dashboard
- **Health Monitoring** - Real-time health scores and risk assessment
- **Fall Analytics** - Historical fall incident tracking with statistics
- **Report Generation** - Weekly, monthly, and yearly health/fall reports
- **Caregiver Assignment** - View assigned caregiver details and contact info
- **Data Visualization** - Charts for trend analysis and health tracking

### Caregiver Dashboard
- **Patient Management** - View and manage assigned patients
- **Health Metrics** - Monitor risk scores and medical conditions
- **Fall Alerts** - Real-time notifications for fall incidents
- **Device Management** - Track patient device status and battery levels
- **Analytics** - Patient statistics and health trends

### General Features
- **Dual Database Support** - Seamlessly switch between Prisma and Convex
- **Type-Safe Backend** - Repository pattern with TypeScript interfaces
- **Responsive Design** - Mobile-first responsive layout
- **Development Tools** - Faker.js for random test data generation
- **Performance** - Optimized queries with proper indexing

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user (supports facilityName for caregivers, initialHealthScore for patients)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User Dashboard

- `GET /api/user/current` - Get current patient info (name, risk score, medical conditions)
- `GET /api/user/caregiver` - Get assigned caregiver details
- `GET /api/user/stats` - Get fall statistics (total, weekly, monthly, yearly)
- `GET /api/user/reports/weekly` - Get last 7 days of health/fall data
- `GET /api/user/reports/monthly` - Get last 4 weeks of health/fall data
- `GET /api/user/reports/yearly` - Get last 12 months of health/fall data

### Caregiver

- `GET /api/caregiver/current` - Get caregiver profile
- `GET /api/caregiver/patients` - Get assigned patients
- `GET /api/caregiver/stats` - Get dashboard statistics

### Patients

- `GET /api/patients/unassigned` - Get unassigned patients
- `POST /api/caregiver-patients` - Assign patient to caregiver

### Falls & Health

- `GET /api/falls/recent` - Get recent fall incidents
- `POST /api/falls` - Report new fall incident
- `GET /api/me` - Get current user info

## Technology Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Chart and analytics visualization
- **Sonner** - Toast notifications
- **Faker.js** - Random test data generation

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access (default)
- **Convex** - Modern BaaS alternative (optional)
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **jose** - JWT authentication

### Database Adapter Pattern

- **Dual database support** - Switch between Prisma and Convex via `DATABASE_PROVIDER` env var
- **Repository interfaces** - Unified contract for both backends
- **Type-safe migrations** - Consistent types across implementations

### Development Tools

- **Prisma Studio** - Visual database editor
- **Convex Dashboard** - BaaS management and monitoring
- **ESLint** - Code linting
- **TypeScript** - Static type checking with strict mode

## Prisma Usage Examples

### Query a User

```typescript
const user = await prisma.user.findUnique({
  where: { email: "user@example.com" },
});
```

### Create a Patient

```typescript
const patient = await prisma.patient.create({
  data: {
    userId: user.id,
    riskScore: 0,
    isHighRisk: false,
  },
});
```

### Query with Relations

```typescript
const caregiver = await prisma.caregiver.findUnique({
  where: { id: caregiverId },
  include: {
    user: true,
    caregiverPatients: {
      include: {
        patient: {
          include: { user: true },
        },
      },
    },
  },
});
```

## Database Adapter Pattern

SmartFall uses a **repository pattern** to support multiple database backends:

```typescript
// API routes use getDbService() - works with either database
const dbService = getDbService();
const patient = await dbService.patients.findByUserId(userId);
const healthLogs = await dbService.healthLogs.findRecent(patientId, 10);
```

Switch backends with one environment variable:
```env
DATABASE_PROVIDER="prisma"  # or "convex"
```

### Adapter Architecture

```
API Routes
    ↓
Database Service (lib/db/service.ts)
    ↓
    ├─ Prisma Adapter ──────→ PostgreSQL
    └─ Convex Adapter ──────→ Convex Backend
```

See `CONVEX_MIGRATION_GUIDE.md` for complete migration and setup details.

## Development Features

### Faker.js Integration

During signup, generate random test accounts:

- **Patient Data**: Random name, email, DOB (50-85 years old), health conditions, initial health score
- **Caregiver Data**: Random name, email, facility name, specialization, license number
- **Static Password**: Always `password123` for easy testing

Click "Fill as User" or "Fill as Caregiver" in development mode to auto-populate the form with random data.

## Development Workflow

### Database Changes

1. Update `prisma/schema.prisma`
2. Run `npm run prisma:push` to sync with database
3. Prisma Client is automatically regenerated

### Adding New Features

1. Create API route in `app/api/`
2. Use Prisma Client for database operations
3. TypeScript types are auto-generated from Prisma schema

### Debugging

- Use `npm run prisma:studio` to inspect database
- Check server logs in terminal
- Use browser DevTools for frontend debugging

## Registration Process

The signup flow is role-specific and collects relevant data:

### Patient Registration (4 Steps)
1. **Basic Info** - Name, DOB, email, password, phone
2. **Account Type** - Confirm "Patient/User" selection
3. **Medical Info** - Emergency contact, medical conditions, initial health score
4. **Confirmation** - Review and submit

### Caregiver Registration (4 Steps)
1. **Basic Info** - Name, DOB, email, password, phone
2. **Account Type** - Confirm "Caregiver" selection
3. **Professional Info** - Facility name, specialization, license number (optional)
4. **Confirmation** - Review and submit

### Development Mode
- Click "Fill as User" or "Fill as Caregiver" to auto-populate with random data
- Uses Faker.js for realistic, unique test accounts
- Password always defaults to `password123` for testing

### API Integration
- `POST /api/auth/signup` handles both patient and caregiver flows
- Automatically creates:
  - User account with secure password hashing
  - Patient/Caregiver profile with role-specific data
  - Initial HealthLog entry for patients (default score: 75)

## Troubleshooting

### "Can't reach database server"

- Ensure PostgreSQL is running (if using Prisma)
- Check `DATABASE_URL` in `.env` for Prisma
- Verify database exists: `psql -U postgres -l`

### "Convex API errors"

- Ensure `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` are set
- Check Convex dashboard for deployment status
- Run `npx convex deploy` to sync schema
- Verify schema.ts matches data you're querying

### "Type errors with Prisma"

```bash
npm run prisma:generate
```

### "TypeScript compilation errors"

```bash
npm run tsc
```

### "Schema out of sync"

```bash
npm run prisma:push
```

### "HealthLog not found" (Convex)

- Run `npx convex codegen` to regenerate types
- Ensure `convex/healthLogs.ts` exists with queries/mutations
- Check that `schema.ts` includes healthLogs table

### "Database provider not switching"

- Verify `DATABASE_PROVIDER` is set in `.env`
- Valid values: `"prisma"` or `"convex"`
- Restart dev server after changing: `npm run dev`

### "Faker import errors"

```bash
npm install
npm run tsc
```

## Environment Variables

Required environment variables in `.env`:

```env
# ============================================================================
# Database Selection
# ============================================================================

# Options: "prisma" (default) | "convex"
DATABASE_PROVIDER="prisma"

# ============================================================================
# Prisma Configuration (PostgreSQL)
# ============================================================================

# Required if DATABASE_PROVIDER="prisma"
DATABASE_URL="postgresql://username:password@localhost:5432/smartfall_db"

# ============================================================================
# Convex Configuration
# ============================================================================

# Required if DATABASE_PROVIDER="convex"
# Get from: https://dashboard.convex.dev
CONVEX_DEPLOYMENT="dev:your-deployment-name"
NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"

# ============================================================================
# Authentication & General
# ============================================================================

# JWT secret for session authentication
JWT_SECRET="your-secret-key-change-in-production"

# Application environment
NODE_ENV="development"

# CORS allowed origins
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001"
```

**Important**: Never commit `.env` to version control. Use `.env.example` as a template.

See `CONVEX_MIGRATION_GUIDE.md` for detailed Convex setup instructions.

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Environment Setup for Production

- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure production database URL
- Enable SSL for database connections

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## Documentation

- **`CONVEX_MIGRATION_GUIDE.md`** - Detailed guide for Convex setup, migration, and deployment
- **`prisma/schema.prisma`** - Complete database schema with all models and relationships
- **`convex/schema.ts`** - Convex table definitions and indexes
- **API Documentation** - See "API Endpoints" section above for available routes

## Next Steps

### For Development
1. Set up local PostgreSQL database or Convex project
2. Configure `.env` with database credentials
3. Run `npm install` and `npm run dev`
4. Use "Fill as User/Caregiver" buttons for test data

### For Production
1. Follow deployment guide for Vercel or Docker
2. Use strong `JWT_SECRET`
3. Configure production database URL
4. Set `NODE_ENV=production`
5. Enable HTTPS and SSL connections

### Feature Roadmap
- [ ] Real-time fall alerts via WebSockets
- [ ] Mobile app integration
- [ ] Advanced analytics and ML predictions
- [ ] Video call between patient and caregiver
- [ ] Medication reminders
- [ ] Integration with wearable devices

## License

ISC
