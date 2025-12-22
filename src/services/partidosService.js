import { collection, addDoc, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/firebase';

export const crearPartido = async (partidoData) => {
    try {
        const docRef = await addDoc(collection(db, 'partidos'), {
            ...partidoData,
            creadoEn: new Date(),
            estado: 'activo'
        });
        return { success: true, id: docRef.id };
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

export const agregarJugador = async (partidoId, jugador) => {
    try {
        const partidoRef = doc(db, 'partidos', partidoId);
        await updateDoc(partidoRef, {
            jugadores: arrayUnion(jugador)
        });
        return { success: true };
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




