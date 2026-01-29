import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiCamera, FiSave, FiUser, FiMail, FiAlertCircle, FiAtSign } from 'react-icons/fi';
import { FaUserCircle } from 'react-icons/fa';
import Modal from './Modal';
import Button from './Button';
import { isValidAvatar } from '../../utils/validators';
import authService from '../../services/authService';
import styles from './EditProfileModal.module.css';

const compressImage = (file, maxSize = 400, quality = 0.8) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = (e) => {
    const img = new Image();
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
      } else {
        if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  };
  reader.onerror = reject;
});

/**
 * Modal para editar perfil de usuario
 */
const EditProfileModal = ({ isOpen, onClose, user, onSave }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [nicknameSuggestions, setNicknameSuggestions] = useState([]);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [nicknameAvailable, setNicknameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [formData, setFormData] = useState({
    nickname: '',
    name: '',
    email: '',
    avatar: ''
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        nickname: user.nickname || '',
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || ''
      });
      setErrors({});
      setNicknameSuggestions([]);
      setNicknameAvailable(null);
      setEmailAvailable(null);
    }
  }, [user, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear field error when typing and reset availability
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    if (name === 'nickname') {
      setNicknameAvailable(null);
      setNicknameSuggestions([]);
    }
    if (name === 'email') {
      setEmailAvailable(null);
    }
  };

  const handleBlur = async (e) => {
    const { name, value } = e.target;
    
    if (name === 'nickname') {
      // Validación básica primero
      if (!value?.trim()) {
        setErrors(prev => ({ ...prev, nickname: 'El nombre de jugador es obligatorio' }));
        return;
      }
      if (value.trim().length < 3) {
        setErrors(prev => ({ ...prev, nickname: 'Mínimo 3 caracteres' }));
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(value.trim())) {
        setErrors(prev => ({ ...prev, nickname: 'Solo letras, números, guiones y _' }));
        return;
      }
      
      // Si es el mismo nickname que el original, no verificar
      if (value.trim().toLowerCase() === user?.nickname?.toLowerCase()) {
        setNicknameAvailable(true);
        return;
      }
      
      // Verificar disponibilidad
      setCheckingNickname(true);
      setNicknameAvailable(null);
      try {
        const result = await authService.checkNickname(value.trim());
        if (result.available) {
          setNicknameAvailable(true);
          setNicknameSuggestions([]);
        } else {
          setNicknameAvailable(false);
          setErrors(prev => ({ ...prev, nickname: 'Este nombre de jugador ya está en uso' }));
          setNicknameSuggestions(result.suggestions || []);
        }
      } catch {
        // Si falla, permitir continuar
        setNicknameAvailable(null);
      } finally {
        setCheckingNickname(false);
      }
    }
    
    if (name === 'email') {
      // Validación básica primero
      if (!value?.trim()) {
        setErrors(prev => ({ ...prev, email: 'El email es obligatorio' }));
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        setErrors(prev => ({ ...prev, email: 'Email inválido' }));
        return;
      }
      
      // Si es el mismo email que el original, no verificar
      if (value.trim().toLowerCase() === user?.email?.toLowerCase()) {
        setEmailAvailable(true);
        return;
      }
      
      // Verificar disponibilidad
      setCheckingEmail(true);
      setEmailAvailable(null);
      try {
        const result = await authService.checkEmail(value.trim());
        if (result.available) {
          setEmailAvailable(true);
        } else {
          setEmailAvailable(false);
          setErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
        }
      } catch {
        // Si falla, permitir continuar
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }
    
    if (name === 'name') {
      if (!value?.trim()) {
        setErrors(prev => ({ ...prev, name: 'El nombre es obligatorio' }));
      } else if (value.trim().length < 2) {
        setErrors(prev => ({ ...prev, name: 'Mínimo 2 caracteres' }));
      }
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    setFormData(prev => ({ ...prev, nickname: suggestion }));
    setNicknameSuggestions([]);
    setErrors(prev => ({ ...prev, nickname: null }));
    setNicknameAvailable(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setFormData(prev => ({ ...prev, avatar: compressed }));
      } catch {
        setErrors(prev => ({ ...prev, avatar: 'Error al procesar la imagen' }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nickname?.trim()) {
      newErrors.nickname = 'El nombre de jugador es obligatorio';
    } else if (formData.nickname.trim().length < 3) {
      newErrors.nickname = 'Mínimo 3 caracteres';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.nickname.trim())) {
      newErrors.nickname = 'Solo letras, números, guiones y _';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Mínimo 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formData.name.trim())) {
      newErrors.name = 'Solo letras y espacios';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[a-zA-Z0-9._-]+@(gmail|outlook|hotmail|yahoo|icloud|protonmail|live|msn)\.(com|es)$/i.test(formData.email.trim())) {
      newErrors.email = 'Usa un email válido (gmail, outlook, etc.)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    // No enviar si sabemos que nickname/email no están disponibles
    if (nicknameAvailable === false || emailAvailable === false) return;

    setLoading(true);
    setErrors({});
    setNicknameSuggestions([]);

    try {
      await onSave({
        nickname: formData.nickname.trim().toLowerCase(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        avatar: formData.avatar
      });
      onClose();
    } catch (error) {
      const errorData = error.response?.data;
      const message = errorData?.message || error.message || 'Error al guardar';
      
      if (message.toLowerCase().includes('nickname') || message.toLowerCase().includes('jugador')) {
        setErrors({ nickname: 'Este nombre de jugador ya está en uso' });
        // Si hay sugerencias, mostrarlas
        if (errorData?.suggestions && errorData.suggestions.length > 0) {
          setNicknameSuggestions(errorData.suggestions);
        }
      } else if (message.toLowerCase().includes('email') || message.toLowerCase().includes('correo')) {
        setErrors({ email: 'Este email ya está registrado' });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nickname: user?.nickname || '',
      name: user?.name || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Editar Perfil"
      size="small"
      className={styles.editProfileModal}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Avatar compacto */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
            {isValidAvatar(formData.avatar) ? (
              <img src={formData.avatar} alt="Avatar" className={styles.avatar} />
            ) : (
              <FaUserCircle className={styles.avatarIcon} />
            )}
            <div className={styles.avatarOverlay}><FiCamera /></div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
        </div>

        {errors.general && (
          <div className={styles.errorGeneral}><FiAlertCircle /> {errors.general}</div>
        )}

        {/* Campos en grid compacto */}
        <div className={styles.field}>
          <label htmlFor="nickname" className={styles.label}><FiAtSign /> Nombre de jugador</label>
          <input 
            type="text" 
            id="nickname" 
            name="nickname" 
            value={formData.nickname} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={`${styles.input} ${errors.nickname ? styles.inputError : ''} ${nicknameAvailable === true && !errors.nickname ? styles.inputSuccess : ''}`} 
            placeholder="nombre_jugador" 
            maxLength={20} 
          />
          {checkingNickname && <span className={styles.checking}>Verificando...</span>}
          {errors.nickname && <span className={styles.error}>{errors.nickname}</span>}
          {nicknameAvailable === true && !errors.nickname && !checkingNickname && <span className={styles.success}>✓ Disponible</span>}
          {nicknameSuggestions.length > 0 && (
            <div className={styles.suggestions}>
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

        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}><FiUser /> Nombre</label>
          <input 
            type="text" 
            id="name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`} 
            placeholder="Tu nombre" 
            maxLength={50} 
          />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}><FiMail /> Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            onBlur={handleBlur}
            className={`${styles.input} ${errors.email ? styles.inputError : ''} ${emailAvailable === true && !errors.email ? styles.inputSuccess : ''}`} 
            placeholder="tu@email.com" 
          />
          {checkingEmail && <span className={styles.checking}>Verificando...</span>}
          {errors.email && <span className={styles.error}>{errors.email}</span>}
          {emailAvailable === true && !errors.email && !checkingEmail && <span className={styles.success}>✓ Disponible</span>}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button type="button" variant="outline" size="small" onClick={handleCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" variant="primary" size="small" disabled={loading}>
            <FiSave /> {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

EditProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    nickname: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    avatar: PropTypes.string
  }),
  onSave: PropTypes.func.isRequired
};

export default EditProfileModal;
