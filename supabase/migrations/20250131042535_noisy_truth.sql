/*
  # Recreate Database Schema

  1. New Tables
    - `profiles`
      - User profile information
      - Stores basic user data and type (client/provider)
    - `provider_profiles`
      - Extended profile for service providers
      - Includes skills, experience, and ratings
    - `services`
      - Service listings posted by clients
      - Contains job details, budget, and status
    - `service_applications`
      - Applications from providers for services
      - Includes proposed price and status
    - `transactions`
      - Financial transactions in the system
      - Tracks payments and earnings
    - `reviews`
      - User reviews and ratings
      - For both clients and providers

  2. Security
    - RLS enabled on all tables
    - Policies for proper data access control
    - Secure user data handling

  3. Changes
    - Improved data types and constraints
    - Better relationship handling
    - Enhanced security policies
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS service_applications CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS provider_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  user_type text NOT NULL CHECK (user_type IN ('client', 'provider')),
  credits decimal(10,2) DEFAULT 0 CHECK (credits >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create provider_profiles table
CREATE TABLE provider_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skills text[],
  experience text,
  hourly_rate decimal(10,2) CHECK (hourly_rate > 0),
  is_verified boolean DEFAULT false,
  rating decimal(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  subscription_type text DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
  subscription_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) >= 3),
  description text NOT NULL CHECK (char_length(description) >= 10),
  category text NOT NULL,
  budget decimal(10,2) NOT NULL CHECK (budget > 0),
  location text NOT NULL,
  deadline timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_applications table
CREATE TABLE service_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES provider_profiles(id) ON DELETE CASCADE,
  proposed_price decimal(10,2) NOT NULL CHECK (proposed_price > 0),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_id, provider_id)
);

-- Create transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('credit_purchase', 'service_payment', 'service_earning')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method text,
  service_id uuid REFERENCES services(id),
  created_at timestamptz DEFAULT now()
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  reviewed_id uuid REFERENCES profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, reviewer_id, reviewed_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Provider Profiles Policies
CREATE POLICY "Provider profiles are viewable by everyone"
  ON provider_profiles FOR SELECT
  USING (true);

CREATE POLICY "Providers can insert their own profile"
  ON provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Providers can update their own profile"
  ON provider_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Services Policies
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Users can update own services"
  ON services FOR UPDATE
  USING (auth.uid() = client_id);

-- Service Applications Policies
CREATE POLICY "Applications are viewable by involved parties"
  ON service_applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT client_id FROM services WHERE id = service_id
    ) OR
    auth.uid() = provider_id
  );

CREATE POLICY "Providers can create applications"
  ON service_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = provider_id AND
    EXISTS (
      SELECT 1 FROM provider_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their applications"
  ON service_applications FOR UPDATE
  USING (auth.uid() = provider_id);

-- Transactions Policies
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reviews Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for completed services"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
      SELECT 1 FROM services
      WHERE id = service_id
      AND status = 'completed'
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_service_applications_status ON service_applications(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);