import {Restaurant} from "../entity/restaurant.entity";
import {db} from "../../../common/knex/knex";
import {Knex} from "knex";

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

export async function findAll() : Promise<Restaurant[]>{
    const rows = await db("restaurants").select(RESTAURANT_COLUMNS);
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