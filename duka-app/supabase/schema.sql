-- ============================================================
-- DUKA SYSTEM - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists pgcrypto;

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    username text unique,
    role text not null default 'staff'
        check (role in ('owner', 'staff')),
    created_at timestamptz not null default now()
);

-- ============================================================
-- 2. PRODUCTS
-- ============================================================
create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    category text not null default 'Other',
    sku text,
    buy_price numeric(12,2) not null default 0
        check (buy_price >= 0),
    sell_price numeric(12,2) not null default 0
        check (sell_price >= 0),
    min_stock integer not null default 0
        check (min_stock >= 0),
    supplier text,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 3. SALES
-- ============================================================
create table if not exists public.sales (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles(id) on delete set null,
    payment_method text not null default 'Cash'
        check (payment_method in ('Cash', 'M-Pesa', 'Card', 'Other')),
    total numeric(12,2) not null default 0
        check (total >= 0),
    created_at timestamptz not null default now()
);

-- ============================================================
-- 4. SALE ITEMS
-- ============================================================
create table if not exists public.sale_items (
    id uuid primary key default gen_random_uuid(),
    sale_id uuid not null references public.sales(id) on delete cascade,
    product_id uuid not null references public.products(id) on delete restrict,
    quantity integer not null
        check (quantity > 0),
    unit_price numeric(12,2) not null
        check (unit_price >= 0),
    created_at timestamptz not null default now()
);

-- ============================================================
-- 5. STOCK MOVEMENTS
-- ============================================================
create table if not exists public.stock_movements (
    id uuid primary key default gen_random_uuid(),
    product_id uuid not null references public.products(id) on delete cascade,
    delta integer not null,
    movement_type text not null
        check (movement_type in ('STOCK_ADD', 'SALE', 'ADJUSTMENT')),
    actor_id uuid references public.profiles(id) on delete set null,
    sale_id uuid references public.sales(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 6. EXPENSES
-- ============================================================
create table if not exists public.expenses (
    id uuid primary key default gen_random_uuid(),
    category text not null,
    amount numeric(12,2) not null
        check (amount > 0),
    description text,
    actor_id uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now()
);

-- ============================================================
-- 7. INDEXES
-- ============================================================
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_sku on public.products(sku);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id);
create index if not exists idx_stock_movements_created on public.stock_movements(created_at);
create index if not exists idx_stock_movements_sale on public.stock_movements(sale_id);
create index if not exists idx_sales_actor on public.sales(actor_id);
create index if not exists idx_sales_created on public.sales(created_at);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);
create index if not exists idx_expenses_created on public.expenses(created_at);
create index if not exists idx_expenses_actor on public.expenses(actor_id);

-- ============================================================
-- 8. INVENTORY VIEW
-- ============================================================
create or replace view public.product_stock
with (security_invoker = true)
as
select
    p.id,
    p.name,
    p.sku,
    p.category,
    p.buy_price,
    p.sell_price,
    p.min_stock,
    p.supplier,
    coalesce(sum(sm.delta), 0)::integer as stock
from public.products p
left join public.stock_movements sm
    on sm.product_id = p.id
group by
    p.id,
    p.name,
    p.sku,
    p.category,
    p.buy_price,
    p.sell_price,
    p.min_stock,
    p.supplier;

-- ============================================================
-- 9. PERMISSIONS & ROW LEVEL SECURITY
-- ============================================================

-- Grant table & schema permissions to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant all on all routines in schema public to anon, authenticated;

alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
alter default privileges in schema public grant all on routines to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.expenses enable row level security;

-- Policies for public / authenticated access
drop policy if exists "Allow all access to profiles" on public.profiles;
create policy "Allow all access to profiles" on public.profiles for all using (true) with check (true);

drop policy if exists "Allow all access to products" on public.products;
create policy "Allow all access to products" on public.products for all using (true) with check (true);

drop policy if exists "Allow all access to sales" on public.sales;
create policy "Allow all access to sales" on public.sales for all using (true) with check (true);

drop policy if exists "Allow all access to sale_items" on public.sale_items;
create policy "Allow all access to sale_items" on public.sale_items for all using (true) with check (true);

drop policy if exists "Allow all access to stock_movements" on public.stock_movements;
create policy "Allow all access to stock_movements" on public.stock_movements for all using (true) with check (true);

drop policy if exists "Allow all access to expenses" on public.expenses;
create policy "Allow all access to expenses" on public.expenses for all using (true) with check (true);

-- Enable Realtime for all tables
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'products') then
    alter publication supabase_realtime add table public.products;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'stock_movements') then
    alter publication supabase_realtime add table public.stock_movements;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'sales') then
    alter publication supabase_realtime add table public.sales;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'sale_items') then
    alter publication supabase_realtime add table public.sale_items;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'expenses') then
    alter publication supabase_realtime add table public.expenses;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
exception when others then
  null;
end $$;