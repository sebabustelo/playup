import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import './Auth.css';

const IniciarSesion = () => {
    const { login, loginWithGoogle, loginWithFacebook } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const resultado = await login(formData.email, formData.password);
        if (resultado.success) {
            addToast('Sesión iniciada correctamente', 'success');
            navigate('/');
        } else {
            addToast(resultado.error || 'Error al iniciar sesión', 'error');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const resultado = await loginWithGoogle();
            if (resultado.success) {
                addToast('Sesión iniciada con Google exitosamente', 'success');
                navigate('/');
            } else {
                // Manejar errores específicos
                let errorMessage = 'Error al iniciar sesión con Google';
                if (resultado.error) {
                    if (resultado.error.includes('popup-closed-by-user')) {
                        errorMessage = 'Inicio de sesión cancelado';
                    } else if (resultado.error.includes('auth/account-exists-with-different-credential')) {
                        errorMessage = 'Ya existe una cuenta con este email usando otro método de inicio de sesión';
                    } else if (resultado.error.includes('auth/popup-blocked')) {
                        errorMessage = 'El popup fue bloqueado. Por favor, permite popups para este sitio';
                    } else {
                        errorMessage = resultado.error;
                    }
                }
                addToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error en login con Google:', error);
            addToast('Error inesperado al iniciar sesión con Google', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setLoading(true);
        const resultado = await loginWithFacebook();
        if (resultado.success) {
            addToast('Sesión iniciada con Facebook', 'success');
            navigate('/');
        } else {
            addToast(resultado.error || 'Error al iniciar sesión', 'error');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Iniciar Sesión</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="divider">
                    <span>O</span>
                </div>

                <div className="social-buttons">
                    <button onClick={handleGoogleLogin} className="btn-google" disabled={loading}>
                        <i className="fab fa-google"></i> Google
                    </button>
                    <button onClick={handleFacebookLogin} className="btn-facebook" disabled={loading}>
                        <i className="fab fa-facebook"></i> Facebook
                    </button>
                </div>

                <p className="auth-link">
                    ¿No tienes cuenta? <Link to="/registrarse">Regístrate aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default IniciarSesion;




