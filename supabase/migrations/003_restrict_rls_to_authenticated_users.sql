-- Restrict RLS policies to authenticated users only
-- This migration ensures all table access is restricted to authenticated users

-- Drop all existing policies that will be recreated
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view client products" ON client_products;
DROP POLICY IF EXISTS "Authenticated users can view active products" ON products;
DROP POLICY IF EXISTS "Admins can view all products" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view their own client products" ON client_products;
DROP POLICY IF EXISTS "Authenticated users can view client products" ON client_products;
DROP POLICY IF EXISTS "Admins and Sales can manage client products" ON client_products;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Sales can view their assigned clients" ON clients;
DROP POLICY IF EXISTS "Admins and Sales can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins and Sales can update clients" ON clients;
DROP POLICY IF EXISTS "Sales can view their own sales" ON sales;
DROP POLICY IF EXISTS "Admins and Sales can create sales" ON sales;
DROP POLICY IF EXISTS "Admins and Sales can update sales" ON sales;

-- Recreate products policies with stricter authentication checks
CREATE POLICY "Authenticated users can view active products" ON products
  FOR SELECT TO authenticated USING (
    is_active = true
  );

CREATE POLICY "Admins can view all products" ON products
  FOR SELECT TO authenticated USING (
    is_admin()
  );

CREATE POLICY "Admins can manage products" ON products
  FOR ALL TO authenticated USING (
    is_admin()
  );

-- Recreate client_products policies with consolidated logic
CREATE POLICY "Authenticated users can view client products" ON client_products
  FOR SELECT TO authenticated USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    ) OR
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = client_products.client_id
      AND clients.email = (
        SELECT email FROM auth.users WHERE id = (select auth.uid())
      )
    )
  );

CREATE POLICY "Admins and Sales can manage client products" ON client_products
  FOR ALL TO authenticated USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

-- Add authentication check to users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT TO authenticated USING (
    (select auth.uid()) = id
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated USING (
    (select auth.uid()) = id
  );

-- Add authentication check to clients policies
CREATE POLICY "Sales can view their assigned clients" ON clients
  FOR SELECT TO authenticated USING (
    salesman_id = (select auth.uid()) OR
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can insert clients" ON clients
  FOR INSERT TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can update clients" ON clients
  FOR UPDATE TO authenticated USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

-- Add authentication check to sales policies
CREATE POLICY "Sales can view their own sales" ON sales
  FOR SELECT TO authenticated USING (
    salesman_id = (select auth.uid())
  );

CREATE POLICY "Admins and Sales can create sales" ON sales
  FOR INSERT TO authenticated WITH CHECK (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

CREATE POLICY "Admins and Sales can update sales" ON sales
  FOR UPDATE TO authenticated USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = (select auth.uid())
      AND role = 'sales'
    )
  );

-- Ensure all tables have RLS enabled and no public access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_products ENABLE ROW LEVEL SECURITY;

-- Add a comment to document the authentication requirement
COMMENT ON TABLE users IS 'Access restricted to authenticated users only';
COMMENT ON TABLE clients IS 'Access restricted to authenticated users only';
COMMENT ON TABLE products IS 'Access restricted to authenticated users only';
COMMENT ON TABLE sales IS 'Access restricted to authenticated users only';
COMMENT ON TABLE client_products IS 'Access restricted to authenticated users only';
