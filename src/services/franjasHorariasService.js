import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

// Crear franja horaria
export const crearFranjaHoraria = async (franjaData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.FRANJAS_HORARIAS), {
            ...franjaData,
            creadoEn: new Date(),
            activa: true
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creando franja horaria:', error);
        return { success: false, error: error.message };
    }
};

// Obtener todas las franjas horarias
export const obtenerFranjasHorarias = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.FRANJAS_HORARIAS),
            orderBy('horaInicio')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo franjas horarias:', error);
        return [];
    }
};

// Actualizar franja horaria
export const actualizarFranjaHoraria = async (id, franjaData) => {
    try {
        await updateDoc(doc(db, COLLECTIONS.FRANJAS_HORARIAS, id), {
            ...franjaData,
            actualizadoEn: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando franja horaria:', error);
        return { success: false, error: error.message };
    }
};

// Eliminar franja horaria
export const eliminarFranjaHoraria = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.FRANJAS_HORARIAS, id));
        return { success: true };
    } catch (error) {
        console.error('Error eliminando franja horaria:', error);
        return { success: false, error: error.message };
    }
};


