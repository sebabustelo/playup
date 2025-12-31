import { collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

// =========================
// Servicios Globales
// =========================

// Crear servicio
export const crearServicio = async (servicioData) => {
    try {
        const docRef = await addDoc(collection(db, COLLECTIONS.SERVICIOS), {
            ...servicioData,
            activo: true,
            creadoEn: new Date()
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creando servicio:', error);
        return { success: false, error: error.message };
    }
};

// Obtener todos los servicios
export const obtenerServicios = async () => {
    try {
        const q = query(
            collection(db, COLLECTIONS.SERVICIOS),
            orderBy('nombre')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo servicios:', error);
        return [];
    }
};

// Actualizar servicio
export const actualizarServicio = async (id, servicioData) => {
    try {
        await updateDoc(doc(db, COLLECTIONS.SERVICIOS, id), {
            ...servicioData,
            actualizadoEn: new Date()
        });
        return { success: true };
    } catch (error) {
        console.error('Error actualizando servicio:', error);
        return { success: false, error: error.message };
    }
};

// Eliminar servicio
export const eliminarServicio = async (id) => {
    try {
        await deleteDoc(doc(db, COLLECTIONS.SERVICIOS, id));
        return { success: true };
    } catch (error) {
        console.error('Error eliminando servicio:', error);
        return { success: false, error: error.message };
    }
};

// =========================
// Servicios por Partido
// =========================

// Agregar servicio a partido
export const agregarServicioAPartido = async (partidoId, servicioId, precio) => {
    try {
        // Obtener datos del servicio
        const servicioDoc = await getDoc(doc(db, COLLECTIONS.SERVICIOS, servicioId));
        const servicio = servicioDoc.exists() ? servicioDoc.data() : null;

        const docRef = await addDoc(
            collection(db, 'partidos', partidoId, 'servicios'),
            {
                servicioId,
                servicioNombre: servicio?.nombre || 'Servicio',
                precio: precio || servicio?.precio || 0,
                agregadoEn: new Date()
            }
        );
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error agregando servicio a partido:', error);
        return { success: false, error: error.message };
    }
};

// Obtener servicios de un partido
export const obtenerServiciosPartido = async (partidoId) => {
    try {
        const querySnapshot = await getDocs(
            collection(db, 'partidos', partidoId, 'servicios')
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo servicios del partido:', error);
        return [];
    }
};

// Eliminar servicio de partido
export const eliminarServicioPartido = async (partidoId, servicioId) => {
    try {
        await deleteDoc(doc(db, 'partidos', partidoId, 'servicios', servicioId));
        return { success: true };
    } catch (error) {
        console.error('Error eliminando servicio del partido:', error);
        return { success: false, error: error.message };
    }
};

