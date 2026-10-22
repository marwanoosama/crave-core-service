import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {Branch} from "../entity/branch.entity";
import {Currency} from "../enums";
import {
    applyCursorPagination,
    applyFilters,
    FilterParams,
    PaginationParams
} from "../../../lib/http/pagination/cursor-pagination";

const BRANCH_COLUMNS = ['id','restaurant_id','country_code','address_text','label','lat','lng',
    'is_active','opens_at','closes_at','accept_orders','created_at','updated_at',
    'delivery_radius','currency','commission','location'];

function toEntity(row: any) {
    return new Branch({
        id: row.id,
        restaurantId: row.restaurant_id,
        countryCode: row.country_code,
        addressText: row.address_text,
        label: row.label,
        lat: row.lat,
        lng: row.lng,
        isActive: row.is_active,
        opensAt: row.opens_at,
        closesAt: row.closes_at,
        acceptOrders: row.accept_orders,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deliveryRadius: row.delivery_radius,
        currency: row.currency,
        commission: row.commission,
        location: row.location
    });
}

export async function createBranch (data: Partial <Branch>, conn: Knex = db): Promise<Branch> {
    const [row] = await conn("restaurant_branches").insert({
        restaurant_id: data.restaurantId,
        country_code: data.countryCode,
        address_text: data.addressText,
        label: data.label,
        lat: data.lat,
        lng: data.lng,
        is_active: data.isActive,
        opens_at: data.opensAt,
        closes_at: data.closesAt,
        accept_orders: data.acceptOrders,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        delivery_radius: data.deliveryRadius,
        currency: data.currency,
        commission: data.commission
    }).returning(BRANCH_COLUMNS);

    return toEntity(row);
}

export async function findBranchesByRestaurant(restaurantId: number): Promise<Branch[]> {
    const rows = await db("restaurant_branches").select(BRANCH_COLUMNS).where("restaurant_id", restaurantId);
    return rows.map(toEntity);
}

export async function findBranchById(id: number): Promise<Branch | undefined> {
    const row = await db("restaurant_branches").select(BRANCH_COLUMNS).where("id", id).first();
    return row ? toEntity(row) : undefined;
}

export async function updateBranch(id: number, data: Record<string, any>): Promise<Branch> {
    const [row] = await db("restaurant_branches").where("id", id).update({
        label: data.label,
        address_text: data.addressText,
        lat: data.lat,
        lng: data.lng,
        opens_at: data.opensAt,
        closes_at: data.closesAt,
        delivery_radius: data.deliveryRadius,
        currency: data.currency,
        accept_orders: data.acceptOrders,
        updated_at: new Date(),
    }).returning(BRANCH_COLUMNS);
    return toEntity(row);
}

export async function updateBranchStatus(id: number, data: {isActive?: boolean, commission?: number}): Promise<Branch> {
    const [row] = await db("restaurant_branches").where("id", id).update({
        is_active: data.isActive,
        commission: data.commission,
        updated_at: new Date(),
    }).returning(BRANCH_COLUMNS);
    return toEntity(row);
}

export async function findNearbyBranches(lat: number, lng: number, params: PaginationParams, filters: FilterParams[]): Promise<NearbyBranch[]> {
    // camelCase API field -> qualified DB column (bare id/created_at/name are
    // ambiguous because this query joins restaurant_branches and restaurants;
    // camelCase filter/sort fields must map to qualified snake_case columns)
    const columnMap = {
        id: "b.id",
        label: "b.label",
        addressText: "b.address_text",
        restaurantId: "b.restaurant_id",
        createdAt: "b.created_at",
        restaurantName: "r.name"
    }

    let query: Knex.QueryBuilder = db('restaurant_branches as b')
        .select(
            'b.id',
            'b.restaurant_id as restaurant_id',
            'b.address_text',
            'b.label',
            'b.lat',
            'b.lng',
            'b.is_active',
            'b.accept_orders',
            'b.currency',
            'b.created_at',
            'r.name',
            'r.logo_url'
        )
        .join('restaurants as r', 'b.restaurant_id', 'r.id')
        .where('b.is_active', true)
        .where('r.status', 'active')
        .whereRaw(
            'ST_DWithin(b.location, ST_MakePoint(?, ?)::geography, b.delivery_radius * 1000)',
            [lng, lat]
        );

    query = applyCursorPagination(query, params, columnMap);
    query = applyFilters(query, filters, columnMap);

    const rows: any[] = await query;

    // inline mapping instead of toEntity(): the joined restaurant name/logo_url
    // don't belong to the Branch entity — but every field must be mapped from
    // snake_case to camelCase before leaving the repository.
    return rows.map((row) => ({
        id: row.id,
        restaurantId: row.restaurant_id,
        addressText: row.address_text,
        label: row.label,
        lat: row.lat,
        lng: row.lng,
        isActive: row.is_active,
        acceptOrders: row.accept_orders,
        currency: row.currency,
        restaurantName: row.name,
        logoURL: row.logo_url,
        createdAt: row.created_at,
    }));
}

// near-branches response shape: Branch fields (camelCase) plus the joined
// restaurant name and logo_url (logoURL matches the Restaurant entity field name)
export interface NearbyBranch {
    id: number;
    restaurantId: number;
    addressText: string;
    label: string;
    lat: number;
    lng: number;
    isActive: boolean;
    acceptOrders: boolean;
    currency: Currency | null;
    restaurantName: string;
    logoURL: string;
    createdAt: Date;
}