import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO, isBefore, startOfDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { obtenerPreciosSemana } from '@/services/preciosService';
import { obtenerReservasCancha, ESTADOS_RESERVA } from '@/services/reservasService';
import { useFranjasHorarias } from '@/hooks/useFranjasHorarias';
import LoadingSpinner from './LoadingSpinner';
import './CalendarioSemanal.css';

const CalendarioSemanal = ({ canchaId, tipo, predioId, predio, onSeleccionarHorario }) => {
    const { data: franjasHorarias = [] } = useFranjasHorarias();
    const diasAnticipacion = predio?.diasAnticipacion || 30; // Por defecto 30 días
    const hoy = startOfDay(new Date());
    const fechaMaxima = addDays(hoy, diasAnticipacion);
    
    const [fechaInicio, setFechaInicio] = useState(() => {
        // Siempre empezar desde hoy
        return hoy;
    });
    const [preciosSemana, setPreciosSemana] = useState({});
    const [reservasSemana, setReservasSemana] = useState({}); // Mapa de fecha -> reservas
    const [cargando, setCargando] = useState(false);
    const [horarioSeleccionado, setHorarioSeleccionado] = useState(null);

    // Obtener precios de la semana cuando cambia canchaId o fechaInicio
    useEffect(() => {
        if (!canchaId || !tipo) {
            setPreciosSemana({});
            return;
        }

        const cargarPreciosYReservas = async () => {
            setCargando(true);
            try {
                const fechaInicioStr = format(fechaInicio, 'yyyy-MM-dd');
                const [precios, reservas] = await Promise.all([
                    obtenerPreciosSemana(canchaId, fechaInicioStr),
                    cargarReservasSemana(canchaId, fechaInicioStr)
                ]);
                setPreciosSemana(precios);
                setReservasSemana(reservas);
            } catch (error) {
                console.error('Error cargando precios y reservas de la semana:', error);
            } finally {
                setCargando(false);
            }
        };

        cargarPreciosYReservas();
    }, [canchaId, tipo, fechaInicio]);

    // Cargar reservas para la semana
    const cargarReservasSemana = async (canchaId, fechaInicioStr) => {
        try {
            const reservasMap = {};
            // Cargar reservas para los próximos 6 días
            for (let i = 0; i < 6; i++) {
                const fecha = addDays(parseISO(fechaInicioStr), i);
                const fechaStr = format(fecha, 'yyyy-MM-dd');
                const reservas = await obtenerReservasCancha(canchaId, fechaStr);
                reservasMap[fechaStr] = reservas.filter(r => 
                    r.estado === ESTADOS_RESERVA.RESERVADA || 
                    r.estado === ESTADOS_RESERVA.OCUPADA || 
                    r.estado === ESTADOS_RESERVA.BLOQUEADA
                );
            }
            return reservasMap;
        } catch (error) {
            console.error('Error cargando reservas:', error);
            return {};
        }
    };

    // Generar los días disponibles (máximo 6 días por vista, pero solo hasta fechaMaxima)
    const diasDisponibles = [];
    for (let i = 0; i < 6; i++) {
        const fecha = addDays(fechaInicio, i);
        // Solo incluir días que no sean del pasado y no excedan fechaMaxima
        const fechaStartOfDay = startOfDay(fecha);
        if (!isBefore(fechaStartOfDay, hoy) && (isBefore(fechaStartOfDay, fechaMaxima) || isSameDay(fechaStartOfDay, fechaMaxima))) {
            diasDisponibles.push({
                fecha: fechaStartOfDay,
                fechaStr: format(fechaStartOfDay, 'yyyy-MM-dd'),
                nombreDia: format(fechaStartOfDay, 'EEEE', { locale: es }),
                numeroDia: format(fechaStartOfDay, 'd'),
                mes: format(fechaStartOfDay, 'MMMM', { locale: es }),
                esHoy: isSameDay(fechaStartOfDay, hoy),
                esPasado: isBefore(fechaStartOfDay, hoy)
            });
        }
    }

    // Verificar si un horario está reservado
    const estaReservado = (fechaStr, horaInicio, horaFin) => {
        const reservasDelDia = reservasSemana[fechaStr] || [];
        return reservasDelDia.some(reserva => {
            const reservaInicio = reserva.horaInicio;
            const reservaFin = reserva.horaFin;
            
            // Verificar solapamiento
            return (
                (reservaInicio <= horaInicio && reservaFin > horaInicio) ||
                (reservaInicio < horaFin && reservaFin >= horaFin) ||
                (reservaInicio >= horaInicio && reservaFin <= horaFin)
            );
        });
    };

    // Obtener horarios disponibles para un día específico (filtrando los reservados)
    const obtenerHorariosDisponibles = (fechaStr) => {
        const preciosDelDia = preciosSemana[fechaStr] || [];
        const horarios = [];

        preciosDelDia.forEach(precio => {
            const franja = franjasHorarias.find(f => f.id === precio.franjaHorariaId);
            if (franja && franja.activa !== false) {
                // Verificar si el horario está reservado
                const reservado = estaReservado(fechaStr, franja.horaInicio, franja.horaFin);
                
                if (!reservado) {
                    horarios.push({
                        franjaId: franja.id,
                        horaInicio: franja.horaInicio,
                        horaFin: franja.horaFin,
                        precio: precio.precio,
                        precioId: precio.precioId,
                        disponible: true
                    });
                }
            }
        });

        return horarios.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    };

    const handleSeleccionarHorario = (fechaStr, horario) => {
        setHorarioSeleccionado({ fecha: fechaStr, horario });
        if (onSeleccionarHorario) {
            onSeleccionarHorario(fechaStr, horario);
        }
    };

    const cambiarSemana = (direccion) => {
        const nuevaFecha = addDays(fechaInicio, direccion * 6);
        const nuevaFechaStartOfDay = startOfDay(nuevaFecha);
        // No permitir navegar al pasado
        if (isBefore(nuevaFechaStartOfDay, hoy)) {
            return;
        }
        // No permitir navegar más allá de fechaMaxima
        if (isBefore(fechaMaxima, nuevaFechaStartOfDay)) {
            return;
        }
        setFechaInicio(nuevaFechaStartOfDay);
        setHorarioSeleccionado(null);
    };

    // Verificar si se puede navegar hacia atrás
    const fechaInicioStartOfDay = startOfDay(fechaInicio);
    const puedeNavegarAtras = !isBefore(fechaInicioStartOfDay, hoy) && differenceInDays(fechaInicioStartOfDay, hoy) > 0;
    // Verificar si se puede navegar hacia adelante
    const fechaSiguienteSemana = addDays(fechaInicioStartOfDay, 6);
    const puedeNavegarAdelante = isBefore(fechaSiguienteSemana, fechaMaxima) || isSameDay(fechaSiguienteSemana, fechaMaxima);

    if (!canchaId || !tipo) {
        return (
            <div className="calendario-semanal-placeholder">
                <p>Selecciona una cancha para ver los horarios disponibles</p>
            </div>
        );
    }

    return (
        <div className="calendario-semanal">
            <div className="calendario-header">
                <button 
                    type="button"
                    onClick={() => cambiarSemana(-1)}
                    className={`btn-navegacion ${!puedeNavegarAtras ? 'disabled' : ''}`}
                    disabled={!puedeNavegarAtras}
                    aria-label="Semana anterior"
                >
                    <i className="fas fa-chevron-left"></i>
                </button>
                <div className="calendario-titulo">
                    <h3>
                        {diasDisponibles.length > 0 ? (
                            <>
                                {format(diasDisponibles[0].fecha, 'd', { locale: es })} - {format(diasDisponibles[diasDisponibles.length - 1].fecha, 'd MMMM yyyy', { locale: es })}
                            </>
                        ) : (
                            'Sin días disponibles'
                        )}
                    </h3>
                    <p className="calendario-subtitulo">
                        Disponible hasta {format(fechaMaxima, 'd \'de\' MMMM \'de\' yyyy', { locale: es })}
                    </p>
                </div>
                <button 
                    type="button"
                    onClick={() => cambiarSemana(1)}
                    className={`btn-navegacion ${!puedeNavegarAdelante ? 'disabled' : ''}`}
                    disabled={!puedeNavegarAdelante}
                    aria-label="Semana siguiente"
                >
                    <i className="fas fa-chevron-right"></i>
                </button>
            </div>

            {cargando ? (
                <div className="calendario-loading">
                    <LoadingSpinner text="Cargando horarios disponibles..." />
                </div>
            ) : (
                <div className="calendario-grid">
                    {diasDisponibles.length === 0 ? (
                        <div className="sin-dias-disponibles">
                            <p>No hay días disponibles para reservar en este período.</p>
                            <p className="texto-secundario">El predio permite reservas hasta {diasAnticipacion} días desde hoy.</p>
                        </div>
                    ) : (
                        diasDisponibles.map((dia) => {
                        const horarios = obtenerHorariosDisponibles(dia.fechaStr);
                        const estaSeleccionado = horarioSeleccionado?.fecha === dia.fechaStr;

                        return (
                            <div 
                                key={dia.fechaStr} 
                                className={`calendario-dia ${dia.esHoy ? 'hoy' : ''} ${estaSeleccionado ? 'seleccionado' : ''}`}
                            >
                                <div className="dia-header">
                                    <span className="dia-nombre">{dia.nombreDia}</span>
                                    <span className="dia-numero">{dia.numeroDia}</span>
                                    {dia.esHoy && <span className="badge-hoy">Hoy</span>}
                                </div>
                                
                                <div className="horarios-container">
                                    {horarios.length === 0 ? (
                                        <div className="sin-horarios">
                                            <span>Sin horarios</span>
                                        </div>
                                    ) : (
                                        horarios.map((horario) => {
                                            const estaHorarioSeleccionado = 
                                                estaSeleccionado && 
                                                horarioSeleccionado?.horario?.franjaId === horario.franjaId;

                                            return (
                                                <button
                                                    key={horario.franjaId}
                                                    type="button"
                                                    className={`horario-btn ${estaHorarioSeleccionado ? 'seleccionado' : ''}`}
                                                    onClick={() => handleSeleccionarHorario(dia.fechaStr, horario)}
                                                >
                                                    <span className="horario-hora">
                                                        {horario.horaInicio} - {horario.horaFin}
                                                    </span>
                                                    <span className="horario-precio">
                                                        ${horario.precio.toLocaleString('es-AR', { 
                                                            minimumFractionDigits: 2, 
                                                            maximumFractionDigits: 2 
                                                        })}
                                                    </span>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        );
                    }))}
                </div>
            )}

            {horarioSeleccionado && (
                <div className="seleccion-resumen">
                    <p>
                        <strong>Seleccionado:</strong> {format(parseISO(horarioSeleccionado.fecha), 'EEEE, d \'de\' MMMM', { locale: es })} 
                        {' '}de {horarioSeleccionado.horario.horaInicio} a {horarioSeleccionado.horario.horaFin}
                        {' '}- ${horarioSeleccionado.horario.precio.toLocaleString('es-AR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                        })}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CalendarioSemanal;

