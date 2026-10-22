import {PaginationParams, FilterParams} from "./cursor-pagination";

export function parsePaginationQuery(query : Record<string, any>, allowedSortBy: string[]): PaginationParams {
    return {
        cursor: query.cursor || null,
        limit: query.limit ? Math.min(1000, Number(query.limit)) : 20,
        // whitelist: fall back to the default sort field when sortBy is missing or not allowed
        sortBy: allowedSortBy.includes(query.sortBy) ? query.sortBy : 'createdAt',
        sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc'
    }
}

// filter
// GET /api/users?filter[status][eq]=active&filter[age][gte]=25&filter[age][lte]=40&filter[id][in]=1,2,3
// {
//     filter: {
//         age: { gte: '25', lte: '40' },
//         status: { eq: 'active' },
//        id: { in: '1,2,3' }
//     }
// }

export function parseFilters(query: Record<string, any>, allowedFields: string[]): FilterParams[] {
    const filter = query.filter;
    if (!filter || typeof filter !== 'object') return [];

    const allowedOps = new Set(['eq', 'gt', 'lt', 'gte', 'lte', 'like', 'in']);

    return allowedFields.flatMap((field) => {
        const fieldFilters = filter[field];
        if (!fieldFilters || typeof fieldFilters !== 'object') return [];

        return Object.entries(fieldFilters)
            .filter(([op]) => allowedOps.has(op))
            .map(([operator, value]) => {
                // 'in' accepts comma-separated lists: filter[id][in]=7,9 -> ['7','9']
                const finalValue = operator === 'in' && typeof value === 'string'
                    ? value.split(',')
                    : value;
                return {
                    field,
                    operator: operator as FilterParams['operator'],
                    value: finalValue as string | string[],
                };
            });
    });
}