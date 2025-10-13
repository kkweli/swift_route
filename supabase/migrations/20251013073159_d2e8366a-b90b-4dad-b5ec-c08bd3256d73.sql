-- Enable PostGIS extension for geospatial operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create nodes table for geographic points (intersections, POIs)
CREATE TABLE public.nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  node_type TEXT DEFAULT 'intersection',
  name TEXT,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create edges table for road segments
CREATE TABLE public.edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  osm_id BIGINT UNIQUE,
  source_node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE NOT NULL,
  target_node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE NOT NULL,
  geometry GEOGRAPHY(LINESTRING, 4326) NOT NULL,
  road_type TEXT NOT NULL,
  name TEXT,
  length_meters DOUBLE PRECISION,
  speed_limit INTEGER,
  one_way BOOLEAN DEFAULT false,
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create routes table for saved routes
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  start_location GEOGRAPHY(POINT, 4326) NOT NULL,
  end_location GEOGRAPHY(POINT, 4326) NOT NULL,
  route_geometry GEOGRAPHY(LINESTRING, 4326),
  distance_meters DOUBLE PRECISION,
  estimated_duration_seconds INTEGER,
  algorithm_used TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create traffic_data table for real-time traffic information
CREATE TABLE public.traffic_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edge_id UUID REFERENCES public.edges(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  speed_kmh DOUBLE PRECISION,
  congestion_level TEXT CHECK (congestion_level IN ('low', 'medium', 'high', 'severe')),
  incident_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create spatial indexes for performance
CREATE INDEX idx_nodes_location ON public.nodes USING GIST(location);
CREATE INDEX idx_edges_geometry ON public.edges USING GIST(geometry);
CREATE INDEX idx_edges_source ON public.edges(source_node_id);
CREATE INDEX idx_edges_target ON public.edges(target_node_id);
CREATE INDEX idx_routes_start ON public.routes USING GIST(start_location);
CREATE INDEX idx_routes_end ON public.routes USING GIST(end_location);
CREATE INDEX idx_traffic_edge ON public.traffic_data(edge_id);
CREATE INDEX idx_traffic_timestamp ON public.traffic_data(timestamp);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_data ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for nodes (public read, admin write)
CREATE POLICY "Nodes are viewable by everyone"
  ON public.nodes FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert nodes"
  ON public.nodes FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update nodes"
  ON public.nodes FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for edges (public read, admin write)
CREATE POLICY "Edges are viewable by everyone"
  ON public.edges FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert edges"
  ON public.edges FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update edges"
  ON public.edges FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for routes (users can manage their own)
CREATE POLICY "Users can view their own routes"
  ON public.routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own routes"
  ON public.routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routes"
  ON public.routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routes"
  ON public.routes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all routes"
  ON public.routes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for traffic_data (public read, admin write)
CREATE POLICY "Traffic data is viewable by everyone"
  ON public.traffic_data FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert traffic data"
  ON public.traffic_data FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile and assign role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();