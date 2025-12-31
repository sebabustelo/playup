import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { ESTADOS_PARTIDO, COLLECTIONS } from '@/utils/constants';
import { crearReservaCancha, verificarDisponibilidad, ESTADOS_RESERVA, liberarReserva } from './reservasService';

// Función helper para limpiar campos undefined
const limpiarDatos = (data) => {
    const cleaned = {};
    Object.keys(data).forEach(key => {
        const value = data[key];
        // Solo incluir si no es undefined
        if (value !== undefined) {
            // Si es un objeto, limpiarlo recursivamente
            if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                cleaned[key] = limpiarDatos(value);
            } else {
                cleaned[key] = value;
            }
        }
    });
    return cleaned;
};

export const crearPartido = async (partidoData) => {
    try {
        // Verificar disponibilidad antes de crear el partido
        const disponibilidad = await verificarDisponibilidad(
            partidoData.canchaId,
            partidoData.fecha,
            partidoData.hora,
            partidoData.horaFin
        );

        if (!disponibilidad.disponible) {
            return {
                success: false,
                error: 'La cancha no está disponible para este horario',
                conflicto: disponibilidad.conflicto
            };
        }

        // Limpiar datos para remover campos undefined
        const datosLimpios = limpiarDatos({
            ...partidoData,
            creadoEn: new Date(),
            estado: ESTADOS_PARTIDO.PENDIENTE,
            jugadoresIds: [] // Array para indexar jugadores
        });
        
        // Crear el partido
        const docRef = await addDoc(collection(db, 'partidos'), datosLimpios);
        const partidoId = docRef.id;

        // Crear la reserva asociada
        const reservaResult = await crearReservaCancha({
            canchaId: partidoData.canchaId,
            partidoId: partidoId,
            fecha: partidoData.fecha,
            horaInicio: partidoData.hora,
            horaFin: partidoData.horaFin,
            estado: ESTADOS_RESERVA.RESERVADA,
            motivo: `Reserva para partido ${partidoId}`,
            creadoPor: partidoData.creadorId
        });

        // Actualizar el partido con el ID de la reserva si se creó exitosamente
        if (reservaResult.success) {
            await updateDoc(doc(db, 'partidos', partidoId), {
                reservaId: reservaResult.id
            });
        }

        return { 
            success: true, 
            id: partidoId,
            reservaId: reservaResult.success ? reservaResult.id : null
        };
    } catch (error) {
        console.error('Error creando partido:', error);
        return { success: false, error: error.message };
    }
};

export const obtenerPartidosUsuario = async (userId) => {
    try {
        const q = query(
            collection(db, 'partidos'),
            where('creadorId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo partidos:', error);
        return [];
    }
};

export const obtenerPartido = async (partidoId) => {
    try {
        const docRef = doc(db, 'partidos', partidoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo partido:', error);
        return null;
    }
};

// DEPRECATED: Usar agregarJugadorAPartido de jugadoresService.js
// Mantenido para compatibilidad temporal
export const agregarJugador = async (partidoId, jugador) => {
    try {
        // Importar dinámicamente para evitar dependencias circulares
        const { agregarJugadorAPartido } = await import('./jugadoresService');
        const resultado = await agregarJugadorAPartido(partidoId, jugador);
        
        if (resultado.success && jugador.usuarioId) {
            // Actualizar array de IDs para indexar
            const partidoRef = doc(db, 'partidos', partidoId);
            await updateDoc(partidoRef, {
                jugadoresIds: arrayUnion(jugador.usuarioId)
            });
        }
        
        return resultado;
    } catch (error) {
        console.error('Error agregando jugador:', error);
        return { success: false, error: error.message };
    }
};

export const obtenerCancha = async (canchaId) => {
    try {
        const docRef = doc(db, 'canchas', canchaId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo cancha:', error);
        return null;
    }
};

// Eliminar partido y todos sus datos asociados
export const eliminarPartido = async (partidoId) => {
    try {
        // Obtener el partido primero para verificar que existe y obtener datos relacionados
        const partidoRef = doc(db, COLLECTIONS.PARTIDOS, partidoId);
        const partidoDoc = await getDoc(partidoRef);
        
        if (!partidoDoc.exists()) {
            return { success: false, error: 'Partido no encontrado' };
        }

        const partidoData = partidoDoc.data();

        // 1. Liberar la reserva asociada si existe
        if (partidoData.reservaId) {
            try {
                await liberarReserva(partidoData.reservaId, 'Partido eliminado');
            } catch (error) {
                console.warn('Error liberando reserva (continuando con eliminación):', error);
            }
        }

        // 2. Eliminar subcolecciones del partido
        const subcolecciones = ['jugadores', 'pagos', 'servicios'];
        const deletePromises = [];

        for (const subcoleccion of subcolecciones) {
            try {
                const subcoleccionRef = collection(db, COLLECTIONS.PARTIDOS, partidoId, subcoleccion);
                const subcoleccionSnapshot = await getDocs(subcoleccionRef);
                subcoleccionSnapshot.docs.forEach(doc => {
                    deletePromises.push(deleteDoc(doc.ref));
                });
            } catch (error) {
                console.warn(`Error obteniendo ${subcoleccion} (continuando):`, error);
            }
        }

        // Ejecutar todas las eliminaciones de subcolecciones en paralelo
        await Promise.all(deletePromises);

        // 3. Eliminar el partido principal
        await deleteDoc(partidoRef);

        return { success: true };
    } catch (error) {
        console.error('Error eliminando partido:', error);
        return { success: false, error: error.message };
    }
};




