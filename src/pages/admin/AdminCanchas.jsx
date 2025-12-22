import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import './AdminCanchas.css';

const AdminCanchas = () => {
    const { addToast } = useToast();
    const [predios, setPredios] = useState([]);
    const [canchas, setCanchas] = useState([]);
    const [predioSeleccionado, setPredioSeleccionado] = useState('');
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        predioId: '',
        nombre: '',
        deporte: 'futbol',
        tipo: '',
        numero: ''
    });

    useEffect(() => {
        cargarPredios();
    }, []);

    useEffect(() => {
        if (predioSeleccionado) {
            cargarCanchas();
        } else {
            setCanchas([]);
        }
    }, [predioSeleccionado]);

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
        
        setLoading(true);
        try {
            const q = query(collection(db, 'canchas'), where('predioId', '==', predioSeleccionado));
            const querySnapshot = await getDocs(q);
            const canchasData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCanchas(canchasData.sort((a, b) => {
                if (a.numero && b.numero) return a.numero.localeCompare(b.numero);
                return a.nombre.localeCompare(b.nombre);
            }));
        } catch (error) {
            console.error('Error cargando canchas:', error);
            addToast('Error al cargar canchas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.predioId) {
            addToast('Debes seleccionar un predio', 'error');
            setLoading(false);
            return;
        }

        try {
            const canchaData = {
                predioId: formData.predioId,
                nombre: formData.nombre,
                deporte: formData.deporte,
                tipo: formData.tipo,
                numero: formData.numero || null,
                activa: true,
                creadoEn: editando ? editando.creadoEn : new Date(),
                actualizadoEn: new Date()
            };

            if (editando) {
                await updateDoc(doc(db, 'canchas', editando.id), canchaData);
                addToast('Cancha actualizada', 'success');
            } else {
                await addDoc(collection(db, 'canchas'), canchaData);
                addToast('Cancha creada', 'success');
            }

            setFormData({
                predioId: predioSeleccionado || '',
                nombre: '',
                deporte: 'futbol',
                tipo: '',
                numero: ''
            });
            setMostrarForm(false);
            setEditando(null);
            cargarCanchas();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al guardar cancha', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (cancha) => {
        setEditando(cancha);
        setFormData({
            predioId: cancha.predioId,
            nombre: cancha.nombre,
            deporte: cancha.deporte,
            tipo: cancha.tipo,
            numero: cancha.numero || ''
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta cancha? Esto también eliminará sus precios y promociones.')) return;

        try {
            // Eliminar precios asociados
            const preciosSnapshot = await getDocs(
                query(collection(db, 'precios'), where('canchaId', '==', id))
            );
            const deletePrecios = preciosSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePrecios);

            // Eliminar promociones asociadas
            const promosSnapshot = await getDocs(
                query(collection(db, 'promociones'), where('canchaId', '==', id))
            );
            const deletePromos = promosSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromos);

            await deleteDoc(doc(db, 'canchas', id));
            addToast('Cancha eliminada', 'success');
            cargarCanchas();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar cancha', 'error');
        }
    };

    const predioActual = predios.find(p => p.id === predioSeleccionado);

    return (
        <div className="admin-canchas">
            <div className="admin-header">
                <h1>Gestionar Canchas</h1>
            </div>

            <div className="selector-predio">
                <label>Seleccionar Predio:</label>
                <select
                    value={predioSeleccionado}
                    onChange={(e) => {
                        setPredioSeleccionado(e.target.value);
                        setMostrarForm(false);
                        setEditando(null);
                    }}
                    className="select-predio"
                >
                    <option value="">-- Selecciona un predio --</option>
                    {predios.map(predio => (
                        <option key={predio.id} value={predio.id}>
                            {predio.nombre} - {predio.ciudad}, {predio.provincia}
                        </option>
                    ))}
                </select>
                {predioSeleccionado && (
                    <button
                        onClick={() => {
                            setFormData({
                                predioId: predioSeleccionado,
                                nombre: '',
                                deporte: 'futbol',
                                tipo: '',
                                numero: ''
                            });
                            setMostrarForm(true);
                            setEditando(null);
                        }}
                        className="btn-nuevo"
                    >
                        + Nueva Cancha
                    </button>
                )}
            </div>

            {predioSeleccionado && predioActual && (
                <div className="info-predio">
                    <h3>{predioActual.nombre}</h3>
                    <p>{predioActual.direccion}, {predioActual.ciudad}, {predioActual.provincia}</p>
                </div>
            )}

            {mostrarForm && predioSeleccionado && (
                <form onSubmit={handleSubmit} className="cancha-form">
                    <h2>{editando ? 'Editar Cancha' : 'Nueva Cancha'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Número/Nombre de Cancha *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Cancha 1, Cancha A, Central"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Número (opcional)</label>
                            <input
                                type="text"
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                                placeholder="Ej: 1, 2, 3 o A, B, C"
                            />
                            <small>Para ordenar las canchas</small>
                        </div>
                        <div className="form-group">
                            <label>Deporte *</label>
                            <select
                                name="deporte"
                                value={formData.deporte}
                                onChange={handleChange}
                                required
                            >
                                <option value="futbol">Fútbol</option>
                                <option value="padel">Pádel</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tipo *</label>
                            {formData.deporte === 'futbol' ? (
                                <select
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona</option>
                                    <option value="5">5 vs 5</option>
                                    <option value="7">7 vs 7</option>
                                    <option value="8">8 vs 8</option>
                                    <option value="11">11 vs 11</option>
                                </select>
                            ) : (
                                <select
                                    name="tipo"
                                    value={formData.tipo}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Selecciona</option>
                                    <option value="individual">Individual</option>
                                    <option value="dobles">Dobles</option>
                                </select>
                            )}
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

            {predioSeleccionado && (
                <div className="canchas-list">
                    {loading ? (
                        <p>Cargando canchas...</p>
                    ) : canchas.length === 0 ? (
                        <p>No hay canchas en este predio. Crea la primera.</p>
                    ) : (
                        <div className="canchas-grid">
                            {canchas.map(cancha => (
                                <div key={cancha.id} className="cancha-card">
                                    <div className="cancha-header">
                                        <h4>{cancha.nombre}</h4>
                                        {cancha.numero && <span className="cancha-numero">#{cancha.numero}</span>}
                                    </div>
                                    <p><i className="fas fa-futbol"></i> {cancha.deporte}</p>
                                    <p><i className="fas fa-users"></i> {cancha.tipo}</p>
                                    <div className="cancha-actions">
                                        <button onClick={() => handleEditar(cancha)} className="btn-editar">
                                            Editar
                                        </button>
                                        <button onClick={() => handleEliminar(cancha.id)} className="btn-eliminar">
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!predioSeleccionado && (
                <div className="mensaje-inicial">
                    <p>Selecciona un predio para ver y gestionar sus canchas.</p>
                    <p>Si no hay predios, créalos primero en <strong>Gestionar Predios</strong>.</p>
                </div>
            )}
        </div>
    );
};

export default AdminCanchas;
