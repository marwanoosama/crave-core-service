import {Restaurant} from "../entity/restaurant.entity";
import {db} from "../../../lib/knex/knex";
import {Knex} from "knex";
import {RestaurantStatus} from "../enums";
import {
    applyCursorPagination,
    applyFilters,
    FilterParams,
    PaginationParams
} from "../../../lib/http/pagination/cursor-pagination";

const RESTAURANT_COLUMNS = ['id', 'owner_id', 'name', 'logo_url', 'status', 'primary_country',
    'created_at', 'updated_at', 'status_updated_at'];

function toEntity(row: any){
    return new Restaurant({
       id: row.id,
       ownerId: row.owner_id,
       name: row.name,
       logoURL: row.logo_url,
       status: row.status,
       createdAt: row.created_at,
       updatedAt: row.updated_at,
       statusUpdatedAt: row.status_updated_at
    });
}

export async function findAll(params: PaginationParams, filters: FilterParams[]) : Promise<Restaurant[]>{
    let query = db("restaurants").select(RESTAURANT_COLUMNS);
    query = applyFilters(query, filters);
    query = applyCursorPagination(query, params);
    const rows = await query;
    return rows.map(toEntity);
}

export async function findById(id: number) : Promise<Restaurant | undefined> {
    const row = await db("restaurants").select(RESTAURANT_COLUMNS).where("id", id).first();

    return row ? toEntity(row) : undefined;
}

export async function createRestaurant(data : Partial<Restaurant>, conn: Knex = db) : Promise<Restaurant> {
    const [row] = await conn("restaurants").insert({
        owner_id: data.ownerId,
        name: data.name,
        logo_url: data.logoURL,
        status: data.status,
        primary_country: data.primaryCountry,
        created_at: data.createdAt,
        updated_at: data.updatedAt,
        status_updated_at: data.statusUpdatedAt
    }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}

export async function updateRestaurant(id: number, data: {name?: string, logoUrl?: string, primaryCountry?: string}): Promise<Restaurant> {
    const [row] = await db("restaurants").where("id", id).update({
        name: data.name,
        logo_url: data.logoUrl,
        primary_country: data.primaryCountry,
        updated_at: new Date(),
    }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}

export async function updateRestaurantStatus(id: number, status: RestaurantStatus, conn: Knex = db){
    const now = new Date();
    const [row] = await conn("restaurants").where("id", id).update({
        status,
        status_updated_at: now,
        updated_at: now,
    }).returning(RESTAURANT_COLUMNS);

    return toEntity(row);
}