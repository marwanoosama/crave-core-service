# Schema: Core
Database: pgsql
Tables: 11
Columns are NOT NULL unless marked nullable.

## users
id: bigint PK
name: varchar
email: varchar unique
password_hash: varchar
system_role: enum
status: enum
created_at: timestamp
updated_at: timestamp

## password_resets
id: bigint PK
user_id: bigint FK
otp_hashed: varchar
expires_at: timestamp
created_at: timestamp
consumed_at: timestamp

## resturants
id: bigint PK
name: varchar
status: enum
logo_url: text
primary_country: varchar
created_at: timestamp
updated_at: timestamp

## resturant_branches
id: bigint PK
resturant_id: bigint FK
name: varchar
label: varchar
country_code: varchar
address_text: text
lng: decimal
lat: decimal
is_active: boolean
open_at: time
close_at: time
accept_orders: boolean
delivery_radius: int
currancy: varchar
commission: int
created_at: timestamp
updated_at: timestamp

## products
id: bigint PK
name: text
description: text nullable
image_url: text
is_active: boolean
resturant_id: bigint FK
created_at: timestamp
updated_at: timestamp

## product_branch_details
id: bigint PK
branch_id: bigint FK
product_id: bigint FK
price: bigint
stock: bigint
is_available: bigint

## resturant_members
id: bigint PK
user_id: bigint FK
resturant_id: bigint FK
status: text
role: enum
created_at: timestamp
updated_at: timestamp

## member_branch_access
member_id: bigint PK FK
branch_id: bigint PK FK

## permissions
id: bigint PK
resource: text
action: text

## role_permissions
id: bigint PK
role: enum
permission_id: bigint FK

## customer_addresses
id: bigint PK
user_id: bigint FK
label: varchar
text: text
lat: decimal
lng: decimal
is_default: boolean
created_at: timestamp
updated_at: timestamp

## Relationships
users.id → password_resets.user_id (one-to-many)
resturants.id → resturant_branches.resturant_id (one-to-many)
resturants.id → products.resturant_id (one-to-many)
products.id → product_branch_details.product_id (one-to-one)
resturant_branches.id → product_branch_details.branch_id (one-to-many)
users.id → resturant_members.user_id (one-to-one)
resturants.id → resturant_members.resturant_id (one-to-many)
resturant_members.user_id → member_branch_access.member_id (one-to-many)
resturant_branches.id → member_branch_access.branch_id (one-to-many)
permissions.id → role_permissions.permission_id (one-to-one)
users.id → customer_addresses.user_id (one-to-many)

---
If you suggest changes to this schema, ALSO return them as a DrawSQL patch: one fenced ```json code block, so I can apply them to my diagram. If you are only answering a question, skip the patch.

Patch rules:
- One JSON object with "strategy": "merge"; combine every change into that single patch.
- Reference tables and columns by name. Only include what changes — omit unchanged columns and unused optional fields.
- Column: {"name","type","length","is_primary_key","is_auto_increment","is_nullable","is_unique_key","is_index","is_unsigned","default","enum_values"} — use exact type names for pgsql as shown in the schema above.
- Relationship: {"type":"one-to-many","source_table":"users","source_column":"id","target_table":"posts","target_column":"user_id"} — for "one-to-many" the source is the "one" side; for "many-to-one" the source is the "many" (foreign-key) side. Prefer "one-to-many".
- Add "default_type" ("string" | "function" | "number" | "boolean") when a default could be misread — a literal string "CURRENT_TIMESTAMP" or "0" needs "default_type":"string".
- SET columns (MySQL) list their members in "set_values", not "enum_values".
- Index: {"indexes":[{"name":"idx_posts_user_created","type":"index","columns":["user_id","created_at"]}]} on its table — "type" is "index" or "unique"; delete via "deletions".
- Group: {"name":"Billing"}. A group never lists its members — put "parent_name":"Billing" on each table that belongs to it.
- Sticky note: {"sticky_notes":[{"content":"..."}]}.
- Delete via "deletions"; rename via "old_name". Do not include left/top coordinates.

Examples:
Add table: `{"strategy":"merge","tables":[{"name":"posts","comment":"Blog posts","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true},{"name":"user_id","type":"bigint","is_index":true},{"name":"title","type":"varchar","length":255},{"name":"body","type":"text","is_nullable":true},{"name":"created_at","type":"timestamp","is_nullable":true},{"name":"updated_at","type":"timestamp","is_nullable":true}]}]}`
Rename table and column (use old_name only when renaming): `{"strategy":"merge","tables":[{"name":"articles","old_name":"posts","columns":[{"name":"content","old_name":"body"}]}]}`
Delete: `{"strategy":"merge","deletions":{"tables":["tmp"],"columns":[{"table":"users","columns":["legacy"]}],"relationships":[{"source_table":"users","source_column":"id","target_table":"posts","target_column":"user_id"}]}}`
Multiple groups with nested tables (every table sets parent_name): `{"strategy":"merge","groups":[{"name":"Auth"},{"name":"Content"}],"tables":[{"name":"users","parent_name":"Auth","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]},{"name":"roles","parent_name":"Auth","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]},{"name":"posts","parent_name":"Content","columns":[{"name":"id","type":"bigint","is_primary_key":true,"is_auto_increment":true}]}]}`
