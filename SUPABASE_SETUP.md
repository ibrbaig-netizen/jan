# Jan Chemist — Supabase Cloud Architecture & Deployment Guide

This guide details the complete 3-component architecture connecting the **Customer Storefront**, the **Secure Admin Dashboard (/admin)**, and the **Supabase PostgreSQL Cloud Backend**.

---

## 1. Architecture Overview

```
                      +-----------------------------------+
                      |      SUPABASE CLOUD BACKEND       |
                      |  - PostgreSQL Database & Tables   |
                      |  - Row Level Security (RLS)       |
                      |  - Supabase Auth (Admin RBAC)     |
                      |  - Realtime Subscriptions         |
                      |  - Atomic Stock Checkout Trigger  |
                      +-----------------+-----------------+
                                        |
               +------------------------+------------------------+
               |                                                 |
               v                                                 v
+-------------------------------+               +----------------------------------+
|   CUSTOMER STOREFRONT (/)     |               |    SECURE ADMIN DASHBOARD (/admin)|
|  - Dynamic Product Fetching   |               |  - Login Gated via Supabase Auth |
|  - Dynamic CMS Settings       |               |  - profiles.role === 'admin'     |
|  - Local In-Memory Cart       |               |  - Products & Departments CRUD   |
|  - Atomic Stock Verification  |               |  - Realtime Incoming Orders      |
|  - Instant WhatsApp Order Gen |               |  - Dynamic CMS Settings Editor   |
+-------------------------------+               +----------------------------------+
```

---

## 2. Step 1: Set Up Supabase Project

1. Navigate to [https://database.new](https://database.new) (or [supabase.com](https://supabase.com)) and sign in.
2. Click **New Project** and name it `jan-chemist-backend`.
3. Choose a strong database password and select your preferred region (e.g. `ap-south-1` or `eu-central-1`).
4. Once provisioned (~1-2 minutes), go to **Project Settings** > **API**.
5. Copy your:
   - **Project URL** (`https://xyzcompany.supabase.co`)
   - **anon / public key** (`eyJhbGciOi...`)

---

## 3. Step 2: Run the SQL Schema

1. In your Supabase dashboard, click **SQL Editor** from the left navigation.
2. Click **New Query**.
3. Copy the contents of `/supabase/schema.sql` (also available directly in the Admin Portal under the **Cloud Backend** tab) and paste them into the SQL editor.
4. Click **Run** (Ctrl + Enter).
5. Verify that the following 6 tables are created in the **Table Editor**:
   - `profiles`
   - `departments`
   - `products`
   - `orders`
   - `order_items`
   - `cms_settings`

---

## 4. Step 3: Create the First Admin Account

1. In Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your store manager email and a strong password (e.g., `admin@janchemist.com`).
4. In the **SQL Editor**, verify or assign the admin role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@janchemist.com';
   ```
5. You can now log into `/admin` using this email and password!

---

## 5. Step 4: Configure Frontend Environment Variables

Add your Supabase credentials to your `.env` or deployment settings:

```bash
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

> **Zero-Downtime Live Setup in Browser**: You can also configure and test your Supabase connection directly inside the Jan Chemist Admin Portal at `/admin` under the **Cloud Backend** tab. It saves to local storage and connects instantly without requiring a server reboot!

---

## 6. Security & Row Level Security (RLS) Breakdown

| Table | Public Access | Customer Access | Admin Access (`role = 'admin'`) |
|---|---|---|---|
| `profiles` | None | Read own profile (`id = auth.uid()`) | Read all profiles, promote users |
| `departments` | `SELECT` (active = true) | `SELECT` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| `products` | `SELECT` (active = true) | `SELECT` | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| `orders` | `INSERT` (checkout) | Read own order by phone | `SELECT`, `UPDATE` (status changes), `DELETE` |
| `order_items` | `INSERT` (checkout) | Read own order items | Full `SELECT`, `UPDATE`, `DELETE` |
| `cms_settings` | `SELECT` (all rows) | `SELECT` | Full `SELECT`, `INSERT`, `UPDATE`, `DELETE` |

---

## 7. Data Integrity & Stock Control

1. **Negative Stock Prevention**: The PostgreSQL stored procedure `public.place_order` locks product rows using `SELECT ... FOR UPDATE` and checks:
   ```sql
   IF v_current_stock < v_qty THEN
     RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %', ...
   ```
2. **Price Freezing**: When an order is placed, `order_items.unit_price` stores the price locked at the second of checkout, ensuring historic orders are never altered if product prices change in the future.
3. **Admin Gated URL**: Non-admin users attempting to open `/admin` are immediately blocked and prompted with the Supabase Auth login modal. Unauthorized tokens or non-admin roles are rejected.
