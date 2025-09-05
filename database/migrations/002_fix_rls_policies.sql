-- Fix infinite recursion in RLS policies
-- This migration drops the problematic policies and recreates them with a helper function

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Sales can view their assigned clients" ON clients;
DROP POLICY IF EXISTS "Admins and Sales can insert clients" ON clients;
DROP POLICY IF EXISTS "Admins and Sales can update clients" ON clients;
DROP POLICY IF EXISTS "Admins can manage products" ON products;
DROP POLICY IF EXISTS "Admins can view all sales" ON sales;
DROP POLICY IF EXISTS "Admins and Sales can create sales" ON sales;
DROP POLICY IF EXISTS "Admins and Sales can update sales" ON sales;
DROP POLICY IF EXISTS "Admins and Sales can manage client products" ON client_products;

-- Create helper function to check admin role (avoids infinite recursion)
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

-- Recreate users policies
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_admin());

-- Recreate clients policies
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

-- Recreate products policies
CREATE POLICY "Admins can manage products" ON products
  FOR ALL USING (is_admin());

-- Recreate sales policies
CREATE POLICY "Admins can view all sales" ON sales
  FOR SELECT USING (is_admin());

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

-- Recreate client_products policies
CREATE POLICY "Admins and Sales can manage client products" ON client_products
  FOR ALL USING (
    is_admin() OR
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'sales'
    )
  );
