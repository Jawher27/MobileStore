-- Create custom types
CREATE TYPE user_role AS ENUM ('client', 'supplier');
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role user_role DEFAULT 'client'::user_role NOT NULL,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_threshold INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.profiles(id) NOT NULL,
    status order_status DEFAULT 'pending'::order_status NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items table
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Function to bypass RLS for role checks
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Suppliers can view all profiles" ON public.profiles
    FOR SELECT USING (
        public.get_user_role() = 'supplier'
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Products
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Only suppliers can insert products" ON public.products
    FOR INSERT WITH CHECK (
        public.get_user_role() = 'supplier'
    );

CREATE POLICY "Only suppliers can update products" ON public.products
    FOR UPDATE USING (
        public.get_user_role() = 'supplier'
    );

CREATE POLICY "Only suppliers can delete products" ON public.products
    FOR DELETE USING (
        public.get_user_role() = 'supplier'
    );

-- Orders
CREATE POLICY "Clients can view their own orders" ON public.orders
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Suppliers can view all orders" ON public.orders
    FOR SELECT USING (
        public.get_user_role() = 'supplier'
    );

CREATE POLICY "Suppliers can update all orders" ON public.orders
    FOR UPDATE USING (
        public.get_user_role() = 'supplier'
    );

-- Order Items
CREATE POLICY "Clients can view their own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS ( SELECT 1 FROM public.orders WHERE id = order_items.order_id AND client_id = auth.uid() )
    );

CREATE POLICY "Clients can insert their own order items" ON public.order_items
    FOR INSERT WITH CHECK (
        EXISTS ( SELECT 1 FROM public.orders WHERE id = order_items.order_id AND client_id = auth.uid() )
    );

CREATE POLICY "Suppliers can view all order items" ON public.order_items
    FOR SELECT USING (
        public.get_user_role() = 'supplier'
    );

-- Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'client'); -- Defaulting to client
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update 'updated_at' columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
