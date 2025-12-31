import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context';
import { useToast } from '@/context';
import './Auth.css';

const Registrarse = () => {
    const { register, loginWithGoogle, loginWithFacebook } = useAuth();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        confirmPassword: ''
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
        
        if (formData.password !== formData.confirmPassword) {
            addToast('Las contraseñas no coinciden', 'error');
            return;
        }

        if (formData.password.length < 6) {
            addToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        setLoading(true);
        const resultado = await register(formData.email, formData.password, formData.nombre);
        if (resultado.success) {
            addToast('Registro exitoso', 'success');
            navigate('/');
        } else {
            addToast(resultado.error || 'Error al registrarse', 'error');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const resultado = await loginWithGoogle();
            if (resultado.success) {
                addToast('Registro con Google exitoso', 'success');
                navigate('/');
            } else {
                // Manejar errores específicos
                let errorMessage = 'Error al registrarse con Google';
                if (resultado.error) {
                    if (resultado.error.includes('popup-closed-by-user')) {
                        errorMessage = 'Registro cancelado';
                    } else if (resultado.error.includes('auth/account-exists-with-different-credential')) {
                        errorMessage = 'Ya existe una cuenta con este email. Inicia sesión en su lugar';
                    } else if (resultado.error.includes('auth/popup-blocked')) {
                        errorMessage = 'El popup fue bloqueado. Por favor, permite popups para este sitio';
                    } else {
                        errorMessage = resultado.error;
                    }
                }
                addToast(errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error en registro con Google:', error);
            addToast('Error inesperado al registrarse con Google', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        setLoading(true);
        const resultado = await loginWithFacebook();
        if (resultado.success) {
            addToast('Registro con Facebook exitoso', 'success');
            navigate('/');
        } else {
            addToast(resultado.error || 'Error al registrarse', 'error');
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Registrarse</h1>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>
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
                            minLength={6}
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
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
                    ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default Registrarse;




