# Crave — Seeded Test Users

All accounts share the password: **`Password123!`**
(Re-seed anytime with `npm run db:migrate` then `npx tsx scripts/seed.ts` — the seed script wipes the `quickbite_core` tables it owns and re-inserts everything.)

Login endpoint: `POST http://localhost:3000/api/auth/login` with `{email, password}`.
Auth is cookie-based: the response sets `access_token` (and returns both tokens in the body).

## Platform

| User | Email | Role | Notes |
|---|---|---|---|
| Platform Admin | `admin@crave.io` | system_admin | Creates restaurants, toggles restaurant/branch status, force-assigns orders, records payouts, cancels any order |

## Restaurants & members

### 1. Burger Nation (eg, country code eg)
| User | Email | Member role |
|---|---|---|
| owner1 — Omar Hassan | `owner1@crave.io` | owner (all branches) |
| manager1 — Mona Adel | `manager1@crave.io` | branch_manager (Nasr City, branch 1) |
| staff1 — Ahmed Fouad | `staff1@crave.io` | staff (Nasr City, branch 1) |

Branches: 1 = Nasr City (Cairo), 3 = Zamalek (Cairo)

### 2. Sushi Spot (eg)
| User | Email | Member role |
|---|---|---|
| owner2 — Sara Ibrahim | `owner2@crave.io` | owner |
| manager2 — Laila Mostafa | `manager2@crave.io` | branch_manager (Maadi, branch 2) |

Branches: 2 = Maadi (Cairo)

### 3. Shawarma House (ksa)
| User | Email | Member role |
|---|---|---|
| owner3 — Khaled Al-Saud | `owner3@crave.io` | owner |
| staff2 — Faisal Al-Harbi | `staff2@crave.io` | staff (Olaya, Riyadh) |

Branches: 4 = Olaya - Riyadh (ksa)

## Customers

| User | Email | Phone | Region |
|---|---|---|---|
| customer1 — Mahmoud Samir | `customer1@crave.io` | +201000000009 | eg (2 addresses: Home/Office) |
| customer2 — Nour El-Din | `customer2@crave.io` | +201000000010 | eg |
| customer3 — Reem Al-Otaibi | `customer3@crave.io` | +201111111111 | ksa (address 4, Riyadh) |

## Delivery agents

| User | Email | Phone | Region |
|---|---|---|---|
| agent1 — Hassan Gaber | `agent1@crave.io` | +201000000011 | eg |
| agent2 — Mostafa Kamel | `agent2@crave.io` | +201000000012 | eg |
| agent3 — Salman Al-Harbi | `agent3@crave.io` | +201222222222 | ksa |

Agent presence flow (order service):
`POST /api/agents/presence/online {lat, lng}` → stay in radius of the branch →
assignment worker broadcasts `task.offered` (socket.io room `agent:<userId>`) →
`POST /api/agents/orders/:publicId/accept`.

## Quick flows to test

1. **Customer orders a burger (COD)** — login `customer1` → `POST :4000/api/orders`
   `{branchId: 1, customerAddressId: 1, paymentMethod: "cod", items: [{productId: 2, quantity: 1}]}`.
2. **Restaurant staff pipeline** — login `staff1` / `manager1`:
   `PATCH :4000/api/restaurants/1/branches/1/orders/:publicId/status`
   `accepted → preparing → ready` (each with an `Idempotency-Key` header).
3. **Dispatch** — login `agent1`, presence online near Cairo branch coords `(30.0566, 31.3302)`,
   after the order is `ready` the worker offers it → accept → `picked` → `delivered`.
4. **Online payment** — create an order with `paymentMethod: "online"` and open the
   returned `payment.redirectUrl` (Kashier test checkout).
5. **Settlement & payout** — after a delivery, `GET :4000/api/restaurants/1/balance` (owner1),
   then `POST :4000/api/admin/restaurants/1/payouts` (admin).

## Other test constants

| Constant | Value |
|---|---|
| Internal API key | `dev-internal-api-key` (header: `api-key`) |
| Order-service regions | `eg` (EGP, eg restaurant set), `ksa` (SAR; COD only — online payments rejected) |
| Kashier (test mode) | MID `MID-53462-938`, creds in crave-order-service `backend/.env` |
| Core service | http://localhost:3000/api |
| Order service | http://localhost:4000/api (needs `X-Region` header) |
