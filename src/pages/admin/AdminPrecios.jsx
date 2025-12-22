import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
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
    const [predios, setPredios] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [precios, setPrecios] = useState([]);
    const [predioSeleccionado, setPredioSeleccionado] = useState('');
    const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        canchaId: '',
        diaSemana: '',
        horarioInicio: '',
        horarioFin: '',
        precio: '',
        esFeriado: false
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
            const prediosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPredios(prediosData);
        } catch (error) {
            console.error('Error cargando predios:', error);
            addToast('Error al cargar predios', 'error');
        }
    };

    const cargarCanchas = async () => {
        if (!predioSeleccionado) return;
        
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
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.canchaId || !formData.diaSemana || !formData.horarioInicio || !formData.horarioFin || !formData.precio) {
            addToast('Completa todos los campos', 'error');
            setLoading(false);
            return;
        }

        try {
            const precioData = {
                canchaId: formData.canchaId,
                diaSemana: formData.esFeriado ? 'feriado' : formData.diaSemana,
                horarioInicio: formData.horarioInicio,
                horarioFin: formData.horarioFin,
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
                horarioInicio: '',
                horarioFin: '',
                precio: '',
                esFeriado: false
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
    };

    const handleEditar = (precio) => {
        setEditando(precio);
        setFormData({
            canchaId: precio.canchaId,
            diaSemana: precio.esFeriado ? '' : precio.diaSemana,
            horarioInicio: precio.horarioInicio,
            horarioFin: precio.horarioFin,
            precio: precio.precio.toString(),
            esFeriado: precio.esFeriado || false
        });
        setMostrarForm(true);
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
                    >
                        <option value="">-- Selecciona un predio --</option>
                        {predios.map(predio => (
                            <option key={predio.id} value={predio.id}>
                                {predio.nombre} - {predio.ciudad}
                            </option>
                        ))}
                    </select>
                </div>

                {predioSeleccionado && (
                    <div className="selector-group">
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
                    <button
                        onClick={() => {
                            setFormData({
                                canchaId: canchaSeleccionada,
                                diaSemana: '',
                                horarioInicio: '',
                                horarioFin: '',
                                precio: '',
                                esFeriado: false
                            });
                            setMostrarForm(true);
                            setEditando(null);
                        }}
                        className="btn-nuevo"
                    >
                        + Nuevo Precio
                    </button>
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
                    <h2>{editando ? 'Editar Precio' : 'Nuevo Precio'}</h2>
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
                            <div className="form-group">
                                <label>Día de la Semana *</label>
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
                            </div>
                        )}
                        <div className="form-group">
                            <label>Horario Inicio *</label>
                            <input
                                type="time"
                                name="horarioInicio"
                                value={formData.horarioInicio}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Horario Fin *</label>
                            <input
                                type="time"
                                name="horarioFin"
                                value={formData.horarioFin}
                                onChange={handleChange}
                                required
                            />
                        </div>
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
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={() => { setMostrarForm(false); setEditando(null); }} className="btn-cancelar">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
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
                        <table className="precios-table">
                            <thead>
                                <tr>
                                    <th>Día</th>
                                    <th>Horario</th>
                                    <th>Precio</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {precios.map(precio => {
                                    const diaLabel = precio.diaSemana === 'feriado' 
                                        ? 'Feriado' 
                                        : DIAS_SEMANA.find(d => d.value === precio.diaSemana)?.label || precio.diaSemana;
                                    return (
                                        <tr key={precio.id}>
                                            <td>{diaLabel}</td>
                                            <td>{precio.horarioInicio} - {precio.horarioFin}</td>
                                            <td>${precio.precio}</td>
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

