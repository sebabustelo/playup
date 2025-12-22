import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context';

const RutasProtegidas = ({ children, isAuthenticated, roles = [] }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div style={{ padding: 20, textAlign: 'center' }}>Cargando...</div>;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    if (roles.length > 0) {
        const userRoles = user.roleNames || [];
        const hasRole = roles.some(role => userRoles.includes(role));
        
        if (!hasRole) {
            return <Navigate to="/" replace />;
        }
    }

    return children;
};

export default RutasProtegidas;




