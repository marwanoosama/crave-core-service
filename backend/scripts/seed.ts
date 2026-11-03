/**
 * Seeds quickbite_core with a full demo dataset:
 *   - system admin, restaurant owners, branch managers, staff,
 *     customers, delivery agents
 *   - restaurants (EG + KSA), branches, product categories, products
 *     with per-branch price/stock, customer addresses
 *   - RBAC memberships (restaurant_members + member_branches)
 *
 * Wipes all domain data first (roles/permissions stay — they are
 * migration-seeded). Safe to re-run.
 *
 *   npx tsx scripts/seed.ts
 */
import bcrypt from "bcrypt";
import {db} from "../src/lib/knex/knex";

const PASSWORD = "Password123!";

interface SeedUser {
    email: string;
    phone: string;
    name: string;
    systemRole: "customer" | "delivery_agent" | "restaurant_user" | "system_admin";
}

const USERS: SeedUser[] = [
    {email: "admin@crave.io", phone: "+201000000001", name: "Platform Admin", systemRole: "system_admin"},
    {email: "owner1@crave.io", phone: "+201000000002", name: "Omar Hassan", systemRole: "restaurant_user"},
    {email: "owner2@crave.io", phone: "+201000000003", name: "Sara Ibrahim", systemRole: "restaurant_user"},
    {email: "owner3@crave.io", phone: "+201000000004", name: "Khaled Al-Saud", systemRole: "restaurant_user"},
    {email: "manager1@crave.io", phone: "+201000000005", name: "Mona Adel", systemRole: "restaurant_user"},
    {email: "manager2@crave.io", phone: "+201000000006", name: "Laila Mostafa", systemRole: "restaurant_user"},
    {email: "staff1@crave.io", phone: "+201000000007", name: "Ahmed Fouad", systemRole: "restaurant_user"},
    {email: "staff2@crave.io", phone: "+201000000008", name: "Faisal Al-Harbi", systemRole: "restaurant_user"},
    {email: "customer1@crave.io", phone: "+201000000009", name: "Mahmoud Samir", systemRole: "customer"},
    {email: "customer2@crave.io", phone: "+201000000010", name: "Nour El-Din", systemRole: "customer"},
    {email: "customer3@crave.io", phone: "+201111111111", name: "Reem Al-Otaibi", systemRole: "customer"},
    {email: "agent1@crave.io", phone: "+201000000011", name: "Hassan Gaber", systemRole: "delivery_agent"},
    {email: "agent2@crave.io", phone: "+201000000012", name: "Mostafa Kamel", systemRole: "delivery_agent"},
    {email: "agent3@crave.io", phone: "+201222222222", name: "Salman Al-Harbi", systemRole: "delivery_agent"},
];

interface SeedBranch {
    label: string;
    countryCode: string;
    addressText: string;
    lat: number;
    lng: number;
    opensAt: string;
    closesAt: string;
    deliveryRadius: number;
    currency: string;
    commission: number; // percent 0-100
    deliveryFee: number; // minor units
}

interface SeedProduct {
    name: string;
    description: string;
    imageUrl: string;
    category: string;
    // price + stock per branch label; minor units
    prices: Record<string, {price: number; stock: number}>;
}

interface SeedRestaurant {
    name: string;
    ownerEmail: string;
    logoUrl: string;
    primaryCountry: string;
    branches: SeedBranch[];
    categories: string[];
    products: SeedProduct[];
    members: {email: string; role: "owner" | "branch_manager" | "staff"; branchLabels: string[]}[];
}

const RESTAURANTS: SeedRestaurant[] = [
    {
        name: "Crave Burgers",
        ownerEmail: "owner1@crave.io",
        logoUrl: "https://cdn.crave.io/logos/crave-burgers.png",
        primaryCountry: "eg",
        branches: [
            {
                label: "Nasr City",
                countryCode: "eg",
                addressText: "12 Abbas El Akkad St, Nasr City, Cairo",
                lat: 30.0566,
                lng: 31.3302,
                opensAt: "10:00",
                closesAt: "02:00",
                deliveryRadius: 8,
                currency: "EGP",
                commission: 10,
                deliveryFee: 2500,
            },
            {
                label: "Maadi",
                countryCode: "eg",
                addressText: "9 Road 9, Maadi, Cairo",
                lat: 29.9602,
                lng: 31.2569,
                opensAt: "11:00",
                closesAt: "01:00",
                deliveryRadius: 6,
                currency: "EGP",
                commission: 10,
                deliveryFee: 2000,
            },
        ],
        categories: ["Burgers", "Sides", "Drinks"],
        products: [
            {
                name: "Classic Burger",
                description: "Beef patty, cheddar, lettuce, tomato, house sauce",
                imageUrl: "https://cdn.crave.io/products/classic-burger.png",
                category: "Burgers",
                prices: {"Nasr City": {price: 8500, stock: 40}, "Maadi": {price: 9000, stock: 25}},
            },
            {
                name: "Double Cheese Burger",
                description: "Two beef patties, double cheddar, pickles",
                imageUrl: "https://cdn.crave.io/products/double-cheese.png",
                category: "Burgers",
                prices: {"Nasr City": {price: 12000, stock: 30}, "Maadi": {price: 12500, stock: 20}},
            },
            {
                name: "Smoky BBQ Burger",
                description: "Beef patty, BBQ sauce, crispy onions, bacon",
                imageUrl: "https://cdn.crave.io/products/smoky-bbq.png",
                category: "Burgers",
                prices: {"Nasr City": {price: 15000, stock: 22}, "Maadi": {price: 15500, stock: 15}},
            },
            {
                name: "French Fries",
                description: "Crispy golden fries, medium",
                imageUrl: "https://cdn.crave.io/products/fries.png",
                category: "Sides",
                prices: {"Nasr City": {price: 3000, stock: 100}, "Maadi": {price: 3000, stock: 80}},
            },
            {
                name: "Onion Rings",
                description: "Battered onion rings, 8 pieces",
                imageUrl: "https://cdn.crave.io/products/onion-rings.png",
                category: "Sides",
                prices: {"Nasr City": {price: 3500, stock: 60}, "Maadi": {price: 3500, stock: 45}},
            },
            {
                name: "Cola",
                description: "Coca-Cola 330ml can",
                imageUrl: "https://cdn.crave.io/products/cola.png",
                category: "Drinks",
                prices: {"Nasr City": {price: 2500, stock: 120}, "Maadi": {price: 2500, stock: 90}},
            },
            {
                name: "Mineral Water",
                description: "Water 600ml bottle",
                imageUrl: "https://cdn.crave.io/products/water.png",
                category: "Drinks",
                prices: {"Nasr City": {price: 1000, stock: 150}, "Maadi": {price: 1000, stock: 110}},
            },
        ],
        members: [
            {email: "owner1@crave.io", role: "owner", branchLabels: []},
            {email: "manager1@crave.io", role: "branch_manager", branchLabels: ["Nasr City"]},
            {email: "staff1@crave.io", role: "staff", branchLabels: ["Nasr City"]},
        ],
    },
    {
        name: "Pizza Palace",
        ownerEmail: "owner2@crave.io",
        logoUrl: "https://cdn.crave.io/logos/pizza-palace.png",
        primaryCountry: "eg",
        branches: [
            {
                label: "Zamalek",
                countryCode: "eg",
                addressText: "4 Brazil St, Zamalek, Cairo",
                lat: 30.0609,
                lng: 31.2197,
                opensAt: "12:00",
                closesAt: "00:00",
                deliveryRadius: 5,
                currency: "EGP",
                commission: 12,
                deliveryFee: 3000,
            },
        ],
        categories: ["Pizzas", "Drinks"],
        products: [
            {
                name: "Margherita",
                description: "Tomato sauce, mozzarella, basil",
                imageUrl: "https://cdn.crave.io/products/margherita.png",
                category: "Pizzas",
                prices: {"Zamalek": {price: 12000, stock: 30}},
            },
            {
                name: "Pepperoni Pizza",
                description: "Tomato sauce, mozzarella, pepperoni",
                imageUrl: "https://cdn.crave.io/products/pepperoni.png",
                category: "Pizzas",
                prices: {"Zamalek": {price: 15000, stock: 25}},
            },
            {
                name: "Four Cheese Pizza",
                description: "Mozzarella, gorgonzola, parmesan, ricotta",
                imageUrl: "https://cdn.crave.io/products/four-cheese.png",
                category: "Pizzas",
                prices: {"Zamalek": {price: 18000, stock: 18}},
            },
            {
                name: "Cola",
                description: "Coca-Cola 330ml can",
                imageUrl: "https://cdn.crave.io/products/cola.png",
                category: "Drinks",
                prices: {"Zamalek": {price: 2500, stock: 100}},
            },
        ],
        members: [
            {email: "owner2@crave.io", role: "owner", branchLabels: []},
            {email: "manager2@crave.io", role: "branch_manager", branchLabels: ["Zamalek"]},
        ],
    },
    {
        name: "Shawarma House",
        ownerEmail: "owner3@crave.io",
        logoUrl: "https://cdn.crave.io/logos/shawarma-house.png",
        primaryCountry: "ksa",
        branches: [
            {
                label: "Olaya - Riyadh",
                countryCode: "ksa",
                addressText: "Olaya Main Rd, Riyadh",
                lat: 24.6932,
                lng: 46.6853,
                opensAt: "11:00",
                closesAt: "03:00",
                deliveryRadius: 7,
                currency: "SAR",
                commission: 10,
                deliveryFee: 1500,
            },
        ],
        categories: ["Sandwiches", "Plates", "Drinks"],
        products: [
            {
                name: "Chicken Shawarma Sandwich",
                description: "Chicken shawarma, garlic sauce, pickles",
                imageUrl: "https://cdn.crave.io/products/chicken-shawarma.png",
                category: "Sandwiches",
                prices: {"Olaya - Riyadh": {price: 1800, stock: 50}},
            },
            {
                name: "Beef Shawarma Sandwich",
                description: "Beef shawarma, tahini, onions",
                imageUrl: "https://cdn.crave.io/products/beef-shawarma.png",
                category: "Sandwiches",
                prices: {"Olaya - Riyadh": {price: 2200, stock: 40}},
            },
            {
                name: "Chicken Shawarma Plate",
                description: "Shawarma, rice, salad, garlic sauce",
                imageUrl: "https://cdn.crave.io/products/shawarma-plate.png",
                category: "Plates",
                prices: {"Olaya - Riyadh": {price: 3500, stock: 30}},
            },
            {
                name: "Cola",
                description: "Coca-Cola 330ml can",
                imageUrl: "https://cdn.crave.io/products/cola.png",
                category: "Drinks",
                prices: {"Olaya - Riyadh": {price: 500, stock: 120}},
            },
        ],
        members: [
            {email: "owner3@crave.io", role: "owner", branchLabels: []},
            {email: "staff2@crave.io", role: "staff", branchLabels: ["Olaya - Riyadh"]},
        ],
    },
];

const ADDRESSES: {email: string; label: string; country: string; city: string; street: string; building: string; apartment: string; type: "home" | "office" | "public_place"; lat: number; lng: number; isDefault: boolean}[] = [
    {email: "customer1@crave.io", label: "Home", country: "eg", city: "Cairo", street: "8 Abbas El Akkad St", building: "B12", apartment: "4A", type: "home", lat: 30.0617, lng: 31.3296, isDefault: true},
    {email: "customer1@crave.io", label: "Office", country: "eg", city: "New Cairo", street: "Road 90, The Five Tower", building: "TF", apartment: "702", type: "office", lat: 30.03, lng: 31.47, isDefault: false},
    {email: "customer2@crave.io", label: "Home", country: "eg", city: "Cairo", street: "12 Road 9", building: "Villa 34", apartment: "", type: "home", lat: 29.95, lng: 31.26, isDefault: true},
    {email: "customer3@crave.io", label: "Home", country: "ksa", city: "Riyadh", street: "King Fahd Rd", building: "Al Olaya Towers", apartment: "1103", type: "home", lat: 24.71, lng: 46.68, isDefault: true},
];

async function main() {
    console.log("Hashing password…");
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    console.log("Wiping existing domain data…");
    const trx = await db.transaction();
    try {
        await trx.raw(`TRUNCATE TABLE member_branches, restaurant_members, product_branch_details,
            products, product_categories, restaurant_branches, restaurants,
            customer_addresses, password_resets, events_outbox, users
            RESTART IDENTITY CASCADE`);

        console.log("Inserting users…");
        const userIds = new Map<string, number>();
        for (const u of USERS) {
            const [row] = await trx("users")
                .insert({
                    email: u.email,
                    phone: u.phone,
                    name: u.name,
                    password_hash: passwordHash,
                    system_role: u.systemRole,
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now(),
                })
                .returning("id");
            userIds.set(u.email, row.id);
            console.log(`  user #${row.id} ${u.email} (${u.systemRole})`);
        }

        const roleRows = await trx("roles").select("id", "name");
        const roleId = new Map(roleRows.map((r) => [r.name, r.id]));

        for (const r of RESTAURANTS) {
            console.log(`Seeding restaurant "${r.name}"…`);
            const [restaurant] = await trx("restaurants")
                .insert({
                    owner_id: userIds.get(r.ownerEmail)!,
                    name: r.name,
                    logo_url: r.logoUrl,
                    status: "active",
                    primary_country: r.primaryCountry,
                    created_at: trx.fn.now(),
                    updated_at: trx.fn.now(),
                    status_updated_at: trx.fn.now(),
                })
                .returning("id");
            console.log(`  restaurant #${restaurant.id}`);

            const branchIds = new Map<string, number>();
            for (const b of r.branches) {
                const [row] = await trx("restaurant_branches")
                    .insert({
                        restaurant_id: restaurant.id,
                        country_code: b.countryCode,
                        address_text: b.addressText,
                        label: b.label,
                        lat: b.lat,
                        lng: b.lng,
                        is_active: true,
                        opens_at: b.opensAt,
                        closes_at: b.closesAt,
                        accept_orders: true,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now(),
                        delivery_radius: b.deliveryRadius,
                        currency: b.currency,
                        commission: b.commission,
                        delivery_fee: b.deliveryFee,
                    })
                    .returning("id");
                branchIds.set(b.label, row.id);
                console.log(`  branch #${row.id} "${b.label}"`);
            }

            const categoryIds = new Map<string, number>();
            for (const c of r.categories) {
                const [row] = await trx("product_categories")
                    .insert({
                        restaurant_id: restaurant.id,
                        name: c,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now(),
                    })
                    .returning("id");
                categoryIds.set(c, row.id);
            }

            for (const p of r.products) {
                // The trg_product_after_insert trigger auto-creates a
                // product_branch_details row per branch (price 0, stock 0,
                // unavailable). Insert then update those rows with the real
                // price/stock.
                const [product] = await trx("products")
                    .insert({
                        name: p.name,
                        description: p.description,
                        image_url: p.imageUrl,
                        restaurant_id: restaurant.id,
                        category_id: categoryIds.get(p.category)!,
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now(),
                    })
                    .returning("id");

                for (const [branchLabel, {price, stock}] of Object.entries(p.prices)) {
                    await trx("product_branch_details")
                        .where({branch_id: branchIds.get(branchLabel)!, product_id: product.id})
                        .update({price, stock, is_available: true});
                }
                console.log(`  product #${product.id} ${p.name}`);
            }

            for (const m of r.members) {
                const [member] = await trx("restaurant_members")
                    .insert({
                        restaurant_id: restaurant.id,
                        user_id: userIds.get(m.email)!,
                        role_id: roleId.get(m.role)!,
                        status: "active",
                        created_at: trx.fn.now(),
                        updated_at: trx.fn.now(),
                    })
                    .returning("id");
                if (m.branchLabels.length > 0) {
                    await trx("member_branches").insert(
                        m.branchLabels.map((label) => ({
                            member_id: member.id,
                            branch_id: branchIds.get(label)!,
                            created_at: trx.fn.now(),
                        })),
                    );
                }
                console.log(`  member #${member.id} ${m.email} (${m.role})`);
            }
        }

        console.log("Seeding customer addresses…");
        for (const a of ADDRESSES) {
            const [row] = await trx("customer_addresses").insert({
                user_id: userIds.get(a.email)!,
                label: a.label,
                country: a.country,
                city: a.city,
                street: a.street,
                building: a.building,
                apartment_number: a.apartment,
                type: a.type,
                lat: a.lat,
                lng: a.lng,
                is_default: a.isDefault,
            }).returning("id");
            console.log(`  address #${row.id} for ${a.email} (${a.label})`);
        }

        await trx.commit();
    } catch (err) {
        await trx.rollback();
        throw err;
    }

    console.log("\nSeed complete.");
    console.log(`Login with any seeded email + password "${PASSWORD}"`);
    await db.destroy();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
