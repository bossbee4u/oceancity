# Ocean City Transportation Management System - Lovable AI Documentation

## Project Overview
Ocean City is a comprehensive transportation management system built for logistics companies to manage drivers, trucks, trailers, shipments, and companies. The application uses **Next.js as the frontend framework** with **Supabase as the complete backend solution**, providing role-based authentication, real-time dashboard analytics, and complete CRUD operations for all entities. This architecture separates concerns with Next.js handling the user interface and Supabase managing all backend operations including database, authentication, real-time subscriptions, and file storage.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **UI Library**: Shadcn UI Components
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Authentication**: Supabase Auth
- **PWA**: Next.js PWA support

### Backend (Supabase - Complete Backend Solution)
- **Backend-as-a-Service**: Supabase (handles all backend operations)
- **Database**: Supabase PostgreSQL with Row Level Security
- **API**: Auto-generated REST API and GraphQL
- **Authentication**: Supabase Auth with social providers
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage for file uploads
- **Database Client**: Supabase JavaScript Client
- **Validation**: Database constraints + Zod (client-side)

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Build Tool**: Next.js built-in

## Database Schema

### Supabase Database Structure
The application uses Supabase PostgreSQL with Row Level Security (RLS) enabled for all tables. Authentication is handled by Supabase Auth, eliminating the need for custom password management.

### Core Tables

#### 1. profiles (extends auth.users)
```sql
- id: UUID PRIMARY KEY (references auth.users.id)
- username: VARCHAR UNIQUE
- full_name: VARCHAR
- role: VARCHAR ('admin', 'manager')
- created_at: TIMESTAMP WITH TIME ZONE
- updated_at: TIMESTAMP WITH TIME ZONE

-- RLS Policies:
-- Users can read their own profile
-- Admins can read/update all profiles
```

#### 2. drivers
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- code: VARCHAR UNIQUE (auto-generated)
- full_name: VARCHAR
- phone: VARCHAR (optional)
- gatepass: DATE (optional)
- waqala: DATE (optional) 
- truck_id: UUID (FK to trucks.id, optional)
- trailer_id: UUID (FK to trailers.id, optional)
- company_id: UUID (FK to companies.id, optional)
- status: VARCHAR ('active', 'vacation', 'cancelled')
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- RLS Policies:
-- Authenticated users can read all drivers
-- Managers and admins can create/update/delete drivers
```

#### 3. companies
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- code: VARCHAR UNIQUE (auto-generated) format (CO01, CO02, ...)
- short_name: VARCHAR
- full_name: VARCHAR
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- RLS Policies:
-- Authenticated users can read all companies
-- Managers and admins can create/update/delete companies
```

#### 4. trucks
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- truck_number: VARCHAR UNIQUE
- type: VARCHAR
- model: INTEGER (year)
- expiry_date: DATE
- status: VARCHAR ('active', 'empty')
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- RLS Policies:
-- Authenticated users can read all trucks
-- Managers and admins can create/update/delete trucks
```

#### 5. trailers
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- trailer_number: VARCHAR UNIQUE
- type: VARCHAR ('Box', 'Flatbed', 'Curtainside', 'TIR Box', 'TIR BL', 'Balmer', 'Reefer', 'Reefer TIR')
- model: INTEGER (year)
- expiry_date: DATE
- status: VARCHAR ('active', 'empty')
- color: VARCHAR ('red', 'blue', 'white', 'black', 'silver', 'orange', 'yellow')
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- RLS Policies:
-- Authenticated users can read all trailers
-- Managers and admins can create/update/delete trailers
```

#### 6. shipments
```sql
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- doc_no: VARCHAR UNIQUE
- loading_date: DATE
- driver_id: UUID (FK to drivers.id)
- truck_id: UUID (FK to trucks.id, optional)
- trailer_id: UUID (FK to trailers.id, optional)
- company_id: UUID (FK to companies.id)
- customer_id: UUID (FK to companies.id optional)
- origin: VARCHAR
- destination: VARCHAR
- amount: DECIMAL (optional)
- gross_weight: DECIMAL (optional)
- net_weight: DECIMAL (optional)
- status: VARCHAR ('waiting', 'submitted')
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

-- RLS Policies:
-- Authenticated users can read all shipments
-- Managers and admins can create/update/delete shipments
-- Users can only see shipments related to their assigned companies (future enhancement)
```

## Pages & Routes

### Public Pages
1. **Home** (`/`) - Landing page with company information
2. **Transport Services** (`/transport`) - Services overview
3. **Used Trucks** (`/used-trucks`) - Used truck listings
4. **Spare Parts** (`/spare-parts`) - Spare parts catalog
5. **Contact** (`/contact`) - Contact information
6. **Login** (`/login`) - User authentication
7. **Signup** (`/signup`) - User registration

### Protected Pages (Require Authentication)
1. **Dashboard** (`/dashboard`) - Main analytics dashboard
2. **Drivers** (`/drivers`) - Driver management
3. **Companies** (`/companies`) - Company management
4. **Trucks** (`/trucks`) - Truck fleet management
5. **Trailers** (`/trailers`) - Trailer fleet management
6. **Shipments** (`/shipments`) - Shipment management
7. **Admin Panel** (`/admin`) - Admin-only features (Admin role required)

## Data Access Patterns

### Supabase Client Operations
The application uses Supabase JavaScript client for direct database operations with automatic Row Level Security enforcement.

### Authentication (Supabase Auth)
- `supabase.auth.signInWithPassword()` - User login
- `supabase.auth.signUp()` - User registration
- `supabase.auth.signOut()` - User logout
- `supabase.auth.getSession()` - Get current session
- `supabase.auth.onAuthStateChange()` - Listen to auth changes

### Dashboard Operations
- `supabase.from('drivers').select('count')` - Get driver statistics
- `supabase.from('trucks').select('*').lt('expiry_date', date)` - Get maintenance alerts
- `supabase.from('shipments').select('*').order('created_at').limit(5)` - Get recent shipments

### Drivers Operations
- `supabase.from('drivers').select('*')` - List all drivers
- `supabase.from('drivers').insert(data)` - Create new driver
- `supabase.from('drivers').select('*').eq('id', id)` - Get driver by ID
- `supabase.from('drivers').update(data).eq('id', id)` - Update driver
- `supabase.from('drivers').delete().eq('id', id)` - Delete driver
- `supabase.from('drivers').select('*').eq('status', 'active')` - Get available drivers

### Companies Operations
- `supabase.from('companies').select('*')` - List all companies
- `supabase.from('companies').insert(data)` - Create new company
- `supabase.from('companies').select('*').eq('id', id)` - Get company by ID
- `supabase.from('companies').update(data).eq('id', id)` - Update company
- `supabase.from('companies').delete().eq('id', id)` - Delete company

### Vehicles Operations
- `supabase.from('trucks').select('*')` - List all trucks
- `supabase.from('trucks').insert(data)` - Create new truck
- `supabase.from('trucks').select('*').eq('id', id)` - Get truck by ID
- `supabase.from('trucks').update(data).eq('id', id)` - Update truck
- `supabase.from('trucks').delete().eq('id', id)` - Delete truck

- `supabase.from('trailers').select('*')` - List all trailers
- `supabase.from('trailers').insert(data)` - Create new trailer
- `supabase.from('trailers').select('*').eq('id', id)` - Get trailer by ID
- `supabase.from('trailers').update(data).eq('id', id)` - Update trailer
- `supabase.from('trailers').delete().eq('id', id)` - Delete trailer

### Shipments Operations
- `supabase.from('shipments').select('*')` - List all shipments
- `supabase.from('shipments').insert(data)` - Create new shipment
- `supabase.from('shipments').select('*').eq('id', id)` - Get shipment by ID
- `supabase.from('shipments').update(data).eq('id', id)` - Update shipment
- `supabase.from('shipments').delete().eq('id', id)` - Delete shipment

### Real-time Subscriptions
- `supabase.channel('shipments').on('postgres_changes', callback)` - Listen to shipment changes
- `supabase.channel('drivers').on('postgres_changes', callback)` - Listen to driver changes

### Database Functions & Triggers (for complex operations)
- PostgreSQL functions for report generation and data aggregation
- Database triggers for automatic code generation and status updates
- Stored procedures for bulk operations and data validation
- RLS policies for security and data access control

## Components Library

### Layout Components
- **Layout** - Main application layout with navigation
- **PublicLayout** - Layout for public pages
- **ProtectedRoute** - Route protection wrapper

### UI Components (Shadcn UI)
- **Button** - Various button styles and sizes
- **Card** - Content containers with header/body/footer
- **Badge** - Status indicators and labels
- **Table** - Data tables with sorting and pagination
- **Dialog** - Modal dialogs and confirmations
- **Form** - Form components with validation
- **Input** - Text inputs and form fields
- **Select** - Dropdown selections
- **Checkbox** - Checkbox inputs
- **Avatar** - User profile images
- **Skeleton** - Loading placeholders
- **Textarea** - Multi-line text inputs
- **Label** - Form field labels
- **Dropdown Menu** - Context menus and dropdowns

### Custom Components
- **LoadingSkeleton** - Table loading states
- **CreateShipmentDialog** - Shipment creation modal
- **AssignmentWarningDialog** - Assignment confirmation dialogs
- **PWAManager** - Progressive Web App functionality

## Key Features & Functionality

### Authentication & Authorization
- Supabase Auth with secure session management
- Role-based access control (Admin, Manager) with Row Level Security
- Protected routes with automatic redirection
- Social login support (Google, GitHub, etc.) - ready for implementation
- Multi-factor authentication support
- Automatic session refresh and management

### Dashboard Analytics
- Real-time statistics (drivers, trucks, trailers, shipments)
- Driver status breakdown
- Maintenance alerts for expiring documents
- Recent shipments overview
- Visual charts and metrics

### Driver Management
- Complete CRUD operations
- Auto-generated driver codes
- Status tracking (active, vacation, cancelled)
- Document expiry tracking (gatepass, waqala)
- Assignment to trucks/trailers/companies

### Fleet Management
- Truck and trailer inventory
- Document expiry monitoring
- Status management (active, empty)
- Maintenance scheduling
- Type and color categorization

### Shipment Operations
- Shipment creation and tracking
- Driver/vehicle assignment
- Status workflow (waiting, submitted)
- Origin/destination management
- Weight and amount tracking
- Document number generation

### Company Management
- Company registration and management
- Auto-generated company codes
- Short name and full name tracking
- Shipment association

### Real-time Features (Supabase Realtime)
- Live updates for shipment status changes
- Real-time driver availability notifications
- Instant dashboard statistics updates
- Live fleet tracking updates
- Real-time maintenance alerts
- Collaborative editing with conflict resolution

## Data Models & Interfaces

### User Profile Interface (extends Supabase Auth User)
```typescript
interface UserProfile {
  id: string; // UUID from auth.users
  username: string;
  full_name: string;
  role: 'admin' | 'manager';
  created_at: string;
  updated_at: string;
  // From Supabase Auth
  email?: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}
```

### Driver Interface
```typescript
interface Driver {
  id: string; // UUID
  code: string;
  full_name: string;
  phone?: string;
  gatepass?: Date | null;
  waqala?: Date | null;
  truck?: string;
  trailer?: string;
  company?: string;
  status: 'active' | 'vacation' | 'cancelled';
  created_at: string;
  updated_at: string;
}
```

### Company Interface
```typescript
interface Company {
  id: string; // UUID
  code: string;
  short_name: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}
```

### Truck Interface
```typescript
interface Truck {
  id: string; // UUID
  truck_number: string;
  type: string;
  model: number;
  expiry_date: string;
  status: 'active' | 'empty';
  created_at?: string;
  updated_at?: string;
}
```

### Trailer Interface
```typescript
interface Trailer {
  id: string; // UUID
  trailer_number: string;
  type: 'Box' | 'Flatbed' | 'Curtainside' | 'TIR Box' | 'TIR BL' | 'Balmer' | 'Reefer' | 'Reefer TIR';
  model: number;
  expiry_date: string;
  status: 'active' | 'empty';
  color: 'red' | 'blue' | 'white' | 'black' | 'silver' | 'orange' | 'yellow';
  created_at?: string;
  updated_at?: string;
}
```

### Shipment Interface
```typescript
interface Shipment {
  id: string; // UUID
  doc_no: string;
  loading_date: string;
  driver_id?: string; // UUID
  truck_id?: string; // UUID
  trailer_id?: string; // UUID
  company_id: string; // UUID
  customer_id?: string; // UUID
  origin: string;
  destination: string;
  amount?: number;
  gross_weight?: number;
  net_weight?: number;
  status: 'waiting' | 'submitted';
  created_at?: string;
  updated_at?: string;
  // Joined data
  driver_name?: string;
  truck_number?: string;
  trailer_number?: string;
  company_name?: string;
  company_short_name?: string;
  customer_name?: string;
}
```

## Business Logic & Functions

### Code Generation
- **Company Codes**: Auto-generated unique codes (e.g., "CO01", "CO02") using Supabase functions


### Status Management
- **Driver Status**: Active, Vacation, Cancelled
- **Vehicle Status**: Active, Empty
- **Shipment Status**: Waiting, Submitted

### Assignment Logic
- Drivers can be assigned to trucks, trailers, and companies
- Shipments can be assigned drivers, trucks, trailers, and companies
- Availability checking for assignments with real-time updates
- Conflict prevention using Supabase real-time subscriptions

### Validation Rules
- Unique constraints on codes, usernames, emails enforced at database level
- Required fields validation using Zod schemas
- Date validation for expiry dates
- Status enum validation with PostgreSQL check constraints
- Row Level Security policies for data access control

### Security Features
- Supabase Auth with secure password hashing (bcrypt)
- Row Level Security (RLS) policies for fine-grained access control
- Automatic SQL injection prevention with Supabase client
- Role-based route protection with Supabase Auth
- Secure session management with automatic token refresh
- HTTPS enforcement and secure headers
- Rate limiting and DDoS protection via server configuration

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://hgupbhapsedcszmwtcws.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndXBiaGFwc2VkY3N6bXd0Y3dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk1MzIsImV4cCI6MjA3NjE0NTUzMn0.BJtJoMuz7hMDs3BWRcroipbaxU4jj2UUbziS9Q85pG0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhndXBiaGFwc2VkY3N6bXd0Y3dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU2OTUzMiwiZXhwIjoyMDc2MTQ1NTMyfQ.g9bNB9aE4gmIK4cV2GJmgRT3JRN7kVj9Ieo00kT4_uM
```

## Deployment Notes

- **Platform**: Traditional hosting (VPS/dedicated server) with Supabase backend
- **Architecture**: Next.js frontend with Supabase as complete backend solution
- **Database**: Supabase PostgreSQL with automatic backups and monitoring
- **Scaling**: Horizontal scaling through load balancers and multiple server instances
- **Environment**: Production environment variables required
- **SSL**: HTTPS configuration required for Supabase integration