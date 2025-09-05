# Database Schema - FranPadelProject Admin

This directory contains the complete database schema, migrations, and utilities for the FranPadelProject Administration Application.

## 🏗️ Database Architecture

### Core Tables

1. **users** - User accounts with role-based access (admin, sales, client)
2. **clients** - Customer/client information with salesman assignment
3. **products** - Available products (courses, clinics, formations)
4. **sales** - Sales transactions and records
5. **client_products** - Product access management for clients

### Relationships

```
users (1) ──── (M) clients (salesman_id)
users (1) ──── (M) sales (salesman_id)
clients (1) ── (M) sales
products (1) ── (M) sales
products (1) ── (M) client_products
sales (1) ───── (M) client_products
```

## 📁 Directory Structure

```
database/
├── migrations/          # Database schema migrations
│   └── 001_initial_schema.sql
├── seeders/            # Sample data for development
│   └── 001_sample_data.sql
├── types/              # TypeScript database types
│   └── database.types.ts
├── utils.ts            # Database utility functions
├── migrate.ts          # Migration runner script
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

1. **Supabase Account** - Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables** - Set up your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Running Migrations

Install dependencies first:

```bash
npm install
```

Run the initial migration:

```bash
npm run db:migrate
```

Run migrations with sample data:

```bash
npm run db:seed
```

Reset database completely:

```bash
npm run db:reset
```

## 📊 Database Schema Details

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Roles:**

- `admin` - Full system access
- `sales` - Can manage clients and sales
- `client` - Limited access for FranMethodology platform

### Clients Table

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  salesman_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER, -- in days, NULL for lifetime
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Product Types:**

- `course` - Training courses with duration
- `clinic` - One-day clinics/sessions
- `formation` - Certification and advanced training

### Sales Table

```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  product_id UUID NOT NULL REFERENCES products(id),
  salesman_id UUID NOT NULL REFERENCES users(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Payment Status:**

- `pending` - Payment not yet received
- `paid` - Payment completed
- `cancelled` - Sale cancelled

### Client Products Table

```sql
CREATE TABLE client_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  product_id UUID NOT NULL REFERENCES products(id),
  sale_id UUID NOT NULL REFERENCES sales(id),
  access_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  access_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔒 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with policies based on user roles:

- **Admins** - Full access to all data
- **Sales** - Access to their assigned clients and sales
- **Clients** - Limited access for platform integration

### Policies Examples

```sql
-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Sales can view their assigned clients
CREATE POLICY "Sales can view their assigned clients" ON clients
  FOR SELECT USING (salesman_id = auth.uid());
```

## 🔧 Database Utilities

The `database/utils.ts` file provides common database operations:

### Client Operations

```typescript
import { dbUtils } from '@/database/utils'

// Get all clients with search and filtering
const clients = await dbUtils.getClients({
  search: 'john',
  salesmanId: 'user-id',
  limit: 20,
})

// Create a new client
const newClient = await dbUtils.createClient({
  email: 'client@example.com',
  full_name: 'John Doe',
  salesman_id: 'salesman-id',
})
```

### Dashboard Statistics

```typescript
const stats = await dbUtils.getDashboardStats()
// Returns: totalSales, totalClients, activeSubscriptions, monthlyRevenue, etc.
```

## 🌱 Sample Data

The sample data includes:

- **4 Users**: 1 Admin, 3 Sales representatives
- **8 Clients**: Various customers with different salesmen
- **6 Products**: Mix of courses, clinics, and formations
- **Sample Sales**: Realistic sales data with different payment statuses
- **Access Records**: Client product access management

## 🔄 Migration Process

### Creating New Migrations

1. Create a new SQL file in `database/migrations/`
2. Follow the naming convention: `###_description.sql`
3. Test the migration locally
4. Update the database types if needed

### Migration Best Practices

- Always include rollback statements
- Test migrations on a copy of production data
- Use transactions for complex migrations
- Update TypeScript types after schema changes

## 📈 Performance Optimizations

### Indexes

```sql
-- Primary key indexes (automatic)
-- Foreign key indexes (automatic)
-- Custom indexes for performance
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_client_products_is_active ON client_products(is_active);
```

### Query Optimization

- Use appropriate indexes for common queries
- Implement pagination for large datasets
- Use database views for complex joins
- Monitor slow queries with Supabase dashboard

## 🧪 Testing

### Local Development

1. Use Supabase local development setup
2. Run migrations: `npm run db:migrate`
3. Seed data: `npm run db:seed`
4. Test with your Next.js application

### Production Deployment

1. Run migrations on staging first
2. Backup production data before migrations
3. Monitor application performance after deployment
4. Update application code to use new schema features

## 📝 Environment Variables

Required for database operations:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For local development
SUPABASE_LOCAL_URL=http://localhost:54321
SUPABASE_LOCAL_ANON_KEY=your-local-anon-key
```

## 🆘 Troubleshooting

### Common Issues

1. **Migration Fails**

   - Check SQL syntax
   - Verify table dependencies
   - Ensure RLS policies don't conflict

2. **Permission Errors**

   - Check RLS policies
   - Verify user roles
   - Test with service role key

3. **Performance Issues**
   - Add missing indexes
   - Optimize queries
   - Check Supabase dashboard

### Getting Help

- Check Supabase documentation
- Review migration logs
- Test queries in Supabase SQL editor
