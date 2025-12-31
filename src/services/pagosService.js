import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

// Validar si ya existe un pago para este jugador en el partido
export const validarPagoExistente = async (partidoId, usuarioId) => {
    try {
        const q = query(
            collection(db, 'partidos', partidoId, 'pagos'),
            where('usuarioId', '==', usuarioId)
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        console.error('Error validando pago existente:', error);
        return false;
    }
};

// Obtener resumen de pagos de un partido
export const obtenerResumenPagos = async (partidoId) => {
    try {
        const pagos = await obtenerPagosPartido(partidoId);
        const totalPendiente = pagos
            .filter(p => p.estado === 'pendiente')
            .reduce((sum, p) => sum + (p.monto || 0), 0);
        const totalPagado = pagos
            .filter(p => p.estado === 'pagado')
            .reduce((sum, p) => sum + (p.monto || 0), 0);
        const totalRechazado = pagos
            .filter(p => p.estado === 'rechazado')
            .reduce((sum, p) => sum + (p.monto || 0), 0);
        
        return {
            total: pagos.length,
            pendientes: pagos.filter(p => p.estado === 'pendiente').length,
            pagados: pagos.filter(p => p.estado === 'pagado').length,
            rechazados: pagos.filter(p => p.estado === 'rechazado').length,
            montoTotalPendiente: totalPendiente,
            montoTotalPagado: totalPagado,
            montoTotalRechazado: totalRechazado,
            montoTotal: totalPendiente + totalPagado + totalRechazado
        };
    } catch (error) {
        console.error('Error obteniendo resumen de pagos:', error);
        return null;
    }
};

// Crear pago con validaciones
export const crearPago = async (partidoId, pagoData) => {
    try {
        // Validar que no exista un pago pendiente para este jugador
        const existePago = await validarPagoExistente(partidoId, pagoData.usuarioId);
        if (existePago) {
            return { 
                success: false, 
                error: 'Ya existe un pago registrado para este jugador en este partido' 
            };
        }

        // Validar que el monto sea positivo
        if (!pagoData.monto || pagoData.monto <= 0) {
            return { 
                success: false, 
                error: 'El monto debe ser mayor a cero' 
            };
        }

        const docRef = await addDoc(
            collection(db, 'partidos', partidoId, 'pagos'),
            {
                ...pagoData,
                estado: 'pendiente',
                creadoEn: new Date()
            }
        );
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error creando pago:', error);
        return { success: false, error: error.message };
    }
};

// Obtener pagos de un partido
export const obtenerPagosPartido = async (partidoId) => {
    try {
        const q = query(
            collection(db, 'partidos', partidoId, 'pagos'),
            orderBy('creadoEn', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo pagos:', error);
        return [];
    }
};

// Obtener pagos de un usuario
export const obtenerPagosUsuario = async (usuarioId) => {
    try {
        // Esto requiere iterar sobre todos los partidos del usuario
        // En producción, considera una colección global de pagos con índice
        const querySnapshot = await getDocs(
            query(
                collection(db, 'pagos'), // Colección global alternativa
                where('usuarioId', '==', usuarioId),
                orderBy('creadoEn', 'desc')
            )
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo pagos del usuario:', error);
        return [];
    }
};

// Actualizar estado de pago
export const actualizarEstadoPago = async (partidoId, pagoId, estado, referencia = null) => {
    try {
        const updateData = {
            estado,
            actualizadoEn: new Date()
        };
        if (referencia) {
            updateData.referencia = referencia;
        }
        await updateDoc(
            doc(db, 'partidos', partidoId, 'pagos', pagoId),
            updateData
        );
        return { success: true };
    } catch (error) {
        console.error('Error actualizando pago:', error);
        return { success: false, error: error.message };
    }
};

// Marcar pago como pagado
export const marcarPagoComoPagado = async (partidoId, pagoId, referencia) => {
    return actualizarEstadoPago(partidoId, pagoId, 'pagado', referencia);
};

