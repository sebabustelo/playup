import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import './AdminDeportes.css';

const AdminDeportes = () => {
    const { addToast } = useToast();
    const [deportes, setDeportes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        tipos: []
    });

    useEffect(() => {
        cargarDeportes();
    }, []);

    const cargarDeportes = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'deportes'));
            const deportesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDeportes(deportesData);
        } catch (error) {
            console.error('Error cargando deportes:', error);
            addToast('Error al cargar deportes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'tipos') {
            const tipos = value.split(',').map(t => t.trim()).filter(t => t);
            setFormData({ ...formData, tipos });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const agregarTipo = () => {
        const nuevoTipo = prompt('Ingresa el nuevo tipo (ej: 5, 7, 8, 11):');
        if (nuevoTipo && !formData.tipos.includes(nuevoTipo)) {
            setFormData({ ...formData, tipos: [...formData.tipos, nuevoTipo] });
        }
    };

    const eliminarTipo = (tipo) => {
        setFormData({ ...formData, tipos: formData.tipos.filter(t => t !== tipo) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (editando) {
                await updateDoc(doc(db, 'deportes', editando.id), formData);
                addToast('Deporte actualizado', 'success');
            } else {
                await addDoc(collection(db, 'deportes'), formData);
                addToast('Deporte creado', 'success');
            }

            setFormData({ nombre: '', tipos: [] });
            setMostrarForm(false);
            setEditando(null);
            cargarDeportes();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al guardar deporte', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditar = (deporte) => {
        setEditando(deporte);
        setFormData({
            nombre: deporte.nombre,
            tipos: deporte.tipos || []
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este deporte?')) return;

        try {
            await deleteDoc(doc(db, 'deportes', id));
            addToast('Deporte eliminado', 'success');
            cargarDeportes();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al eliminar deporte', 'error');
        }
    };

    return (
        <div className="admin-deportes">
            <div className="admin-header">
                <h1>Gestionar Deportes</h1>
                <button onClick={() => { setMostrarForm(!mostrarForm); setEditando(null); }} className="btn-nuevo">
                    {mostrarForm ? 'Cancelar' : '+ Nuevo Deporte'}
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleSubmit} className="deporte-form">
                    <h2>{editando ? 'Editar Deporte' : 'Nuevo Deporte'}</h2>
                    <div className="form-group">
                        <label>Nombre del Deporte *</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            placeholder="Ej: Fútbol, Pádel"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Tipos Disponibles</label>
                        <div className="tipos-container">
                            {formData.tipos.map(tipo => (
                                <span key={tipo} className="tipo-tag">
                                    {tipo}
                                    <button type="button" onClick={() => eliminarTipo(tipo)}>×</button>
                                </span>
                            ))}
                            <button type="button" onClick={agregarTipo} className="btn-agregar-tipo">
                                + Agregar Tipo
                            </button>
                        </div>
                        <small>Ejemplos: 5, 7, 8, 11 (para fútbol) o Individual, Dobles (para pádel)</small>
                    </div>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                    </button>
                </form>
            )}

            <div className="deportes-list">
                {deportes.length === 0 ? (
                    <p>No hay deportes configurados. Los tipos de canchas se configuran aquí.</p>
                ) : (
                    <div className="deportes-grid">
                        {deportes.map(deporte => (
                            <div key={deporte.id} className="deporte-card">
                                <h3>{deporte.nombre}</h3>
                                <div className="tipos-list">
                                    {deporte.tipos && deporte.tipos.length > 0 ? (
                                        deporte.tipos.map(tipo => (
                                            <span key={tipo} className="tipo-badge">{tipo}</span>
                                        ))
                                    ) : (
                                        <p>Sin tipos configurados</p>
                                    )}
                                </div>
                                <div className="deporte-actions">
                                    <button onClick={() => handleEditar(deporte)} className="btn-editar">
                                        Editar
                                    </button>
                                    <button onClick={() => handleEliminar(deporte.id)} className="btn-eliminar">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDeportes;




