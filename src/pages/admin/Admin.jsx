import { Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { tieneRol } from '@/services/usuariosService';
import { ROLES } from '@/utils/constants';
import './Admin.css';

const Admin = () => {
    const { user } = useAuth();
    const esAdmin = tieneRol(user, ROLES.ADMIN);
    const esAdminPredios = tieneRol(user, ROLES.ADMIN_PREDIOS);
    const prediosAsignados = user?.prediosAsignados || [];

    return (
        <div className="admin">
            <div className="admin-header-section">
                <h1>Panel de Administración</h1>
                {esAdminPredios && !esAdmin && (
                    <div className="admin-predios-info">
                        <i className="fas fa-info-circle"></i>
                        <p>Estás gestionando {prediosAsignados.length} predio{prediosAsignados.length !== 1 ? 's' : ''} asignado{prediosAsignados.length !== 1 ? 's' : ''}</p>
                    </div>
                )}
            </div>
            <div className="admin-menu">
                {/* Solo admin principal puede gestionar predios */}
                {esAdmin && (
                    <Link to="/admin/predios" className="admin-card">
                        <i className="fas fa-building"></i>
                        <h3>Gestionar Predios</h3>
                        <p>Administrar sedes y ubicaciones</p>
                    </Link>
                )}
                
                {/* Admin principal y admin_predios pueden gestionar canchas */}
                {(esAdmin || esAdminPredios) && (
                    <Link to="/admin/canchas" className="admin-card">
                        <i className="fas fa-futbol"></i>
                        <h3>Gestionar Canchas</h3>
                        <p>Agregar y configurar canchas por predio</p>
                        {esAdminPredios && !esAdmin && (
                            <span className="admin-badge">Solo predios asignados</span>
                        )}
                    </Link>
                )}
                
                {/* Admin principal y admin_predios pueden gestionar precios */}
                {(esAdmin || esAdminPredios) && (
                    <Link to="/admin/precios" className="admin-card">
                        <i className="fas fa-dollar-sign"></i>
                        <h3>Gestionar Precios</h3>
                        <p>Configurar precios por horario, día y feriados</p>
                        {esAdminPredios && !esAdmin && (
                            <span className="admin-badge">Solo predios asignados</span>
                        )}
                    </Link>
                )}
                
                {/* Solo admin principal puede gestionar promociones */}
                {esAdmin && (
                    <Link to="/admin/promociones" className="admin-card">
                        <i className="fas fa-tags"></i>
                        <h3>Gestionar Promociones</h3>
                        <p>Crear y administrar promociones especiales</p>
                    </Link>
                )}
                
                {/* Solo admin principal puede gestionar deportes */}
                {esAdmin && (
                    <Link to="/admin/deportes" className="admin-card">
                        <i className="fas fa-running"></i>
                        <h3>Gestionar Deportes</h3>
                        <p>Configurar deportes y tipos de canchas</p>
                    </Link>
                )}
                
                {/* Solo admin principal puede gestionar franjas horarias */}
                {esAdmin && (
                    <Link to="/admin/franjas-horarias" className="admin-card">
                        <i className="fas fa-clock"></i>
                        <h3>Gestionar Franjas Horarias</h3>
                        <p>Configurar horarios disponibles para canchas</p>
                    </Link>
                )}
                
                {/* Solo admin principal puede gestionar servicios */}
                {esAdmin && (
                    <Link to="/admin/servicios" className="admin-card">
                        <i className="fas fa-concierge-bell"></i>
                        <h3>Gestionar Servicios</h3>
                        <p>Administrar servicios adicionales (grabación, etc.)</p>
                    </Link>
                )}
                
                {/* Admin principal y admin_predios pueden gestionar partidos */}
                {(esAdmin || esAdminPredios) && (
                    <Link to="/admin/partidos" className="admin-card">
                        <i className="fas fa-futbol-ball"></i>
                        <h3>Gestionar Partidos</h3>
                        <p>Ver y gestionar partidos y reservas</p>
                        {esAdminPredios && !esAdmin && (
                            <span className="admin-badge">Solo predios asignados</span>
                        )}
                    </Link>
                )}
                
                {/* Solo admin principal puede gestionar usuarios */}
                {esAdmin && (
                    <Link to="/admin/usuarios" className="admin-card">
                        <i className="fas fa-users"></i>
                        <h3>Gestionar Usuarios</h3>
                        <p>Administrar usuarios y asignar roles</p>
                    </Link>
                )}
                
                {/* Solo admin principal puede cargar datos de ejemplo */}
                {esAdmin && (
                    <Link to="/admin/cargar-datos" className="admin-card datos-ejemplo">
                        <i className="fas fa-database"></i>
                        <h3>Cargar Datos de Ejemplo</h3>
                        <p>Cargar datos de prueba para desarrollo</p>
                    </Link>
                )}
            </div>
        </div>
    );
};

export default Admin;




