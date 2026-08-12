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
  club_name TEXT,
  club_avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to document the new columns
COMMENT ON COLUMN users.club_name IS 'The name of the club the user belongs to';
COMMENT ON COLUMN users.club_avatar_url IS 'URL to the club avatar/logo image';


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

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT TO authenticated USING (
    (select auth.uid()) = id
  );

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE TO authenticated USING (
    (select auth.uid()) = id
  );

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
