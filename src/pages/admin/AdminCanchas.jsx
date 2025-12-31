import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast, useAuth } from '@/context';
import { tieneRol, esAdminPredio } from '@/services/usuariosService';
import { ROLES } from '@/utils/constants';
import ConfirmDialog from '@/components/ConfirmDialog';
import './AdminCanchas.css';

const AdminCanchas = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const esAdmin = tieneRol(user, ROLES.ADMIN);
    const esAdminPredios = tieneRol(user, ROLES.ADMIN_PREDIOS);
    const prediosAsignados = user?.prediosAsignados || [];
    
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
        numero: '',
        caracteristicas: [] // Array de objetos {nombre: string, valor: string}
    });
    
    const [nuevaCaracteristica, setNuevaCaracteristica] = useState({
        nombre: '',
        valor: ''
    });
    const [dialogEliminar, setDialogEliminar] = useState({ isOpen: false, canchaId: null });

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
            if (prediosData.length === 1 && esAdminPredios && !esAdmin) {
                setPredioSeleccionado(prediosData[0].id);
            }
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

    const handleCaracteristicaChange = (e) => {
        const { name, value } = e.target;
        setNuevaCaracteristica({ ...nuevaCaracteristica, [name]: value });
    };

    const agregarCaracteristica = () => {
        if (!nuevaCaracteristica.nombre.trim() || !nuevaCaracteristica.valor.trim()) {
            addToast('Completa nombre y valor de la característica', 'error');
            return;
        }

        // Verificar si ya existe una característica con ese nombre
        if (formData.caracteristicas.some(c => c.nombre.toLowerCase() === nuevaCaracteristica.nombre.toLowerCase())) {
            addToast('Ya existe una característica con ese nombre', 'error');
            return;
        }

        setFormData({
            ...formData,
            caracteristicas: [...formData.caracteristicas, { ...nuevaCaracteristica }]
        });
        setNuevaCaracteristica({ nombre: '', valor: '' });
    };

    const eliminarCaracteristica = (index) => {
        const nuevasCaracteristicas = formData.caracteristicas.filter((_, i) => i !== index);
        setFormData({ ...formData, caracteristicas: nuevasCaracteristicas });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.predioId) {
            addToast('Debes seleccionar un predio', 'error');
            setLoading(false);
            return;
        }
        
        // Si es admin_predios, verificar que el predio esté asignado
        if (esAdminPredios && !esAdmin) {
            if (!prediosAsignados.includes(formData.predioId)) {
                addToast('No tienes permisos para gestionar este predio', 'error');
                setLoading(false);
                return;
            }
        }

        try {
            const canchaData = {
                predioId: formData.predioId,
                nombre: formData.nombre,
                deporte: formData.deporte,
                tipo: formData.tipo,
                numero: formData.numero || null,
                caracteristicas: formData.caracteristicas || [],
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
                numero: '',
                caracteristicas: []
            });
            setNuevaCaracteristica({ nombre: '', valor: '' });
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
            numero: cancha.numero || '',
            caracteristicas: cancha.caracteristicas || []
        });
        setNuevaCaracteristica({ nombre: '', valor: '' });
        setMostrarForm(true);
    };

    const handleEliminar = (id) => {
        setDialogEliminar({ isOpen: true, canchaId: id });
    };

    const confirmarEliminar = async () => {
        const { canchaId } = dialogEliminar;
        if (!canchaId) return;

        try {
            // Eliminar precios asociados
            const preciosSnapshot = await getDocs(
                query(collection(db, 'precios'), where('canchaId', '==', canchaId))
            );
            const deletePrecios = preciosSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePrecios);

            // Eliminar promociones asociadas
            const promosSnapshot = await getDocs(
                query(collection(db, 'promociones'), where('canchaId', '==', canchaId))
            );
            const deletePromos = promosSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromos);

            await deleteDoc(doc(db, 'canchas', canchaId));
            addToast('Cancha eliminada', 'success');
            cargarCanchas();
            setDialogEliminar({ isOpen: false, canchaId: null });
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar cancha', 'error');
            setDialogEliminar({ isOpen: false, canchaId: null });
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
                    disabled={esAdminPredios && !esAdmin && predios.length === 1}
                >
                    <option value="">-- Selecciona un predio --</option>
                    {predios.map(predio => (
                        <option key={predio.id} value={predio.id}>
                            {predio.nombre} - {predio.ciudad}, {predio.provincia}
                        </option>
                    ))}
                </select>
                {esAdminPredios && !esAdmin && predios.length === 1 && (
                    <small className="predio-info-hint">
                        <i className="fas fa-info-circle"></i>
                        Solo puedes gestionar este predio asignado
                    </small>
                )}
                {predioSeleccionado && (
                    <button
                        onClick={() => {
                            setFormData({
                                predioId: predioSeleccionado,
                                nombre: '',
                                deporte: 'futbol',
                                tipo: '',
                                numero: '',
                                caracteristicas: []
                            });
                            setNuevaCaracteristica({ nombre: '', valor: '' });
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

                    <div className="form-group form-group-full">
                        <label>Características de la Cancha</label>
                        <div className="caracteristicas-container">
                            <div className="caracteristicas-list">
                                {formData.caracteristicas.length > 0 ? (
                                    formData.caracteristicas.map((caracteristica, index) => (
                                        <div key={index} className="caracteristica-item">
                                            <span className="caracteristica-nombre">{caracteristica.nombre}:</span>
                                            <span className="caracteristica-valor">{caracteristica.valor}</span>
                                            <button
                                                type="button"
                                                onClick={() => eliminarCaracteristica(index)}
                                                className="btn-eliminar-caracteristica"
                                                title="Eliminar característica"
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="sin-caracteristicas">No hay características agregadas</p>
                                )}
                            </div>
                            <div className="agregar-caracteristica">
                                <div className="caracteristica-inputs">
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={nuevaCaracteristica.nombre}
                                        onChange={handleCaracteristicaChange}
                                        placeholder="Ej: Techada, Superficie, Iluminación"
                                        className="input-caracteristica-nombre"
                                    />
                                    <input
                                        type="text"
                                        name="valor"
                                        value={nuevaCaracteristica.valor}
                                        onChange={handleCaracteristicaChange}
                                        placeholder="Ej: Sí, Césped sintético, LED"
                                        className="input-caracteristica-valor"
                                    />
                                    <button
                                        type="button"
                                        onClick={agregarCaracteristica}
                                        className="btn-agregar-caracteristica"
                                        title="Agregar característica"
                                    >
                                        <i className="fas fa-plus"></i> Agregar
                                    </button>
                                </div>
                                <small className="form-hint">
                                    Ejemplos: Techada: Sí, Superficie: Césped sintético, Iluminación: LED, Vestuarios: Sí
                                </small>
                            </div>
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
                                    {cancha.caracteristicas && cancha.caracteristicas.length > 0 && (
                                        <div className="cancha-caracteristicas">
                                            {cancha.caracteristicas.slice(0, 3).map((car, idx) => (
                                                <span key={idx} className="caracteristica-badge">
                                                    {car.nombre}: {car.valor}
                                                </span>
                                            ))}
                                            {cancha.caracteristicas.length > 3 && (
                                                <span className="caracteristica-more">
                                                    +{cancha.caracteristicas.length - 3} más
                                                </span>
                                            )}
                                        </div>
                                    )}
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

            <ConfirmDialog
                isOpen={dialogEliminar.isOpen}
                onClose={() => setDialogEliminar({ isOpen: false, canchaId: null })}
                onConfirm={confirmarEliminar}
                type="danger"
                title="Eliminar Cancha"
                message={
                    <div>
                        <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                            ¿Estás seguro de eliminar esta cancha?
                        </p>
                        <div style={{ marginBottom: '16px' }}>
                            <p style={{ marginBottom: '8px', fontWeight: 500, color: '#dc3545' }}>
                                Esta acción también eliminará:
                            </p>
                            <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#666' }}>
                                <li>Todos los precios asociados</li>
                                <li>Todas las promociones asociadas</li>
                            </ul>
                        </div>
                        <p style={{ 
                            margin: 0, 
                            color: '#dc3545', 
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}>
                            ⚠️ Esta acción NO se puede deshacer.
                        </p>
                    </div>
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default AdminCanchas;
