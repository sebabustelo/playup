import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { obtenerPartidosUsuario } from '@/services/partidosService';
import { format } from 'date-fns';
import './MisPartidos.css';

const MisPartidos = () => {
    const { user } = useAuth();
    const [partidos, setPartidos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            cargarPartidos();
        }
    }, [user]);

    const cargarPartidos = async () => {
        setLoading(true);
        try {
            const partidosData = await obtenerPartidosUsuario(user.id);
            setPartidos(partidosData);
        } catch (error) {
            console.error('Error cargando partidos:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="mis-partidos"><p>Cargando...</p></div>;
    }

    return (
        <div className="mis-partidos">
            <h1>Mis Partidos</h1>

            {partidos.length === 0 ? (
                <div className="sin-partidos">
                    <p>No has creado ningún partido aún.</p>
                    <Link to="/crear-partido" className="btn-crear">
                        Crear mi primer partido
                    </Link>
                </div>
            ) : (
                <div className="partidos-grid">
                    {partidos.map(partido => (
                        <Link key={partido.id} to={`/partido/${partido.id}`} className="partido-card">
                            <h3>{partido.canchaNombre}</h3>
                            <p><i className="fas fa-calendar"></i> {format(new Date(partido.fecha), 'dd/MM/yyyy')}</p>
                            <p><i className="fas fa-clock"></i> {partido.hora}</p>
                            <p><i className="fas fa-users"></i> {partido.tipo} vs {partido.tipo}</p>
                            <p><i className="fas fa-dollar-sign"></i> ${partido.precioTotal} total</p>
                            <p className="jugadores-count">
                                {partido.jugadores?.length || 0} jugadores
                            </p>
                            <span className={`estado estado-${partido.estado}`}>
                                {partido.estado}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MisPartidos;

