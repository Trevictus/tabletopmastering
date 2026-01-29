import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { MdPerson, MdLock } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import styles from './Login.module.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const toast = useToast();

  const from = location.state?.from || '/home';

  // Close modal when clicking outside the form
  const handleOverlayClick = (e) => {
    // Only close if click was directly on overlay, not on the form
    if (e.target === e.currentTarget) {
      navigate('/');
    }
  };

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState({
    identifier: '',
    password: ''
  });

  const [touched, setTouched] = useState({
    identifier: false,
    password: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Identifier validation (email or player name)
  const validateIdentifier = (identifier) => {
    if (!identifier.trim()) {
      return 'El email o nombre de jugador es obligatorio';
    }
    if (identifier.trim().length < 3) {
      return 'Debe tener al menos 3 caracteres';
    }
    return '';
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'La contraseña es obligatoria';
    }
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: fieldValue
    }));

    // Clear server error when typing
    if (serverError) {
      setServerError('');
    }

    // Validate in real-time if field was already touched
    if (touched[name]) {
      if (name === 'identifier') {
        setErrors((prev) => ({ ...prev, identifier: validateIdentifier(value) }));
      } else if (name === 'password') {
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
      }
    }
  };

  // Handle blur
  const handleBlur = (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    // Validate the field
    if (name === 'identifier') {
      setErrors((prev) => ({ ...prev, identifier: validateIdentifier(value) }));
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      identifier: true,
      password: true
    });

    // Validate all fields
    const identifierError = validateIdentifier(formData.identifier);
    const passwordError = validatePassword(formData.password);

    setErrors({
      identifier: identifierError,
      password: passwordError
    });

    // If there are errors, don't submit the form
    if (identifierError || passwordError) {
      return;
    }

    // Send data to server
    setIsLoading(true);
    setServerError('');

    try {
      const { identifier, password } = formData;
      await login({ identifier, password });
      
      toast.success('¡Bienvenido de nuevo!', {
        action: {
          label: 'Ir al Inicio',
          onClick: () => navigate(from, { replace: true })
        }
      });
      
      navigate(from, { replace: true });
    } catch (error) {
      // Show error toast
      toast.error(
        error.response?.data?.message || 'Email o contraseña incorrectos',
        { title: 'Error de autenticación' }
      );
      
      // Handle server errors
      if (error.response?.data?.message) {
        setServerError(error.response.data.message);
      } else if (error.message) {
        setServerError(error.message);
      } else {
        setServerError('Ha ocurrido un error. Por favor, intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginPage} onClick={handleOverlayClick}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <GiPerspectiveDiceSixFacesRandom className={styles.icon} />
            <h1 className={styles.title}>Iniciar Sesión</h1>
            <p className={styles.subtitle}>
              Accede a tu cuenta de Tabletop Mastering
            </p>
          </div>

          {/* Error del servidor */}
          {serverError && (
            <div className={styles.serverError}>
              <span>⚠️</span>
              <span>{serverError}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
              label="Email o Nombre de jugador"
              type="text"
              name="identifier"
              value={formData.identifier}
              placeholder="tu@email.com o nombre_jugador"
              error={touched.identifier ? errors.identifier : ''}
              required
              icon={<MdPerson size={18} />}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="username"
              disabled={isLoading}
            />

            <Input
              label="Contraseña"
              type="password"
              name="password"
              value={formData.password}
              placeholder="••••••••"
              error={touched.password ? errors.password : ''}
              helpText={!touched.password && !errors.password ? 'Mínimo 8 caracteres' : ''}
              required
              icon={<MdLock size={18} />}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="current-password"
              disabled={isLoading}
            />

            <div className={styles.rememberMe}>
              <input
                type="checkbox"
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                className={styles.checkbox}
              />
              <label htmlFor="rememberMe" className={styles.checkboxLabel}>
                Recordarme en este dispositivo
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>o</span>
          </div>

          {/* Link a registro */}
          <div className={styles.registerLink}>
            <p className={styles.registerText}>
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className={styles.link}>
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
