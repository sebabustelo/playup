# Esquema de Base de Datos - PlayUp

Este directorio contiene el esquema completo de la base de datos MySQL para PlayUp.

## Archivos

- `schema.sql`: Esquema completo con todas las tablas, relaciones, índices y vistas
- `stored_procedures.sql`: Procedimientos almacenados y triggers para gestión de reservas
- `README.md`: Este archivo con documentación

## Estructura de la Base de Datos

### Tablas Principales

1. **Configuración y Catálogos**
   - `roles`: Roles del sistema (admin, admin_predios, cliente, usuario)
   - `deportes`: Tipos de deportes disponibles
   - `franjas_horarias`: Horarios disponibles para reservas
   - `servicios`: Servicios adicionales (grabación, etc.)

2. **Usuarios y Autenticación**
   - `usuarios`: Información de usuarios
   - `usuario_roles`: Relación muchos a muchos entre usuarios y roles
   - `usuario_predios`: Relación entre usuarios admin_predios y predios asignados

3. **Predios y Canchas**
   - `predios`: Sedes/ubicaciones de canchas
   - `canchas`: Canchas de cada predio
   - `cancha_caracteristicas`: Características dinámicas de las canchas

4. **Precios y Promociones**
   - `precios`: Precios por cancha, día de semana y horario
   - `promociones`: Promociones especiales

5. **Partidos**
   - `partidos`: Partidos creados
   - `jugadores`: Jugadores de cada partido
   - `pagos`: Pagos de jugadores
   - `servicios_partido`: Servicios agregados a partidos

6. **Reservas y Disponibilidad**
   - `reservas_canchas`: Control de disponibilidad de canchas por horario

7. **Auxiliares**
   - `feriados`: Calendario de feriados

## Características del Esquema

### Optimizaciones

- **Índices compuestos** para consultas frecuentes
- **Foreign keys** con acciones apropiadas (CASCADE, RESTRICT)
- **Campos JSON** para datos dinámicos (jugadores_ids)
- **Timestamps automáticos** para auditoría
- **Soft deletes** con campo `activo` en lugar de borrado físico

### Relaciones

- Un usuario puede tener múltiples roles (muchos a muchos)
- Un usuario admin_predios puede gestionar múltiples predios
- Un predio tiene múltiples canchas
- Una cancha tiene múltiples precios (por día y horario)
- Un partido tiene múltiples jugadores, pagos y servicios

### Vistas

- `v_usuarios_con_roles`: Usuarios con sus roles concatenados
- `v_disponibilidad_canchas`: Disponibilidad de canchas por fecha y horario
- `v_partidos_completos`: Partidos con información completa (predio, jugadores, pagos, reserva)

### Procedimientos Almacenados

- `sp_crear_reserva_cancha`: Crea una reserva verificando disponibilidad
- `sp_actualizar_estado_reserva`: Actualiza el estado de una reserva
- `sp_verificar_disponibilidad`: Verifica si una cancha está disponible en un horario
- `sp_liberar_reserva`: Libera reservas cuando se cancela un partido
- `sp_obtener_horarios_disponibles`: Obtiene horarios disponibles de una cancha en una fecha

### Triggers

- `tr_partido_crear_reserva`: Crea automáticamente una reserva al crear un partido
- `tr_partido_cancelar_reserva`: Actualiza el estado de la reserva cuando se cancela o confirma un partido

## Uso

### Crear la base de datos

```bash
# Crear esquema
mysql -u root -p < database/schema.sql

# Crear procedimientos almacenados y triggers
mysql -u root -p playup < database/stored_procedures.sql
```

### Verificar la estructura

```sql
USE playup;
SHOW TABLES;
DESCRIBE usuarios;
```

## Gestión de Reservas

El sistema de reservas permite:

1. **Control de disponibilidad**: Evita dobles reservas para el mismo horario
2. **Estados de reserva**:
   - `reservada`: Cancha reservada pero aún no confirmada
   - `ocupada`: Cancha en uso (partido confirmado)
   - `disponible`: Cancha libre
   - `cancelada`: Reserva cancelada
   - `bloqueada`: Cancha bloqueada por mantenimiento u otra razón

3. **Automatización**: Los triggers crean y actualizan reservas automáticamente al crear/cancelar partidos

4. **Verificación**: Los procedimientos almacenados verifican disponibilidad antes de crear reservas

## Notas para el Backend en Go

1. **IDs**: Se usan VARCHAR(50) para compatibilidad con Firebase UIDs
2. **Timestamps**: Usar `TIMESTAMP` con valores por defecto para `creado_en` y `actualizado_en`
3. **Enums**: Usar ENUMs para estados y tipos limitados
4. **Decimales**: Usar DECIMAL(10, 2) para precios y montos
5. **JSON**: El campo `jugadores_ids` en `partidos` es JSON para indexación rápida
6. **Reservas**: Siempre verificar disponibilidad antes de crear un partido usando `sp_verificar_disponibilidad`
7. **Transacciones**: Usar transacciones al crear partidos para asegurar que la reserva se cree correctamente

## Migraciones Futuras

Cuando se implemente el backend en Go, considerar:

1. Sistema de migraciones (golang-migrate, goose, etc.)
2. Seeders para datos iniciales
3. Scripts de backup y restore
4. Índices adicionales según patrones de consulta reales

