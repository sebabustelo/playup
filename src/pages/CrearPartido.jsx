import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import { crearPartido, obtenerCancha } from '@/services/partidosService';
import './CrearPartido.css';

const CrearPartido = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        canchaId: '',
        fecha: '',
        hora: '',
        tipo: '',
        precioTotal: '',
        descripcion: ''
    });

    useEffect(() => {
        cargarCanchas();
    }, []);

    const cargarCanchas = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'canchas'));
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

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calcularPrecioPorJugador = () => {
        if (formData.precioTotal && formData.tipo) {
            const numJugadores = parseInt(formData.tipo) * 2; // Por ejemplo, 5 vs 5 = 10 jugadores
            return (parseFloat(formData.precioTotal) / numJugadores).toFixed(2);
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!formData.canchaId || !formData.fecha || !formData.hora || !formData.tipo || !formData.precioTotal) {
            addToast('Por favor completa todos los campos', 'error');
            setLoading(false);
            return;
        }

        try {
            const cancha = await obtenerCancha(formData.canchaId);
            if (!cancha) {
                addToast('Cancha no encontrada', 'error');
                setLoading(false);
                return;
            }

            const partidoData = {
                creadorId: user.id,
                creadorNombre: user.nombre,
                creadorEmail: user.email,
                canchaId: formData.canchaId,
                canchaNombre: cancha.nombre,
                canchaDireccion: cancha.direccion,
                fecha: formData.fecha,
                hora: formData.hora,
                tipo: formData.tipo,
                precioTotal: parseFloat(formData.precioTotal),
                precioPorJugador: parseFloat(calcularPrecioPorJugador()),
                descripcion: formData.descripcion,
                jugadores: [],
                estado: 'activo'
            };

            const resultado = await crearPartido(partidoData);
            if (resultado.success) {
                addToast('Partido creado exitosamente', 'success');
                navigate(`/partido/${resultado.id}`);
            } else {
                addToast('Error al crear partido', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al crear partido', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="crear-partido">
            <h1>Crear Nuevo Partido</h1>

            <form onSubmit={handleSubmit} className="partido-form">
                <div className="form-group">
                    <label>Cancha *</label>
                    <select
                        name="canchaId"
                        value={formData.canchaId}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona una cancha</option>
                        {canchas.map(cancha => (
                            <option key={cancha.id} value={cancha.id}>
                                {cancha.nombre} - {cancha.direccion}, {cancha.ciudad}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Fecha *</label>
                        <input
                            type="date"
                            name="fecha"
                            value={formData.fecha}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Hora *</label>
                        <input
                            type="time"
                            name="hora"
                            value={formData.hora}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Tipo de Partido *</label>
                    <select
                        name="tipo"
                        value={formData.tipo}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Selecciona el tipo</option>
                        <option value="5">5 vs 5</option>
                        <option value="7">7 vs 7</option>
                        <option value="8">8 vs 8</option>
                        <option value="11">11 vs 11</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Precio Total de la Cancha ($) *</label>
                    <input
                        type="number"
                        name="precioTotal"
                        value={formData.precioTotal}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        required
                    />
                    {formData.precioTotal && formData.tipo && (
                        <p className="precio-info">
                            Precio por jugador: ${calcularPrecioPorJugador()}
                        </p>
                    )}
                </div>

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

                <button type="submit" className="btn-submit" disabled={loading}>
                    {loading ? 'Creando...' : 'Crear Partido'}
                </button>
            </form>
        </div>
    );
};

export default CrearPartido;




