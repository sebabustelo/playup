import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from '@/context';
import { useAuth } from '@/context';
import { obtenerUsuarios, actualizarRolesUsuario, tieneRol } from '@/services/usuariosService';
import { ROLES, ROLES_DISPLAY } from '@/utils/constants';
import './AdminUsuarios.css';

const AdminUsuarios = () => {
    const { addToast } = useToast();
    const { user: currentUser } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [predios, setPredios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editando, setEditando] = useState(null);
    const [formData, setFormData] = useState({
        roles: [],
        prediosAsignados: []
    });
    const [filtro, setFiltro] = useState('todos'); // 'todos', 'clientes', 'admin_predios', 'admin'
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarUsuarios();
        cargarPredios();
    }, []);

    const cargarUsuarios = async () => {
        setLoading(true);
        try {
            console.log('🔄 Cargando usuarios...');
            const usuariosData = await obtenerUsuarios();
            console.log('📋 Usuarios cargados:', usuariosData);
            setUsuarios(usuariosData);
            if (usuariosData.length === 0) {
                addToast('No se encontraron usuarios. Los usuarios de Google se crearán automáticamente al iniciar sesión.', 'info');
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            addToast('Error al cargar usuarios: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const cargarPredios = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'predios'));
            const prediosData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPredios(prediosData.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        } catch (error) {
            console.error('Error cargando predios:', error);
        }
    };

    const handleEditar = (usuario) => {
        setEditando(usuario);
        const rolesArray = usuario.roles || [];
        const roleNames = rolesArray.map(r => typeof r === 'string' ? r : r.name);
        
        setFormData({
            roles: roleNames,
            prediosAsignados: usuario.prediosAsignados || []
        });
    };

    const handleRolChange = (rol, checked) => {
        setFormData(prev => {
            const newRoles = checked
                ? [...prev.roles, rol]
                : prev.roles.filter(r => r !== rol);
            
            // Si se desmarca admin_predios, limpiar predios asignados
            if (rol === ROLES.ADMIN_PREDIOS && !checked) {
                return {
                    roles: newRoles,
                    prediosAsignados: []
                };
            }
            
            return {
                roles: newRoles,
                prediosAsignados: prev.prediosAsignados
            };
        });
    };

    const handlePredioChange = (predioId, checked) => {
        setFormData(prev => {
            const newPredios = checked
                ? [...prev.prediosAsignados, predioId]
                : prev.prediosAsignados.filter(p => p !== predioId);
            
            return {
                ...prev,
                prediosAsignados: newPredios
            };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editando) return;

        setLoading(true);
        try {
            // Convertir roles a objetos
            const rolesObjects = formData.roles.map(rol => ({
                name: rol,
                display_name: ROLES_DISPLAY[rol] || rol
            }));

            // Solo permitir predios asignados si tiene rol admin_predios
            const prediosAsignados = formData.roles.includes(ROLES.ADMIN_PREDIOS)
                ? formData.prediosAsignados
                : [];

            const resultado = await actualizarRolesUsuario(
                editando.id,
                rolesObjects,
                prediosAsignados
            );

            if (resultado.success) {
                addToast('Roles actualizados correctamente', 'success');
                setEditando(null);
                cargarUsuarios();
                
                // Si se actualizó el usuario actual, recargar sesión
                if (editando.id === currentUser?.id) {
                    addToast('Tus roles han cambiado. Por favor, recarga la página.', 'info');
                }
            } else {
                addToast('Error al actualizar roles', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            addToast('Error al actualizar roles', 'error');
        } finally {
            setLoading(false);
        }
    };

    const usuariosFiltrados = usuarios.filter(usuario => {
        // Filtro por rol
        let cumpleFiltro = false;
        if (filtro === 'todos') cumpleFiltro = true;
        else if (filtro === 'clientes') cumpleFiltro = tieneRol(usuario, ROLES.CLIENTE) && !tieneRol(usuario, ROLES.ADMIN) && !tieneRol(usuario, ROLES.ADMIN_PREDIOS);
        else if (filtro === 'admin_predios') cumpleFiltro = tieneRol(usuario, ROLES.ADMIN_PREDIOS);
        else if (filtro === 'admin') cumpleFiltro = tieneRol(usuario, ROLES.ADMIN);
        
        if (!cumpleFiltro) return false;
        
        // Filtro por búsqueda
        if (busqueda.trim()) {
            const busquedaLower = busqueda.toLowerCase();
            return (
                (usuario.nombre || '').toLowerCase().includes(busquedaLower) ||
                (usuario.email || '').toLowerCase().includes(busquedaLower) ||
                (usuario.telefono || '').includes(busqueda)
            );
        }
        
        return true;
    });

    const obtenerRolesDisplay = (usuario) => {
        const roles = usuario.roles || [];
        return roles.map(r => {
            const roleName = typeof r === 'string' ? r : r.name;
            return ROLES_DISPLAY[roleName] || roleName;
        });
    };

    const getRoleIcon = (rol) => {
        switch(rol) {
            case ROLES.ADMIN:
                return 'fa-crown';
            case ROLES.ADMIN_PREDIOS:
                return 'fa-building';
            case ROLES.CLIENTE:
                return 'fa-user';
            default:
                return 'fa-user-circle';
        }
    };

    const getRoleColor = (rol) => {
        switch(rol) {
            case ROLES.ADMIN:
                return '#d32f2f';
            case ROLES.ADMIN_PREDIOS:
                return '#1976d2';
            case ROLES.CLIENTE:
                return '#388e3c';
            default:
                return '#757575';
        }
    };

    return (
        <div className="admin-usuarios">
            <div className="admin-header">
                <div className="header-title-section">
                    <h1><i className="fas fa-users-cog"></i> Gestionar Usuarios y Roles</h1>
                    <p className="header-subtitle">Administra los roles y permisos de los usuarios del sistema</p>
                </div>
                <div className="header-actions">
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o teléfono..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="search-input"
                        />
                        {busqueda && (
                            <button
                                className="search-clear"
                                onClick={() => setBusqueda('')}
                                title="Limpiar búsqueda"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    <div className="filtros-usuarios">
                        <button
                            className={filtro === 'todos' ? 'active' : ''}
                            onClick={() => setFiltro('todos')}
                            title="Todos los usuarios"
                        >
                            <i className="fas fa-users"></i> Todos
                        </button>
                        <button
                            className={filtro === 'clientes' ? 'active' : ''}
                            onClick={() => setFiltro('clientes')}
                            title="Solo clientes"
                        >
                            <i className="fas fa-user"></i> Clientes
                        </button>
                        <button
                            className={filtro === 'admin_predios' ? 'active' : ''}
                            onClick={() => setFiltro('admin_predios')}
                            title="Administradores de predios"
                        >
                            <i className="fas fa-building"></i> Admin Predios
                        </button>
                        <button
                            className={filtro === 'admin' ? 'active' : ''}
                            onClick={() => setFiltro('admin')}
                            title="Administradores principales"
                        >
                            <i className="fas fa-crown"></i> Admin
                        </button>
                    </div>
                </div>
            </div>

            {loading && !editando ? (
                <div className="loading">Cargando usuarios...</div>
            ) : (
                <div className="usuarios-list">
                    {usuariosFiltrados.length === 0 ? (
                        <div className="sin-usuarios">
                            <p>No se encontraron usuarios.</p>
                            <p className="hint">
                                <small>
                                    Los usuarios de Google se crean automáticamente al iniciar sesión. 
                                    Si acabas de iniciar sesión con Google, recarga la página.
                                </small>
                            </p>
                            <button onClick={cargarUsuarios} className="btn-recargar">
                                <i className="fas fa-sync-alt"></i> Recargar Usuarios
                            </button>
                        </div>
                    ) : (
                        <div className="usuarios-grid">
                            {usuariosFiltrados.map(usuario => (
                                <div key={usuario.id} className="usuario-card">
                                    <div className="usuario-header">
                                        {usuario.avatar && (
                                            <img src={usuario.avatar} alt={usuario.nombre} className="usuario-avatar" />
                                        )}
                                        <div className="usuario-info">
                                            <h3>{usuario.nombre || 'Sin nombre'}</h3>
                                            <p><i className="fas fa-envelope"></i> {usuario.email}</p>
                                            {usuario.telefono && (
                                                <p><i className="fas fa-phone"></i> {usuario.telefono}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="usuario-roles">
                                        <div className="roles-badges">
                                            {obtenerRolesDisplay(usuario).length > 0 ? (
                                                obtenerRolesDisplay(usuario).map((rolDisplay, idx) => {
                                                    const roles = usuario.roles || [];
                                                    const roleName = typeof roles[idx] === 'string' ? roles[idx] : roles[idx]?.name;
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="role-badge"
                                                            style={{ backgroundColor: getRoleColor(roleName) }}
                                                        >
                                                            <i className={`fas ${getRoleIcon(roleName)}`}></i>
                                                            {rolDisplay}
                                                        </span>
                                                    );
                                                })
                                            ) : (
                                                <span className="role-badge" style={{ backgroundColor: getRoleColor(ROLES.CLIENTE) }}>
                                                    <i className={`fas ${getRoleIcon(ROLES.CLIENTE)}`}></i>
                                                    Cliente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {tieneRol(usuario, ROLES.ADMIN_PREDIOS) && usuario.prediosAsignados && usuario.prediosAsignados.length > 0 && (
                                        <div className="usuario-predios">
                                            <strong>Predios asignados:</strong>
                                            <ul>
                                                {usuario.prediosAsignados.map(predioId => {
                                                    const predio = predios.find(p => p.id === predioId);
                                                    return (
                                                        <li key={predioId}>
                                                            {predio ? `${predio.nombre} - ${predio.ciudad}` : predioId}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="usuario-actions">
                                        <button
                                            onClick={() => handleEditar(usuario)}
                                            className="btn-editar"
                                            disabled={usuario.id === currentUser?.id && tieneRol(currentUser, ROLES.ADMIN)}
                                        >
                                            <i className="fas fa-edit"></i> Editar Roles
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {editando && (
                <div className="modal-overlay" onClick={() => setEditando(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar Roles de {editando.nombre || editando.email}</h2>
                            <button className="btn-cerrar" onClick={() => setEditando(null)}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="roles-form">
                            <div className="form-group">
                                <label className="form-label-with-icon">
                                    <i className="fas fa-user-tag"></i>
                                    Selecciona los Roles
                                </label>
                                <p className="form-description">Puedes asignar múltiples roles a un usuario</p>
                                <div className="roles-grid">
                                    <div
                                        className={`role-card ${formData.roles.includes(ROLES.CLIENTE) ? 'selected' : ''}`}
                                        onClick={() => handleRolChange(ROLES.CLIENTE, !formData.roles.includes(ROLES.CLIENTE))}
                                    >
                                        <div className="role-card-header">
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(ROLES.CLIENTE)}
                                                onChange={(e) => handleRolChange(ROLES.CLIENTE, e.target.checked)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <i className={`fas ${getRoleIcon(ROLES.CLIENTE)}`} style={{ color: getRoleColor(ROLES.CLIENTE) }}></i>
                                            <span className="role-name">{ROLES_DISPLAY[ROLES.CLIENTE]}</span>
                                        </div>
                                        <p className="role-description">Usuario estándar del sistema. Puede crear partidos y gestionar sus propios eventos.</p>
                                    </div>
                                    
                                    <div
                                        className={`role-card ${formData.roles.includes(ROLES.ADMIN_PREDIOS) ? 'selected' : ''}`}
                                        onClick={() => handleRolChange(ROLES.ADMIN_PREDIOS, !formData.roles.includes(ROLES.ADMIN_PREDIOS))}
                                    >
                                        <div className="role-card-header">
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(ROLES.ADMIN_PREDIOS)}
                                                onChange={(e) => handleRolChange(ROLES.ADMIN_PREDIOS, e.target.checked)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <i className={`fas ${getRoleIcon(ROLES.ADMIN_PREDIOS)}`} style={{ color: getRoleColor(ROLES.ADMIN_PREDIOS) }}></i>
                                            <span className="role-name">{ROLES_DISPLAY[ROLES.ADMIN_PREDIOS]}</span>
                                        </div>
                                        <p className="role-description">Puede gestionar predios específicos asignados. Ideal para administradores de sedes.</p>
                                    </div>
                                    
                                    <div
                                        className={`role-card ${formData.roles.includes(ROLES.ADMIN) ? 'selected' : ''} ${editando.id === currentUser?.id ? 'disabled' : ''}`}
                                        onClick={() => !(editando.id === currentUser?.id) && handleRolChange(ROLES.ADMIN, !formData.roles.includes(ROLES.ADMIN))}
                                    >
                                        <div className="role-card-header">
                                            <input
                                                type="checkbox"
                                                checked={formData.roles.includes(ROLES.ADMIN)}
                                                onChange={(e) => handleRolChange(ROLES.ADMIN, e.target.checked)}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={editando.id === currentUser?.id}
                                            />
                                            <i className={`fas ${getRoleIcon(ROLES.ADMIN)}`} style={{ color: getRoleColor(ROLES.ADMIN) }}></i>
                                            <span className="role-name">{ROLES_DISPLAY[ROLES.ADMIN]}</span>
                                        </div>
                                        <p className="role-description">Acceso completo al sistema. Puede gestionar usuarios, predios, precios y todas las configuraciones.</p>
                                        {editando.id === currentUser?.id && (
                                            <div className="role-warning">
                                                <i className="fas fa-exclamation-triangle"></i>
                                                <small>No puedes cambiar tu propio rol de administrador</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {formData.roles.includes(ROLES.ADMIN_PREDIOS) && (
                                <div className="form-group predios-group">
                                    <label className="form-label-with-icon">
                                        <i className="fas fa-map-marker-alt"></i>
                                        Predios Asignados
                                    </label>
                                    <p className="form-description">Selecciona los predios que este administrador podrá gestionar</p>
                                    {predios.length === 0 ? (
                                        <div className="no-predios-message">
                                            <i className="fas fa-info-circle"></i>
                                            <p>No hay predios disponibles. Crea predios primero desde la sección "Gestionar Predios".</p>
                                        </div>
                                    ) : (
                                        <div className="predios-grid">
                                            {predios.map(predio => (
                                                <div
                                                    key={predio.id}
                                                    className={`predio-card ${formData.prediosAsignados.includes(predio.id) ? 'selected' : ''}`}
                                                    onClick={() => handlePredioChange(predio.id, !formData.prediosAsignados.includes(predio.id))}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.prediosAsignados.includes(predio.id)}
                                                        onChange={(e) => handlePredioChange(predio.id, e.target.checked)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="predio-info">
                                                        <strong>{predio.nombre}</strong>
                                                        <span className="predio-location">
                                                            <i className="fas fa-map-marker-alt"></i>
                                                            {predio.ciudad}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setEditando(null)}
                                    className="btn-cancelar"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-guardar"
                                    disabled={loading || formData.roles.length === 0}
                                >
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsuarios;

