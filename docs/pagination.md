# Cursor Pagination & Filtering

Conventions for list endpoints in the core service, and usage reference for every
endpoint that supports cursor pagination and filtering.

- Base path (development): `http://localhost:3000/api`
- All request and response field names are **camelCase**.
- Every paginated endpoint returns the same envelope:

```json
{
  "success": true,
  "data": [ ...items... ],
  "meta": {
    "nextCursor": "2026-10-20T00:52:15.329Z",
    "hasMore": true,
    "count": 2
  }
}
```

- `nextCursor` — opaque token; `null` when you reached the last page.
- `hasMore` — `true` if another page exists.
- `count` — number of items in **this** page (not the whole collection).
- `id` and other `BIGSERIAL` columns are returned as **JSON strings** (int64),
  `DECIMAL` columns (e.g. `lat`, `lng`) are returned as strings too.

---

## Shared pagination parameters (query string)

| Param       | Type              | Default     | Behavior |
|-------------|-------------------|-------------|----------|
| `limit`     | integer 1–1000    | `20`        | Clamped to 1000. Non-numeric or `0` is ignored (all matching rows are returned, `hasMore: false`). |
| `cursor`    | string            | —           | Value of `meta.nextCursor` from the previous page. Must be passed **verbatim** (URL-encoded); anything else causes an error. |
| `sortBy`    | string            | `createdAt` | Must be one of the endpoint's whitelisted fields (below). Unknown values — including SQL-injection attempts or legacy snake_case names such as `created_at` — **silently fall back to `createdAt`**, never a 400. |
| `sortOrder` | `asc` \| `desc`   | `asc`       | Anything other than `desc` is `asc`. |

### Cursor flow

1. First request: no `cursor`.
2. Read `meta.nextCursor` from the response.
3. Next request: add `&cursor=<nextCursor>` (URL-encode the value).
4. Repeat until `hasMore` is `false` / `nextCursor` is `null`.

```bash
# page 1
curl 'http://localhost:3000/api/restaurant?limit=2&sortOrder=desc'
# page 2 (cursor taken from page 1's meta.nextCursor)
curl 'http://localhost:3000/api/restaurant?limit=2&sortOrder=desc&cursor=2026-10-20T00%3A52%3A15.329Z'
```

Cursor values are either an ISO-8601 timestamp (`createdAt` sorting) or the raw
sort value (`id`, `name`, ...). Treat them as opaque — always echo back what the
API gave you.

---

## Shared filter syntax

Filters use bracket notation: `filter[FIELD][OPERATOR]=VALUE`.

| Operator | Meaning                                  | Example                          |
|----------|------------------------------------------|----------------------------------|
| `eq`     | exact match                              | `filter[status][eq]=active`      |
| `gt`     | greater than                             | `filter[id][gt]=7`               |
| `lt`     | less than                                | `filter[createdAt][lt]=...`      |
| `gte`    | greater than or equal                    | —                                |
| `lte`    | less than or equal                       | —                                |
| `like`   | case-insensitive partial match (ILIKE)   | `filter[name][like]=pizza`       |
| `in`     | match any of a comma-separated list      | `filter[id][in]=7,9`             |

Rules:

- Only **whitelisted fields** are applied per endpoint (listed below); unknown
  field names (e.g. `filter[password_hash][like]=x`) are silently ignored.
- Multiple filters combine with AND.
- Filters combine freely with pagination; the cursor moves within the
  **filtered** result set, so when following cursors, keep the same filters,
  `sortBy`, and `sortOrder`.

---

## GET /api/restaurant — list restaurants

Public (no authentication).

**Sort fields (`sortBy`):** `createdAt` (default), `name`, `status`

**Filter fields:**

| Field    | Operators                | Notes |
|----------|--------------------------|-------|
| `id`     | `eq`, `gt`, `lt`, `gte`, `lte`, `in` | |
| `status` | `eq`, `in`               | values: `active`, `disabled`, `suspended`, `pending` |
| `name`   | `eq`, `like`             | `like` is case-insensitive |

**Item fields:** `id`, `ownerId`, `name`, `logoURL`, `status`, `createdAt`, `updatedAt`, `statusUpdatedAt`

```bash
# first page, 2 items, newest first
curl 'http://localhost:3000/api/restaurant?limit=2&sortOrder=desc'

# sort by name
curl 'http://localhost:3000/api/restaurant?sortBy=name'

# filters
curl 'http://localhost:3000/api/restaurant?filter[status][eq]=active'
curl 'http://localhost:3000/api/restaurant?filter[name][like]=pizza'
curl 'http://localhost:3000/api/restaurant?filter[id][in]=7,9'
curl 'http://localhost:3000/api/restaurant?filter[id][gt]=7&limit=1'   # + follow with cursor
```

Sample item:

```json
{
  "id": "7",
  "ownerId": "21",
  "name": "KFC",
  "logoURL": "",
  "status": "active",
  "createdAt": "2026-10-20T00:52:15.329Z",
  "updatedAt": "2026-10-20T00:53:37.166Z",
  "statusUpdatedAt": "2026-10-20T00:52:15.329Z"
}
```

---

## GET /api/branches/nearby — find nearby branches

Public (no authentication). Returns **active** branches of **active** restaurants
whose delivery radius covers the requested point (`ST_DWithin`, radius in km).

**Required params:** `lat`, `lng` — decimal degrees (WGS84), e.g. `?lat=29.10&lng=28.33`

**Caching:** full response is cached in Redis for **1 hour**, keyed by the exact
URL (method + path + query). Repeating an identical URL returns `X-Cache: HIT`
with the cached body; any query-parameter change produces a new key.

**Sort fields (`sortBy`):** `id`, `createdAt` (default), `restaurantName`, `label`

**Filter fields:**

| Field          | Operators                            | Notes |
|----------------|--------------------------------------|-------|
| `id`           | `eq`, `gt`, `lt`, `gte`, `lte`, `in` | branch id |
| `restaurantId` | `eq`, `in`, ...                      | branch's restaurant |
| `addressText`  | `eq`, `like`                         | |
| `label`        | `eq`, `like`                         | |

> Filter keys are camelCase (`restaurantId`, `addressText`). The former snake_case
> keys (`restaurant_id`, `address_text`) are no longer whitelisted and are ignored.

**Item fields:** `id`, `restaurantId`, `addressText`, `label`, `lat`, `lng`,
`isActive`, `acceptOrders`, `currency` (`EGP` | `SAR` | null), `restaurantName`,
`logoURL`, `createdAt` (cursor source).

```bash
# branches covering the point (default sort: createdAt asc)
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33'

# page through the result
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&limit=1'
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&limit=1&cursor=2026-10-20T00%3A54%3A13.121Z'

# other sort fields
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&sortBy=label'
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&sortBy=restaurantName'

# filters (each combinable with pagination)
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&filter[label][like]=Faisal'
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&filter[restaurantId][eq]=7'
curl 'http://localhost:3000/api/branches/nearby?lat=29.10&lng=28.33&filter[id][in]=6,8'
```

Sample item:

```json
{
  "id": "6",
  "restaurantId": "7",
  "addressText": "Faisal Street, Faisal, Giza, Egypt",
  "label": "KFC Faisal",
  "lat": "29.101200",
  "lng": "28.332100",
  "isActive": true,
  "acceptOrders": true,
  "currency": "EGP",
  "restaurantName": "KFC",
  "logoURL": "",
  "createdAt": "2026-10-20T00:54:13.121Z"
}
```

---

## Fallback & safety behavior (verified)

| Input                                      | Result |
|--------------------------------------------|--------|
| `sortBy` missing                           | sorts by `createdAt` |
| `sortBy` not in the endpoint's whitelist (e.g. `password`) | falls back to `createdAt` |
| `sortBy=id; DROP TABLE users;--`           | rejected by the whitelist; falls back to `createdAt`; no SQL executed |
| Legacy snake_case `sortBy=created_at`      | falls back to `createdAt` |
| `sortBy=`... camelCase field the endpoint allows | exact camelCase → snake_case SQL column mapping (`createdAt` → `created_at`, `restaurantName` → `r.name`, ...) |
| Unknown filter field                       | filter silently ignored |
| A cursor from `meta.nextCursor`            | exact page continuation (UTC-shift identifiers handled server-side, no duplicated/skipped rows across pages) |
| Hand-made cursor value                     | error (500) — always use `meta.nextCursor` |

**Note on mixed-type cursors:** dates returned by `toISOString()` are rebound
server-side as proper timestamps; numeric/string cursors (e.g. `id`, `name`) are
compared as strings/numbers.
