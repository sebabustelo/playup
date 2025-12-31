-- ============================================
-- STORED PROCEDURES PARA GESTIÓN DE RESERVAS
-- ============================================

DELIMITER //

-- Procedimiento: Crear reserva de cancha
-- Verifica disponibilidad antes de crear la reserva
CREATE PROCEDURE sp_crear_reserva_cancha(
    IN p_cancha_id VARCHAR(50),
    IN p_fecha DATE,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME,
    IN p_partido_id VARCHAR(50),
    IN p_creado_por VARCHAR(50),
    IN p_estado VARCHAR(20),
    IN p_motivo VARCHAR(255),
    OUT p_reserva_id INT,
    OUT p_resultado VARCHAR(100),
    OUT p_mensaje TEXT
)
BEGIN
    DECLARE v_existe_reserva INT DEFAULT 0;
    DECLARE v_reserva_id INT;
    
    -- Verificar si ya existe una reserva activa para este horario
    SELECT COUNT(*) INTO v_existe_reserva
    FROM reservas_canchas
    WHERE cancha_id = p_cancha_id
      AND fecha = p_fecha
      AND estado IN ('reservada', 'ocupada', 'bloqueada')
      AND (
          (hora_inicio <= p_hora_inicio AND hora_fin > p_hora_inicio)
          OR (hora_inicio < p_hora_fin AND hora_fin >= p_hora_fin)
          OR (hora_inicio >= p_hora_inicio AND hora_fin <= p_hora_fin)
      );
    
    IF v_existe_reserva > 0 THEN
        SET p_resultado = 'ERROR';
        SET p_mensaje = 'La cancha ya está reservada para este horario';
        SET p_reserva_id = NULL;
    ELSE
        -- Crear la reserva
        INSERT INTO reservas_canchas (
            cancha_id,
            partido_id,
            fecha,
            hora_inicio,
            hora_fin,
            estado,
            motivo,
            creado_por
        ) VALUES (
            p_cancha_id,
            p_partido_id,
            p_fecha,
            p_hora_inicio,
            p_hora_fin,
            COALESCE(p_estado, 'reservada'),
            p_motivo,
            p_creado_por
        );
        
        SET v_reserva_id = LAST_INSERT_ID();
        SET p_reserva_id = v_reserva_id;
        SET p_resultado = 'OK';
        SET p_mensaje = 'Reserva creada exitosamente';
    END IF;
END //

-- Procedimiento: Actualizar estado de reserva
CREATE PROCEDURE sp_actualizar_estado_reserva(
    IN p_reserva_id INT,
    IN p_nuevo_estado VARCHAR(20),
    IN p_motivo VARCHAR(255),
    OUT p_resultado VARCHAR(100),
    OUT p_mensaje TEXT
)
BEGIN
    DECLARE v_existe INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_existe
    FROM reservas_canchas
    WHERE id = p_reserva_id;
    
    IF v_existe = 0 THEN
        SET p_resultado = 'ERROR';
        SET p_mensaje = 'Reserva no encontrada';
    ELSE
        UPDATE reservas_canchas
        SET estado = p_nuevo_estado,
            motivo = COALESCE(p_motivo, motivo),
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = p_reserva_id;
        
        SET p_resultado = 'OK';
        SET p_mensaje = 'Estado de reserva actualizado';
    END IF;
END //

-- Procedimiento: Verificar disponibilidad de cancha
CREATE PROCEDURE sp_verificar_disponibilidad(
    IN p_cancha_id VARCHAR(50),
    IN p_fecha DATE,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME,
    OUT p_disponible BOOLEAN,
    OUT p_reserva_conflicto INT
)
BEGIN
    DECLARE v_reservas_activas INT DEFAULT 0;
    DECLARE v_reserva_id INT;
    
    -- Buscar reservas que se solapen con el horario solicitado
    SELECT id INTO v_reserva_id
    FROM reservas_canchas
    WHERE cancha_id = p_cancha_id
      AND fecha = p_fecha
      AND estado IN ('reservada', 'ocupada', 'bloqueada')
      AND (
          (hora_inicio <= p_hora_inicio AND hora_fin > p_hora_inicio)
          OR (hora_inicio < p_hora_fin AND hora_fin >= p_hora_fin)
          OR (hora_inicio >= p_hora_inicio AND hora_fin <= p_hora_fin)
      )
    LIMIT 1;
    
    SET v_reservas_activas = IFNULL(v_reserva_id, 0);
    SET p_reserva_conflicto = v_reserva_id;
    SET p_disponible = (v_reservas_activas = 0);
END //

-- Procedimiento: Liberar reserva (cuando se cancela un partido)
CREATE PROCEDURE sp_liberar_reserva(
    IN p_partido_id VARCHAR(50),
    OUT p_resultado VARCHAR(100),
    OUT p_mensaje TEXT
)
BEGIN
    DECLARE v_reservas_liberadas INT DEFAULT 0;
    
    -- Actualizar estado de reservas asociadas al partido
    UPDATE reservas_canchas
    SET estado = 'disponible',
        actualizado_en = CURRENT_TIMESTAMP
    WHERE partido_id = p_partido_id
      AND estado IN ('reservada', 'ocupada');
    
    SET v_reservas_liberadas = ROW_COUNT();
    
    IF v_reservas_liberadas > 0 THEN
        SET p_resultado = 'OK';
        SET p_mensaje = CONCAT('Se liberaron ', v_reservas_liberadas, ' reserva(s)');
    ELSE
        SET p_resultado = 'INFO';
        SET p_mensaje = 'No se encontraron reservas para liberar';
    END IF;
END //

-- Procedimiento: Obtener horarios disponibles de una cancha
CREATE PROCEDURE sp_obtener_horarios_disponibles(
    IN p_cancha_id VARCHAR(50),
    IN p_fecha DATE,
    OUT p_resultado TEXT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_hora_inicio TIME;
    DECLARE v_hora_fin TIME;
    DECLARE v_disponible BOOLEAN;
    DECLARE v_horarios TEXT DEFAULT '';
    
    DECLARE cur_franjas CURSOR FOR
        SELECT hora_inicio, hora_fin
        FROM franjas_horarias
        WHERE activo = TRUE
        ORDER BY hora_inicio;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN cur_franjas;
    
    read_loop: LOOP
        FETCH cur_franjas INTO v_hora_inicio, v_hora_fin;
        
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Verificar si está disponible
        SELECT COUNT(*) = 0 INTO v_disponible
        FROM reservas_canchas
        WHERE cancha_id = p_cancha_id
          AND fecha = p_fecha
          AND estado IN ('reservada', 'ocupada', 'bloqueada')
          AND (
              (hora_inicio <= v_hora_inicio AND hora_fin > v_hora_inicio)
              OR (hora_inicio < v_hora_fin AND hora_fin >= v_hora_fin)
              OR (hora_inicio >= v_hora_inicio AND hora_fin <= v_hora_fin)
          );
        
        IF v_disponible THEN
            IF v_horarios != '' THEN
                SET v_horarios = CONCAT(v_horarios, ',');
            END IF;
            SET v_horarios = CONCAT(v_horarios, v_hora_inicio, '-', v_hora_fin);
        END IF;
    END LOOP;
    
    CLOSE cur_franjas;
    
    SET p_resultado = v_horarios;
END //

DELIMITER ;

-- ============================================
-- TRIGGERS PARA GESTIÓN AUTOMÁTICA
-- ============================================

DELIMITER //

-- Trigger: Crear reserva automáticamente al crear un partido
CREATE TRIGGER tr_partido_crear_reserva
AFTER INSERT ON partidos
FOR EACH ROW
BEGIN
    DECLARE v_reserva_id INT;
    DECLARE v_resultado VARCHAR(100);
    DECLARE v_mensaje TEXT;
    
    -- Crear reserva automáticamente
    CALL sp_crear_reserva_cancha(
        NEW.cancha_id,
        NEW.fecha,
        NEW.hora,
        NEW.hora_fin,
        NEW.id,
        NEW.creador_id,
        'reservada',
        CONCAT('Reserva para partido ', NEW.id),
        v_reserva_id,
        v_resultado,
        v_mensaje
    );
    
    -- Actualizar el partido con el ID de la reserva
    IF v_resultado = 'OK' THEN
        UPDATE partidos
        SET reserva_id = v_reserva_id
        WHERE id = NEW.id;
    END IF;
END //

-- Trigger: Actualizar estado de reserva cuando se cancela un partido
CREATE TRIGGER tr_partido_cancelar_reserva
AFTER UPDATE ON partidos
FOR EACH ROW
BEGIN
    IF OLD.estado != 'cancelado' AND NEW.estado = 'cancelado' THEN
        -- Liberar la reserva
        UPDATE reservas_canchas
        SET estado = 'disponible',
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = NEW.reserva_id
          AND estado IN ('reservada', 'ocupada');
    END IF;
    
    -- Marcar como ocupada cuando se confirma
    IF OLD.estado != 'confirmado' AND NEW.estado = 'confirmado' THEN
        UPDATE reservas_canchas
        SET estado = 'ocupada',
            actualizado_en = CURRENT_TIMESTAMP
        WHERE id = NEW.reserva_id
          AND estado = 'reservada';
    END IF;
END //

DELIMITER ;


