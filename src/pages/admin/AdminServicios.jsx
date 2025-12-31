import { useState } from 'react';
import { useServicios, useCreateServicio, useUpdateServicio, useDeleteServicio } from '@/hooks/useServicios';
import { useToast } from '@/context';
import './AdminServicios.css';

const AdminServicios = () => {
    const { addToast } = useToast();
    const { data: servicios = [], isLoading } = useServicios();
    const createMutation = useCreateServicio();
    const updateMutation = useUpdateServicio();
    const deleteMutation = useDeleteServicio();
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        activo: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) || '' : value)
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.nombre) {
            addToast('Completa el nombre del servicio', 'error');
            return;
        }

        try {
            if (editando) {
                await updateMutation.mutateAsync({ id: editando.id, ...formData });
                addToast('Servicio actualizado', 'success');
            } else {
                await createMutation.mutateAsync(formData);
                addToast('Servicio creado', 'success');
            }
            setFormData({ nombre: '', descripcion: '', precio: '', activo: true });
            setMostrarForm(false);
            setEditando(null);
        } catch (error) {
            addToast('Error al guardar servicio', 'error');
        }
    };

    const handleEditar = (servicio) => {
        setEditando(servicio);
        setFormData({
            nombre: servicio.nombre,
            descripcion: servicio.descripcion || '',
            precio: servicio.precio || '',
            activo: servicio.activo !== false
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

        try {
            await deleteMutation.mutateAsync(id);
            addToast('Servicio eliminado', 'success');
        } catch (error) {
            addToast('Error al eliminar servicio', 'error');
        }
    };

    return (
        <div className="admin-servicios">
            <div className="admin-header">
                <h1>Gestionar Servicios</h1>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }} className="btn-nuevo">
                    + Nuevo Servicio
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleSubmit} className="servicio-form">
                    <h2>{editando ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Nombre del Servicio *</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                placeholder="Ej: Grabación Beelup"
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
                                placeholder="Descripción del servicio..."
                            />
                        </div>
                        <div className="form-group">
                            <label>Precio Base ($)</label>
                            <input
                                type="number"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={formData.activo}
                                    onChange={handleChange}
                                />
                                Activo
                            </label>
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" onClick={() => { setMostrarForm(false); setEditando(null); }} className="btn-cancelar">
                            Cancelar
                        </button>
                        <button type="submit" className="btn-submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                            {createMutation.isLoading || updateMutation.isLoading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            )}

            {isLoading ? (
                <p>Cargando servicios...</p>
            ) : servicios.length === 0 ? (
                <p>No hay servicios configurados. Crea el primero.</p>
            ) : (
                <div className="servicios-list">
                    <div className="servicios-grid">
                        {servicios.map(servicio => (
                            <div key={servicio.id} className="servicio-card">
                                <h3>{servicio.nombre}</h3>
                                {servicio.descripcion && (
                                    <p className="descripcion">{servicio.descripcion}</p>
                                )}
                                {servicio.precio && (
                                    <p className="precio">${servicio.precio.toFixed(2)}</p>
                                )}
                                <span className={`badge ${servicio.activo ? 'activo' : 'inactivo'}`}>
                                    {servicio.activo ? 'Activo' : 'Inactivo'}
                                </span>
                                <div className="servicio-actions">
                                    <button onClick={() => handleEditar(servicio)} className="btn-editar">
                                        Editar
                                    </button>
                                    <button onClick={() => handleEliminar(servicio.id)} className="btn-eliminar">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminServicios;


