import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import { format } from 'date-fns';
import './AdminPromociones.css';

const AdminPromociones = () => {
    const { addToast } = useToast();
    const [predios, setPredios] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [promociones, setPromociones] = useState([]);
    const [predioSeleccionado, setPredioSeleccionado] = useState('');
    const [canchaSeleccionada, setCanchaSeleccionada] = useState('');
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        canchaId: '',
        fechaInicio: '',
        fechaFin: '',
        horarioInicio: '',
        horarioFin: '',
        precioPromocion: '',
        descripcion: '',
        activa: true
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
            cargarPromociones();
        } else {
            setPromociones([]);
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

    const cargarPromociones = async () => {
        if (!canchaSeleccionada) return;
        
        setLoading(true);
        try {
            const q = query(collection(db, 'promociones'), where('canchaId', '==', canchaSeleccionada));
            const querySnapshot = await getDocs(q);
            const promocionesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPromociones(promocionesData.sort((a, b) => {
                return new Date(b.fechaInicio) - new Date(a.fechaInicio);
            }));
        } catch (error) {
            console.error('Error cargando promociones:', error);
            addToast('Error al cargar promociones', 'error');
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

        if (!formData.canchaId || !formData.fechaInicio || !formData.fechaFin || !formData.precioPromocion) {
            addToast('Completa todos los campos obligatorios', 'error');
            setLoading(false);
            return;
        }

        if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
            addToast('La fecha de inicio debe ser anterior a la fecha de fin', 'error');
            setLoading(false);
            return;
        }

        try {
            const promocionData = {
                canchaId: formData.canchaId,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin,
                horarioInicio: formData.horarioInicio || null,
                horarioFin: formData.horarioFin || null,
                precioPromocion: parseFloat(formData.precioPromocion),
                descripcion: formData.descripcion || '',
                activa: formData.activa,
                creadoEn: editando ? editando.creadoEn : new Date(),
                actualizadoEn: new Date()
            };

            if (editando) {
                await updateDoc(doc(db, 'promociones', editando.id), promocionData);
                addToast('Promoción actualizada', 'success');
            } else {
                await addDoc(collection(db, 'promociones'), promocionData);
                addToast('Promoción creada', 'success');
            }

            setFormData({
                canchaId: canchaSeleccionada || '',
                fechaInicio: '',
                fechaFin: '',
                horarioInicio: '',
                horarioFin: '',
                precioPromocion: '',
                descripcion: '',
                activa: true
            });
            setMostrarForm(false);
            setEditando(null);
            cargarPromociones();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al guardar promoción', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (promocion) => {
        setEditando(promocion);
        setFormData({
            canchaId: promocion.canchaId,
            fechaInicio: promocion.fechaInicio,
            fechaFin: promocion.fechaFin,
            horarioInicio: promocion.horarioInicio || '',
            horarioFin: promocion.horarioFin || '',
            precioPromocion: promocion.precioPromocion.toString(),
            descripcion: promocion.descripcion || '',
            activa: promocion.activa !== false
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return;

        try {
            await deleteDoc(doc(db, 'promociones', id));
            addToast('Promoción eliminada', 'success');
            cargarPromociones();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar promoción', 'error');
        }
    };

    const canchaActual = canchas.find(c => c.id === canchaSeleccionada);
    const predioActual = predios.find(p => p.id === predioSeleccionado);

    const esPromocionActiva = (promocion) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const inicio = new Date(promocion.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(promocion.fechaFin);
        fin.setHours(23, 59, 59, 999);
        return promocion.activa && hoy >= inicio && hoy <= fin;
    };

    return (
        <div className="admin-promociones">
            <div className="admin-header">
                <h1>Gestionar Promociones</h1>
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
                                fechaInicio: '',
                                fechaFin: '',
                                horarioInicio: '',
                                horarioFin: '',
                                precioPromocion: '',
                                descripcion: '',
                                activa: true
                            });
                            setMostrarForm(true);
                            setEditando(null);
                        }}
                        className="btn-nuevo"
                    >
                        + Nueva Promoción
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
                <form onSubmit={handleSubmit} className="promocion-form">
                    <h2>{editando ? 'Editar Promoción' : 'Nueva Promoción'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Fecha Inicio *</label>
                            <input
                                type="date"
                                name="fechaInicio"
                                value={formData.fechaInicio}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Fin *</label>
                            <input
                                type="date"
                                name="fechaFin"
                                value={formData.fechaFin}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Horario Inicio (opcional)</label>
                            <input
                                type="time"
                                name="horarioInicio"
                                value={formData.horarioInicio}
                                onChange={handleChange}
                            />
                            <small>Si no se especifica, aplica todo el día</small>
                        </div>
                        <div className="form-group">
                            <label>Horario Fin (opcional)</label>
                            <input
                                type="time"
                                name="horarioFin"
                                value={formData.horarioFin}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio Promocional ($) *</label>
                            <input
                                type="number"
                                name="precioPromocion"
                                value={formData.precioPromocion}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-group full-width">
                            <label>Descripción</label>
                            <textarea
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Ej: Promoción especial de verano, Descuento por inauguración..."
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="activa"
                                    checked={formData.activa}
                                    onChange={handleChange}
                                />
                                Promoción Activa
                            </label>
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
                <div className="promociones-list">
                    {loading ? (
                        <p>Cargando promociones...</p>
                    ) : promociones.length === 0 ? (
                        <p>No hay promociones para esta cancha. Crea la primera.</p>
                    ) : (
                        <div className="promociones-grid">
                            {promociones.map(promocion => {
                                const activa = esPromocionActiva(promocion);
                                return (
                                    <div key={promocion.id} className={`promocion-card ${activa ? 'activa' : ''}`}>
                                        <div className="promocion-header">
                                            <h4>${promocion.precioPromocion}</h4>
                                            {activa && <span className="badge-activa">ACTIVA</span>}
                                            {!promocion.activa && <span className="badge-inactiva">INACTIVA</span>}
                                        </div>
                                        <p><i className="fas fa-calendar"></i> {format(new Date(promocion.fechaInicio), 'dd/MM/yyyy')} - {format(new Date(promocion.fechaFin), 'dd/MM/yyyy')}</p>
                                        {promocion.horarioInicio && promocion.horarioFin && (
                                            <p><i className="fas fa-clock"></i> {promocion.horarioInicio} - {promocion.horarioFin}</p>
                                        )}
                                        {promocion.descripcion && (
                                            <p className="descripcion">{promocion.descripcion}</p>
                                        )}
                                        <div className="promocion-actions">
                                            <button onClick={() => handleEditar(promocion)} className="btn-editar">
                                                Editar
                                            </button>
                                            <button onClick={() => handleEliminar(promocion.id)} className="btn-eliminar">
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {!canchaSeleccionada && (
                <div className="mensaje-inicial">
                    <p>Selecciona un predio y una cancha para gestionar sus promociones.</p>
                </div>
            )}
        </div>
    );
};

export default AdminPromociones;

