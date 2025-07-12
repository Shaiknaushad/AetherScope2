# replit.md

## Overview

AetherScope is a comprehensive full-stack dashboard application built with React, Express, and PostgreSQL. It provides multiple domain-specific modules including a Home dashboard with knowledge graph triplets, Health, Finance, Personal, B2B, and Government management tools. The application features a modern, responsive design using shadcn/ui components and implements a clean architectural pattern with separate client and server directories. The Home page integrates with Supabase to display and manage knowledge graph triplets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **Session Management**: Connect-pg-simple for PostgreSQL session store
- **Development**: tsx for TypeScript execution in development

### Directory Structure
```
├── client/          # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components for each module
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions and configurations
├── server/          # Express backend application
│   ├── routes.ts    # API route definitions
│   ├── storage.ts   # Database abstraction layer
│   └── vite.ts      # Vite integration for development
├── shared/          # Shared code between client and server
│   └── schema.ts    # Database schema and validation
└── migrations/      # Database migration files
```

## Key Components

### Database Schema
The application uses Drizzle ORM with PostgreSQL and defines schemas for:
- **Users**: Basic user authentication
- **Triplets**: Knowledge graph triplets with subject-predicate-object structure (Supabase integration)
- **Health Module**: Health records, appointments, medications
- **Finance Module**: Transactions, budgets
- **Personal Module**: Tasks, goals, mood logs
- **B2B Module**: Leads, invoices
- **Government Module**: Applications, documents, complaints

### API Layer
- RESTful API endpoints organized by module
- Consistent error handling middleware
- Request/response logging
- Input validation using Zod schemas
- Mock user authentication (userId: 1)

### UI Components
- Comprehensive component library from shadcn/ui
- Custom StatCard component for dashboard metrics
- Layout component with sidebar navigation
- Responsive design with mobile considerations
- Dark/light theme support via CSS variables

### State Management
- TanStack Query for server state caching and synchronization
- Custom query client configuration
- Optimistic updates for better UX
- Error handling and loading states

## Data Flow

1. **Client Requests**: React components use TanStack Query hooks to fetch data
2. **API Calls**: Queries are made to Express.js API endpoints
3. **Database Operations**: Express routes use the storage abstraction layer
4. **Database Queries**: Storage layer executes Drizzle ORM queries against PostgreSQL
5. **Response Handling**: Data flows back through the layers with proper error handling
6. **UI Updates**: React components automatically update when data changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **@supabase/supabase-js**: Supabase client for knowledge graph integration
- **cohere-ai**: AI-powered text processing and triplet extraction
- **multer**: File upload handling middleware
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **wouter**: Lightweight React router
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for Node.js
- **drizzle-kit**: Database migration tool
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds the React application to `dist/public`
2. **Backend Build**: esbuild bundles the Express server to `dist/index.js`
3. **Database Migrations**: Drizzle Kit manages database schema changes

### Environment Setup
- **Development**: Uses Vite dev server with HMR and Express API
- **Production**: Serves static files from Express with bundled server code
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Scripts
- `npm run dev`: Start development server with hot reload
- `npm run build`: Build both client and server for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes
- `npm run check`: TypeScript type checking

The application is designed to be deployed on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL database support.

## Recent Changes

### January 2025
- **Enhanced Health Dashboard**: Implemented specialized healthcare features including:
  - AI diagnosis tracking with blockchain-like logging for medical decisions
  - Patient consent auditing system with verification workflows
  - Treatment action logging with transparency and accountability
  - Healthcare log analysis with AI-powered insights for medical events
  - Real-time medication tracking and appointment management
- **Enhanced Finance Dashboard**: Built comprehensive financial management tools including:
  - Real-time expense tracking with categorization and payment methods
  - Crypto/stock portfolio monitoring with live gain/loss tracking
  - Budget management with progress indicators and overspending alerts
  - Financial log analysis for transaction patterns and market activities
  - Investment portfolio tracker for stocks, crypto, ETFs, and bonds
- **Backend Enhancements**: Extended storage interface and API routes to support:
  - AI diagnosis, patient consent, and treatment action management
  - Real-time expense tracking and portfolio item management
  - Specialized log analysis for healthcare and financial domains
- **UI/UX Improvements**: Added comprehensive forms, dialogs, and real-time displays
- **Data Integrity**: Maintained existing Home and Log Tracker functionality while adding new features

### January 2025 (Latest Updates)
- **External API Integration**: Successfully configured and activated Supabase and Cohere AI services
- **Environment Setup**: Properly configured API keys for COHERE_API_KEY, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY
- **Supabase Live Connection**: Home dashboard now connects to live Supabase database with 75+ existing triplets
- **Cohere AI Active**: Log analysis and triplet extraction using Cohere AI text processing is fully functional
- **Full Stack Deployment**: All components (Health, Finance, Home, Log Tracker) working with external services

### December 2024
- **Added Home Dashboard**: Created a new home page featuring knowledge graph triplets integration
- **Supabase Integration**: Integrated Supabase for managing triplets data with real-time functionality
- **Navigation Updates**: Added Home tab as the default landing page in the sidebar navigation
- **UI Components**: Added Input, Label, and Textarea components for form handling
- **Environment Configuration**: Set up environment variables for Supabase connection (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- **Triplets Management**: Implemented full CRUD operations for knowledge graph triplets with search functionality
- **Table Structure Fix**: Updated to work with actual Supabase table structure (Triplets table with proper case sensitivity)