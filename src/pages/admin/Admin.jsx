import { Link } from 'react-router-dom';
import './Admin.css';

const Admin = () => {
    return (
        <div className="admin">
            <h1>Panel de Administración</h1>
            <div className="admin-menu">
                <Link to="/admin/predios" className="admin-card">
                    <i className="fas fa-building"></i>
                    <h3>Gestionar Predios</h3>
                    <p>Administrar sedes y ubicaciones</p>
                </Link>
                <Link to="/admin/canchas" className="admin-card">
                    <i className="fas fa-futbol"></i>
                    <h3>Gestionar Canchas</h3>
                    <p>Agregar y configurar canchas por predio</p>
                </Link>
                <Link to="/admin/precios" className="admin-card">
                    <i className="fas fa-dollar-sign"></i>
                    <h3>Gestionar Precios</h3>
                    <p>Configurar precios por horario, día y feriados</p>
                </Link>
                <Link to="/admin/promociones" className="admin-card">
                    <i className="fas fa-tags"></i>
                    <h3>Gestionar Promociones</h3>
                    <p>Crear y administrar promociones especiales</p>
                </Link>
                <Link to="/admin/deportes" className="admin-card">
                    <i className="fas fa-running"></i>
                    <h3>Gestionar Deportes</h3>
                    <p>Configurar deportes y tipos de canchas</p>
                </Link>
            </div>
        </div>
    );
};

export default Admin;




