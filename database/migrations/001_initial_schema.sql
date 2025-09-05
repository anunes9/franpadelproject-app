-- FranPadelProject Admin Database Schema
-- Initial migration for the core tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'sales', 'client');
CREATE TYPE product_type AS ENUM ('course', 'clinic', 'formation');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'cancelled');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  salesman_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type product_type NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  duration INTEGER, -- in days, NULL for lifetime access
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales table
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  salesman_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  payment_status payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Products table (access management)
CREATE TABLE client_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  access_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  access_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, product_id, sale_id)
);

-- Create indexes for better performance
CREATE INDEX idx_clients_salesman_id ON clients(salesman_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_sales_client_id ON sales(client_id);
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_salesman_id ON sales(salesman_id);
CREATE INDEX idx_sales_sale_date ON sales(sale_date);
CREATE INDEX idx_sales_payment_status ON sales(payment_status);
CREATE INDEX idx_client_products_client_id ON client_products(client_id);
CREATE INDEX idx_client_products_product_id ON client_products(product_id);
CREATE INDEX idx_client_products_sale_id ON client_products(sale_id);
CREATE INDEX idx_client_products_is_active ON client_products(is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_products_updated_at BEFORE UPDATE ON client_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Use a function to check admin role to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin());

-- Clients policies
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (is_admin());

CREATE POLICY "Sales can view their assigned clients" ON clients
  FOR SELECT USING (
    salesman_id = auth.uid() OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can insert clients" ON clients
  FOR INSERT WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can update clients" ON clients
  FOR UPDATE USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );

-- Products policies
CREATE POLICY "Authenticated users can view products" ON products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin());

-- Sales policies
CREATE POLICY "Admins can view all sales" ON sales
  FOR SELECT USING (is_admin());

CREATE POLICY "Sales can view their own sales" ON sales
  FOR SELECT USING (salesman_id = auth.uid());

CREATE POLICY "Admins and Sales can create sales" ON sales
  FOR INSERT WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can update sales" ON sales
  FOR UPDATE USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );

-- Client Products policies
CREATE POLICY "Authenticated users can view client products" ON client_products
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and Sales can manage client products" ON client_products
  FOR ALL USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );
