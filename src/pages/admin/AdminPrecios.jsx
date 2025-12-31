import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast, useAuth } from '@/context';
import { useFranjasHorarias } from '@/hooks/useFranjasHorarias';
import { tieneRol, esAdminPredio } from '@/services/usuariosService';
import { ROLES } from '@/utils/constants';
import './AdminPrecios.css';

const DIAS_SEMANA = [
    { value: '0', label: 'Domingo' },
    { value: '1', label: 'Lunes' },
    { value: '2', label: 'Martes' },
    { value: '3', label: 'Miércoles' },
    { value: '4', label: 'Jueves' },
    { value: '5', label: 'Viernes' },
    { value: '6', label: 'Sábado' },
    { value: 'feriado', label: 'Feriado' }
];

const AdminPrecios = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const esAdmin = tieneRol(user, ROLES.ADMIN);
    const esAdminPredios = tieneRol(user, ROLES.ADMIN_PREDIOS);
    const prediosAsignados = user?.prediosAsignados || [];
    
    const { data: franjasHorarias = [] } = useFranjasHorarias();
    const [predios, setPredios] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [precios, setPrecios] = useState([]);
    const [predioSeleccionado, setPredioSeleccionado] = useState('');
    const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [modoMasivo, setModoMasivo] = useState(false);
    const [formData, setFormData] = useState({
        canchaId: '',
        diaSemana: '',
        diasSeleccionados: [], // Para modo masivo con múltiples días
        franjaHorariaId: '',
        precio: '',
        esFeriado: false,
        // Para modo masivo
        horaInicioRango: '',
        horaFinRango: ''
    });

    useEffect(() => {
        cargarPredios();
    }, []);

    useEffect(() => {
        if (predioSeleccionado) {
            cargarCanchas();
        } else {
            setCanchas([]);
            setCanchaSeleccionada('');
        }
    }, [predioSeleccionado]);

    useEffect(() => {
        if (canchaSeleccionada) {
            cargarPrecios();
        } else {
            setPrecios([]);
        }
    }, [canchaSeleccionada]);

    const cargarPredios = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'predios'));
            let prediosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Si es admin_predios, filtrar solo los predios asignados
            if (esAdminPredios && !esAdmin) {
                prediosData = prediosData.filter(predio => prediosAsignados.includes(predio.id));
            }
            
            setPredios(prediosData);
            
            // Si solo hay un predio disponible y es admin_predios, seleccionarlo automáticamente
            if (prediosData.length === 1 && esAdminPredios && !esAdmin && !predioSeleccionado) {
                setPredioSeleccionado(prediosData[0].id);
            }
        } catch (error) {
            console.error('Error cargando predios:', error);
            addToast('Error al cargar predios', 'error');
        }
    };

    const cargarCanchas = async () => {
        if (!predioSeleccionado) return;
        
        // Si es admin_predios, verificar que el predio esté asignado
        if (esAdminPredios && !esAdmin) {
            if (!prediosAsignados.includes(predioSeleccionado)) {
                addToast('No tienes permisos para gestionar este predio', 'error');
                setCanchas([]);
                return;
            }
        }
        
        try {
            const q = query(collection(db, 'canchas'), where('predioId', '==', predioSeleccionado));
            const querySnapshot = await getDocs(q);
            const canchasData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCanchas(canchasData);
        } catch (error) {
            console.error('Error cargando canchas:', error);
            addToast('Error al cargar canchas', 'error');
        }
    };

    const cargarPrecios = async () => {
        if (!canchaSeleccionada) return;
        
        setLoading(true);
        try {
            const q = query(collection(db, 'precios'), where('canchaId', '==', canchaSeleccionada));
            const querySnapshot = await getDocs(q);
            const preciosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrecios(preciosData.sort((a, b) => {
                if (a.diaSemana !== b.diaSemana) {
                    if (a.diaSemana === 'feriado') return 1;
                    if (b.diaSemana === 'feriado') return -1;
                    return parseInt(a.diaSemana) - parseInt(b.diaSemana);
                }
                return a.horarioInicio.localeCompare(b.horarioInicio);
            }));
        } catch (error) {
            console.error('Error cargando precios:', error);
            addToast('Error al cargar precios', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        // Manejar selección múltiple de días
        if (name === 'diaCheckbox') {
            const diaValue = value;
            let nuevosDias = [...(formData.diasSeleccionados || [])];
            
            if (checked) {
                if (!nuevosDias.includes(diaValue)) {
                    nuevosDias.push(diaValue);
                }
            } else {
                nuevosDias = nuevosDias.filter(d => d !== diaValue);
            }
            
            setFormData({
                ...formData,
                diasSeleccionados: nuevosDias
            });
        } else {
            setFormData({
                ...formData,
                [name]: type === 'checkbox' ? checked : value
            });
        }
    };

    // Función para convertir hora "HH:MM" a minutos
    const horaAMinutos = (hora) => {
        const [h, m] = hora.split(':').map(Number);
        return h * 60 + (m || 0);
    };

    // Función para verificar si una franja horaria está dentro del rango
    const franjaEnRango = (franja, horaInicioRango, horaFinRango) => {
        const inicioFranja = horaAMinutos(franja.horaInicio);
        const finFranja = horaAMinutos(franja.horaFin);
        const inicioRango = horaAMinutos(horaInicioRango);
        const finRango = horaAMinutos(horaFinRango);
        
        // La franja está dentro del rango si su inicio está dentro o igual al inicio del rango
        // y su fin está dentro o igual al fin del rango
        return inicioFranja >= inicioRango && finFranja <= finRango;
    };

    // Obtener franjas horarias dentro del rango
    const obtenerFranjasEnRango = (horaInicioRango, horaFinRango) => {
        if (!horaInicioRango || !horaFinRango) return [];
        
        return franjasHorarias
            .filter(f => f.activa !== false)
            .filter(f => franjaEnRango(f, horaInicioRango, horaFinRango))
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Verificar permisos si es admin_predios
        if (esAdminPredios && !esAdmin && formData.canchaId) {
            const cancha = canchas.find(c => c.id === formData.canchaId);
            if (cancha && !prediosAsignados.includes(cancha.predioId)) {
                addToast('No tienes permisos para gestionar precios de esta cancha', 'error');
                setLoading(false);
                return;
            }
        }

        if (modoMasivo) {
            // Modo masivo: crear precios para todas las franjas en el rango y días seleccionados
            const diasParaProcesar = formData.esFeriado 
                ? ['feriado'] 
                : ((formData.diasSeleccionados || []).length > 0 ? (formData.diasSeleccionados || []) : [formData.diaSemana].filter(Boolean));
            
            if (!formData.canchaId || diasParaProcesar.length === 0 || !formData.horaInicioRango || !formData.horaFinRango || !formData.precio) {
                addToast('Completa todos los campos y selecciona al menos un día', 'error');
                setLoading(false);
                return;
            }

            const franjasEnRango = obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango);
            
            if (franjasEnRango.length === 0) {
                addToast('No hay franjas horarias en el rango seleccionado', 'error');
                setLoading(false);
                return;
            }

            try {
                // Verificar si ya existen precios para evitar duplicados
                const preciosExistentes = await getDocs(
                    query(collection(db, 'precios'), where('canchaId', '==', formData.canchaId))
                );
                const preciosExistentesMap = new Map();
                preciosExistentes.docs.forEach(doc => {
                    const data = doc.data();
                    const key = `${data.canchaId}_${data.franjaHorariaId}_${data.esFeriado ? 'feriado' : data.diaSemana}`;
                    preciosExistentesMap.set(key, doc.id);
                });

                let creados = 0;
                let actualizados = 0;

                // Iterar sobre cada día seleccionado
                for (const diaSemana of diasParaProcesar) {
                    // Iterar sobre cada franja horaria en el rango
                    for (const franja of franjasEnRango) {
                        const key = `${formData.canchaId}_${franja.id}_${diaSemana}`;
                        const precioExistenteId = preciosExistentesMap.get(key);

                        const precioData = {
                            canchaId: formData.canchaId,
                            diaSemana: diaSemana,
                            franjaHorariaId: franja.id,
                            horarioInicio: franja.horaInicio,
                            horarioFin: franja.horaFin,
                            precio: parseFloat(formData.precio),
                            esFeriado: formData.esFeriado,
                            activo: true,
                            actualizadoEn: new Date()
                        };

                        if (precioExistenteId) {
                            // Actualizar precio existente
                            await updateDoc(doc(db, 'precios', precioExistenteId), precioData);
                            actualizados++;
                        } else {
                            // Crear nuevo precio
                            precioData.creadoEn = new Date();
                            await addDoc(collection(db, 'precios'), precioData);
                            creados++;
                        }
                    }
                }

                const totalPrecios = creados + actualizados;
                addToast(
                    `Precios procesados: ${creados} creados, ${actualizados} actualizados (${totalPrecios} total)`,
                    'success'
                );

                setFormData({
                    canchaId: canchaSeleccionada || '',
                    diaSemana: '',
                    diasSeleccionados: [],
                    franjaHorariaId: '',
                    precio: '',
                    esFeriado: false,
                    horaInicioRango: '',
                    horaFinRango: ''
                });
                setMostrarForm(false);
                setModoMasivo(false);
                cargarPrecios();
            } catch (error) {
                console.error('Error:', error);
                addToast('Error al guardar precios', 'error');
            } finally {
                setLoading(false);
            }
        } else {
            // Modo individual: crear/editar un precio
            if (!formData.canchaId || !formData.diaSemana || !formData.franjaHorariaId || !formData.precio) {
                addToast('Completa todos los campos', 'error');
                setLoading(false);
                return;
            }

            // Obtener datos de la franja horaria
            const franja = franjasHorarias.find(f => f.id === formData.franjaHorariaId);
            if (!franja) {
                addToast('Franja horaria no encontrada', 'error');
                setLoading(false);
                return;
            }

            try {
                const precioData = {
                    canchaId: formData.canchaId,
                    diaSemana: formData.esFeriado ? 'feriado' : formData.diaSemana,
                    franjaHorariaId: formData.franjaHorariaId,
                    horarioInicio: franja.horaInicio, // Mantener para compatibilidad
                    horarioFin: franja.horaFin, // Mantener para compatibilidad
                    precio: parseFloat(formData.precio),
                    esFeriado: formData.esFeriado,
                    activo: true,
                    creadoEn: editando ? editando.creadoEn : new Date(),
                    actualizadoEn: new Date()
                };

                if (editando) {
                    await updateDoc(doc(db, 'precios', editando.id), precioData);
                    addToast('Precio actualizado', 'success');
                } else {
                    await addDoc(collection(db, 'precios'), precioData);
                    addToast('Precio creado', 'success');
                }

                setFormData({
                    canchaId: canchaSeleccionada || '',
                    diaSemana: '',
                    diasSeleccionados: [],
                    franjaHorariaId: '',
                    precio: '',
                    esFeriado: false,
                    horaInicioRango: '',
                    horaFinRango: ''
                });
                setMostrarForm(false);
                setEditando(null);
                cargarPrecios();
            } catch (error) {
                console.error('Error:', error);
                addToast('Error al guardar precio', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleEditar = (precio) => {
        setEditando(precio);
        setFormData({
            canchaId: precio.canchaId,
            diaSemana: precio.esFeriado ? '' : precio.diaSemana,
            diasSeleccionados: [],
            franjaHorariaId: precio.franjaHorariaId || '',
            precio: precio.precio.toString(),
            esFeriado: precio.esFeriado || false,
            horaInicioRango: '',
            horaFinRango: ''
        });
        setMostrarForm(true);
        setModoMasivo(false);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este precio?')) return;

        try {
            await deleteDoc(doc(db, 'precios', id));
            addToast('Precio eliminado', 'success');
            cargarPrecios();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar precio', 'error');
        }
    };

    const canchaActual = canchas.find(c => c.id === canchaSeleccionada);
    const predioActual = predios.find(p => p.id === predioSeleccionado);
    
    // Estado para controlar qué días están expandidos
    const [diasExpandidos, setDiasExpandidos] = useState(new Set());
    
    // Función para agrupar precios por día
    const preciosPorDia = precios.reduce((acc, precio) => {
        const diaKey = precio.diaSemana === 'feriado' ? 'feriado' : precio.diaSemana;
        if (!acc[diaKey]) {
            acc[diaKey] = [];
        }
        acc[diaKey].push(precio);
        return acc;
    }, {});
    
    // Ordenar los días según el orden de la semana
    const diasOrdenados = Object.keys(preciosPorDia).sort((a, b) => {
        if (a === 'feriado') return 1;
        if (b === 'feriado') return -1;
        return parseInt(a) - parseInt(b);
    });
    
    // Función para toggle del acordeón
    const toggleDia = (diaKey) => {
        const nuevosExpandidos = new Set(diasExpandidos);
        if (nuevosExpandidos.has(diaKey)) {
            nuevosExpandidos.delete(diaKey);
        } else {
            nuevosExpandidos.add(diaKey);
        }
        setDiasExpandidos(nuevosExpandidos);
    };

    return (
        <div className="admin-precios">
            <div className="admin-header">
                <h1>Gestionar Precios</h1>
            </div>

            <div className="selectores">
                <div className="selector-group">
                    <label>Predio:</label>
                    <select
                        value={predioSeleccionado}
                        onChange={(e) => {
                            setPredioSeleccionado(e.target.value);
                            setCanchaSeleccionada('');
                            setMostrarForm(false);
                            setEditando(null);
                        }}
                        disabled={esAdminPredios && !esAdmin && predios.length === 1}
                    >
                        <option value="">-- Selecciona un predio --</option>
                        {predios.map(predio => (
                            <option key={predio.id} value={predio.id}>
                                {predio.nombre} - {predio.ciudad}
                            </option>
                        ))}
                    </select>
                    {esAdminPredios && !esAdmin && predios.length === 1 && (
                        <small className="predio-info-hint">
                            <i className="fas fa-info-circle"></i>
                            Solo puedes gestionar este predio asignado
                        </small>
                    )}
                </div>

                {predioSeleccionado && (
                    <div className="selector-group selector-cancha">
                        <label>Cancha:</label>
                        <select
                            value={canchaSeleccionada}
                            onChange={(e) => {
                                setCanchaSeleccionada(e.target.value);
                                setFormData({ ...formData, canchaId: e.target.value });
                                setMostrarForm(false);
                                setEditando(null);
                            }}
                        >
                            <option value="">-- Selecciona una cancha --</option>
                            {canchas.map(cancha => (
                                <option key={cancha.id} value={cancha.id}>
                                    {cancha.nombre} - {cancha.deporte} {cancha.tipo}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {canchaSeleccionada && (
                    <div className="botones-accion">
                        <button
                            onClick={() => {
                setFormData({
                    canchaId: canchaSeleccionada,
                    diaSemana: '',
                    diasSeleccionados: [],
                    franjaHorariaId: '',
                    precio: '',
                    esFeriado: false,
                    horaInicioRango: '',
                    horaFinRango: ''
                });
                                setMostrarForm(true);
                                setEditando(null);
                                setModoMasivo(false);
                            }}
                            className="btn-nuevo"
                        >
                            + Nuevo Precio
                        </button>
                        <button
                            onClick={() => {
                                setFormData({
                                    canchaId: canchaSeleccionada,
                                    diaSemana: '',
                                    franjaHorariaId: '',
                                    precio: '',
                                    esFeriado: false,
                                    horaInicioRango: '08:00',
                                    horaFinRango: '23:00'
                                });
                                setMostrarForm(true);
                                setEditando(null);
                                setModoMasivo(true);
                            }}
                            className="btn-nuevo btn-masivo"
                        >
                            + Precios por Rango
                        </button>
                    </div>
                )}
            </div>

            {canchaActual && predioActual && (
                <div className="info-cancha">
                    <h3>{canchaActual.nombre}</h3>
                    <p>{predioActual.nombre} - {predioActual.ciudad}</p>
                </div>
            )}

            {mostrarForm && canchaSeleccionada && (
                <form onSubmit={handleSubmit} className="precio-form">
                    <div className="form-header">
                        <h2>{editando ? 'Editar Precio' : modoMasivo ? 'Precios por Rango Horario' : 'Nuevo Precio'}</h2>
                        {!editando && (
                            <div className="modo-toggle">
                                <button
                                    type="button"
                                    onClick={() => setModoMasivo(false)}
                                    className={!modoMasivo ? 'active' : ''}
                                >
                                    Individual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModoMasivo(true)}
                                    className={modoMasivo ? 'active' : ''}
                                >
                                    Por Rango
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="esFeriado"
                                    checked={formData.esFeriado}
                                    onChange={handleChange}
                                />
                                Es Feriado
                            </label>
                        </div>
                        {!formData.esFeriado && (
                            <div className="form-group form-group-full">
                                <label>Días de la Semana *</label>
                                {modoMasivo ? (
                                    <div className="dias-checkbox-group">
                                        {DIAS_SEMANA.filter(d => d.value !== 'feriado').map(dia => (
                                            <label key={dia.value} className="checkbox-label">
                                                <input
                                                    type="checkbox"
                                                    name="diaCheckbox"
                                                    value={dia.value}
                                                    checked={(formData.diasSeleccionados || []).includes(dia.value)}
                                                    onChange={handleChange}
                                                />
                                                <span>{dia.label}</span>
                                            </label>
                                        ))}
                                        <div className="dias-acciones">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const todosLosDias = DIAS_SEMANA
                                                        .filter(d => d.value !== 'feriado')
                                                        .map(d => d.value);
                                                    setFormData({ ...formData, diasSeleccionados: todosLosDias });
                                                }}
                                                className="btn-link"
                                            >
                                                Seleccionar todos
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, diasSeleccionados: [] });
                                                }}
                                                className="btn-link"
                                            >
                                                Deseleccionar todos
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <select
                                        name="diaSemana"
                                        value={formData.diaSemana}
                                        onChange={handleChange}
                                        required={!formData.esFeriado}
                                    >
                                        <option value="">Selecciona</option>
                                        {DIAS_SEMANA.filter(d => d.value !== 'feriado').map(dia => (
                                            <option key={dia.value} value={dia.value}>
                                                {dia.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                        
                        {modoMasivo ? (
                            <>
                                <div className="form-group">
                                    <label>Hora Inicio del Rango *</label>
                                    <input
                                        type="time"
                                        name="horaInicioRango"
                                        value={formData.horaInicioRango}
                                        onChange={handleChange}
                                        required
                                    />
                                    <small>Hora desde la cual aplicar el precio</small>
                                </div>
                                <div className="form-group">
                                    <label>Hora Fin del Rango *</label>
                                    <input
                                        type="time"
                                        name="horaFinRango"
                                        value={formData.horaFinRango}
                                        onChange={handleChange}
                                        required
                                    />
                                    <small>Hora hasta la cual aplicar el precio</small>
                                </div>
                                {formData.horaInicioRango && formData.horaFinRango && (
                                    <div className="form-group form-group-full">
                                        <div className="franjas-preview">
                                            <strong>Vista previa de precios a crear/actualizar:</strong>
                                            <div className="preview-info">
                                                <div className="preview-section">
                                                    <strong>Días seleccionados:</strong>
                                                    <div className="dias-preview">
                                                        {formData.esFeriado ? (
                                                            <span className="dia-badge">Feriado</span>
                                                        ) : (formData.diasSeleccionados || []).length > 0 ? (
                                                            (formData.diasSeleccionados || []).map(dia => {
                                                                const diaLabel = DIAS_SEMANA.find(d => d.value === dia)?.label || dia;
                                                                return (
                                                                    <span key={dia} className="dia-badge">
                                                                        {diaLabel}
                                                                    </span>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-muted">Selecciona al menos un día</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="preview-section">
                                                    <strong>Franjas horarias ({obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango).length}):</strong>
                                                    <div className="franjas-list">
                                                        {obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango).map(franja => (
                                                            <span key={franja.id} className="franja-badge">
                                                                {franja.horaInicio} - {franja.horaFin}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                {(formData.diasSeleccionados || []).length > 0 && obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango).length > 0 && (
                                                    <div className="preview-total">
                                                        <strong>
                                                            Total: {(formData.diasSeleccionados || []).length * obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango).length} precios
                                                        </strong>
                                                    </div>
                                                )}
                                            </div>
                                            {obtenerFranjasEnRango(formData.horaInicioRango, formData.horaFinRango).length === 0 && (
                                                <small style={{color: '#f44336'}}>
                                                    No hay franjas horarias en el rango seleccionado. Verifica que el rango sea válido.
                                                </small>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="form-group">
                                <label>Franja Horaria *</label>
                                <select
                                    name="franjaHorariaId"
                                    value={formData.franjaHorariaId}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona una franja horaria</option>
                                    {franjasHorarias
                                        .filter(f => f.activa !== false)
                                        .map(franja => (
                                            <option key={franja.id} value={franja.id}>
                                                {franja.horaInicio} - {franja.horaFin}
                                            </option>
                                        ))}
                                </select>
                                {franjasHorarias.length === 0 && (
                                    <small style={{color: '#f44336'}}>
                                        No hay franjas horarias. <a href="/admin/franjas-horarias">Crear una</a>
                                    </small>
                                )}
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label>Precio ($) *</label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                            {modoMasivo && (
                                <small>Este precio se aplicará a todas las franjas horarias del rango</small>
                            )}
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={() => { 
                            setMostrarForm(false); 
                            setEditando(null); 
                            setModoMasivo(false);
                        }} className="btn-cancelar">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : editando ? 'Actualizar' : modoMasivo ? 'Crear Precios' : 'Crear'}
                        </button>
                    </div>
                </form>
            )}

            {canchaSeleccionada && (
                <div className="precios-list">
                    {loading ? (
                        <p>Cargando precios...</p>
                    ) : precios.length === 0 ? (
                        <p>No hay precios configurados para esta cancha. Crea el primero.</p>
                    ) : (
                        <div className="precios-acordeon">
                            {diasOrdenados.map(diaKey => {
                                const diaLabel = diaKey === 'feriado' 
                                    ? 'Feriado' 
                                    : DIAS_SEMANA.find(d => d.value === diaKey)?.label || diaKey;
                                const preciosDelDia = preciosPorDia[diaKey];
                                const estaExpandido = diasExpandidos.has(diaKey);
                                
                                // Ordenar precios del día por horario
                                const preciosOrdenados = [...preciosDelDia].sort((a, b) => {
                                    const franjaA = a.franjaHorariaId 
                                        ? franjasHorarias.find(f => f.id === a.franjaHorariaId)
                                        : null;
                                    const franjaB = b.franjaHorariaId 
                                        ? franjasHorarias.find(f => f.id === b.franjaHorariaId)
                                        : null;
                                    const horarioA = franjaA ? franjaA.horaInicio : a.horarioInicio || '';
                                    const horarioB = franjaB ? franjaB.horaInicio : b.horarioInicio || '';
                                    return horarioA.localeCompare(horarioB);
                                });
                                
                                return (
                                    <div key={diaKey} className="acordeon-item">
                                        <div 
                                            className="acordeon-header"
                                            onClick={() => toggleDia(diaKey)}
                                        >
                                            <div className="acordeon-header-content">
                                                <span className="acordeon-dia">{diaLabel}</span>
                                                <span className="acordeon-count">
                                                    {preciosDelDia.length} {preciosDelDia.length === 1 ? 'horario' : 'horarios'}
                                                </span>
                                            </div>
                                            <i className={`fas fa-chevron-${estaExpandido ? 'up' : 'down'} acordeon-icon`}></i>
                                        </div>
                                        {estaExpandido && (
                                            <div className="acordeon-content">
                                                <table className="precios-table-inner">
                                                    <thead>
                                                        <tr>
                                                            <th>Horario</th>
                                                            <th>Precio</th>
                                                            <th>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {preciosOrdenados.map(precio => {
                                                            const franja = precio.franjaHorariaId 
                                                                ? franjasHorarias.find(f => f.id === precio.franjaHorariaId)
                                                                : null;
                                                            const horarioDisplay = franja 
                                                                ? `${franja.horaInicio} - ${franja.horaFin}`
                                                                : `${precio.horarioInicio} - ${precio.horarioFin}`;
                                                            return (
                                                                <tr key={precio.id}>
                                                                    <td>{horarioDisplay}</td>
                                                                    <td>${precio.precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                    <td>
                                                                        <button onClick={() => handleEditar(precio)} className="btn-editar">
                                                                            Editar
                                                                        </button>
                                                                        <button onClick={() => handleEliminar(precio.id)} className="btn-eliminar">
                                                                            Eliminar
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {!canchaSeleccionada && (
                <div className="mensaje-inicial">
                    <p>Selecciona un predio y una cancha para gestionar sus precios.</p>
                </div>
            )}
        </div>
    );
};

export default AdminPrecios;

