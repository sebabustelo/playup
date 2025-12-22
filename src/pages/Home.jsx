import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import './Home.css';

const Home = () => {
    const { user } = useAuth();

    return (
        <div className="home">
            <section className="hero">
                
                <h2>Organiza partidos de fútbol, pádel y más deportes en tu ciudad</h2>
                <div className="hero-buttons">
                    <Link to="/buscar-canchas" className="btn btn-primary">
                        Buscar Canchas
                    </Link>
                    {user && (
                        <Link to="/crear-partido" className="btn btn-secondary">
                            Crear Partido
                        </Link>
                    )}
                </div>
            </section>

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
                    <i className="fas fa-bell"></i>
                    <h3>Notificaciones</h3>
                    <p>Recibe avisos por email y WhatsApp</p>
                </div>
            </section>
        </div>
    );
};

export default Home;


