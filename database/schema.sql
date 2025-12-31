-- ============================================
-- ESQUEMA COMPLETO DE BASE DE DATOS - PLAYUP
-- MySQL 8.0+
-- ============================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS playup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE playup;

-- ============================================
-- TABLAS DE CONFIGURACIÓN Y CATÁLOGOS
-- ============================================

-- Tabla de roles del sistema
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_roles_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de deportes
CREATE TABLE deportes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_deportes_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de franjas horarias
CREATE TABLE franjas_horarias (
    id VARCHAR(50) PRIMARY KEY,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_franjas_activo (activo),
    INDEX idx_franjas_horario (hora_inicio, hora_fin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de servicios adicionales
CREATE TABLE servicios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) DEFAULT 0.00,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_servicios_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE USUARIOS Y AUTENTICACIÓN
-- ============================================

-- Tabla de usuarios
CREATE TABLE usuarios (
    id VARCHAR(50) PRIMARY KEY, -- Firebase UID o ID generado
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    avatar VARCHAR(500),
    provider VARCHAR(50) DEFAULT 'firebase', -- 'firebase', 'google', 'facebook'
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_email (email),
    INDEX idx_usuarios_activo (activo),
    INDEX idx_usuarios_provider (provider)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia: usuarios y roles (muchos a muchos)
CREATE TABLE usuario_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL,
    rol_id VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_rol (usuario_id, rol_id),
    INDEX idx_usuario_roles_usuario (usuario_id),
    INDEX idx_usuario_roles_rol (rol_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE PREDIOS Y CANCHAS
-- ============================================

-- Tabla de predios (sedes/ubicaciones)
CREATE TABLE predios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    direccion VARCHAR(500),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    telefono VARCHAR(20),
    email VARCHAR(255),
    -- Configuración de reservas
    dias_anticipacion INT DEFAULT 30, -- Días hacia adelante que se pueden reservar
    tipo_pago ENUM('reserva', 'total') DEFAULT 'total',
    tipo_reserva ENUM('monto', 'porcentaje') NULL, -- Solo si tipo_pago = 'reserva'
    valor_reserva DECIMAL(10, 2) NULL, -- Monto fijo o porcentaje según tipo_reserva
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_predios_ciudad (ciudad),
    INDEX idx_predios_provincia (provincia),
    INDEX idx_predios_activo (activo),
    INDEX idx_predios_ubicacion (latitud, longitud)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla intermedia: usuarios admin_predios y predios asignados
CREATE TABLE usuario_predios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL,
    predio_id VARCHAR(50) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_predio (usuario_id, predio_id),
    INDEX idx_usuario_predios_usuario (usuario_id),
    INDEX idx_usuario_predios_predio (predio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de canchas
CREATE TABLE canchas (
    id VARCHAR(50) PRIMARY KEY,
    predio_id VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    numero VARCHAR(50), -- Para ordenar (ej: "1", "2", "A", "B")
    deporte VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- '5', '7', '8', '11', etc.
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    INDEX idx_canchas_predio (predio_id),
    INDEX idx_canchas_deporte (deporte),
    INDEX idx_canchas_tipo (tipo),
    INDEX idx_canchas_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de características de canchas (dinámico)
CREATE TABLE cancha_caracteristicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancha_id VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL, -- Ej: "Techada", "Tipo de superficie"
    valor VARCHAR(255) NOT NULL, -- Ej: "Sí", "Césped sintético"
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    INDEX idx_cancha_caracteristicas_cancha (cancha_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE PRECIOS Y PROMOCIONES
-- ============================================

-- Tabla de precios
CREATE TABLE precios (
    id VARCHAR(50) PRIMARY KEY,
    cancha_id VARCHAR(50) NOT NULL,
    franja_horaria_id VARCHAR(50) NOT NULL,
    dia_semana VARCHAR(10) NOT NULL, -- '0' (Domingo) a '6' (Sábado) o 'feriado'
    precio DECIMAL(10, 2) NOT NULL,
    es_feriado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    FOREIGN KEY (franja_horaria_id) REFERENCES franjas_horarias(id) ON DELETE CASCADE,
    INDEX idx_precios_cancha (cancha_id),
    INDEX idx_precios_franja (franja_horaria_id),
    INDEX idx_precios_dia (dia_semana),
    INDEX idx_precios_activo (activo),
    UNIQUE KEY unique_precio_cancha_franja_dia (cancha_id, franja_horaria_id, dia_semana, es_feriado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de promociones
CREATE TABLE promociones (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cancha_id VARCHAR(50),
    predio_id VARCHAR(50),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0.00,
    descuento_monto DECIMAL(10, 2) DEFAULT 0.00,
    activa BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE CASCADE,
    INDEX idx_promociones_cancha (cancha_id),
    INDEX idx_promociones_predio (predio_id),
    INDEX idx_promociones_fechas (fecha_inicio, fecha_fin),
    INDEX idx_promociones_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE RESERVAS Y DISPONIBILIDAD
-- ============================================

-- Tabla de reservas/ocupaciones de canchas
-- Esta tabla controla el estado de disponibilidad de las canchas por horario
CREATE TABLE reservas_canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cancha_id VARCHAR(50) NOT NULL,
    partido_id VARCHAR(50) NULL, -- NULL si es una reserva bloqueada sin partido
    fecha DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('reservada', 'ocupada', 'disponible', 'cancelada', 'bloqueada') DEFAULT 'reservada',
    motivo VARCHAR(255), -- Razón de bloqueo o cancelación
    creado_por VARCHAR(50), -- Usuario que creó la reserva
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE CASCADE,
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE SET NULL,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_reservas_cancha (cancha_id),
    INDEX idx_reservas_partido (partido_id),
    INDEX idx_reservas_fecha (fecha),
    INDEX idx_reservas_estado (estado),
    INDEX idx_reservas_fecha_hora (fecha, hora_inicio, hora_fin),
    INDEX idx_reservas_cancha_fecha (cancha_id, fecha, estado)
    -- Nota: No se usa UNIQUE KEY aquí porque puede haber múltiples reservas para el mismo horario
    -- pero con diferentes estados. La validación de solapamientos se hace en los stored procedures
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLAS DE PARTIDOS
-- ============================================

-- Tabla de partidos
CREATE TABLE partidos (
    id VARCHAR(50) PRIMARY KEY,
    creador_id VARCHAR(50) NOT NULL,
    creador_nombre VARCHAR(255) NOT NULL,
    creador_email VARCHAR(255) NOT NULL,
    cancha_id VARCHAR(50) NOT NULL,
    cancha_nombre VARCHAR(255) NOT NULL,
    cancha_direccion VARCHAR(500),
    predio_id VARCHAR(50) NOT NULL, -- Agregado para facilitar queries
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    hora_fin TIME NOT NULL,
    franja_horaria_id VARCHAR(50) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- '5', '7', '8', '11', etc.
    descripcion TEXT,
    precio_total DECIMAL(10, 2) NOT NULL,
    precio_por_jugador DECIMAL(10, 2) NOT NULL,
    precio_id VARCHAR(50), -- Referencia al precio usado
    estado ENUM('pendiente', 'confirmado', 'cancelado', 'completado', 'activo') DEFAULT 'pendiente',
    -- Grupo de Telegram
    grupo_telegram_link VARCHAR(500),
    grupo_telegram_activo BOOLEAN DEFAULT FALSE,
    -- Array de IDs de jugadores para indexación rápida
    jugadores_ids JSON, -- Array de IDs de usuarios
    -- Estado de reserva de la cancha
    reserva_id INT NULL, -- Referencia a la reserva de cancha
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (cancha_id) REFERENCES canchas(id) ON DELETE RESTRICT,
    FOREIGN KEY (predio_id) REFERENCES predios(id) ON DELETE RESTRICT,
    FOREIGN KEY (franja_horaria_id) REFERENCES franjas_horarias(id) ON DELETE RESTRICT,
    FOREIGN KEY (reserva_id) REFERENCES reservas_canchas(id) ON DELETE SET NULL,
    INDEX idx_partidos_creador (creador_id),
    INDEX idx_partidos_cancha (cancha_id),
    INDEX idx_partidos_predio (predio_id),
    INDEX idx_partidos_fecha (fecha),
    INDEX idx_partidos_estado (estado),
    INDEX idx_partidos_fecha_hora (fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de jugadores por partido
CREATE TABLE jugadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partido_id VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(50), -- NULL si no es usuario registrado
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    telegram_username VARCHAR(100),
    estado ENUM('invitado', 'confirmado', 'rechazado') DEFAULT 'invitado',
    agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_jugadores_partido (partido_id),
    INDEX idx_jugadores_usuario (usuario_id),
    INDEX idx_jugadores_estado (estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de pagos por partido
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partido_id VARCHAR(50) NOT NULL,
    usuario_id VARCHAR(50) NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    medio_pago ENUM('transferencia', 'mercadopago') NOT NULL,
    estado ENUM('pendiente', 'pagado', 'rechazado') DEFAULT 'pendiente',
    referencia VARCHAR(255), -- Número de transferencia, ID de MercadoPago, etc.
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    INDEX idx_pagos_partido (partido_id),
    INDEX idx_pagos_usuario (usuario_id),
    INDEX idx_pagos_estado (estado),
    UNIQUE KEY unique_pago_partido_usuario (partido_id, usuario_id) -- Un pago por usuario por partido
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de servicios por partido
CREATE TABLE servicios_partido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    partido_id VARCHAR(50) NOT NULL,
    servicio_id VARCHAR(50) NOT NULL,
    servicio_nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    agregado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (partido_id) REFERENCES partidos(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE RESTRICT,
    INDEX idx_servicios_partido_partido (partido_id),
    INDEX idx_servicios_partido_servicio (servicio_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA DE FERIADOS (opcional, para mejor gestión)
-- ============================================

CREATE TABLE feriados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_feriados_fecha (fecha),
    INDEX idx_feriados_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Usuarios con sus roles
CREATE OR REPLACE VIEW v_usuarios_con_roles AS
SELECT 
    u.id,
    u.nombre,
    u.email,
    u.telefono,
    u.avatar,
    u.provider,
    u.activo,
    GROUP_CONCAT(r.nombre ORDER BY r.nombre SEPARATOR ',') AS roles,
    GROUP_CONCAT(r.display_name ORDER BY r.nombre SEPARATOR ', ') AS roles_display,
    u.creado_en,
    u.actualizado_en
FROM usuarios u
LEFT JOIN usuario_roles ur ON u.id = ur.usuario_id
LEFT JOIN roles r ON ur.rol_id = r.id
GROUP BY u.id, u.nombre, u.email, u.telefono, u.avatar, u.provider, u.activo, u.creado_en, u.actualizado_en;

-- Vista: Disponibilidad de canchas por fecha
CREATE OR REPLACE VIEW v_disponibilidad_canchas AS
SELECT 
    c.id AS cancha_id,
    c.nombre AS cancha_nombre,
    c.predio_id,
    pr.nombre AS predio_nombre,
    rc.fecha,
    rc.hora_inicio,
    rc.hora_fin,
    rc.estado AS estado_reserva,
    rc.partido_id,
    CASE 
        WHEN rc.estado IN ('reservada', 'ocupada', 'bloqueada') THEN FALSE
        ELSE TRUE
    END AS disponible
FROM canchas c
INNER JOIN predios pr ON c.predio_id = pr.id
LEFT JOIN reservas_canchas rc ON c.id = rc.cancha_id 
    AND rc.estado IN ('reservada', 'ocupada', 'bloqueada')
WHERE c.activa = TRUE
ORDER BY c.id, rc.fecha, rc.hora_inicio;

-- Vista: Partidos con información completa
CREATE OR REPLACE VIEW v_partidos_completos AS
SELECT 
    p.id,
    p.creador_id,
    p.creador_nombre,
    p.creador_email,
    p.cancha_id,
    p.cancha_nombre,
    p.cancha_direccion,
    p.predio_id,
    pr.nombre AS predio_nombre,
    pr.ciudad AS predio_ciudad,
    p.fecha,
    p.hora,
    p.hora_fin,
    p.franja_horaria_id,
    fh.hora_inicio AS franja_hora_inicio,
    fh.hora_fin AS franja_hora_fin,
    p.tipo,
    p.descripcion,
    p.precio_total,
    p.precio_por_jugador,
    p.estado,
    p.grupo_telegram_link,
    p.grupo_telegram_activo,
    p.reserva_id,
    rc.estado AS estado_reserva,
    COUNT(DISTINCT j.id) AS total_jugadores,
    COUNT(DISTINCT CASE WHEN j.estado = 'confirmado' THEN j.id END) AS jugadores_confirmados,
    COUNT(DISTINCT pa.id) AS total_pagos,
    SUM(CASE WHEN pa.estado = 'pagado' THEN pa.monto ELSE 0 END) AS monto_pagado,
    SUM(CASE WHEN pa.estado = 'pendiente' THEN pa.monto ELSE 0 END) AS monto_pendiente,
    p.creado_en,
    p.actualizado_en
FROM partidos p
LEFT JOIN predios pr ON p.predio_id = pr.id
LEFT JOIN franjas_horarias fh ON p.franja_horaria_id = fh.id
LEFT JOIN reservas_canchas rc ON p.reserva_id = rc.id
LEFT JOIN jugadores j ON p.id = j.partido_id
LEFT JOIN pagos pa ON p.id = pa.partido_id
GROUP BY p.id, p.creador_id, p.creador_nombre, p.creador_email, p.cancha_id, p.cancha_nombre, 
         p.cancha_direccion, p.predio_id, pr.nombre, pr.ciudad, p.fecha, p.hora, p.hora_fin, 
         p.franja_horaria_id, fh.hora_inicio, fh.hora_fin, p.tipo, p.descripcion, p.precio_total, 
         p.precio_por_jugador, p.estado, p.grupo_telegram_link, p.grupo_telegram_activo, 
         p.reserva_id, rc.estado, p.creado_en, p.actualizado_en;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar roles por defecto
INSERT INTO roles (id, nombre, display_name, descripcion) VALUES
('admin', 'admin', 'Administrador Principal', 'Acceso total al panel de administración'),
('admin_predios', 'admin_predios', 'Administrador de Predios', 'Puede gestionar predios y canchas específicas asignadas'),
('cliente', 'cliente', 'Cliente', 'Usuario estándar con acceso a la creación y gestión de partidos'),
('usuario', 'usuario', 'Usuario', 'Rol base para cualquier usuario registrado')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

-- ============================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ============================================

-- Índices compuestos para consultas frecuentes
CREATE INDEX idx_partidos_creador_fecha ON partidos(creador_id, fecha DESC);
CREATE INDEX idx_partidos_cancha_fecha ON partidos(cancha_id, fecha DESC);
CREATE INDEX idx_precios_cancha_dia ON precios(cancha_id, dia_semana, activo);
CREATE INDEX idx_jugadores_partido_estado ON jugadores(partido_id, estado);
CREATE INDEX idx_reservas_activas ON reservas_canchas(cancha_id, fecha, estado, hora_inicio, hora_fin);

-- ============================================
-- COMENTARIOS FINALES
-- ============================================

-- Este esquema está diseñado para:
-- 1. Escalabilidad: Índices optimizados para consultas frecuentes
-- 2. Integridad referencial: Foreign keys con acciones apropiadas
-- 3. Flexibilidad: Campos JSON para datos dinámicos
-- 4. Auditoría: Timestamps automáticos en todas las tablas
-- 5. Soft deletes: Campo 'activo' en lugar de borrado físico
-- 6. Normalización: Estructura 3NF con relaciones bien definidas

