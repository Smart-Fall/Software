# SmartFall - Advanced Fall Detection System

A modern fall detection and health monitoring system built with **Next.js**, **TypeScript**, and **Prisma ORM**.

## What's New

- **Next.js 16** - Modern React framework with App Router
- **TypeScript** - Full type safety across the application
- **Prisma ORM** - Type-safe database access with PostgreSQL
- **JWT Authentication** - Secure session management
- **React 19** - Latest React features and performance improvements
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first styling

## Project Structure

```
smartfall-nextjs/
├── app/                           # Next.js App Router directory
│   ├── layout.tsx                 # Root layout component
│   ├── page.tsx                   # Home page
│   ├── globals.css                # Global styles
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client instance
│   │   ├── auth.js                # Authentication utilities
│   │   └── types.ts               # TypeScript type definitions
│   ├── api/                       # API routes
│   │   ├── auth/                  # Authentication endpoints
│   │   ├── caregiver/             # Caregiver endpoints
│   │   ├── patients/              # Patient endpoints
│   │   └── me/                    # Current user endpoint
│   ├── signup/                    # Sign-up pages
│   ├── login/                     # Login pages
│   ├── user-dashboard/            # Patient dashboard
│   ├── caregiver-dashboard/       # Caregiver dashboard
│   └── navbar/                    # Navigation component
├── prisma/
│   └── schema.prisma              # Database schema definition
├── components/                    # Reusable UI components
│   └── ui/                        # shadcn/ui components
├── public/                        # Static assets
├── .env                           # Environment variables (not in git)
├── .env.example                   # Environment template
├── next.config.js                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS config
└── package.json                   # Dependencies and scripts
```

## Getting Started

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

| Command                   | Description                       |
| ------------------------- | --------------------------------- |
| `npm run dev`             | Start development server          |
| `npm run build`           | Build for production              |
| `npm run start`           | Start production server           |
| `npm run lint`            | Run ESLint                        |
| `npm run prisma:generate` | Generate Prisma Client            |
| `npm run prisma:push`     | Push schema changes to database   |
| `npm run prisma:migrate`  | Create a new migration            |
| `npm run prisma:studio`   | Open Prisma Studio (database GUI) |

## Database Schema

The application uses **Prisma ORM** with PostgreSQL. Key models:

- **User** - Base user accounts (patients and caregivers)
- **Session** - Authentication sessions
- **Patient** - Patient-specific health data and risk scores
- **Caregiver** - Caregiver profiles and specializations
- **CaregiverPatient** - Patient-caregiver assignments
- **Fall** - Fall incident records

View the complete schema in `prisma/schema.prisma`.

## Key Features

- **User Authentication** - Secure JWT-based login and signup
- **Role-Based Access** - Separate interfaces for patients and caregivers
- **Patient Management** - Caregivers can view and manage assigned patients
- **Health Monitoring** - Track patient risk scores and fall incidents
- **Dashboard Analytics** - Real-time statistics and patient health metrics
- **Responsive Design** - Mobile-first responsive layout
- **Type Safety** - Full TypeScript coverage with Prisma-generated types

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### User

- `GET /api/me` - Get current user info

### Caregiver

- `GET /api/caregiver/current` - Get caregiver profile
- `GET /api/caregiver/patients` - Get assigned patients
- `GET /api/caregiver/stats` - Get dashboard statistics

### Patients

- `GET /api/patients/unassigned` - Get unassigned patients
- `POST /api/caregiver-patients` - Assign patient to caregiver

## Technology Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **jose** - JWT authentication

### Development Tools

- **Prisma Studio** - Visual database editor
- **ESLint** - Code linting
- **TypeScript** - Static type checking

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

## Troubleshooting

### "Can't reach database server"

- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### "Type errors with Prisma"

```bash
npm run prisma:generate
```

### "Schema out of sync"

```bash
npm run prisma:push
```

## Environment Variables

Required environment variables in `.env`:

```env
# Database connection
DATABASE_URL="postgresql://username:password@localhost:5432/smartfall_db"

# JWT secret for session authentication
JWT_SECRET="your-secret-key-change-in-production"

# Application environment
NODE_ENV="development"
```

**Important**: Never commit `.env` to version control. Use `.env.example` as a template.

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

## License

ISC
