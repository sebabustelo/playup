import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { agregarUsuarioAGrupo, extraerGroupIdDeLink } from './telegramService';

// Agregar jugador a un partido (subcolección)
export const agregarJugadorAPartido = async (partidoId, jugadorData) => {
    try {
        const docRef = await addDoc(
            collection(db, 'partidos', partidoId, 'jugadores'),
            {
                ...jugadorData,
                estado: 'invitado',
                agregadoEn: new Date()
            }
        );

        // Intentar agregar al grupo de Telegram si existe
        try {
            const partidoRef = doc(db, 'partidos', partidoId);
            const partidoSnap = await getDoc(partidoRef);
            
            if (partidoSnap.exists()) {
                const partidoData = partidoSnap.data();
                const grupoTelegram = partidoData.grupoTelegram;
                
                // Si el partido tiene grupo de Telegram activo y el jugador tiene username de Telegram
                if (grupoTelegram && grupoTelegram.activo && grupoTelegram.link) {
                    const telegramUsername = jugadorData.telegramUsername || jugadorData.telegram;
                    
                    if (telegramUsername) {
                        // Intentar agregar al grupo
                        // NOTA: Para que funcione, el bot debe ser administrador del grupo
                        // y necesitamos el chat_id, no solo el link. Por ahora, guardamos el username
                        // para referencia futura y el usuario puede unirse manualmente con el link
                        const resultadoTelegram = await agregarUsuarioAGrupo(grupoTelegram.link, telegramUsername);
                        if (resultadoTelegram.success) {
                            console.log(`Jugador ${jugadorData.nombre} agregado al grupo de Telegram`);
                        } else {
                            // No es crítico si falla - el usuario puede unirse manualmente con el link
                            // El username se guarda en los datos del jugador para referencia
                            console.log(`Jugador ${jugadorData.nombre} tiene username de Telegram guardado. Puede unirse al grupo manualmente: ${grupoTelegram.link}`);
                        }
                    }
                }
            }
        } catch (telegramError) {
            // No fallar la creación del jugador si falla Telegram
            console.warn('Error al agregar jugador al grupo de Telegram:', telegramError);
        }

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error agregando jugador:', error);
        return { success: false, error: error.message };
    }
};

// Obtener jugadores de un partido
export const obtenerJugadoresPartido = async (partidoId) => {
    try {
        const querySnapshot = await getDocs(
            collection(db, 'partidos', partidoId, 'jugadores')
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo jugadores:', error);
        return [];
    }
};

// Actualizar estado de jugador
export const actualizarEstadoJugador = async (partidoId, jugadorId, estado) => {
    try {
        await updateDoc(
            doc(db, 'partidos', partidoId, 'jugadores', jugadorId),
            {
                estado,
                actualizadoEn: new Date()
            }
        );
        return { success: true };
    } catch (error) {
        console.error('Error actualizando estado jugador:', error);
        return { success: false, error: error.message };
    }
};

// Eliminar jugador de partido
export const eliminarJugadorPartido = async (partidoId, jugadorId) => {
    try {
        await deleteDoc(doc(db, 'partidos', partidoId, 'jugadores', jugadorId));
        return { success: true };
    } catch (error) {
        console.error('Error eliminando jugador:', error);
        return { success: false, error: error.message };
    }
};

// Obtener partidos de un jugador
export const obtenerPartidosJugador = async (usuarioId) => {
    try {
        // Esto requiere una query más compleja, por ahora usamos una aproximación
        // En producción, considera agregar un campo 'jugadoresIds' al partido para indexar
        const querySnapshot = await getDocs(
            query(
                collection(db, 'partidos'),
                where('jugadoresIds', 'array-contains', usuarioId)
            )
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo partidos del jugador:', error);
        return [];
    }
};

