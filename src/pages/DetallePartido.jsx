import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import { obtenerPartido, agregarJugador } from '@/services/partidosService';
import { enviarNotificacionesJugador } from '@/services/notificacionesService';
import { format } from 'date-fns';
import './DetallePartido.css';

const DetallePartido = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [partido, setPartido] = useState(null);
    const [loading, setLoading] = useState(true);
    const [agregandoJugador, setAgregandoJugador] = useState(false);
    const [formJugador, setFormJugador] = useState({
        nombre: '',
        email: '',
        telefono: ''
    });

    useEffect(() => {
        cargarPartido();
    }, [id]);

    const cargarPartido = async () => {
        setLoading(true);
        try {
            const partidoData = await obtenerPartido(id);
            setPartido(partidoData);
        } catch (error) {
            console.error('Error cargando partido:', error);
            addToast('Error al cargar partido', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAgregarJugador = async (e) => {
        e.preventDefault();
        setAgregandoJugador(true);

        if (!formJugador.nombre || (!formJugador.email && !formJugador.telefono)) {
            addToast('Completa al menos nombre y email o teléfono', 'error');
            setAgregandoJugador(false);
            return;
        }

        try {
            const jugador = {
                ...formJugador,
                agregadoEn: new Date(),
                agregadoPor: user.id
            };

            const resultado = await agregarJugador(id, jugador);
            if (resultado.success) {
                // Enviar notificaciones
                const monto = partido.precioPorJugador || (partido.precioTotal / (parseInt(partido.tipo) * 2));
                await enviarNotificacionesJugador(jugador, {
                    ...partido,
                    id
                }, monto);

                addToast('Jugador agregado y notificado', 'success');
                setFormJugador({ nombre: '', email: '', telefono: '' });
                cargarPartido(); // Recargar para ver el nuevo jugador
            } else {
                addToast('Error al agregar jugador', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al agregar jugador', 'error');
        } finally {
            setAgregandoJugador(false);
        }
    };

    if (loading) {
        return <div className="detalle-partido"><p>Cargando...</p></div>;
    }

    if (!partido) {
        return <div className="detalle-partido"><p>Partido no encontrado</p></div>;
    }

    const esCreador = partido.creadorId === user.id;
    const montoPorJugador = partido.precioPorJugador || (partido.precioTotal / (parseInt(partido.tipo) * 2));

    return (
        <div className="detalle-partido">
            <div className="partido-header">
                <h1>{partido.canchaNombre}</h1>
                <span className={`estado estado-${partido.estado}`}>
                    {partido.estado}
                </span>
            </div>

            <div className="partido-info">
                <div className="info-card">
                    <h3>Información del Partido</h3>
                    <p><i className="fas fa-map-marker-alt"></i> {partido.canchaDireccion}</p>
                    <p><i className="fas fa-calendar"></i> {format(new Date(partido.fecha), 'dd/MM/yyyy')}</p>
                    <p><i className="fas fa-clock"></i> {partido.hora}</p>
                    <p><i className="fas fa-users"></i> {partido.tipo} vs {partido.tipo}</p>
                    <p><i className="fas fa-dollar-sign"></i> Precio total: ${partido.precioTotal}</p>
                    <p><i className="fas fa-user"></i> Organizador: {partido.creadorNombre}</p>
                    {partido.descripcion && (
                        <p className="descripcion">{partido.descripcion}</p>
                    )}
                </div>

                {esCreador && (
                    <div className="agregar-jugador-card">
                        <h3>Agregar Jugador</h3>
                        <form onSubmit={handleAgregarJugador}>
                            <input
                                type="text"
                                placeholder="Nombre del jugador"
                                value={formJugador.nombre}
                                onChange={(e) => setFormJugador({ ...formJugador, nombre: e.target.value })}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={formJugador.email}
                                onChange={(e) => setFormJugador({ ...formJugador, email: e.target.value })}
                            />
                            <input
                                type="tel"
                                placeholder="Teléfono"
                                value={formJugador.telefono}
                                onChange={(e) => setFormJugador({ ...formJugador, telefono: e.target.value })}
                            />
                            <p className="monto-info">
                                Monto a pagar: ${montoPorJugador.toFixed(2)}
                            </p>
                            <button type="submit" disabled={agregandoJugador}>
                                {agregandoJugador ? 'Agregando...' : 'Agregar y Notificar'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div className="jugadores-section">
                <h2>Jugadores ({partido.jugadores?.length || 0})</h2>
                {partido.jugadores && partido.jugadores.length > 0 ? (
                    <div className="jugadores-list">
                        {partido.jugadores.map((jugador, index) => (
                            <div key={index} className="jugador-card">
                                <h4>{jugador.nombre}</h4>
                                {jugador.email && <p><i className="fas fa-envelope"></i> {jugador.email}</p>}
                                {jugador.telefono && <p><i className="fas fa-phone"></i> {jugador.telefono}</p>}
                                <p className="monto">Monto: ${montoPorJugador.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No hay jugadores agregados aún</p>
                )}
            </div>
        </div>
    );
};

export default DetallePartido;

