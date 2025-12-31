import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/firebase';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import { crearPartido, obtenerCancha } from '@/services/partidosService';
import { obtenerPrecio, obtenerPreciosDisponibles } from '@/services/preciosService';
import { verificarDisponibilidad } from '@/services/reservasService';
import { useFranjasHorarias } from '@/hooks/useFranjasHorarias';
import { validarLinkTelegram, isTelegramConfigured } from '@/services/telegramService';
import CalendarioSemanal from '@/components/CalendarioSemanal';
import './CrearPartido.css';

// Configurar idioma español para el calendario
if (typeof document !== 'undefined') {
    document.documentElement.lang = 'es-AR';
}

const CrearPartido = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { data: franjasHorarias = [], isLoading: cargandoFranjas } = useFranjasHorarias();
    const [predios, setPredios] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [precioInfo, setPrecioInfo] = useState(null);
    const [cargandoPrecio, setCargandoPrecio] = useState(false);
    const [franjasDisponibles, setFranjasDisponibles] = useState([]);
    const [cargandoFranjasDisponibles, setCargandoFranjasDisponibles] = useState(false);
    const [canchaSeleccionada, setCanchaSeleccionada] = useState(null);
    const [predioSeleccionado, setPredioSeleccionado] = useState(null);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [pasoActual, setPasoActual] = useState('seleccion'); // 'seleccion' | 'pago'
    
    // Obtener parámetros de URL si vienen de BuscarCanchas
    const predioIdFromUrl = searchParams.get('predioId');
    const canchaIdFromUrl = searchParams.get('canchaId');
    
    const [formData, setFormData] = useState({
        predioId: predioIdFromUrl || '',
        canchaId: canchaIdFromUrl || '',
        fecha: '',
        franjaHorariaId: '',
        tipo: '',
        descripcion: '',
        crearGrupoTelegram: false,
        linkGrupoTelegram: ''
    });

    useEffect(() => {
        cargarPredios();
    }, []);

    useEffect(() => {
        if (formData.predioId) {
            cargarCanchas();
            // Cargar información del predio seleccionado
            const predio = predios.find(p => p.id === formData.predioId);
            setPredioSeleccionado(predio || null);
        } else {
            setCanchas([]);
            setPredioSeleccionado(null);
            if (!canchaIdFromUrl) {
                setFormData(prev => ({ ...prev, canchaId: '' }));
            }
        }
    }, [formData.predioId, predios]);

    // Si viene canchaId desde URL, cargar la información de la cancha
    useEffect(() => {
        if (canchaIdFromUrl) {
            const cargarCanchaDesdeUrl = async () => {
                try {
                    const canchaDocRef = doc(db, 'canchas', canchaIdFromUrl);
                    const canchaDoc = await getDoc(canchaDocRef);
                    if (canchaDoc.exists()) {
                        const canchaData = canchaDoc.data();
                        const canchaCompleta = { id: canchaIdFromUrl, ...canchaData };
                        setCanchaSeleccionada(canchaCompleta);
                        
                        // Actualizar formData con predioId y tipo si no están
                        setFormData(prev => ({
                            ...prev,
                            predioId: prev.predioId || canchaData.predioId || '',
                            canchaId: canchaIdFromUrl,
                            tipo: prev.tipo || canchaData.tipo || ''
                        }));
                        
                        // Mostrar calendario si hay tipo
                        if (canchaData.tipo) {
                            setMostrarCalendario(true);
                            setPasoActual('seleccion');
                        }
                    }
                } catch (error) {
                    console.error('Error cargando cancha desde URL:', error);
                }
            };
            cargarCanchaDesdeUrl();
        }
    }, [canchaIdFromUrl]);

    // Cargar información de la cancha cuando se selecciona
    useEffect(() => {
        if (formData.canchaId && canchas.length > 0) {
            const canchaEncontrada = canchas.find(c => c.id === formData.canchaId);
            if (canchaEncontrada) {
                setCanchaSeleccionada(canchaEncontrada);
                // Si viene desde URL o se selecciona una cancha, cargar el tipo y mostrar calendario
                if (!formData.tipo || formData.tipo !== canchaEncontrada.tipo) {
                    setFormData(prev => ({
                        ...prev,
                        tipo: canchaEncontrada.tipo || ''
                    }));
                }
                // Mostrar calendario si hay cancha y tipo
                if (canchaEncontrada.tipo) {
                    setMostrarCalendario(true);
                    setPasoActual('seleccion');
                }
            }
        } else if (!formData.canchaId) {
            setCanchaSeleccionada(null);
        }
    }, [formData.canchaId, canchas, formData.tipo]);

    const cargarPredios = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'predios'));
            const prediosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPredios(prediosData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        } catch (error) {
            console.error('Error cargando predios:', error);
            addToast('Error al cargar predios', 'error');
        }
    };

    const cargarCanchas = async () => {
        if (!formData.predioId) {
            setCanchas([]);
            return;
        }

        try {
            const q = query(
                collection(db, 'canchas'),
                where('predioId', '==', formData.predioId),
                where('activa', '==', true)
            );
            const querySnapshot = await getDocs(q);
            const canchasData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCanchas(canchasData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
            
            // Si hay canchaId desde URL y está en la lista, asegurarse de que esté seleccionada
            if (canchaIdFromUrl && canchasData.find(c => c.id === canchaIdFromUrl)) {
                const canchaEncontrada = canchasData.find(c => c.id === canchaIdFromUrl);
                setFormData(prev => ({ 
                    ...prev, 
                    canchaId: canchaIdFromUrl,
                    tipo: canchaEncontrada?.tipo || ''
                }));
                setCanchaSeleccionada(canchaEncontrada);
                // Mostrar calendario si hay tipo
                if (canchaEncontrada?.tipo) {
                    setMostrarCalendario(true);
                    setPasoActual('seleccion');
                }
            }
        } catch (error) {
            console.error('Error cargando canchas:', error);
            addToast('Error al cargar canchas', 'error');
        }
    };

    // Buscar franjas horarias disponibles (que tengan precio) cuando cambia cancha, tipo o fecha
    const buscarFranjasDisponibles = async (canchaId, tipo, fecha) => {
        if (!canchaId || !tipo || !fecha) {
            setFranjasDisponibles([]);
            setFormData(prev => ({ ...prev, franjaHorariaId: '' }));
            setPrecioInfo(null);
            return;
        }

        setCargandoFranjasDisponibles(true);
        try {
            // OPTIMIZACIÓN: Obtener cancha y precios en paralelo
            const [cancha, preciosDelDia] = await Promise.all([
                obtenerCancha(canchaId),
                obtenerPreciosDisponibles(canchaId, fecha)
            ]);

            if (!cancha) {
                setFranjasDisponibles([]);
                return;
            }

            // Verificar si la cancha soporta este tipo de partido
            const tiposCancha = cancha.tipos || cancha.tipo || [];
            const tipoNumero = parseInt(tipo);
            
            // Si la cancha tiene tipos específicos, verificar que el tipo seleccionado esté disponible
            if (Array.isArray(tiposCancha) && tiposCancha.length > 0) {
                const tiposDisponibles = tiposCancha.map(t => parseInt(t) || t);
                if (!tiposDisponibles.includes(tipoNumero)) {
                    addToast(`Esta cancha no soporta partidos de ${tipo} vs ${tipo}. Tipos disponibles: ${tiposCancha.join(', ')}`, 'warning');
                    setFranjasDisponibles([]);
                    return;
                }
            }

            // Obtener día de la semana para los precios
            const obtenerDiaSemana = (fecha) => {
                if (typeof fecha === 'string' && fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    const [year, month, day] = fecha.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    return date.getDay().toString();
                }
                const date = new Date(fecha);
                return date.getDay().toString();
            };
            const diaSemana = obtenerDiaSemana(fecha);
            const esFeriadoFecha = false; // TODO: Implementar lógica de feriados
            
            // Crear un mapa de franjaHorariaId -> precio para acceso rápido
            const preciosMap = new Map();
            preciosDelDia.forEach(precio => {
                if (precio.franjaHorariaId && precio.precio) {
                    const precioNumero = typeof precio.precio === 'number' 
                        ? precio.precio 
                        : parseFloat(precio.precio);
                    
                    if (!isNaN(precioNumero) && precioNumero > 0) {
                        // Guardar el precio completo para tener acceso al precioId
                        preciosMap.set(precio.franjaHorariaId, {
                            precio: precioNumero,
                            precioId: precio.id,
                            diaSemana: precio.diaSemana,
                            esFeriado: precio.esFeriado || false
                        });
                    }
                }
            });

            // Filtrar franjas horarias que tienen precio y construir el array de resultados
            const preciosDisponibles = franjasHorarias
                .filter(f => f.activa !== false)
                .filter(f => preciosMap.has(f.id))
                .map(franja => {
                    const precioData = preciosMap.get(franja.id);
                    return {
                        franja: franja,
                        precio: {
                            precio: precioData.precio,
                            precioId: precioData.precioId,
                            diaSemana: precioData.diaSemana,
                            esFeriado: precioData.esFeriado
                        }
                    };
                })
                .sort((a, b) => a.franja.horaInicio.localeCompare(b.franja.horaInicio));
            
            setFranjasDisponibles(preciosDisponibles);
            
            // Si había una franja seleccionada que ya no está disponible, limpiarla
            if (formData.franjaHorariaId && !preciosDisponibles.find(p => p.franja.id === formData.franjaHorariaId)) {
                setFormData(prev => ({ ...prev, franjaHorariaId: '' }));
                setPrecioInfo(null);
            }
        } catch (error) {
            console.error('Error buscando franjas disponibles:', error);
            setFranjasDisponibles([]);
        } finally {
            setCargandoFranjasDisponibles(false);
        }
    };

    const handleChange = async (e) => {
        const newFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        
        // Si cambió el predio, limpiar cancha y campos dependientes
        if (e.target.name === 'predioId') {
            newFormData.canchaId = '';
            newFormData.tipo = '';
            newFormData.fecha = '';
            newFormData.franjaHorariaId = '';
            setFranjasDisponibles([]);
            setPrecioInfo(null);
        }
        
        // Si cambió la cancha, cargar el tipo automáticamente desde la cancha
        if (e.target.name === 'canchaId') {
            const canchaEncontrada = canchas.find(c => c.id === e.target.value);
            if (canchaEncontrada) {
                newFormData.tipo = canchaEncontrada.tipo || '';
                setCanchaSeleccionada(canchaEncontrada);
                // Mostrar calendario cuando se selecciona una cancha
                setMostrarCalendario(true);
                setPasoActual('seleccion');
            } else {
                newFormData.tipo = '';
                setCanchaSeleccionada(null);
                setMostrarCalendario(false);
            }
            newFormData.fecha = '';
            newFormData.franjaHorariaId = '';
            setFranjasDisponibles([]);
            setPrecioInfo(null);
        }
        
        // El tipo ya no se puede cambiar manualmente, se carga desde la cancha
        
        setFormData(newFormData);
        
        // Si cambió cancha o fecha, buscar franjas disponibles (el tipo se carga automáticamente)
        if (e.target.name === 'canchaId' || e.target.name === 'fecha') {
            if (newFormData.canchaId && newFormData.tipo && newFormData.fecha) {
                buscarFranjasDisponibles(newFormData.canchaId, newFormData.tipo, newFormData.fecha);
            }
        }
        
        // Si cambió la franja horaria seleccionada, buscar el precio
        if (e.target.name === 'franjaHorariaId' && newFormData.canchaId && newFormData.fecha && newFormData.franjaHorariaId) {
            const franjaSeleccionada = franjasDisponibles.find(p => p.franja.id === newFormData.franjaHorariaId);
            if (franjaSeleccionada && franjaSeleccionada.precio) {
                setPrecioInfo(franjaSeleccionada.precio);
            } else {
                // Si no está en la lista, buscar el precio directamente
                const franja = franjasHorarias.find(f => f.id === newFormData.franjaHorariaId);
                if (franja) {
                    setCargandoPrecio(true);
                    try {
                        const precio = await obtenerPrecio(newFormData.canchaId, newFormData.fecha, franja.horaInicio);
                        if (precio && precio.precio) {
                            setPrecioInfo(precio);
                        } else {
                            setPrecioInfo(null);
                        }
                    } catch (error) {
                        console.error('Error obteniendo precio:', error);
                        setPrecioInfo(null);
                    } finally {
                        setCargandoPrecio(false);
                    }
                }
            }
        }
    };


    const calcularPrecioPorJugador = () => {
        if (precioInfo?.precio && formData.tipo) {
            const numJugadores = parseInt(formData.tipo) * 2; // Por ejemplo, 5 vs 5 = 10 jugadores
            return (precioInfo.precio / numJugadores).toFixed(2);
        }
        return 0;
    };

    // Calcular el monto a pagar según la configuración del predio
    const calcularMontoAPagar = () => {
        if (!precioInfo?.precio || !predioSeleccionado) {
            return 0;
        }

        const precioTotal = typeof precioInfo.precio === 'number' 
            ? precioInfo.precio 
            : parseFloat(precioInfo.precio) || 0;

        if (predioSeleccionado.tipoPago === 'total') {
            return precioTotal;
        }

        // Si es reserva
        if (predioSeleccionado.tipoPago === 'reserva') {
            if (predioSeleccionado.tipoReserva === 'porcentaje') {
                const porcentaje = predioSeleccionado.valorReserva || 50;
                return (precioTotal * porcentaje) / 100;
            } else {
                // Monto fijo
                return predioSeleccionado.valorReserva || 0;
            }
        }

        return precioTotal;
    };

    // Validar link de Telegram si se proporcionó
    const validarDatosAntesDePago = () => {
        if (!formData.predioId || !formData.canchaId || !formData.tipo || !formData.fecha || !formData.franjaHorariaId) {
            addToast('Por favor completa todos los campos', 'error');
            return false;
        }

        // Validar link de Telegram si se proporcionó
        if (formData.crearGrupoTelegram && formData.linkGrupoTelegram) {
            if (!validarLinkTelegram(formData.linkGrupoTelegram)) {
                addToast('El link de Telegram no es válido. Debe ser un link de invitación a un grupo de Telegram (ej: https://t.me/joinchat/...).', 'error');
                return false;
            }
        }

        if (!precioInfo || !precioInfo.precio) {
            addToast('No se pudo obtener el precio para esta cancha, fecha y hora. Por favor verifica los datos.', 'error');
            return false;
        }

        return true;
    };

    // Procesar pago directamente (sin paso intermedio)
    const procesarPagoDirecto = async () => {
        if (!validarDatosAntesDePago()) {
            return;
        }

        if (!user) {
            addToast('Debes estar autenticado para crear un partido', 'error');
            return;
        }

        setLoading(true);
        try {
            // Importar funciones necesarias
            const { crearPartido, obtenerCancha } = await import('@/services/partidosService');
            const { crearPreferenciaPago } = await import('@/services/mercadopagoService');
            const { verificarDisponibilidad } = await import('@/services/reservasService');

            // Verificar disponibilidad
            const franjaSeleccionada = franjasHorarias.find(f => f.id === formData.franjaHorariaId);
            if (franjaSeleccionada) {
                const disponibilidad = await verificarDisponibilidad(
                    formData.canchaId,
                    formData.fecha,
                    franjaSeleccionada.horaInicio,
                    franjaSeleccionada.horaFin
                );

                if (!disponibilidad.disponible) {
                    addToast('La cancha no está disponible para este horario. Por favor selecciona otro horario.', 'error');
                    setLoading(false);
                    return;
                }
            }

            // Obtener cancha
            const cancha = await obtenerCancha(formData.canchaId);
            if (!cancha) {
                addToast('Cancha no encontrada', 'error');
                setLoading(false);
                return;
            }

            // Crear el partido
            const partidoDataCompleto = {
                creadorId: user.id,
                creadorNombre: user.nombre || '',
                creadorEmail: user.email || '',
                canchaId: formData.canchaId,
                canchaNombre: cancha.nombre || '',
                canchaDireccion: cancha.direccion || cancha.ubicacion || '',
                predioId: cancha.predioId || formData.predioId || '',
                fecha: formData.fecha,
                hora: franjaSeleccionada?.horaInicio || '',
                horaFin: franjaSeleccionada?.horaFin || '',
                franjaHorariaId: formData.franjaHorariaId,
                tipo: formData.tipo,
                precioTotal: typeof precioInfo.precio === 'number' ? precioInfo.precio : parseFloat(precioInfo.precio) || 0,
                precioPorJugador: parseFloat(calcularPrecioPorJugador()),
                precioId: precioInfo.precioId || '',
                descripcion: formData.descripcion || '',
                jugadores: [],
                estado: 'activo',
                grupoTelegram: formData.crearGrupoTelegram && formData.linkGrupoTelegram ? {
                    link: formData.linkGrupoTelegram,
                    activo: true
                } : null,
                pago: {
                    tipo: predioSeleccionado?.tipoPago || 'total',
                    montoTotal: typeof precioInfo.precio === 'number' ? precioInfo.precio : parseFloat(precioInfo.precio) || 0,
                    montoAPagar: calcularMontoAPagar(),
                    montoPagado: 0,
                    metodo: 'mercadopago',
                    estado: 'pendiente'
                }
            };

            const resultado = await crearPartido(partidoDataCompleto);
            
            if (!resultado.success) {
                addToast('Error al crear partido', 'error');
                setLoading(false);
                return;
            }

            const partidoId = resultado.id;

            // Crear preferencia de MercadoPago y redirigir directamente
            const preferencia = await crearPreferenciaPago({
                partidoId: partidoId,
                pagoId: `pago-${partidoId}-${Date.now()}`,
                monto: calcularMontoAPagar(),
                nombre: user.nombre || 'Usuario',
                email: user.email || '',
                partidoNombre: cancha.nombre || 'Partido'
            });

            if (preferencia.success && preferencia.initPoint) {
                // Mostrar mensaje informativo antes de redirigir (solo en desarrollo HTTP)
                const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
                if (origin.startsWith('http://')) {
                    addToast(
                        '⚠️ IMPORTANTE: Después del pago, busca el botón "Volver al sitio" en la página de MercadoPago y haz clic en él para regresar a la aplicación.',
                        'warning',
                        10000 // Mostrar por 10 segundos
                    );
                    // Esperar un momento para que el usuario vea el mensaje
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                // Redirigir directamente a MercadoPago
                window.location.href = preferencia.initPoint;
            } else {
                addToast('Error al procesar el pago con MercadoPago: ' + (preferencia.error || 'Error desconocido'), 'error');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al procesar el pago', 'error');
            setLoading(false);
        }
    };

    return (
        <div className="crear-partido">
            <div className="hero-crear-partido">
                <div className="hero-content">
                    <h1 className="hero-title">Crear Nuevo Partido</h1>
                    <p className="hero-subtitle">Organizá tu partido y reservá tu cancha favorita</p>

                    <form onSubmit={(e) => e.preventDefault()} className="partido-form">
                <div className="form-group">
                    <label>Predio/Sede *</label>
                    <select
                        name="predioId"
                        value={formData.predioId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona un predio</option>
                        {predios.map(predio => (
                            <option key={predio.id} value={predio.id}>
                                {predio.nombre} - {predio.ciudad}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Cancha *</label>
                    <select
                        name="canchaId"
                        value={formData.canchaId}
                        onChange={handleChange}
                        required
                        disabled={!formData.predioId}
                    >
                        <option value="">{formData.predioId ? 'Selecciona una cancha' : 'Primero selecciona un predio'}</option>
                        {canchas.map(cancha => (
                            <option key={cancha.id} value={cancha.id}>
                                {cancha.nombre} - {cancha.deporte || 'Fútbol'}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Tipo de Partido *</label>
                    {formData.canchaId && formData.tipo ? (
                        <div className="tipo-display">
                            <input
                                type="text"
                                value={`${formData.tipo} vs ${formData.tipo}`}
                                readOnly
                                className="tipo-readonly"
                            />
                            <small className="form-hint">El tipo se determina automáticamente según la cancha seleccionada</small>
                        </div>
                    ) : (
                        <div className="tipo-placeholder">
                            <span>{formData.canchaId ? 'Cargando tipo de cancha...' : 'Primero selecciona una cancha'}</span>
                        </div>
                    )}
                </div>

                {canchaSeleccionada && canchaSeleccionada.caracteristicas && canchaSeleccionada.caracteristicas.length > 0 && (
                    <div className="form-group form-group-full">
                        <label>Características de la Cancha</label>
                        <div className="cancha-caracteristicas-display">
                            {canchaSeleccionada.caracteristicas.map((caracteristica, index) => (
                                <div key={index} className="caracteristica-item-display">
                                    <span className="caracteristica-nombre-display">{caracteristica.nombre}:</span>
                                    <span className="caracteristica-valor-display">{caracteristica.valor}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mostrar calendario semanal cuando se selecciona una cancha */}
                {mostrarCalendario && formData.canchaId && formData.tipo && pasoActual === 'seleccion' && (
                    <div className="calendario-container">
                        <h2 style={{ marginBottom: '20px', color: '#4CAF50' }}>Selecciona Fecha y Horario</h2>
                        <CalendarioSemanal
                            canchaId={formData.canchaId}
                            tipo={formData.tipo}
                            predioId={formData.predioId}
                            predio={predios.find(p => p.id === formData.predioId)}
                            onSeleccionarHorario={(fechaStr, horario) => {
                                setFormData(prev => ({
                                    ...prev,
                                    fecha: fechaStr,
                                    franjaHorariaId: horario.franjaId
                                }));
                                setPrecioInfo({
                                    precio: horario.precio,
                                    precioId: horario.precioId,
                                    franjaHoraria: franjasHorarias.find(f => f.id === horario.franjaId)
                                });
                                // Avanzar al paso de pago automáticamente
                                setPasoActual('pago');
                            }}
                        />
                    </div>
                )}

                {/* Mostrar sección de pago cuando se ha seleccionado fecha y horario */}
                {pasoActual === 'pago' && formData.fecha && formData.franjaHorariaId && (
                    <div className="seccion-pago">
                        <h2>Resumen del Partido</h2>
                        <div className="resumen-partido">
                            <div className="resumen-item">
                                <span className="resumen-label">Cancha:</span>
                                <span className="resumen-value">{canchaSeleccionada?.nombre || ''}</span>
                            </div>
                            <div className="resumen-item">
                                <span className="resumen-label">Tipo:</span>
                                <span className="resumen-value">{formData.tipo} vs {formData.tipo}</span>
                            </div>
                            <div className="resumen-item">
                                <span className="resumen-label">Fecha:</span>
                                <span className="resumen-value">
                                    {formData.fecha ? format(parseISO(formData.fecha), 'EEEE, d \'de\' MMMM \'de\' yyyy', { locale: es }) : ''}
                                </span>
                            </div>
                            <div className="resumen-item">
                                <span className="resumen-label">Horario:</span>
                                <span className="resumen-value">
                                    {franjasHorarias.find(f => f.id === formData.franjaHorariaId)?.horaInicio || ''} - {franjasHorarias.find(f => f.id === formData.franjaHorariaId)?.horaFin || ''}
                                </span>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Precio Total de la Cancha ($)</label>
                            {cargandoPrecio ? (
                                <div className="precio-cargando">
                                    <span>Cargando precio...</span>
                                </div>
                            ) : precioInfo && precioInfo.precio ? (
                                <div className="precio-info-container">
                                    <div className="precio-total">
                                        <strong>${(typeof precioInfo.precio === 'number' ? precioInfo.precio : parseFloat(precioInfo.precio) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                                    </div>
                                    {formData.tipo && (
                                        <p className="precio-por-jugador">
                                            Precio por jugador: <strong>${calcularPrecioPorJugador()}</strong>
                                            <span className="precio-detalle">
                                                ({formData.tipo} vs {formData.tipo} = {parseInt(formData.tipo) * 2} jugadores)
                                            </span>
                                        </p>
                                    )}
                                    {precioInfo.esFeriado && (
                                        <p className="precio-feriado">⚠️ Precio de feriado</p>
                                    )}
                                </div>
                            ) : (
                                <div className="precio-no-disponible">
                                    <span>Selecciona cancha, fecha y hora para ver el precio</span>
                                </div>
                            )}
                        </div>

                        {precioInfo && precioInfo.precio && predioSeleccionado && (
                            <div className="monto-pago-container">
                                <div className="monto-pago-info">
                                    <div className="monto-total">
                                        <span className="monto-label">Precio Total:</span>
                                        <span className="monto-valor">
                                            ${(typeof precioInfo.precio === 'number' ? precioInfo.precio : parseFloat(precioInfo.precio) || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {predioSeleccionado.tipoPago === 'reserva' && (
                                        <div className="monto-reserva">
                                            <span className="monto-label">
                                                {predioSeleccionado.tipoReserva === 'porcentaje' 
                                                    ? `Reserva (${predioSeleccionado.valorReserva || 50}%):`
                                                    : 'Reserva:'}
                                            </span>
                                            <span className="monto-valor">
                                                ${calcularMontoAPagar().toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                    <div className="monto-a-pagar">
                                        <span className="monto-label">Monto a Pagar:</span>
                                        <span className="monto-valor-destacado">
                                            ${calcularMontoAPagar().toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="botones-navegacion">
                            <button
                                type="button"
                                onClick={() => {
                                    setPasoActual('seleccion');
                                    setFormData(prev => ({ ...prev, fecha: '', franjaHorariaId: '' }));
                                    setPrecioInfo(null);
                                }}
                                className="btn-volver"
                            >
                                <i className="fas fa-arrow-left"></i> Volver a Seleccionar
                            </button>
                            {precioInfo && precioInfo.precio && predioSeleccionado && (
                                <button
                                    type="button"
                                    onClick={procesarPagoDirecto}
                                    className="btn-continuar-pago"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin"></i> Procesando...
                                        </>
                                    ) : (
                                        <>
                                            {predioSeleccionado.tipoPago === 'reserva' ? 'Pagar Reserva con MercadoPago' : 'Pagar Total con MercadoPago'} 
                                            <i className="fas fa-arrow-right"></i>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Mostrar campos adicionales */}
                {pasoActual === 'pago' && (
                    <>
                        <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Información adicional sobre el partido..."
                            />
                        </div>

                        <div className="form-group telegram-group">
                    <div className="telegram-checkbox">
                        <input
                            type="checkbox"
                            id="crearGrupoTelegram"
                            name="crearGrupoTelegram"
                            checked={formData.crearGrupoTelegram}
                            onChange={(e) => {
                                setFormData({
                                    ...formData,
                                    crearGrupoTelegram: e.target.checked,
                                    linkGrupoTelegram: e.target.checked ? formData.linkGrupoTelegram : ''
                                });
                            }}
                        />
                        <label htmlFor="crearGrupoTelegram">
                            <i className="fab fa-telegram"></i> Crear grupo de Telegram para este partido
                        </label>
                    </div>
                    {formData.crearGrupoTelegram && (
                        <div className="telegram-link-input">
                            <label htmlFor="linkGrupoTelegram">Link del grupo de Telegram *</label>
                            <input
                                type="url"
                                id="linkGrupoTelegram"
                                name="linkGrupoTelegram"
                                value={formData.linkGrupoTelegram}
                                onChange={handleChange}
                                placeholder="https://t.me/joinchat/..."
                                required={formData.crearGrupoTelegram}
                            />
                            <small className="form-hint">
                                Crea un grupo en Telegram y pega aquí el link de invitación. Los jugadores que agregues al partido podrán ser añadidos al grupo automáticamente si proporcionan su username de Telegram.
                            </small>
                        </div>
                        )}
                        </div>
                    </>
                )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CrearPartido;




