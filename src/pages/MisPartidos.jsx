import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { usePartidosUsuario } from '@/hooks/usePartidos';
import PartidoCard from '@/components/PartidoCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import './MisPartidos.css';

const MisPartidos = () => {
    const { user } = useAuth();
    const { data: partidos = [], isLoading: loading } = usePartidosUsuario(user?.id);

    return (
        <div className="mis-partidos">
            <div className="hero-mis-partidos">
                <div className="hero-content">
                    <h1 className="hero-title">Mis Partidos</h1>
                    <p className="hero-subtitle">Gestioná tus partidos y reservas en un solo lugar</p>

                    {loading ? (
                        <LoadingSpinner text="Cargando tus partidos..." />
                    ) : (
                        <>
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
                                        <PartidoCard key={partido.id} partido={partido} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MisPartidos;

