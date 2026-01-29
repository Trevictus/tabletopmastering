import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import { MdEmail, MdLock, MdPerson, MdAlternateEmail } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import styles from './Register.module.css';

/**
 * Register Page
 * Account creation form with complete validation
 */
const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Close modal when clicking outside the form
  const handleOverlayClick = (e) => {
    // Only close if click was directly on overlay, not on the form
    if (e.target === e.currentTarget) {
      navigate('/');
    }
  };

  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  const [errors, setErrors] = useState({
    nickname: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: ''
  });

  const [touched, setTouched] = useState({
    nickname: false,
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
    acceptTerms: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [nicknameSuggestions, setNicknameSuggestions] = useState([]);
  const [nicknameAvailable, setNicknameAvailable] = useState(null); // null=not verified, true/false
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Player name validation
  const validateNickname = (nickname) => {
    if (!nickname.trim()) {
      return 'El nombre de jugador es obligatorio';
    }
    if (nickname.trim().length < 3) {
      return 'El nombre de jugador debe tener al menos 3 caracteres';
    }
    if (nickname.trim().length > 20) {
      return 'El nombre de jugador no puede exceder 20 caracteres';
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname.trim())) {
      return 'Solo letras, números, guiones y _';
    }
    return '';
  };

  // Name validation
  const validateName = (name) => {
    if (!name.trim()) {
      return 'El nombre es obligatorio';
    }
    if (name.trim().length < 2) {
      return 'El nombre debe tener al menos 2 caracteres';
    }
    if (name.trim().length > 50) {
      return 'El nombre no puede exceder 50 caracteres';
    }
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(name.trim())) {
      return 'Solo letras y espacios';
    }
    return '';
  };

  // Email validation
  const validateEmail = (email) => {
    // Only standard domains with .com or .es
    const emailRegex = /^[a-zA-Z0-9._-]+@(gmail|outlook|hotmail|yahoo|icloud|protonmail|live|msn)\.(com|es)$/i;
    if (!email.trim()) {
      return 'El email es obligatorio';
    }
    if (!emailRegex.test(email.trim())) {
      return 'Usa un email válido (gmail, outlook, etc.) con .com o .es';
    }
    return '';
  };

  // Password validation
  const validatePassword = (password) => {
    if (!password) {
      return 'La contraseña es obligatoria';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    // Additional recommendations (not mandatory)
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      // Only warn but don't block
      return '';
    }
    return '';
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) {
      return 'Debes confirmar tu contraseña';
    }
    if (confirmPassword !== password) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  };

  // Calculate password strength
  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    
    // Length
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    
    // Complexity
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    if (strength <= 2) {
      return { strength: 1, label: 'Débil', color: '#8b2e2e' };
    } else if (strength <= 4) {
      return { strength: 2, label: 'Media', color: '#d4af37' };
    } else {
      return { strength: 3, label: 'Fuerte', color: '#2d5016' };
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear server error when typing
    if (serverError) {
      setServerError('');
    }

    // Reset availability when typing
    if (name === 'nickname') {
      setNicknameAvailable(null);
      setNicknameSuggestions([]);
    }
    if (name === 'email') {
      setEmailAvailable(null);
    }

    // Validate in real-time if field was already touched
    if (touched[name]) {
      switch (name) {
        case 'nickname':
          setErrors((prev) => ({ ...prev, nickname: validateNickname(value) }));
          break;
        case 'name':
          setErrors((prev) => ({ ...prev, name: validateName(value) }));
          break;
        case 'email':
          setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
          break;
        case 'password':
          setErrors((prev) => ({ 
            ...prev, 
            password: validatePassword(value),
            confirmPassword: formData.confirmPassword 
              ? validateConfirmPassword(formData.confirmPassword, value)
              : ''
          }));
          break;
        case 'confirmPassword':
          setErrors((prev) => ({ 
            ...prev, 
            confirmPassword: validateConfirmPassword(value, formData.password) 
          }));
          break;
        default:
          break;
      }
    }
  };

  // Handle blur
  const handleBlur = async (e) => {
    const { name, value } = e.target;

    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    // Validate field
    switch (name) {
      case 'nickname': {
        const nicknameError = validateNickname(value);
        setErrors((prev) => ({ ...prev, nickname: nicknameError }));
        
        // If no format error, check availability
        if (!nicknameError && value.trim()) {
          setCheckingNickname(true);
          setNicknameAvailable(null);
          setNicknameSuggestions([]);
          try {
            const result = await authService.checkNickname(value.trim());
            if (result.available) {
              setNicknameAvailable(true);
              setNicknameSuggestions([]);
            } else {
              setNicknameAvailable(false);
              setErrors((prev) => ({ ...prev, nickname: 'Este nombre de jugador ya está en uso' }));
              setNicknameSuggestions(result.suggestions || []);
            }
          } catch {
            // If check fails, allow to continue
            setNicknameAvailable(null);
          } finally {
            setCheckingNickname(false);
          }
        }
        break;
      }
      case 'name':
        setErrors((prev) => ({ ...prev, name: validateName(value) }));
        break;
      case 'email': {
        const emailError = validateEmail(value);
        setErrors((prev) => ({ ...prev, email: emailError }));
        
        // If no format error, check availability
        if (!emailError && value.trim()) {
          setCheckingEmail(true);
          setEmailAvailable(null);
          try {
            const result = await authService.checkEmail(value.trim());
            if (result.available) {
              setEmailAvailable(true);
            } else {
              setEmailAvailable(false);
              setErrors((prev) => ({ ...prev, email: 'Este email ya está registrado' }));
            }
          } catch {
            // If check fails, allow to continue
            setEmailAvailable(null);
          } finally {
            setCheckingEmail(false);
          }
        }
        break;
      }
      case 'password':
        setErrors((prev) => ({ ...prev, password: validatePassword(value) }));
        break;
      case 'confirmPassword':
        setErrors((prev) => ({ 
          ...prev, 
          confirmPassword: validateConfirmPassword(value, formData.password) 
        }));
        break;
      default:
        break;
    }
  };

  // Select a nickname suggestion
  const handleSelectSuggestion = (suggestion) => {
    setFormData((prev) => ({ ...prev, nickname: suggestion }));
    setNicknameSuggestions([]);
    setErrors((prev) => ({ ...prev, nickname: '' }));
    setNicknameAvailable(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      nickname: true,
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true
    });

    // Validate all fields
    const nicknameError = validateNickname(formData.nickname);
    const nameError = validateName(formData.name);
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(
      formData.confirmPassword,
      formData.password
    );
    const acceptTermsError = !formData.acceptTerms ? 'Debes aceptar los términos' : '';

    setErrors({
      nickname: nicknameError,
      name: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      acceptTerms: acceptTermsError
    });

    // If there are errors, don't submit the form
    if (nicknameError || nameError || emailError || passwordError || confirmPasswordError || acceptTermsError) {
      return;
    }

    // If we know nickname or email is not available, don't submit
    if (nicknameAvailable === false || emailAvailable === false) {
      return;
    }

    // Send data to server
    setIsLoading(true);
    setServerError('');
    setNicknameSuggestions([]);

    try {
      const { nickname, name, email, password } = formData;
      const response = await register({ nickname, name, email, password });

      // Registration successful - user is already logged in the context
      if (response.data?.user) {
        navigate('/', { 
          state: { 
            message: `¡Bienvenido/a, ${response.data.user.name}! Tu cuenta ha sido creada exitosamente.` 
          } 
        });
      }
    } catch (error) {
      // Handle server errors
      const errorData = error.response?.data;
      if (errorData?.message) {
        setServerError(errorData.message);
        // If there are nickname suggestions, show them
        if (errorData.suggestions && errorData.suggestions.length > 0) {
          setNicknameSuggestions(errorData.suggestions);
        }
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
    <div className={styles.registerPage} onClick={handleOverlayClick}>
      <div className={styles.registerContainer}>
        <div className={styles.registerCard} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={styles.header}>
            <GiPerspectiveDiceSixFacesRandom className={styles.icon} />
            <h1 className={styles.title}>Crear Cuenta</h1>
            <p className={styles.subtitle}>
              Únete a la comunidad de Tabletop Mastering
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
            <div className={styles.fieldWithFeedback}>
              <Input
                label="Nombre de jugador"
                type="text"
                name="nickname"
                value={formData.nickname}
                placeholder="nombre_jugador"
                error={touched.nickname ? errors.nickname : ''}
                helpText={!touched.nickname ? 'Único. Solo letras, números y _' : (checkingNickname ? 'Verificando disponibilidad...' : (nicknameAvailable === true && !errors.nickname ? '✓ Disponible' : ''))}
                required
                icon={<MdAlternateEmail size={16} />}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="username"
                disabled={isLoading}
              />
              
              {/* Sugerencias de nickname debajo del campo */}
              {nicknameSuggestions.length > 0 && (
                <div className={styles.inlineSuggestions}>
                  <span className={styles.suggestionsLabel}>Prueba con:</span>
                  <div className={styles.suggestionsList}>
                    {nicknameSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        className={styles.suggestionBtn}
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Nombre Completo"
              type="text"
              name="name"
              value={formData.name}
              placeholder="Tu nombre"
              error={touched.name ? errors.name : ''}
              required
              icon={<MdPerson size={16} />}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="name"
              disabled={isLoading}
            />

            <Input
              label="Correo Electrónico"
              type="email"
              name="email"
              value={formData.email}
              placeholder="tu-email@ejemplo.com"
              error={touched.email ? errors.email : ''}
              helpText={checkingEmail ? 'Verificando disponibilidad...' : (emailAvailable === true && !errors.email ? '✓ Disponible' : '')}
              required
              icon={<MdEmail size={16} />}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="email"
              disabled={isLoading}
            />

            <div>
              <Input
                label="Contraseña"
                type="password"
                name="password"
                value={formData.password}
                placeholder="••••••••"
                error={touched.password ? errors.password : ''}
                required
                icon={<MdLock size={16} />}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="new-password"
                disabled={isLoading}
              />
              
              {/* Indicador de fortaleza de contraseña */}
              {formData.password && !errors.password && (
                <div className={styles.passwordStrength}>
                  <div className={styles.strengthBar}>
                    <div 
                      className={styles.strengthFill}
                      style={{ 
                        width: `${(passwordStrength.strength / 3) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  <span 
                    className={styles.strengthLabel}
                    style={{ color: passwordStrength.color }}
                  >
                    Seguridad: {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirmar Contraseña"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              placeholder="••••••••"
              error={touched.confirmPassword ? errors.confirmPassword : ''}
              required
              icon={<MdLock size={16} />}
              onChange={handleChange}
              onBlur={handleBlur}
              autoComplete="new-password"
              disabled={isLoading}
            />

            {/* Checkbox de términos */}
            <div className={styles.termsCheckbox}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }));
                    if (touched.acceptTerms) {
                      setErrors(prev => ({ ...prev, acceptTerms: e.target.checked ? '' : 'Debes aceptar los términos' }));
                    }
                  }}
                  onBlur={() => setTouched(prev => ({ ...prev, acceptTerms: true }))}
                  className={styles.checkbox}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>
                  Acepto los{' '}
                  <Link to="/terms" target="_blank" className={styles.termsLink}>Términos de Uso</Link>,{' '}
                  <Link to="/privacy" target="_blank" className={styles.termsLink}>Política de Privacidad</Link>{' '}y{' '}
                  <Link to="/cookies" target="_blank" className={styles.termsLink}>Política de Cookies</Link>
                </span>
              </label>
              {touched.acceptTerms && errors.acceptTerms && (
                <span className={styles.termsError}>{errors.acceptTerms}</span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              disabled={isLoading || !formData.acceptTerms}
              className={styles.submitButton}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <span className={styles.dividerText}>o</span>
          </div>

          {/* Link a login */}
          <div className={styles.loginLink}>
            <p className={styles.loginText}>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className={styles.link}>
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
