// Servicio para cargar datos de ejemplo a Firestore
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { COLLECTIONS } from '@/utils/constants';

// Importar función de validación desde firebase.js
import { isFirebaseConfigured } from '@/firebase';

// Validar que Firebase esté configurado
const validarFirebase = () => {
    try {
        if (!isFirebaseConfigured()) {
            return false;
        }
        // Intentar acceder a la configuración de Firebase
        if (!db) {
            throw new Error('Firebase no está inicializado');
        }
        return true;
    } catch (error) {
        console.error('Error validando Firebase:', error);
        return false;
    }
};

// Importar datos de ejemplo
import prediosData from '@/data/ejemplos/predios.json';
import canchasData from '@/data/ejemplos/canchas.json';
import franjasHorariasData from '@/data/ejemplos/franjasHorarias.json';
import serviciosData from '@/data/ejemplos/servicios.json';
import deportesData from '@/data/ejemplos/deportes.json';
import preciosData from '@/data/ejemplos/precios.json';

// Mapa para guardar IDs generados
const idsMap = {
    predios: {},
    canchas: {},
    franjasHorarias: {},
    servicios: {},
    deportes: {}
};

// Cargar predios
export const cargarPredios = async () => {
    try {
        if (!validarFirebase()) {
            return { success: false, error: 'Firebase no está configurado. Por favor, configura Firebase en src/firebase.js' };
        }

        console.log('Verificando predios existentes...');
        
        // Verificar si ya existen predios con timeout
        const existingPromise = getDocs(collection(db, COLLECTIONS.PREDIOS));
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: La consulta tardó más de 30 segundos')), 30000)
        );
        
        const existing = await Promise.race([existingPromise, timeoutPromise]);
        
        if (!existing.empty) {
            console.log(`Ya existen ${existing.size} predios en la base de datos`);
            // Mapear los existentes
            existing.docs.forEach(doc => {
                const data = doc.data();
                const key = `${data.nombre}_${data.ciudad}`.toLowerCase().replace(/\s+/g, '_');
                idsMap.predios[key] = doc.id;
            });
            return { success: true, message: 'Predios ya existen', count: existing.size };
        }

        console.log(`Cargando ${prediosData.length} predios...`);
        const resultados = [];
        
        for (let i = 0; i < prediosData.length; i++) {
            const predio = prediosData[i];
            console.log(`Cargando predio ${i + 1}/${prediosData.length}: ${predio.nombre} - ${predio.ciudad}`);
            
            try {
                const docRef = await Promise.race([
                    addDoc(collection(db, COLLECTIONS.PREDIOS), {
                        ...predio,
                        creadoEn: new Date()
                    }),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout al crear predio')), 15000)
                    )
                ]);
                
                const key = `${predio.nombre}_${predio.ciudad}`.toLowerCase().replace(/\s+/g, '_');
                idsMap.predios[key] = docRef.id;
                resultados.push(docRef.id);
                console.log(`✅ Predio ${i + 1} cargado: ${docRef.id}`);
            } catch (error) {
                console.error(`Error cargando predio ${i + 1}:`, error);
                // Continuar con el siguiente aunque falle uno
                if (error.message.includes('permission') || error.message.includes('Permission')) {
                    throw new Error('Error de permisos. Verifica las Security Rules de Firestore. Deben permitir escritura para admins.');
                }
            }
        }
        
        console.log(`✅ Cargados ${resultados.length} predios de ${prediosData.length}`);
        return { success: true, count: resultados.length, ids: resultados };
    } catch (error) {
        console.error('Error cargando predios:', error);
        let errorMessage = error.message;
        
        if (error.message.includes('permission') || error.message.includes('Permission')) {
            errorMessage = 'Error de permisos. Verifica que las Security Rules de Firestore permitan escritura. Ve a Firebase Console → Firestore → Reglas y publica las reglas del archivo firestore.rules';
        } else if (error.message.includes('Timeout')) {
            errorMessage = 'Timeout: La operación tardó demasiado. Verifica tu conexión a internet y que Firestore esté creado en Firebase Console.';
        }
        
        return { success: false, error: errorMessage };
    }
};

// Cargar franjas horarias
export const cargarFranjasHorarias = async () => {
    try {
        const existing = await getDocs(collection(db, COLLECTIONS.FRANJAS_HORARIAS));
        if (!existing.empty) {
            console.log('Ya existen franjas horarias en la base de datos');
            existing.docs.forEach(doc => {
                const data = doc.data();
                const key = `${data.horaInicio}_${data.horaFin}`.replace(/:/g, '_');
                idsMap.franjasHorarias[key] = doc.id;
            });
            return { success: true, message: 'Franjas horarias ya existen', count: existing.size };
        }

        const resultados = [];
        for (const franja of franjasHorariasData) {
            const docRef = await addDoc(collection(db, COLLECTIONS.FRANJAS_HORARIAS), {
                ...franja,
                creadoEn: new Date()
            });
            const key = `${franja.horaInicio}_${franja.horaFin}`.replace(/:/g, '_');
            idsMap.franjasHorarias[key] = docRef.id;
            resultados.push(docRef.id);
        }
        console.log(`✅ Cargadas ${resultados.length} franjas horarias`);
        return { success: true, count: resultados.length, ids: resultados };
    } catch (error) {
        console.error('Error cargando franjas horarias:', error);
        return { success: false, error: error.message };
    }
};

// Cargar servicios
export const cargarServicios = async () => {
    try {
        const existing = await getDocs(collection(db, COLLECTIONS.SERVICIOS));
        if (!existing.empty) {
            console.log('Ya existen servicios en la base de datos');
            existing.docs.forEach(doc => {
                const data = doc.data();
                idsMap.servicios[data.nombre.toLowerCase()] = doc.id;
            });
            return { success: true, message: 'Servicios ya existen', count: existing.size };
        }

        const resultados = [];
        for (const servicio of serviciosData) {
            const docRef = await addDoc(collection(db, COLLECTIONS.SERVICIOS), {
                ...servicio,
                creadoEn: new Date()
            });
            idsMap.servicios[servicio.nombre.toLowerCase()] = docRef.id;
            resultados.push(docRef.id);
        }
        console.log(`✅ Cargados ${resultados.length} servicios`);
        return { success: true, count: resultados.length, ids: resultados };
    } catch (error) {
        console.error('Error cargando servicios:', error);
        return { success: false, error: error.message };
    }
};

// Cargar deportes
export const cargarDeportes = async () => {
    try {
        const existing = await getDocs(collection(db, COLLECTIONS.DEPORTES));
        if (!existing.empty) {
            console.log('Ya existen deportes en la base de datos');
            existing.docs.forEach(doc => {
                const data = doc.data();
                idsMap.deportes[data.nombre.toLowerCase()] = doc.id;
            });
            return { success: true, message: 'Deportes ya existen', count: existing.size };
        }

        const resultados = [];
        for (const deporte of deportesData) {
            const docRef = await addDoc(collection(db, COLLECTIONS.DEPORTES), {
                ...deporte,
                creadoEn: new Date()
            });
            idsMap.deportes[deporte.nombre.toLowerCase()] = docRef.id;
            resultados.push(docRef.id);
        }
        console.log(`✅ Cargados ${resultados.length} deportes`);
        return { success: true, count: resultados.length, ids: resultados };
    } catch (error) {
        console.error('Error cargando deportes:', error);
        return { success: false, error: error.message };
    }
};

// Cargar canchas (después de predios)
export const cargarCanchas = async () => {
    try {
        // Primero necesitamos los IDs de predios
        if (Object.keys(idsMap.predios).length === 0) {
            await cargarPredios();
        }

        const existing = await getDocs(collection(db, COLLECTIONS.CANCHAS));
        if (!existing.empty) {
            console.log('Ya existen canchas en la base de datos');
            return { success: true, message: 'Canchas ya existen', count: existing.size };
        }

        // Obtener todos los predios para mapear
        const prediosDocs = await getDocs(collection(db, COLLECTIONS.PREDIOS));
        const prediosMap = {};
        prediosDocs.docs.forEach(doc => {
            const data = doc.data();
            const key = `${data.nombre}_${data.ciudad}`.toLowerCase().replace(/\s+/g, '_');
            prediosMap[key] = doc.id;
        });

        const resultados = [];
        for (const cancha of canchasData) {
            // Buscar el ID del predio
            const predioKey = cancha.predioId;
            const predioId = prediosMap[predioKey] || idsMap.predios[predioKey];
            
            if (!predioId) {
                console.warn(`No se encontró predio para: ${predioKey}. Predios disponibles:`, Object.keys(prediosMap));
                continue;
            }

            const docRef = await addDoc(collection(db, COLLECTIONS.CANCHAS), {
                ...cancha,
                predioId: predioId,
                creadoEn: new Date()
            });
            idsMap.canchas[cancha.nombre] = docRef.id;
            resultados.push(docRef.id);
        }
        console.log(`✅ Cargadas ${resultados.length} canchas`);
        return { success: true, count: resultados.length, ids: resultados };
    } catch (error) {
        console.error('Error cargando canchas:', error);
        return { success: false, error: error.message };
    }
};

// Cargar precios (después de canchas y franjas horarias)
export const cargarPrecios = async () => {
    try {
        // Asegurarse de que existan canchas y franjas horarias
        if (Object.keys(idsMap.canchas).length === 0) {
            await cargarCanchas();
        }
        if (Object.keys(idsMap.franjasHorarias).length === 0) {
            await cargarFranjasHorarias();
        }

        const existing = await getDocs(collection(db, COLLECTIONS.PRECIOS));
        if (!existing.empty) {
            console.log('Ya existen precios en la base de datos');
            return { success: true, message: 'Precios ya existen', count: existing.size };
        }

        // Obtener canchas UNA VEZ antes del loop
        console.log('Obteniendo canchas...');
        const canchasDocs = await getDocs(collection(db, COLLECTIONS.CANCHAS));
        const canchasMap = {};
        canchasDocs.docs.forEach(doc => {
            const data = doc.data();
            const nombreNormalizado = data.nombre.toLowerCase().trim();
            canchasMap[nombreNormalizado] = doc.id;
            // Mapear por índice (cancha_1 -> Cancha 1)
            const match = nombreNormalizado.match(/cancha\s*(\d+)/);
            if (match) {
                canchasMap[`cancha_${match[1]}`] = doc.id;
            }
        });
        console.log(`Mapeadas ${Object.keys(canchasMap).length} canchas`);

        // Obtener franjas horarias UNA VEZ antes del loop
        console.log('Obteniendo franjas horarias...');
        const franjasDocs = await getDocs(collection(db, COLLECTIONS.FRANJAS_HORARIAS));
        const franjasMap = {};
        franjasDocs.docs.forEach(doc => {
            const data = doc.data();
            const key = `${data.horaInicio}_${data.horaFin}`.replace(/:/g, '_');
            franjasMap[key] = doc.id;
        });
        console.log(`Mapeadas ${Object.keys(franjasMap).length} franjas horarias`);

        const horaMap = {
            'franja_18_19': { inicio: '18:00', fin: '19:00', key: '18_00_19_00' },
            'franja_19_20': { inicio: '19:00', fin: '20:00', key: '19_00_20_00' },
            'franja_20_21': { inicio: '20:00', fin: '21:00', key: '20_00_21_00' }
        };

        const resultados = [];
        let errores = 0;
        
        for (const precio of preciosData) {
            try {
                // Buscar cancha
                const canchaKey = precio.canchaId.toLowerCase();
                const canchaId = canchasMap[canchaKey] || idsMap.canchas[precio.canchaId];
                
                // Buscar franja
                const horaInfo = horaMap[precio.franjaHorariaId];
                const franjaIdReal = horaInfo ? franjasMap[horaInfo.key] : null;

                if (!canchaId) {
                    console.warn(`No se encontró cancha para: ${precio.canchaId}`);
                    errores++;
                    continue;
                }

                if (!franjaIdReal) {
                    console.warn(`No se encontró franja para: ${precio.franjaHorariaId}`);
                    errores++;
                    continue;
                }

                const docRef = await addDoc(collection(db, COLLECTIONS.PRECIOS), {
                    ...precio,
                    canchaId: canchaId,
                    franjaHorariaId: franjaIdReal,
                    horarioInicio: horaInfo.inicio,
                    horarioFin: horaInfo.fin,
                    creadoEn: new Date()
                });
                resultados.push(docRef.id);
            } catch (error) {
                console.error(`Error cargando precio individual:`, error);
                errores++;
            }
        }
        
        console.log(`✅ Cargados ${resultados.length} precios${errores > 0 ? `, ${errores} errores` : ''}`);
        return { 
            success: true, 
            count: resultados.length, 
            ids: resultados,
            errores: errores
        };
    } catch (error) {
        console.error('Error cargando precios:', error);
        return { success: false, error: error.message };
    }
};

// Cargar todos los datos de ejemplo
export const cargarTodosLosDatos = async () => {
    console.log('🚀 Iniciando carga de datos de ejemplo...');
    
    // Validar Firebase primero
    if (!validarFirebase()) {
        const error = 'Firebase no está configurado. Por favor, configura Firebase en src/firebase.js con tus credenciales.';
        console.error('❌', error);
        return { success: false, error };
    }
    
    // Verificar que Firestore esté accesible
    try {
        console.log('Verificando conexión con Firestore...');
        const testQuery = await Promise.race([
            getDocs(collection(db, COLLECTIONS.PREDIOS)),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout: No se pudo conectar a Firestore. Verifica que la base de datos esté creada.')), 10000)
            )
        ]);
        console.log('✅ Conexión con Firestore OK');
    } catch (error) {
        console.error('❌ Error de conexión:', error);
        return { 
            success: false, 
            error: error.message.includes('Timeout') 
                ? 'No se pudo conectar a Firestore. Verifica que:\n1. Firestore Database esté creado en Firebase Console\n2. Las Security Rules permitan lectura\n3. Tu conexión a internet funcione'
                : error.message 
        };
    }
    
    try {
        // Orden de carga importante por dependencias
        console.log('1/6 Cargando predios...');
        const prediosResult = await cargarPredios();
        if (!prediosResult.success && !prediosResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando predios: ${prediosResult.error}`);
        }

        console.log('2/6 Cargando franjas horarias...');
        const franjasResult = await cargarFranjasHorarias();
        if (!franjasResult.success && !franjasResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando franjas horarias: ${franjasResult.error}`);
        }

        console.log('3/6 Cargando servicios...');
        const serviciosResult = await cargarServicios();
        if (!serviciosResult.success && !serviciosResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando servicios: ${serviciosResult.error}`);
        }

        console.log('4/6 Cargando deportes...');
        const deportesResult = await cargarDeportes();
        if (!deportesResult.success && !deportesResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando deportes: ${deportesResult.error}`);
        }

        console.log('5/6 Cargando canchas...');
        const canchasResult = await cargarCanchas();
        if (!canchasResult.success && !canchasResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando canchas: ${canchasResult.error}`);
        }

        console.log('6/6 Cargando precios...');
        const preciosResult = await cargarPrecios();
        if (!preciosResult.success && !preciosResult.message?.includes('ya existen')) {
            throw new Error(`Error cargando precios: ${preciosResult.error}`);
        }

        console.log('✅ Todos los datos de ejemplo han sido cargados exitosamente');
        return { 
            success: true, 
            message: 'Datos cargados exitosamente',
            resumen: {
                predios: prediosResult.count || 0,
                franjas: franjasResult.count || 0,
                servicios: serviciosResult.count || 0,
                deportes: deportesResult.count || 0,
                canchas: canchasResult.count || 0,
                precios: preciosResult.count || 0
            }
        };
    } catch (error) {
        console.error('❌ Error cargando datos:', error);
        return { success: false, error: error.message };
    }
};

// Función para limpiar todos los datos (solo para desarrollo)
export const limpiarDatosEjemplo = async () => {
    console.warn('⚠️ Esta función eliminará todos los datos. Solo usar en desarrollo.');
    // Esta función debería implementarse con cuidado
    // Por ahora solo la dejamos como placeholder
    return { success: false, message: 'Función no implementada por seguridad' };
};

