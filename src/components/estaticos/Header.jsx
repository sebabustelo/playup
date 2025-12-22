import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context';
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        setOpen(false);
    };

    const handleToggle = () => setOpen(!open);
    const handleClose = () => setOpen(false);

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo" onClick={handleClose}>
                    <img src="/img/logo.png" alt="PlayUp Logo" className="logo-img" />
                </Link>

                <div className={`hamburger ${open ? 'active' : ''}`} onClick={handleToggle}>
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </div>

                <div className={`nav-overlay ${open ? 'open' : ''}`} onClick={handleClose}></div>

                <nav className={`nav ${open ? 'open' : ''}`}>
                    <Link to="/buscar-canchas" className="nav-link" onClick={handleClose}>
                        <i className="fas fa-search"></i> Buscar Canchas
                    </Link>
                    {user ? (
                        <>
                            <Link to="/crear-partido" className="nav-link" onClick={handleClose}>
                                <i className="fas fa-plus-circle"></i> Crear Partido
                            </Link>
                            <Link to="/mis-partidos" className="nav-link" onClick={handleClose}>
                                <i className="fas fa-list"></i> Mis Partidos
                            </Link>
                            {user.roleNames?.includes('admin') && (
                                <Link to="/admin" className="nav-link" onClick={handleClose}>
                                    <i className="fas fa-cog"></i> Admin
                                </Link>
                            )}
                            <div className="user-menu">
                                <span className="user-name">
                                    <i className="fas fa-user"></i> {user.nombre}
                                </span>
                                <button onClick={handleLogout} className="btn-logout">
                                    <i className="fas fa-sign-out-alt"></i> Salir
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link" onClick={handleClose}>
                                <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
                            </Link>
                            <Link to="/registrarse" className="nav-link btn-register" onClick={handleClose}>
                                <i className="fas fa-user-plus"></i> Registrarse
                            </Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Header;

