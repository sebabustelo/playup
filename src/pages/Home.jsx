import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import './Home.css';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="home">
            <section className="hero">

                <h2>Organizá partidos, reservá canchas y jugá en tu ciudad</h2>
                <p className="hero-subtitle">Organizá partidos de fútbol, pádel y más deportes en tu ciudad.</p>
                <div className="hero-buttons">
                    <Link to="/buscar-canchas" className="btn btn-secondary">
                        Buscar Canchas
                    </Link>
                    {user && (
                        <Link to="/crear-partido" className="btn btn-secondary">
                            Crear Partido
                        </Link>
                    )}
                </div>


                <section className="features">
                    <div className="feature-card">
                        <i className="fas fa-search"></i>
                        <h3>Busca Canchas</h3>
                        <p>Encuentra canchas por ciudad o ubicación cercana</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-users"></i>
                        <h3>Organiza Partidos</h3>
                        <p>Crea partidos e invita jugadores fácilmente</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-user-friends"></i>
                        <h3>Buscar Jugadores</h3>
                        <p>Encuentra jugadores disponibles para tus partidos</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-trophy"></i>
                        <h3>Crear Torneos</h3>
                        <p>Organiza torneos y competencias entre equipos</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-chart-line"></i>
                        <h3>Estadísticas</h3>
                        <p>Consulta tu historial y estadísticas de partidos</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-shield-alt"></i>
                        <h3>Pagos Seguros</h3>
                        <p>Paga de forma segura con MercadoPago integrado</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-video"></i>
                        <h3>Grabación del Partido</h3>
                        <p>Graba y comparte los mejores momentos de tus partidos</p>
                    </div>
                    <div className="feature-card">
                        <i className="fas fa-building"></i>
                        <h3>Gestión para Complejos</h3>
                        <p>Herramientas completas para administrar tu complejo deportivo</p>
                    </div>
                </section>
            </section>
        </div>
    );
};

export default Home;


