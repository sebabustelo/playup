import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast, useAuth } from '@/context';
import { tieneRol } from '@/services/usuariosService';
import { ROLES, ESTADOS_PARTIDO, ESTADOS_RESERVA, ESTADOS_RESERVA_DISPLAY, COLLECTIONS } from '@/utils/constants';
import { obtenerReservaPorPartido, actualizarEstadoReserva } from '@/services/reservasService';
import { eliminarPartido } from '@/services/partidosService';
import ConfirmDialog from '@/components/ConfirmDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './AdminPartidos.css';

const AdminPartidos = () => {
    const { addToast } = useToast();
    const { user } = useAuth();
    const esAdmin = tieneRol(user, ROLES.ADMIN);
    const esAdminPredios = tieneRol(user, ROLES.ADMIN_PREDIOS);
    const prediosAsignados = user?.prediosAsignados || [];

    const [partidos, setPartidos] = useState([]);
    const [predios, setPredios] = useState([]);
    const [canchasMap, setCanchasMap] = useState({}); // Mapa canchaId -> predioId
    const [loading, setLoading] = useState(false);
    const [filtroPredio, setFiltroPredio] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [reservas, setReservas] = useState({}); // Mapa de partidoId -> reserva
    const [dialogEliminar, setDialogEliminar] = useState({ isOpen: false, partido: null });

    useEffect(() => {
        cargarPredios();
        cargarCanchas();
        cargarPartidos();
    }, [filtroPredio, filtroEstado]);

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
        } catch (error) {
            console.error('Error cargando predios:', error);
            addToast('Error al cargar predios', 'error');
        }
    };

    const cargarCanchas = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'canchas'));
            const mapa = {};
            querySnapshot.docs.forEach(doc => {
                mapa[doc.id] = doc.data().predioId;
            });
            setCanchasMap(mapa);
        } catch (error) {
            console.error('Error cargando canchas:', error);
        }
    };

    const cargarPartidos = async () => {
        setLoading(true);
        try {
            // Ordenar solo por fecha para evitar necesidad de índice compuesto
            // Si se necesita ordenar también por hora, crear índice compuesto en Firestore
            let q = query(collection(db, 'partidos'), orderBy('fecha', 'desc'));

            // Si es admin_predios, filtrar por predios asignados
            if (esAdminPredios && !esAdmin && prediosAsignados.length > 0) {
                // Necesitamos obtener las canchas de los predios asignados primero
                const canchasSnapshot = await getDocs(collection(db, 'canchas'));
                const canchasAsignadas = canchasSnapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .filter(cancha => prediosAsignados.includes(cancha.predioId))
                    .map(cancha => cancha.id);

                if (canchasAsignadas.length > 0) {
                    // Filtrar por canchaId sin orderBy para evitar necesidad de índice compuesto
                    // Ordenaremos por fecha en el cliente después
                    // Firestore limita 'in' a 10, así que hacemos múltiples queries si es necesario
                    const partidosPromises = [];
                    for (let i = 0; i < canchasAsignadas.length; i += 10) {
                        const batch = canchasAsignadas.slice(i, i + 10);
                        partidosPromises.push(getDocs(
                            query(
                                collection(db, 'partidos'),
                                where('canchaId', 'in', batch)
                            )
                        ));
                    }
                    const results = await Promise.all(partidosPromises);
                    let partidosData = [];
                    results.forEach(snapshot => {
                        partidosData = partidosData.concat(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                    });
                    
                    // Ordenar por fecha en el cliente
                    partidosData.sort((a, b) => {
                        const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                        const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                        const fechaDiff = fechaB.getTime() - fechaA.getTime();
                        if (fechaDiff !== 0) return fechaDiff;
                        // Si la fecha es la misma, ordenar por hora (descendente)
                        if (a.hora && b.hora) {
                            return b.hora.localeCompare(a.hora);
                        }
                        return 0;
                    });
                    
                    // Agregar predioId a los partidos que no lo tienen (usando el mapa de canchas)
                    partidosData = partidosData.map(p => {
                        if (!p.predioId && p.canchaId && canchasMap[p.canchaId]) {
                            return { ...p, predioId: canchasMap[p.canchaId] };
                        }
                        return p;
                    });
                    
                    // Aplicar filtros adicionales
                    if (filtroPredio) {
                        partidosData = partidosData.filter(p => {
                            const predioIdDelPartido = p.predioId || (p.canchaId ? canchasMap[p.canchaId] : null);
                            return predioIdDelPartido === filtroPredio;
                        });
                    }
                    
                    if (filtroEstado !== 'todos') {
                        partidosData = partidosData.filter(p => p.estado === filtroEstado);
                    }
                    
                    setPartidos(partidosData);
                    
                    // Cargar reservas para todos los partidos de una vez
                    const reservasMap = {};
                    if (partidosData.length > 0) {
                        try {
                            const partidosIds = partidosData.map(p => p.id);
                            const reservasPromises = [];
                            for (let i = 0; i < partidosIds.length; i += 10) {
                                const batch = partidosIds.slice(i, i + 10);
                                const qReservas = query(
                                    collection(db, COLLECTIONS.RESERVAS_CANCHAS),
                                    where('partidoId', 'in', batch)
                                );
                                reservasPromises.push(getDocs(qReservas));
                            }
                            const reservasSnapshots = await Promise.all(reservasPromises);
                            reservasSnapshots.forEach(snapshot => {
                                snapshot.docs.forEach(doc => {
                                    const reserva = { id: doc.id, ...doc.data() };
                                    if (reserva.partidoId) {
                                        reservasMap[reserva.partidoId] = reserva;
                                    }
                                });
                            });
                        } catch (error) {
                            console.error('Error cargando reservas en lote:', error);
                            addToast('Error al cargar reservas asociadas', 'error');
                        }
                    }
                    setReservas(reservasMap);
                    setLoading(false);
                    return;
                } else {
                    setPartidos([]);
                    setLoading(false);
                    return;
                }
            }

            const querySnapshot = await getDocs(q);
            let partidosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Agregar predioId a los partidos que no lo tienen (usando el mapa de canchas)
            partidosData = partidosData.map(p => {
                if (!p.predioId && p.canchaId && canchasMap[p.canchaId]) {
                    return { ...p, predioId: canchasMap[p.canchaId] };
                }
                return p;
            });

            // Aplicar filtros adicionales
            if (filtroPredio) {
                partidosData = partidosData.filter(p => {
                    const predioIdDelPartido = p.predioId || (p.canchaId ? canchasMap[p.canchaId] : null);
                    return predioIdDelPartido === filtroPredio;
                });
            }

            if (filtroEstado !== 'todos') {
                partidosData = partidosData.filter(p => p.estado === filtroEstado);
            }

            // Ordenar por fecha y hora en el cliente (después de obtener los datos)
            // Esto evita la necesidad de un índice compuesto en Firestore
            partidosData.sort((a, b) => {
                // Primero por fecha
                const fechaA = a.fecha?.toDate ? a.fecha.toDate() : new Date(a.fecha);
                const fechaB = b.fecha?.toDate ? b.fecha.toDate() : new Date(b.fecha);
                const fechaDiff = fechaB.getTime() - fechaA.getTime();
                if (fechaDiff !== 0) return fechaDiff;
                
                // Si la fecha es la misma, ordenar por hora (descendente)
                if (a.hora && b.hora) {
                    return b.hora.localeCompare(a.hora);
                }
                return 0;
            });

            setPartidos(partidosData);

            // Cargar reservas para todos los partidos de una vez
            const reservasMap = {};
            if (partidosData.length > 0) {
                try {
                    // Obtener todas las reservas de los partidos
                    const partidosIds = partidosData.map(p => p.id);
                    // Firestore limita 'in' a 10, así que hacemos múltiples queries si es necesario
                    const reservasPromises = [];
                    for (let i = 0; i < partidosIds.length; i += 10) {
                        const batch = partidosIds.slice(i, i + 10);
                        const collectionName = COLLECTIONS.RESERVAS_CANCHAS || 'reservas_canchas';
                        const q = query(
                            collection(db, collectionName),
                            where('partidoId', 'in', batch)
                        );
                        reservasPromises.push(getDocs(q));
                    }
                    
                    const reservasSnapshots = await Promise.all(reservasPromises);
                    reservasSnapshots.forEach(snapshot => {
                        snapshot.docs.forEach(doc => {
                            const reserva = { id: doc.id, ...doc.data() };
                            if (reserva.partidoId) {
                                reservasMap[reserva.partidoId] = reserva;
                            }
                        });
                    });
                } catch (error) {
                    console.error('Error cargando reservas:', error);
                }
            }
            setReservas(reservasMap);
        } catch (error) {
            console.error('Error cargando partidos:', error);
            addToast('Error al cargar partidos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstadoReserva = async (partidoId, nuevoEstado) => {
        const reserva = reservas[partidoId];
        if (!reserva) {
            addToast('Reserva no encontrada', 'error');
            return;
        }

        try {
            const resultado = await actualizarEstadoReserva(reserva.id, nuevoEstado);
            if (resultado.success) {
                addToast('Estado de reserva actualizado', 'success');
                // Recargar reserva
                const reservaActualizada = await obtenerReservaPorPartido(partidoId);
                setReservas(prev => ({
                    ...prev,
                    [partidoId]: reservaActualizada
                }));
            } else {
                addToast('Error al actualizar estado de reserva', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al actualizar estado de reserva', 'error');
        }
    };

    const handleCambiarEstadoPartido = async (partidoId, nuevoEstado) => {
        try {
            await updateDoc(doc(db, 'partidos', partidoId), {
                estado: nuevoEstado,
                actualizadoEn: new Date()
            });

            // Si se cancela, liberar la reserva
            if (nuevoEstado === ESTADOS_PARTIDO.CANCELADO) {
                const reserva = reservas[partidoId];
                if (reserva) {
                    await actualizarEstadoReserva(reserva.id, ESTADOS_RESERVA.DISPONIBLE, 'Partido cancelado');
                }
            }

            // Si se confirma, marcar como ocupada
            if (nuevoEstado === ESTADOS_PARTIDO.CONFIRMADO) {
                const reserva = reservas[partidoId];
                if (reserva) {
                    await actualizarEstadoReserva(reserva.id, ESTADOS_RESERVA.OCUPADA);
                }
            }

            addToast('Estado actualizado', 'success');
            cargarPartidos();
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al actualizar estado', 'error');
        }
    };

    const handleEliminarPartido = (partidoId) => {
        const partido = partidos.find(p => p.id === partidoId);
        if (!partido) return;
        setDialogEliminar({ isOpen: true, partido });
    };

    const confirmarEliminarPartido = async () => {
        const { partido } = dialogEliminar;
        if (!partido) return;

        setLoading(true);
        try {
            const resultado = await eliminarPartido(partido.id);
            if (resultado.success) {
                addToast('Partido eliminado exitosamente', 'success');
                cargarPartidos(); // Recargar la lista
            } else {
                addToast('Error al eliminar partido: ' + (resultado.error || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error eliminando partido:', error);
            addToast('Error al eliminar partido', 'error');
        } finally {
            setLoading(false);
            setDialogEliminar({ isOpen: false, partido: null });
        }
    };

    return (
        <div className="admin-partidos">
            <div className="admin-header">
                <h1>Gestionar Partidos y Reservas</h1>
            </div>

            <div className="filtros-partidos">
                <div className="filtro-group">
                    <label>Filtrar por Predio:</label>
                    <select
                        value={filtroPredio}
                        onChange={(e) => setFiltroPredio(e.target.value)}
                    >
                        <option value="">Todos los predios</option>
                        {predios.map(predio => (
                            <option key={predio.id} value={predio.id}>
                                {predio.nombre} - {predio.ciudad}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="filtro-group">
                    <label>Filtrar por Estado:</label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        {Object.values(ESTADOS_PARTIDO).map(estado => (
                            <option key={estado} value={estado}>
                                {estado.charAt(0).toUpperCase() + estado.slice(1)}
                            </option>
                        ))}
                    </select>
                </div>

                <button onClick={cargarPartidos} className="btn-recargar">
                    <i className="fas fa-sync-alt"></i> Recargar
                </button>
            </div>

            {loading ? (
                <div className="loading">Cargando partidos...</div>
            ) : (
                <div className="partidos-list">
                    {partidos.length === 0 ? (
                        <div className="sin-partidos">
                            <p>No se encontraron partidos</p>
                        </div>
                    ) : (
                        <div className="partidos-grid">
                            {partidos.map(partido => {
                                const reserva = reservas[partido.id];
                                return (
                                    <div key={partido.id} className="partido-card-admin">
                                        <div className="partido-header-admin">
                                            <h3>{partido.canchaNombre}</h3>
                                            <div className="estados-badge">
                                                <span className={`badge-estado badge-${partido.estado}`}>
                                                    {partido.estado}
                                                </span>
                                                {reserva && (
                                                    <span className={`badge-reserva badge-reserva-${reserva.estado}`}>
                                                        {ESTADOS_RESERVA_DISPLAY[reserva.estado] || reserva.estado}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="partido-info-admin">
                                            <p><i className="fas fa-calendar"></i> {format(new Date(partido.fecha), 'dd/MM/yyyy', { locale: es })}</p>
                                            <p><i className="fas fa-clock"></i> {partido.hora} - {partido.horaFin}</p>
                                            <p><i className="fas fa-user"></i> {partido.creadorNombre}</p>
                                            <p><i className="fas fa-dollar-sign"></i> ${partido.precioTotal}</p>
                                        </div>

                                        <div className="acciones-partido">
                                            <div className="acciones-estado-partido">
                                                <label>Estado Partido:</label>
                                                <select
                                                    value={partido.estado}
                                                    onChange={(e) => handleCambiarEstadoPartido(partido.id, e.target.value)}
                                                >
                                                    {Object.values(ESTADOS_PARTIDO).map(estado => (
                                                        <option key={estado} value={estado}>
                                                            {estado.charAt(0).toUpperCase() + estado.slice(1)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {reserva && (
                                                <div className="acciones-estado-reserva">
                                                    <label>Estado Reserva:</label>
                                                    <select
                                                        value={reserva.estado}
                                                        onChange={(e) => handleCambiarEstadoReserva(partido.id, e.target.value)}
                                                    >
                                                        {Object.values(ESTADOS_RESERVA).map(estado => (
                                                            <option key={estado} value={estado}>
                                                                {ESTADOS_RESERVA_DISPLAY[estado] || estado}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {!reserva && (
                                                <p className="sin-reserva">
                                                    <i className="fas fa-exclamation-triangle"></i> Sin reserva registrada
                                                </p>
                                            )}

                                            {/* Solo admin principal puede eliminar partidos */}
                                            {esAdmin && (
                                                <div className="acciones-eliminar">
                                                    <button
                                                        onClick={() => handleEliminarPartido(partido.id)}
                                                        className="btn-eliminar-partido"
                                                        disabled={loading}
                                                        title="Eliminar partido permanentemente"
                                                    >
                                                        <i className="fas fa-trash-alt"></i> Eliminar Partido
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={dialogEliminar.isOpen}
                onClose={() => setDialogEliminar({ isOpen: false, partido: null })}
                onConfirm={confirmarEliminarPartido}
                type="danger"
                title="Eliminar Partido"
                message={
                    dialogEliminar.partido ? (
                        <div>
                            <p style={{ marginBottom: '16px', fontWeight: 500 }}>
                                ¿Estás seguro de eliminar este partido?
                            </p>
                            <div style={{ 
                                background: '#f8f9fa', 
                                padding: '12px', 
                                borderRadius: '8px',
                                marginBottom: '16px'
                            }}>
                                <p style={{ margin: '4px 0', color: '#333' }}>
                                    <strong>Cancha:</strong> {dialogEliminar.partido.canchaNombre || 'N/A'}
                                </p>
                                <p style={{ margin: '4px 0', color: '#333' }}>
                                    <strong>Fecha:</strong> {
                                        dialogEliminar.partido.fecha 
                                            ? format(
                                                dialogEliminar.partido.fecha.toDate 
                                                    ? dialogEliminar.partido.fecha.toDate() 
                                                    : new Date(dialogEliminar.partido.fecha), 
                                                'dd/MM/yyyy', 
                                                { locale: es }
                                            )
                                            : 'N/A'
                                    }
                                </p>
                                <p style={{ margin: '4px 0', color: '#333' }}>
                                    <strong>Hora:</strong> {dialogEliminar.partido.hora || 'N/A'}
                                </p>
                            </div>
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{ marginBottom: '8px', fontWeight: 500, color: '#dc3545' }}>
                                    Esta acción eliminará:
                                </p>
                                <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#666' }}>
                                    <li>El partido</li>
                                    <li>La reserva asociada</li>
                                    <li>Todos los jugadores registrados</li>
                                    <li>Todos los pagos</li>
                                    <li>Todos los servicios</li>
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
                    ) : '¿Estás seguro?'
                }
                confirmText="Eliminar"
                cancelText="Cancelar"
            />
        </div>
    );
};

export default AdminPartidos;

