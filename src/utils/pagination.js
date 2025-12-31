// Utilidades para paginación
export const createPaginationQuery = (baseQuery, page, pageSize) => {
    // Para Firestore, necesitas usar startAfter con el último documento
    // Esto es un helper que puedes usar cuando implementes paginación real
    return {
        query: baseQuery,
        page,
        pageSize,
        // startAfter se agregará dinámicamente cuando tengas el último doc
    };
};

export const getPaginationMeta = (total, page, pageSize) => {
    const totalPages = Math.ceil(total / pageSize);
    return {
        page,
        pageSize,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
    };
};


