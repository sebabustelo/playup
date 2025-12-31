import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

/**
 * Obtiene el día de la semana de una fecha (0=Domingo, 1=Lunes, ..., 6=Sábado)
 * Maneja correctamente las fechas en formato YYYY-MM-DD sin problemas de zona horaria
 */
const obtenerDiaSemana = (fecha) => {
    // Si la fecha viene en formato YYYY-MM-DD, parsearla manualmente para evitar problemas de zona horaria
    if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fecha.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month es 0-indexed en Date
        return date.getDay().toString(); // 0-6
    }
    // Si ya es un objeto Date o formato diferente
    const date = new Date(fecha);
    return date.getDay().toString(); // 0-6
};

/**
 * Verifica si una fecha es feriado (simplificado - en producción debería venir de una BD de feriados)
 */
const esFeriado = (fecha) => {
    // TODO: Implementar lógica de feriados desde una colección o servicio
    // Por ahora retorna false
    return false;
};

/**
 * Encuentra la franja horaria que corresponde a una hora
 */
const encontrarFranjaHoraria = async (hora) => {
    try {
        const [horaStr, minutoStr] = hora.split(':');
        const horaNum = parseInt(horaStr);
        const minutoNum = parseInt(minutoStr || 0);
        
        // Buscar franjas horarias que contengan esta hora
        const franjasSnapshot = await getDocs(collection(db, COLLECTIONS.FRANJAS_HORARIAS));
        const franjas = franjasSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Encontrar la franja que contiene esta hora
        for (const franja of franjas) {
            const [inicioH, inicioM] = franja.horaInicio.split(':').map(Number);
            const [finH, finM] = franja.horaFin.split(':').map(Number);
            
            const inicioMinutos = inicioH * 60 + inicioM;
            const finMinutos = finH * 60 + finM;
            const horaMinutos = horaNum * 60 + minutoNum;
            
            // Verificar si la hora está dentro del rango (inclusive inicio, exclusive fin)
            if (horaMinutos >= inicioMinutos && horaMinutos < finMinutos) {
                return franja;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error encontrando franja horaria:', error);
        return null;
    }
};

/**
 * Obtiene el precio de una cancha para una fecha y hora específicas
 */
export const obtenerPrecio = async (canchaId, fecha, hora) => {
    try {
        if (!canchaId || !fecha || !hora) {
            return null;
        }

        // Obtener día de la semana
        const diaSemana = obtenerDiaSemana(fecha);
        const esFeriadoFecha = esFeriado(fecha);

        // Encontrar la franja horaria
        const franja = await encontrarFranjaHoraria(hora);
        if (!franja) {
            console.warn('No se encontró franja horaria para:', hora);
            return null;
        }

        // Buscar precio: primero por feriado si aplica, luego por día de semana
        const diaBusqueda = esFeriadoFecha ? 'feriado' : diaSemana;
        
        // Remover logs de debug para mejorar rendimiento (solo mantener en desarrollo si es necesario)
        
        // Intentar buscar primero con el formato que tenemos (string)
        let querySnapshot = null;
        if (diaBusqueda !== 'feriado') {
            // Intentar con número primero (más común en Firestore)
            const diaNumero = parseInt(diaBusqueda);
            if (!isNaN(diaNumero)) {
                const qNumero = query(
                    collection(db, COLLECTIONS.PRECIOS),
                    where('canchaId', '==', canchaId),
                    where('franjaHorariaId', '==', franja.id),
                    where('diaSemana', '==', diaNumero),
                    where('activo', '==', true)
                );
                querySnapshot = await getDocs(qNumero);
            }
        }
        
        // Si no se encontró con número, intentar con string
        if (!querySnapshot || querySnapshot.empty) {
            const q = query(
                collection(db, COLLECTIONS.PRECIOS),
                where('canchaId', '==', canchaId),
                where('franjaHorariaId', '==', franja.id),
                where('diaSemana', '==', diaBusqueda),
                where('activo', '==', true)
            );
            querySnapshot = await getDocs(q);
        }
        
        if (!querySnapshot || querySnapshot.empty) {
            // Si no hay precio específico, buscar precio genérico o del día más cercano
            console.warn(`❌ No se encontró precio específico para canchaId: ${canchaId}, franjaHorariaId: ${franja.id}, diaSemana: ${diaBusqueda} (tipo: ${typeof diaBusqueda})`);
            console.log('📅 Fecha recibida:', fecha, 'Día calculado:', diaSemana, 'Día búsqueda:', diaBusqueda);
            
            // Mostrar qué días tienen precios disponibles
            if (preciosInfo.length > 0) {
                const diasDisponibles = preciosInfo.map(p => {
                    const diaNum = typeof p.diaSemana === 'string' ? parseInt(p.diaSemana) : p.diaSemana;
                    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const nombreDia = !isNaN(diaNum) && diaNum >= 0 && diaNum <= 6 ? nombresDias[diaNum] : p.diaSemana;
                    return `${nombreDia} (${p.diaSemana})`;
                }).join(', ');
                console.log(`ℹ️ Días disponibles en precios: ${diasDisponibles}`);
                console.warn(`⚠️ No hay precio configurado para ${diaBusqueda === '0' ? 'Domingo' : `día ${diaBusqueda}`} en este horario. Días con precio: ${diasDisponibles}`);
            }
            
            // Buscar sin restricción de día (precio base)
            const qAlternativo = query(
                collection(db, COLLECTIONS.PRECIOS),
                where('canchaId', '==', canchaId),
                where('franjaHorariaId', '==', franja.id),
                where('activo', '==', true)
            );
            
            // NO usar precio alternativo - si no hay precio para este día específico, retornar null
            // Esto asegura que solo se muestren horarios con precio configurado para el día seleccionado
            return null;
        }

        const precioData = querySnapshot.docs[0].data();
        return {
            precio: precioData.precio,
            franjaHoraria: franja,
            diaSemana: precioData.diaSemana,
            esFeriado: precioData.esFeriado || false,
            precioId: querySnapshot.docs[0].id
        };
    } catch (error) {
        console.error('Error obteniendo precio:', error);
        return null;
    }
};

/**
 * Obtiene todos los precios de una cancha
 */
export const obtenerPreciosCancha = async (canchaId) => {
    try {
        const q = query(
            collection(db, COLLECTIONS.PRECIOS),
            where('canchaId', '==', canchaId),
            where('activo', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error obteniendo precios de cancha:', error);
        return [];
    }
};

/**
 * Obtiene todos los precios disponibles para una cancha en una fecha específica
 * Optimizado para obtener todos los precios de una vez en lugar de consultar uno por uno
 */
export const obtenerPreciosDisponibles = async (canchaId, fecha) => {
    try {
        if (!canchaId || !fecha) {
            return [];
        }

        // Obtener día de la semana
        const diaSemana = obtenerDiaSemana(fecha);
        const esFeriadoFecha = esFeriado(fecha);
        const diaBusqueda = esFeriadoFecha ? 'feriado' : diaSemana;

        // Obtener todos los precios de la cancha de una vez
        const q = query(
            collection(db, COLLECTIONS.PRECIOS),
            where('canchaId', '==', canchaId),
            where('activo', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        const todosLosPrecios = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Filtrar precios que coincidan con el día de la semana
        const preciosDelDia = todosLosPrecios.filter(precio => {
            // Comparar como número o string
            const precioDia = precio.diaSemana;
            if (diaBusqueda === 'feriado') {
                return precio.esFeriado === true || precioDia === 'feriado';
            }
            // Intentar comparar como número y como string
            return precioDia === diaBusqueda || 
                   precioDia === parseInt(diaBusqueda) || 
                   parseInt(precioDia) === parseInt(diaBusqueda);
        });

        // Crear un mapa de franjaHorariaId -> precio para acceso rápido
        const preciosMap = new Map();
        preciosDelDia.forEach(precio => {
            const franjaId = precio.franjaHorariaId;
            if (franjaId) {
                // Si ya existe un precio para esta franja, mantener el primero encontrado
                if (!preciosMap.has(franjaId)) {
                    preciosMap.set(franjaId, precio);
                }
            }
        });

        return Array.from(preciosMap.values());
    } catch (error) {
        console.error('Error obteniendo precios disponibles:', error);
        return [];
    }
};

/**
 * Obtiene todos los precios disponibles para una cancha en una semana completa
 * Optimizado para obtener todos los precios de una vez y agruparlos por día
 */
export const obtenerPreciosSemana = async (canchaId, fechaInicio) => {
    try {
        if (!canchaId || !fechaInicio) {
            return {};
        }

        // Obtener todos los precios de la cancha de una vez
        const q = query(
            collection(db, COLLECTIONS.PRECIOS),
            where('canchaId', '==', canchaId),
            where('activo', '==', true)
        );
        
        const querySnapshot = await getDocs(q);
        const todosLosPrecios = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Calcular los 7 días de la semana a partir de fechaInicio
        const fechaInicioObj = typeof fechaInicio === 'string' && fechaInicio.match(/^\d{4}-\d{2}-\d{2}$/)
            ? (() => {
                const [year, month, day] = fechaInicio.split('-').map(Number);
                return new Date(year, month - 1, day);
            })()
            : new Date(fechaInicio);

        // Crear un objeto para almacenar precios por día (formato YYYY-MM-DD)
        const preciosPorDia = {};

        // Para cada día de la semana (7 días)
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(fechaInicioObj);
            fecha.setDate(fecha.getDate() + i);
            const fechaStr = fecha.toISOString().split('T')[0];
            const diaSemana = fecha.getDay().toString();
            const esFeriadoFecha = esFeriado(fechaStr);
            const diaBusqueda = esFeriadoFecha ? 'feriado' : diaSemana;

            // Filtrar precios que coincidan con este día
            const preciosDelDia = todosLosPrecios.filter(precio => {
                const precioDia = precio.diaSemana;
                if (diaBusqueda === 'feriado') {
                    return precio.esFeriado === true || precioDia === 'feriado';
                }
                return precioDia === diaBusqueda || 
                       precioDia === parseInt(diaBusqueda) || 
                       parseInt(precioDia) === parseInt(diaBusqueda);
            });

            // Crear un mapa de franjaHorariaId -> precio para este día
            const preciosMap = new Map();
            preciosDelDia.forEach(precio => {
                const franjaId = precio.franjaHorariaId;
                if (franjaId && precio.precio) {
                    const precioNumero = typeof precio.precio === 'number' 
                        ? precio.precio 
                        : parseFloat(precio.precio);
                    
                    if (!isNaN(precioNumero) && precioNumero > 0) {
                        if (!preciosMap.has(franjaId)) {
                            preciosMap.set(franjaId, {
                                precio: precioNumero,
                                precioId: precio.id,
                                diaSemana: precio.diaSemana,
                                esFeriado: precio.esFeriado || false
                            });
                        }
                    }
                }
            });

            preciosPorDia[fechaStr] = Array.from(preciosMap.entries()).map(([franjaId, precioData]) => ({
                franjaHorariaId: franjaId,
                ...precioData
            }));
        }

        return preciosPorDia;
    } catch (error) {
        console.error('Error obteniendo precios de la semana:', error);
        return {};
    }
};

