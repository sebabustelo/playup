import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

// Estados de reserva
export const ESTADOS_RESERVA = {
    RESERVADA: 'reservada',
    OCUPADA: 'ocupada',
    DISPONIBLE: 'disponible',
    CANCELADA: 'cancelada',
    BLOQUEADA: 'bloqueada'
};

// Crear reserva de cancha
export const crearReservaCancha = async (reservaData) => {
    try {
        // Verificar disponibilidad primero
        const disponible = await verificarDisponibilidad(
            reservaData.canchaId,
            reservaData.fecha,
            reservaData.horaInicio,
            reservaData.horaFin
        );

        if (!disponible.disponible) {
            return {
                success: false,
                error: 'La cancha no está disponible para este horario',
                conflicto: disponible.conflicto
            };
        }

        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        const reservaRef = await addDoc(collection(db, collectionName), {
            canchaId: reservaData.canchaId,
            partidoId: reservaData.partidoId || null,
            fecha: reservaData.fecha,
            horaInicio: reservaData.horaInicio,
            horaFin: reservaData.horaFin,
            estado: reservaData.estado || ESTADOS_RESERVA.RESERVADA,
            motivo: reservaData.motivo || null,
            creadoPor: reservaData.creadoPor || null,
            creadoEn: Timestamp.now(),
            actualizadoEn: Timestamp.now()
        });

        return { success: true, id: reservaRef.id };
    } catch (error) {
        console.error('Error creando reserva:', error);
        return { success: false, error: error.message };
    }
};

// Verificar disponibilidad de cancha
export const verificarDisponibilidad = async (canchaId, fecha, horaInicio, horaFin) => {
    try {
        // Buscar reservas que se solapen con el horario solicitado
        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        const q = query(
            collection(db, collectionName),
            where('canchaId', '==', canchaId),
            where('fecha', '==', fecha)
        );

        const querySnapshot = await getDocs(q);
        const reservas = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Verificar solapamientos con reservas activas
        const reservasActivas = reservas.filter(r => 
            r.estado === ESTADOS_RESERVA.RESERVADA || 
            r.estado === ESTADOS_RESERVA.OCUPADA || 
            r.estado === ESTADOS_RESERVA.BLOQUEADA
        );

        const conflicto = reservasActivas.find(reserva => {
            const reservaInicio = reserva.horaInicio;
            const reservaFin = reserva.horaFin;
            
            // Verificar si hay solapamiento
            return (
                (reservaInicio <= horaInicio && reservaFin > horaInicio) ||
                (reservaInicio < horaFin && reservaFin >= horaFin) ||
                (reservaInicio >= horaInicio && reservaFin <= horaFin)
            );
        });

        return {
            disponible: !conflicto,
            conflicto: conflicto || null
        };
    } catch (error) {
        console.error('Error verificando disponibilidad:', error);
        return { disponible: false, conflicto: null, error: error.message };
    }
};

// Obtener reserva por ID
export const obtenerReserva = async (reservaId) => {
    try {
        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        const reservaRef = doc(db, collectionName, reservaId);
        const reservaSnap = await getDoc(reservaRef);
        
        if (reservaSnap.exists()) {
            return { id: reservaSnap.id, ...reservaSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo reserva:', error);
        return null;
    }
};

// Obtener reservas de una cancha
export const obtenerReservasCancha = async (canchaId, fecha = null) => {
    try {
        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        let q;
        if (fecha) {
            q = query(
                collection(db, collectionName),
                where('canchaId', '==', canchaId),
                where('fecha', '==', fecha)
            );
        } else {
            q = query(
                collection(db, collectionName),
                where('canchaId', '==', canchaId)
            );
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo reservas:', error);
        return [];
    }
};

// Obtener reserva por partido
export const obtenerReservaPorPartido = async (partidoId) => {
    try {
        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        const q = query(
            collection(db, collectionName),
            where('partidoId', '==', partidoId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo reserva por partido:', error);
        return null;
    }
};

// Actualizar estado de reserva
export const actualizarEstadoReserva = async (reservaId, nuevoEstado, motivo = null) => {
    try {
        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
        const reservaRef = doc(db, collectionName, reservaId);
        const updateData = {
            estado: nuevoEstado,
            actualizadoEn: Timestamp.now()
        };
        
        if (motivo) {
            updateData.motivo = motivo;
        }

        await updateDoc(reservaRef, updateData);
        return { success: true };
    } catch (error) {
        console.error('Error actualizando estado de reserva:', error);
        return { success: false, error: error.message };
    }
};

// Liberar reserva (marcar como disponible)
export const liberarReserva = async (reservaId, motivo = 'Reserva cancelada') => {
    return actualizarEstadoReserva(reservaId, ESTADOS_RESERVA.DISPONIBLE, motivo);
};

// Obtener horarios disponibles de una cancha en una fecha
export const obtenerHorariosDisponibles = async (canchaId, fecha, franjasHorarias) => {
    try {
        // Obtener todas las reservas activas para esa fecha
        const reservas = await obtenerReservasCancha(canchaId, fecha);
        const reservasActivas = reservas.filter(r => 
            r.estado === ESTADOS_RESERVA.RESERVADA || 
            r.estado === ESTADOS_RESERVA.OCUPADA || 
            r.estado === ESTADOS_RESERVA.BLOQUEADA
        );

        // Filtrar franjas horarias disponibles
        const horariosDisponibles = franjasHorarias.filter(franja => {
            return !reservasActivas.some(reserva => {
                const reservaInicio = reserva.horaInicio;
                const reservaFin = reserva.horaFin;
                const franjaInicio = franja.horaInicio;
                const franjaFin = franja.horaFin;

                // Verificar solapamiento
                return (
                    (reservaInicio <= franjaInicio && reservaFin > franjaInicio) ||
                    (reservaInicio < franjaFin && reservaFin >= franjaFin) ||
                    (reservaInicio >= franjaInicio && reservaFin <= franjaFin)
                );
            });
        });

        return horariosDisponibles;
    } catch (error) {
        console.error('Error obteniendo horarios disponibles:', error);
        return [];
    }
};

// Bloquear cancha (para mantenimiento, etc.)
export const bloquearCancha = async (canchaId, fecha, horaInicio, horaFin, motivo, creadoPor) => {
    return crearReservaCancha({
        canchaId,
        fecha,
        horaInicio,
        horaFin,
        estado: ESTADOS_RESERVA.BLOQUEADA,
        motivo,
        creadoPor
    });
};

