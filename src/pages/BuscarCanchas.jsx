import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanchas } from '@/hooks/useCanchas';
import { usePartidosUsuario } from '@/hooks/usePartidos';
import { useDebounce } from '@/utils/debounce';
import { useToast, useAuth } from '@/context';
import CanchaCard from '@/components/CanchaCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import './BuscarCanchas.css';

// TEMPORAL: Usar input nativo hasta que react-datepicker esté instalado
// Para instalar: npm install react-datepicker
// Luego descomenta el código de DatePicker más abajo

const BuscarCanchas = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const fechaInputRef = useRef(null);
    const horaInputRef = useRef(null);
    const [filtros, setFiltros] = useState({
        ciudad: '',
        deporte: '',
        tipo: '',
        fecha: '',
        hora: '',
        buscarCercanas: false
    });
    const { addToast } = useToast();
    
    // Obtener partidos del usuario logueado (canchas reservadas)
    const { data: partidosReservados = [], isLoading: loadingReservas } = usePartidosUsuario(user?.id);

    // Debounce para búsquedas de ciudad
    const debouncedCiudad = useDebounce(filtros.ciudad, 300);

    // Usar hook optimizado con React Query
    // Nota: El filtro por ciudad busca en canchas, pero debería buscar en predios
    // Por ahora, si se busca por ciudad, el hook intentará buscar en canchas
    // En el futuro, esto debería mejorarse para buscar en predios
    const { data: canchas = [], isLoading: loading, error } = useCanchas({
        ciudad: debouncedCiudad || undefined,
        deporte: filtros.deporte || undefined,
        tipo: filtros.tipo || undefined,
    });

    useEffect(() => {
        if (error) {
            addToast('Error al buscar canchas', 'error');
        } else if (canchas.length > 0 && debouncedCiudad) {
            addToast(`Se encontraron ${canchas.length} canchas`, 'success');
        }
    }, [canchas, error, debouncedCiudad, addToast]);

    const buscarCercanas = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // TODO: Implementar búsqueda por distancia usando coordenadas
                    // Por ahora, la búsqueda se actualiza automáticamente con los filtros
                    addToast('Buscando canchas cercanas...', 'info');
                    // En el futuro, agregar filtros de latitud/longitud
                },
                (error) => {
                    addToast('Error al obtener ubicación', 'error');
                }
            );
        } else {
            addToast('Tu navegador no soporta geolocalización', 'error');
        }
    };

    // La búsqueda se hace automáticamente con React Query cuando cambian los filtros

    // Inicializar fecha y hora por defecto (mañana y 16:30)
    useEffect(() => {
        const mañana = new Date();
        mañana.setDate(mañana.getDate() + 1);
        const fechaFormato = mañana.toISOString().split('T')[0]; // YYYY-MM-DD

        setFiltros(prev => {
            const updated = { ...prev };
            if (!prev.fecha) {
                updated.fecha = fechaFormato;
            }
            if (!prev.hora) {
                updated.hora = '16:00';
            }
            return updated;
        });
    }, []);

    // Obtener fecha formateada para mostrar
    const getFechaFormateada = (fechaString) => {
        if (!fechaString) return '';
        const fecha = new Date(fechaString + 'T00:00:00');
        return fecha.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    };

    // Obtener texto de fecha para mostrar
    const getTextoFecha = () => {
        if (!filtros.fecha) return 'Elige fecha';
        const fecha = new Date(filtros.fecha + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const mañana = new Date(hoy);
        mañana.setDate(mañana.getDate() + 1);

        if (fecha.getTime() === hoy.getTime()) {
            return `Hoy ${getFechaFormateada(filtros.fecha)}`;
        } else if (fecha.getTime() === mañana.getTime()) {
            return `Mañana ${getFechaFormateada(filtros.fecha)}`;
        } else {
            return getFechaFormateada(filtros.fecha);
        }
    };

    return (
        <div className="buscar-canchas">
            {/* Hero Section con Buscador y todo el contenido */}
            <div className="hero-buscar-canchas">
                <div className="hero-content">
                    <h1 className="hero-title">Reserva tu cancha al instante</h1>
                    <p className="hero-subtitle">Explorá las canchas disponibles en tu ciudad y en tiempo real</p>

                    <div className="buscador-hero">
                        <div className="buscador-field">
                            <i className="fas fa-map-marker-alt"></i>
                            <input
                                type="text"
                                value={filtros.ciudad}
                                onChange={(e) => setFiltros({ ...filtros, ciudad: e.target.value })}
                                placeholder="Cargando Ubicación..."
                                className="input-ubicacion"
                            />
                        </div>

                        <div className="buscador-field">
                            <i className="fas fa-futbol"></i>
                            <select
                                value={filtros.deporte}
                                onChange={(e) => setFiltros({ ...filtros, deporte: e.target.value })}
                                className="select-deporte"
                            >
                                <option value="">Elige deporte</option>
                                <option value="futbol">Fútbol</option>
                                <option value="padel">Pádel</option>
                            </select>
                        </div>

                        <label 
                            className="buscador-field buscador-field-fecha" 
                            htmlFor="input-fecha-buscar"
                        >
                            <i className="fas fa-calendar-alt"></i>
                            <span className="fecha-display">{getTextoFecha()}</span>
                            <input
                                ref={fechaInputRef}
                                id="input-fecha-buscar"
                                type="date"
                                value={filtros.fecha}
                                onChange={(e) =>
                                    setFiltros({ ...filtros, fecha: e.target.value })
                                }
                                className="input-fecha"
                                min={new Date().toISOString().split('T')[0]}
                                max={(() => {
                                    const maxDate = new Date();
                                    maxDate.setDate(maxDate.getDate() + 7);
                                    return maxDate.toISOString().split('T')[0];
                                })()}
                            />
                        </label>


                        <div 
                            className="buscador-field buscador-field-clickable"
                            onClick={() => {
                                if (horaInputRef.current) {
                                    horaInputRef.current.click();
                                }
                            }}
                        >
                            <i className="fas fa-clock"></i>
                            <input
                                ref={horaInputRef}
                                type="time"
                                value={filtros.hora}
                                onChange={(e) => {
                                    // Asegurar que solo se seleccionen horas exactas
                                    const horaValue = e.target.value;
                                    if (horaValue) {
                                        const [horas, minutos] = horaValue.split(':');
                                        setFiltros({ ...filtros, hora: `${horas}:00` });
                                    } else {
                                        setFiltros({ ...filtros, hora: horaValue });
                                    }
                                }}
                                className="input-hora"
                                step="3600"
                            />
                            <span className="hora-display">{filtros.hora || '16:00'}hs</span>
                        </div>

                        <button
                            className="btn-buscar-hero"
                            disabled={loading}
                        >
                            <i className="fas fa-search"></i>
                            Buscar
                        </button>
                        <button
                            onClick={buscarCercanas}
                            className="btn-cercanas-hero"
                            disabled={loading}
                        >
                            <i className="fas fa-map-marker-alt"></i> Cercanas
                        </button>
                    </div>





                    {/* Resultados */}
                    {loading && canchas.length === 0 ? (
                        <LoadingSpinner text="Buscando canchas..." />
                    ) : (
                        <>
                            <div className="canchas-grid">
                                {canchas.length === 0 && !loading && (
                                    <p className="no-results">No se encontraron canchas. Crea una desde el panel de administración.</p>
                                )}
                                {canchas.map((cancha) => (
                                    <CanchaCard
                                        key={cancha.id}
                                        cancha={cancha}
                                        onClick={() => {
                                            // Navegar a crear partido con la cancha preseleccionada
                                            navigate(`/crear-partido?predioId=${cancha.predioId}&canchaId=${cancha.id}`);
                                        }}
                                    />
                                ))}
                            </div>
                            {loading && canchas.length > 0 && (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <LoadingSpinner size="small" text="Actualizando resultados..." />
                                </div>
                            )}
                            
                         
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuscarCanchas;




