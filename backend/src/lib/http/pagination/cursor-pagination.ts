import {Knex} from "knex";

// sortBy arrives from the API in camelCase (entity field names); DB columns are snake_case.
export function toSnakeCase(value: string): string {
    return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// matches only ISO-8601 dates produced by Date#toISOString() (nextCursor values),
// so numeric/string cursors are never misinterpreted
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?Z$/;

export interface PaginationParams{
    cursor?: string;
    limit: number;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

export interface FilterParams{
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'lte' | 'gte' | 'in' | 'like';
    value: string | string[]
}

export interface PaginationMeta{
    nextCursor: string | null
    hasMore: boolean;
    count: number;
}

export function applyCursorPagination<T>(query: Knex.QueryBuilder, params: PaginationParams, columnMap?: Record<string, string>): Knex.QueryBuilder{
    if(!params.sortBy){
        return query;
    }

    // resolve the DB column: explicit camelCase-keyed map first (for qualified/aliased
    // columns in joins), otherwise convert camelCase to snake_case automatically
    const sortBy = columnMap?.[params.sortBy] ?? toSnakeCase(params.sortBy);
    if(params.cursor){
        const op = params.sortOrder === 'asc' ? '>' : '<';
        // rebind ISO date cursors as Date objects: DB timestamps are TIMESTAMP WITHOUT
        // TIME ZONE, so a raw "...Z" string would be compared as raw wall-clock and
        // shift rows across pages by the server's UTC offset (duplicates when asc, gaps when desc)
        const cursorValue = ISO_DATE_PATTERN.test(params.cursor) ? new Date(params.cursor) : params.cursor;
        query = query.where(sortBy, op, cursorValue);
    }

    return query.orderBy(sortBy, params.sortOrder).limit(params.limit + 1);
}

export function applyFilters<T>(query: Knex.QueryBuilder, filters: FilterParams[], columnMap?: Record<string, string>): Knex.QueryBuilder{
    for(const filter of filters){
        const fieldMapped = columnMap?.[filter.field] ?? filter.field;
        switch (filter.operator){
            case 'eq': query.where(fieldMapped, filter.value); break;
            case 'gt': query.where(fieldMapped, '>', filter.value); break;
            case 'lt': query.where(fieldMapped, '<', filter.value); break;
            case 'lte': query.where(fieldMapped, '<=', filter.value); break;
            case 'gte': query.where(fieldMapped, '>=', filter.value); break;
            case 'like': query.whereILike(fieldMapped, `%${filter.value}%`); break;
            case 'in': query.whereIn(fieldMapped, Array.isArray(filter.value) ? filter.value : [filter.value]); break;
        }
    }

    return query;
}

    export function buildPaginationResult<T>(rows: T[], limit: number, sortBy: string): { data: T[]; meta: PaginationMeta } {
        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;

        let nextCursor: string | null = null;

        if (hasMore && data.length > 0) {
            const lastItem = data[data.length - 1] as any;
            const key = sortByMap[sortBy] ?? sortBy;
            const value = lastItem[key];

            if (value != null) {
                nextCursor = value instanceof Date ? value.toISOString() : String(value);
            }
        }

        return {
            data,
            meta: {
                nextCursor,
                hasMore,
                count: data.length
            }
        };
    }

    // mapping for next cursor field in pagination params (snake case in db, camel case in app)
    const sortByMap: Record<string, string> = {
        created_at: 'createdAt',
        updated_at: 'updatedAt',
    };