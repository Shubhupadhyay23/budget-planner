-- Budget Planner Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Families (Workspaces)
CREATE TABLE public.families (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    admin_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Profiles (Members)
CREATE TABLE public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, family_id)
);

-- 3. Budgets
CREATE TABLE public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    income NUMERIC NOT NULL,
    currency TEXT DEFAULT '₹',
    cycle_1_budget NUMERIC NOT NULL,
    cycle_2_budget NUMERIC NOT NULL,
    cycle_3_budget NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(family_id, month, year)
);

-- 4. Expenses
CREATE TABLE public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    paid_by UUID NOT NULL REFERENCES public.profiles(id),
    split_members UUID[] NOT NULL, -- Array of profile IDs
    cycle INTEGER CHECK (cycle IN (1, 2, 3)),
    is_extra_expense BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Activity Logs (Audit)
CREATE TABLE public.activity_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'ADDED_EXPENSE', 'EDITED_EXPENSE', etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own profile
CREATE POLICY "Users can view own profiles" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id OR family_id IN (
        SELECT family_id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Users can view their family
CREATE POLICY "Users can view own family" ON public.families
    FOR SELECT USING (id IN (
        SELECT family_id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Users can insert expenses in their family
CREATE POLICY "Users can insert expenses" ON public.expenses
    FOR INSERT WITH CHECK (family_id IN (
        SELECT family_id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Users can view expenses in their family
CREATE POLICY "Users can view expenses" ON public.expenses
    FOR SELECT USING (family_id IN (
        SELECT family_id FROM public.profiles WHERE user_id = auth.uid()
    ));

-- Add realtime to expenses
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
