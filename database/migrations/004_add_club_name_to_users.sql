-- Add club_name and club_avatar_url columns to users table
-- This migration adds new string columns for storing the user's club information

-- Add the club_name column to the users table
ALTER TABLE users
ADD COLUMN club_name TEXT;

-- Add the club_avatar_url column to the users table
ALTER TABLE users
ADD COLUMN club_avatar_url TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN users.club_name IS 'The name of the club the user belongs to';
COMMENT ON COLUMN users.club_avatar_url IS 'URL to the club avatar/logo image';
