/*
  # Initial TaskMatch Database Schema

  1. New Tables
    - users
      - Basic user information and authentication
    - profiles
      - Extended user profile information
    - services
      - Service listings
    - service_applications
      - Applications from providers for services
    - transactions
      - Credit transactions and payments
    - reviews
      - User reviews and ratings
    
  2. Security
    - RLS enabled on all tables
    - Policies for data access control
*/

-- Users & Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  user_type text NOT NULL CHECK (user_type IN ('client', 'provider')),
  credits decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Provider Profiles
CREATE TABLE IF NOT EXISTS provider_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  skills text[],
  experience text,
  hourly_rate decimal(10,2),
  is_verified boolean DEFAULT false,
  rating decimal(2,1) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  subscription_type text DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
  subscription_expires_at timestamptz
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  budget decimal(10,2) NOT NULL,
  location text NOT NULL,
  deadline timestamptz,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Service Applications
CREATE TABLE IF NOT EXISTS service_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES provider_profiles(id) ON DELETE CASCADE,
  proposed_price decimal(10,2) NOT NULL,
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, provider_id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit_purchase', 'service_payment', 'service_earning')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  payment_method text,
  service_id uuid REFERENCES services(id),
  created_at timestamptz DEFAULT now()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id),
  reviewed_id uuid REFERENCES profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(service_id, reviewer_id, reviewed_id)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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

-- Applications Policies
CREATE POLICY "Providers can view applications"
  ON service_applications FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM provider_profiles
    )
  );

CREATE POLICY "Providers can create applications"
  ON service_applications FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = provider_id AND
    status = 'pending'
  );

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