// Constantes de la aplicación
export const APP_CONFIG = {
    CACHE_TIME: {
        SHORT: 2 * 60 * 1000,      // 2 minutos
        MEDIUM: 5 * 60 * 1000,     // 5 minutos
        LONG: 10 * 60 * 1000,      // 10 minutos
    },
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100,
    },
    DEBOUNCE: {
        SEARCH: 300,                // 300ms para búsquedas
        FORM: 500,                  // 500ms para formularios
    }
};

export const COLLECTIONS = {
    PREDIOS: 'predios',
    CANCHAS: 'canchas',
    PARTIDOS: 'partidos',
    PRECIOS: 'precios',
    PROMOCIONES: 'promociones',
    DEPORTES: 'deportes',
    USUARIOS: 'users',
    USERS: 'users', // Alias para compatibilidad
    FRANJAS_HORARIAS: 'franjas_horarias',
    SERVICIOS: 'servicios',
    RESERVAS_CANCHAS: 'reservas_canchas',
};

export const ROLES = {
    ADMIN: 'admin',
    ADMIN_PREDIOS: 'admin_predios',
    CLIENTE: 'cliente',
    USUARIO: 'usuario',
};

export const ROLES_DISPLAY = {
    admin: 'Administrador Principal',
    admin_predios: 'Administrador de Predios',
    cliente: 'Cliente',
    usuario: 'Usuario'
};

export const ESTADOS_PARTIDO = {
    PENDIENTE: 'pendiente',
    CONFIRMADO: 'confirmado',
    CANCELADO: 'cancelado',
    COMPLETADO: 'completado',
};

export const ESTADOS_JUGADOR = {
    INVITADO: 'invitado',
    CONFIRMADO: 'confirmado',
    RECHAZADO: 'rechazado',
};

export const ESTADOS_PAGO = {
    PENDIENTE: 'pendiente',
    PAGADO: 'pagado',
    RECHAZADO: 'rechazado',
};

export const MEDIOS_PAGO = {
    TRANSFERENCIA: 'transferencia',
    MERCADOPAGO: 'mercadopago',
};

export const ESTADOS_RESERVA = {
    RESERVADA: 'reservada',
    OCUPADA: 'ocupada',
    DISPONIBLE: 'disponible',
    CANCELADA: 'cancelada',
    BLOQUEADA: 'bloqueada',
};

export const ESTADOS_RESERVA_DISPLAY = {
    reservada: 'Reservada',
    ocupada: 'Ocupada',
    disponible: 'Disponible',
    cancelada: 'Cancelada',
    bloqueada: 'Bloqueada',
};

