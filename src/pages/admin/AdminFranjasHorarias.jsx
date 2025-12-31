import { useState, useEffect } from 'react';
import { useFranjasHorarias, useCreateFranjaHoraria, useUpdateFranjaHoraria, useDeleteFranjaHoraria } from '@/hooks/useFranjasHorarias';
import { useToast } from '@/context';
import './AdminFranjasHorarias.css';

const AdminFranjasHorarias = () => {
    const { addToast } = useToast();
    const { data: franjas = [], isLoading } = useFranjasHorarias();
    const createMutation = useCreateFranjaHoraria();
    const updateMutation = useUpdateFranjaHoraria();
    const deleteMutation = useDeleteFranjaHoraria();
    const [mostrarForm, setMostrarForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        horaInicio: '',
        horaFin: '',
        activa: true
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.horaInicio || !formData.horaFin) {
            addToast('Completa todos los campos', 'error');
            return;
        }

        if (formData.horaInicio >= formData.horaFin) {
            addToast('La hora de inicio debe ser anterior a la hora de fin', 'error');
            return;
        }

        try {
            if (editando) {
                await updateMutation.mutateAsync({ id: editando.id, ...formData });
                addToast('Franja horaria actualizada', 'success');
            } else {
                await createMutation.mutateAsync(formData);
                addToast('Franja horaria creada', 'success');
            }
            setFormData({ horaInicio: '', horaFin: '', activa: true });
            setMostrarForm(false);
            setEditando(null);
        } catch (error) {
            addToast('Error al guardar franja horaria', 'error');
        }
    };

    const handleEditar = (franja) => {
        setEditando(franja);
        setFormData({
            horaInicio: franja.horaInicio,
            horaFin: franja.horaFin,
            activa: franja.activa !== false
        });
        setMostrarForm(true);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar esta franja horaria?')) return;

        try {
            await deleteMutation.mutateAsync(id);
            addToast('Franja horaria eliminada', 'success');
        } catch (error) {
            addToast('Error al eliminar franja horaria', 'error');
        }
    };

    return (
        <div className="admin-franjas">
            <div className="admin-header">
                <h1>Gestionar Franjas Horarias</h1>
                <button onClick={() => { setMostrarForm(true); setEditando(null); }} className="btn-nuevo">
                    + Nueva Franja Horaria
                </button>
            </div>

            {mostrarForm && (
                <form onSubmit={handleSubmit} className="franja-form">
                    <h2>{editando ? 'Editar Franja Horaria' : 'Nueva Franja Horaria'}</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Hora Inicio *</label>
                            <input
                                type="time"
                                name="horaInicio"
                                value={formData.horaInicio}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora Fin *</label>
                            <input
                                type="time"
                                name="horaFin"
                                value={formData.horaFin}
                                onChange={handleChange}
                                required
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
                                Activa
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
                <p>Cargando franjas horarias...</p>
            ) : franjas.length === 0 ? (
                <p>No hay franjas horarias configuradas. Crea la primera.</p>
            ) : (
                <div className="franjas-list">
                    <table className="franjas-table">
                        <thead>
                            <tr>
                                <th>Hora Inicio</th>
                                <th>Hora Fin</th>
                                <th>Duración</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {franjas.map(franja => {
                                const inicio = new Date(`2000-01-01T${franja.horaInicio}`);
                                const fin = new Date(`2000-01-01T${franja.horaFin}`);
                                const duracion = (fin - inicio) / (1000 * 60 * 60); // horas
                                return (
                                    <tr key={franja.id}>
                                        <td>{franja.horaInicio}</td>
                                        <td>{franja.horaFin}</td>
                                        <td>{duracion} horas</td>
                                        <td>
                                            <span className={`badge ${franja.activa ? 'activa' : 'inactiva'}`}>
                                                {franja.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td>
                                            <button onClick={() => handleEditar(franja)} className="btn-editar">
                                                Editar
                                            </button>
                                            <button onClick={() => handleEliminar(franja.id)} className="btn-eliminar">
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
};

export default AdminFranjasHorarias;


