import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import { usePartido } from '@/hooks/usePartidos';
import { useJugadoresPartido, useAgregarJugadorAPartido } from '@/hooks/useJugadores';
import { usePagosPartido, useCreatePago, useMarcarPagoComoPagado } from '@/hooks/usePagos';
import { useServiciosPartido, useAgregarServicioAPartido } from '@/hooks/useServicios';
import { useServicios } from '@/hooks/useServicios';
import { MEDIOS_PAGO, ESTADOS_PAGO, ESTADOS_RESERVA_DISPLAY } from '@/utils/constants';
import { notificarPagoRegistrado, notificarPagoConfirmado } from '@/services/notificacionesService';
import ResumenPagos from '@/components/ResumenPagos';
import { enviarNotificacionesJugador } from '@/services/notificacionesService';
import { obtenerReservaPorPartido, actualizarEstadoReserva, ESTADOS_RESERVA } from '@/services/reservasService';
import { format } from 'date-fns';
import LoadingSpinner from '@/components/LoadingSpinner';
import './DetallePartido.css';

const DetallePartido = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { addToast } = useToast();
    const { data: partido, isLoading: loadingPartido } = usePartido(id);
    const { data: jugadores = [], isLoading: loadingJugadores } = useJugadoresPartido(id);
    const { data: pagos = [] } = usePagosPartido(id);
    const { data: servicios = [] } = useServiciosPartido(id);
    const { data: serviciosDisponibles = [] } = useServicios();
    const agregarJugadorMutation = useAgregarJugadorAPartido();
    const crearPagoMutation = useCreatePago();
    const marcarPagoPagadoMutation = useMarcarPagoComoPagado();
    const agregarServicioMutation = useAgregarServicioAPartido();

    // Cargar reserva del partido
    useEffect(() => {
        if (partido?.id) {
            cargarReserva();
        }
    }, [partido?.id]);

    const cargarReserva = async () => {
        if (!partido?.id) return;
        setCargandoReserva(true);
        try {
            const reservaData = await obtenerReservaPorPartido(partido.id);
            setReserva(reservaData);
        } catch (error) {
            console.error('Error cargando reserva:', error);
        } finally {
            setCargandoReserva(false);
        }
    };

    const handleCambiarEstadoReserva = async (nuevoEstado) => {
        if (!reserva?.id) return;
        
        try {
            const resultado = await actualizarEstadoReserva(reserva.id, nuevoEstado);
            if (resultado.success) {
                addToast('Estado de reserva actualizado', 'success');
                await cargarReserva();
            } else {
                addToast('Error al actualizar estado de reserva', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al actualizar estado de reserva', 'error');
        }
    };

    const [formJugador, setFormJugador] = useState({
        nombre: '',
        email: '',
        telefono: '',
        telegramUsername: '',
        usuarioId: null
    });
    const [formPago, setFormPago] = useState({
        jugadorId: '',
        monto: '',
        medioPago: MEDIOS_PAGO.TRANSFERENCIA,
        referencia: ''
    });
    const [mostrarFormPago, setMostrarFormPago] = useState(false);
    const [mostrarFormServicio, setMostrarFormServicio] = useState(false);
    const [servicioSeleccionado, setServicioSeleccionado] = useState('');
    const [reserva, setReserva] = useState(null);
    const [cargandoReserva, setCargandoReserva] = useState(false);

    const handleAgregarJugador = async (e) => {
        e.preventDefault();

        if (!formJugador.nombre || (!formJugador.email && !formJugador.telefono)) {
            addToast('Completa al menos nombre y email o teléfono', 'error');
            return;
        }

        try {
            const jugadorData = {
                ...formJugador,
                agregadoPor: user.id,
                monto: montoPorJugador
            };

            await agregarJugadorMutation.mutateAsync({ 
                partidoId: id, 
                jugadorData 
            });
            
            // Actualizar array de IDs en partido para indexar
            // Esto se hace automáticamente en el servicio
            
            // Enviar notificaciones
            const resultadosNotificacion = await enviarNotificacionesJugador(jugadorData, {
                ...partido,
                id
            }, montoPorJugador);

            // Mostrar mensaje según los resultados
            const mensajesExitosos = [];
            if (resultadosNotificacion.email?.success) {
                mensajesExitosos.push('Email');
            }
            if (resultadosNotificacion.whatsapp?.success) {
                mensajesExitosos.push('WhatsApp');
            }

            if (mensajesExitosos.length > 0) {
                addToast(`Jugador agregado. ${mensajesExitosos.join(' y ')} ${mensajesExitosos.length === 1 ? 'enviado' : 'enviados'}`, 'success');
            } else if (resultadosNotificacion.errores.length > 0) {
                addToast(`Jugador agregado. ${resultadosNotificacion.errores[0]}`, 'warning');
            } else {
                addToast('Jugador agregado', 'success');
            }
            setFormJugador({ nombre: '', email: '', telefono: '', telegramUsername: '', usuarioId: null });
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al agregar jugador', 'error');
        }
    };

    const loading = loadingPartido || loadingJugadores;

    if (loading) {
        return (
            <div className="detalle-partido">
                <LoadingSpinner text="Cargando partido..." />
            </div>
        );
    }

    if (!partido) {
        return <div className="detalle-partido"><p>Partido no encontrado</p></div>;
    }

    const esCreador = partido.creadorId === user.id;
    const montoPorJugador = partido.precioPorJugador || (partido.precioTotal / (parseInt(partido.tipo) * 2));

    const handleCrearPago = async (e) => {
        e.preventDefault();
        
        if (!formPago.jugadorId || !formPago.monto) {
            addToast('Completa jugador y monto', 'error');
            return;
        }

        try {
            const resultado = await crearPagoMutation.mutateAsync({
                partidoId: id,
                pagoData: {
                    ...formPago,
                    monto: parseFloat(formPago.monto),
                    usuarioId: formPago.jugadorId
                }
            });

            if (resultado.success) {
                // Notificar al jugador
                const jugador = jugadores.find(j => j.id === formPago.jugadorId);
                if (jugador) {
                    await notificarPagoRegistrado(jugador, partido, {
                        ...formPago,
                        monto: parseFloat(formPago.monto),
                        estado: ESTADOS_PAGO.PENDIENTE
                    });
                }

                addToast('Pago registrado y notificación enviada', 'success');
                setFormPago({ jugadorId: '', monto: '', medioPago: MEDIOS_PAGO.TRANSFERENCIA, referencia: '' });
                setMostrarFormPago(false);
            } else {
                addToast(resultado.error || 'Error al registrar pago', 'error');
            }
        } catch (error) {
            if (error.message) {
                addToast(error.message, 'error');
            } else {
                addToast('Error al registrar pago', 'error');
            }
        }
    };

    const handleMarcarPagoPagado = async (pagoId, referencia) => {
        try {
            await marcarPagoPagadoMutation.mutateAsync({
                partidoId: id,
                pagoId,
                referencia: referencia || ''
            });

            // Notificar al jugador
            const pago = pagos.find(p => p.id === pagoId);
            if (pago) {
                const jugador = jugadores.find(j => j.id === pago.usuarioId);
                if (jugador) {
                    await notificarPagoConfirmado(jugador, partido, {
                        ...pago,
                        estado: ESTADOS_PAGO.PAGADO,
                        referencia
                    });
                }
            }

            addToast('Pago marcado como pagado y notificación enviada', 'success');
        } catch (error) {
            addToast('Error al actualizar pago', 'error');
        }
    };

    const handleAgregarServicio = async () => {
        if (!servicioSeleccionado) {
            addToast('Selecciona un servicio', 'error');
            return;
        }

        const servicio = serviciosDisponibles.find(s => s.id === servicioSeleccionado);
        if (!servicio) {
            addToast('Servicio no encontrado', 'error');
            return;
        }

        try {
            await agregarServicioMutation.mutateAsync({
                partidoId: id,
                servicioId: servicioSeleccionado,
                precio: servicio.precio || 0
            });
            addToast('Servicio agregado', 'success');
            setServicioSeleccionado('');
            setMostrarFormServicio(false);
        } catch (error) {
            addToast('Error al agregar servicio', 'error');
        }
    };

    return (
        <div className="detalle-partido">
            <div className="partido-header">
                <h1>{partido.canchaNombre}</h1>
                <div className="estados-container">
                    <span className={`estado estado-${partido.estado}`}>
                        {partido.estado}
                    </span>
                    {reserva && (
                        <span className={`estado-reserva estado-reserva-${reserva.estado}`}>
                            <i className="fas fa-calendar-check"></i> 
                            {ESTADOS_RESERVA_DISPLAY[reserva.estado] || reserva.estado}
                        </span>
                    )}
                </div>
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
                    {partido.grupoTelegram && partido.grupoTelegram.activo && partido.grupoTelegram.link && (
                        <p className="telegram-link">
                            <i className="fab fa-telegram"></i> 
                            <a href={partido.grupoTelegram.link} target="_blank" rel="noopener noreferrer">
                                Unirse al grupo de Telegram
                            </a>
                        </p>
                    )}
                    {reserva && (
                        <div className="reserva-info">
                            <h4>Estado de Reserva</h4>
                            <p className={`estado-reserva-detalle estado-reserva-${reserva.estado}`}>
                                <i className="fas fa-calendar-check"></i>
                                {ESTADOS_RESERVA_DISPLAY[reserva.estado] || reserva.estado}
                            </p>
                            {reserva.motivo && (
                                <p className="reserva-motivo"><small>{reserva.motivo}</small></p>
                            )}
                            {esCreador && (
                                <div className="acciones-reserva">
                                    {reserva.estado === ESTADOS_RESERVA.RESERVADA && (
                                        <button 
                                            className="btn-confirmar-reserva"
                                            onClick={() => handleCambiarEstadoReserva(ESTADOS_RESERVA.OCUPADA)}
                                        >
                                            <i className="fas fa-check"></i> Confirmar Ocupación
                                        </button>
                                    )}
                                    {reserva.estado === ESTADOS_RESERVA.OCUPADA && (
                                        <button 
                                            className="btn-liberar-reserva"
                                            onClick={() => handleCambiarEstadoReserva(ESTADOS_RESERVA.DISPONIBLE)}
                                        >
                                            <i className="fas fa-unlock"></i> Liberar Cancha
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
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
                            {partido?.grupoTelegram?.activo && (
                                <input
                                    type="text"
                                    placeholder="Username de Telegram (opcional, sin @)"
                                    value={formJugador.telegramUsername}
                                    onChange={(e) => setFormJugador({ ...formJugador, telegramUsername: e.target.value })}
                                />
                            )}
                            <p className="monto-info">
                                Monto a pagar: ${montoPorJugador.toFixed(2)}
                            </p>
                            <button type="submit" disabled={agregarJugadorMutation.isLoading}>
                                {agregarJugadorMutation.isLoading ? 'Agregando...' : 'Agregar y Notificar'}
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <div className="jugadores-section">
                <h2>Jugadores ({jugadores.length})</h2>
                {jugadores.length > 0 ? (
                    <div className="jugadores-list">
                        {jugadores.map((jugador) => (
                            <div key={jugador.id} className="jugador-card">
                                <h4>{jugador.nombre}</h4>
                                {jugador.email && <p><i className="fas fa-envelope"></i> {jugador.email}</p>}
                                {jugador.telefono && <p><i className="fas fa-phone"></i> {jugador.telefono}</p>}
                                <p className={`estado-jugador estado-${jugador.estado}`}>
                                    {jugador.estado}
                                </p>
                                {jugador.monto && (
                                    <p className="monto-jugador">Monto: ${jugador.monto.toFixed(2)}</p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No hay jugadores agregados aún</p>
                )}
            </div>

            <ResumenPagos partidoId={id} />

            <div className="pagos-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Pagos ({pagos.length})</h2>
                    {esCreador && (
                        <button onClick={() => setMostrarFormPago(!mostrarFormPago)} className="btn-agregar">
                            {mostrarFormPago ? 'Cancelar' : '+ Registrar Pago'}
                        </button>
                    )}
                </div>

                {mostrarFormPago && esCreador && (
                    <form onSubmit={handleCrearPago} className="form-pago">
                        <div className="form-group">
                            <label>Jugador *</label>
                            <select
                                value={formPago.jugadorId}
                                onChange={(e) => setFormPago({ ...formPago, jugadorId: e.target.value })}
                                required
                            >
                                <option value="">Selecciona un jugador</option>
                                {jugadores.map(jugador => (
                                    <option key={jugador.id} value={jugador.id}>
                                        {jugador.nombre} {jugador.email && `(${jugador.email})`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Monto ($) *</label>
                            <input
                                type="number"
                                value={formPago.monto}
                                onChange={(e) => setFormPago({ ...formPago, monto: e.target.value })}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Medio de Pago *</label>
                            <select
                                value={formPago.medioPago}
                                onChange={(e) => setFormPago({ ...formPago, medioPago: e.target.value })}
                                required
                            >
                                <option value={MEDIOS_PAGO.TRANSFERENCIA}>Transferencia</option>
                                <option value={MEDIOS_PAGO.MERCADOPAGO}>MercadoPago</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Referencia (opcional)</label>
                            <input
                                type="text"
                                value={formPago.referencia}
                                onChange={(e) => setFormPago({ ...formPago, referencia: e.target.value })}
                                placeholder="Número de operación, etc."
                            />
                        </div>
                        <button type="submit" disabled={crearPagoMutation.isLoading} className="btn-submit">
                            {crearPagoMutation.isLoading ? 'Registrando...' : 'Registrar Pago'}
                        </button>
                    </form>
                )}

                {pagos.length > 0 ? (
                    <div className="pagos-list">
                        {pagos.map((pago) => {
                            const jugador = jugadores.find(j => j.id === pago.usuarioId);
                            return (
                                <div key={pago.id} className="pago-card">
                                    <h4>${pago.monto.toFixed(2)}</h4>
                                    {jugador && <p><strong>{jugador.nombre}</strong></p>}
                                    <p>Medio: {pago.medioPago}</p>
                                    <p className={`estado-pago estado-${pago.estado}`}>
                                        {pago.estado}
                                    </p>
                                    {pago.referencia && <p>Ref: {pago.referencia}</p>}
                                    {esCreador && pago.estado === ESTADOS_PAGO.PENDIENTE && (
                                        <button
                                            onClick={() => {
                                                const ref = prompt('Ingresa referencia de pago (opcional):');
                                                handleMarcarPagoPagado(pago.id, ref);
                                            }}
                                            className="btn-marcar-pagado"
                                        >
                                            Marcar como Pagado
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p>No hay pagos registrados</p>
                )}
            </div>

            <div className="servicios-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Servicios Adicionales ({servicios.length})</h2>
                    {esCreador && (
                        <button onClick={() => setMostrarFormServicio(!mostrarFormServicio)} className="btn-agregar">
                            {mostrarFormServicio ? 'Cancelar' : '+ Agregar Servicio'}
                        </button>
                    )}
                </div>

                {mostrarFormServicio && esCreador && (
                    <div className="form-servicio">
                        <div className="form-group">
                            <label>Servicio *</label>
                            <select
                                value={servicioSeleccionado}
                                onChange={(e) => setServicioSeleccionado(e.target.value)}
                            >
                                <option value="">Selecciona un servicio</option>
                                {serviciosDisponibles
                                    .filter(s => s.activo !== false)
                                    .map(servicio => (
                                        <option key={servicio.id} value={servicio.id}>
                                            {servicio.nombre} {servicio.precio && `($${servicio.precio})`}
                                        </option>
                                    ))}
                            </select>
                        </div>
                        <button onClick={handleAgregarServicio} disabled={agregarServicioMutation.isLoading} className="btn-submit">
                            {agregarServicioMutation.isLoading ? 'Agregando...' : 'Agregar Servicio'}
                        </button>
                    </div>
                )}

                {servicios.length > 0 ? (
                    <div className="servicios-list">
                        {servicios.map((servicio) => (
                            <div key={servicio.id} className="servicio-card">
                                <h4>{servicio.servicioNombre}</h4>
                                <p>${servicio.precio.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p>No hay servicios adicionales</p>
                )}
            </div>
        </div>
    );
};

export default DetallePartido;

