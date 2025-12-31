-- =========================
-- Base de datos
-- =========================
CREATE DATABASE IF NOT EXISTS playup
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE playup;

-- =========================
-- Usuarios
-- =========================
CREATE TABLE usuarios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  telefono VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('jugador','organizador','admin_complejo') NOT NULL DEFAULT 'jugador',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =========================
-- Deportes
-- =========================
CREATE TABLE deportes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO deportes (nombre) VALUES ('Fútbol'), ('Pádel');

-- =========================
-- Complejos
-- =========================
CREATE TABLE complejos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  latitud DECIMAL(10,7),
  longitud DECIMAL(10,7),
  telefono VARCHAR(20),
  usuario_admin_id BIGINT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_complejo_admin
    FOREIGN KEY (usuario_admin_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================
-- Canchas
-- =========================
CREATE TABLE canchas (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  complejo_id BIGINT NOT NULL,
  deporte_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(50), -- futbol 5, futbol 7, padel doble, etc
  activa BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_cancha_complejo
    FOREIGN KEY (complejo_id) REFERENCES complejos(id),
  CONSTRAINT fk_cancha_deporte
    FOREIGN KEY (deporte_id) REFERENCES deportes(id)
) ENGINE=InnoDB;

-- =========================
-- Franjas horarias
-- =========================
CREATE TABLE franjas_horarias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL
) ENGINE=InnoDB;

-- =========================
-- Precios por cancha
-- =========================
CREATE TABLE precios_cancha (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cancha_id BIGINT NOT NULL,
  franja_horaria_id INT NOT NULL,
  dia_semana TINYINT NOT NULL COMMENT '1=Lunes ... 7=Domingo',
  precio DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_precio_cancha
    FOREIGN KEY (cancha_id) REFERENCES canchas(id),
  CONSTRAINT fk_precio_franja
    FOREIGN KEY (franja_horaria_id) REFERENCES franjas_horarias(id),
  UNIQUE KEY uq_precio (cancha_id, franja_horaria_id, dia_semana)
) ENGINE=InnoDB;

-- =========================
-- Partidos (Reserva)
-- =========================
CREATE TABLE partidos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cancha_id BIGINT NOT NULL,
  organizador_id BIGINT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  precio_total DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','confirmado','cancelado') DEFAULT 'pendiente',
  grabacion BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_partido_cancha
    FOREIGN KEY (cancha_id) REFERENCES canchas(id),
  CONSTRAINT fk_partido_organizador
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================
-- Jugadores por partido
-- =========================
CREATE TABLE partido_jugadores (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  partido_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  estado ENUM('invitado','confirmado','rechazado') DEFAULT 'invitado',
  monto DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_pj_partido
    FOREIGN KEY (partido_id) REFERENCES partidos(id),
  CONSTRAINT fk_pj_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uq_partido_usuario (partido_id, usuario_id)
) ENGINE=InnoDB;

-- =========================
-- Pagos
-- =========================
CREATE TABLE pagos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  partido_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  medio_pago ENUM('transferencia','mercadopago') NOT NULL,
  monto DECIMAL(10,2) NOT NULL,
  estado ENUM('pendiente','pagado','rechazado') DEFAULT 'pendiente',
  referencia VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pago_partido
    FOREIGN KEY (partido_id) REFERENCES partidos(id),
  CONSTRAINT fk_pago_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================
-- Servicios adicionales
-- =========================
CREATE TABLE servicios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

INSERT INTO servicios (nombre) VALUES ('Grabación Beelup');

-- =========================
-- Servicios por partido
-- =========================
CREATE TABLE partido_servicios (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  partido_id BIGINT NOT NULL,
  servicio_id INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_ps_partido
    FOREIGN KEY (partido_id) REFERENCES partidos(id),
  CONSTRAINT fk_ps_servicio
    FOREIGN KEY (servicio_id) REFERENCES servicios(id),
  UNIQUE KEY uq_partido_servicio (partido_id, servicio_id)
) ENGINE=InnoDB;

-- =========================
-- Bolsa de partidos (matchmaking)
-- =========================
CREATE TABLE bolsa_partidos (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  deporte_id INT NOT NULL,
  fecha DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  latitud DECIMAL(10,7),
  longitud DECIMAL(10,7),
  creador_id BIGINT NOT NULL,
  estado ENUM('abierto','cerrado') DEFAULT 'abierto',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bolsa_deporte
    FOREIGN KEY (deporte_id) REFERENCES deportes(id),
  CONSTRAINT fk_bolsa_creador
    FOREIGN KEY (creador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- =========================
-- Postulaciones a bolsa
-- =========================
CREATE TABLE bolsa_postulaciones (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bolsa_partido_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  estado ENUM('pendiente','aceptado','rechazado') DEFAULT 'pendiente',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_post_bolsa
    FOREIGN KEY (bolsa_partido_id) REFERENCES bolsa_partidos(id),
  CONSTRAINT fk_post_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  UNIQUE KEY uq_bolsa_usuario (bolsa_partido_id, usuario_id)
) ENGINE=InnoDB;
