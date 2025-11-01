# Booster System Setup Guide

## 1. Database Schema Updates

Run the SQL in Supabase SQL Editor:

**File:** `supabase_booster_schema.sql`

This will:
- Add `role` column to `users` table (default: 'customer', can be 'booster' or 'admin')
- Add `booster_id` and `claimed_at` columns to `orders` table
- Create indexes for performance
- Update RLS policies for booster access

## 2. Making a User a Booster

To make a user a booster, run this SQL in Supabase:

```sql
-- Update user role to booster
UPDATE users 
SET role = 'booster' 
WHERE email = 'user@example.com';
```

Or use the Supabase Dashboard:
1. Go to Table Editor → users
2. Find the user by email
3. Edit the `role` field and change it to `booster`
4. Save

## 3. Features

### Booster Dashboard (`/booster/dashboard`)
- **Available Orders Tab**: Shows all pending orders that haven't been claimed
- **My Orders Tab**: Shows orders claimed by the booster
- **Stats**: Total orders, completed orders, active orders, total earnings

### Order Claiming
- Boosters can claim available orders by clicking "Claim Order"
- First booster to claim gets the order
- Order status changes to "processing" when claimed
- Order is assigned to the booster (`booster_id` is set)

### API Routes
- `GET /api/orders/available` - Get available (unclaimed) orders
- `POST /api/orders/claim` - Claim an order (only for boosters)
- `GET /api/orders/booster` - Get booster's own orders
- `GET /api/user/role` - Get current user's role

## 4. Security

- Only users with `role = 'booster'` can access booster routes
- Orders can only be claimed if:
  - Order status is "pending"
  - Order doesn't have a `booster_id` yet
- Race condition protection: Uses database constraints to prevent double-claiming

## 5. User Menu

Booster users will see a "Booster Dashboard" link in their user menu (top right dropdown).

## 6. Testing

1. Create a test user and make them a booster:
   ```sql
   UPDATE users SET role = 'booster' WHERE email = 'test@example.com';
   ```

2. Create some orders (by making test payments)

3. Log in as booster and go to `/booster/dashboard`

4. You should see available orders

5. Click "Claim Order" to claim one

6. Check "My Orders" tab to see claimed orders

