import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  MdCheckCircle, 
  MdError, 
  MdWarning, 
  MdInfo, 
  MdClose 
} from 'react-icons/md';
import { ToastTypes } from '../../../context/ToastContext';
import styles from './Toast.module.css';

/**
 * Individual Toast component
 * Displays a notification with entry and exit animation
 */
const Toast = ({ id, type, title, message, action, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Exit animation duration
  }, [id, onClose]);

  // Auto-remove on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  // Icons by type
  const icons = {
    [ToastTypes.SUCCESS]: <MdCheckCircle className={styles.icon} />,
    [ToastTypes.ERROR]: <MdError className={styles.icon} />,
    [ToastTypes.WARNING]: <MdWarning className={styles.icon} />,
    [ToastTypes.INFO]: <MdInfo className={styles.icon} />,
  };

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exiting : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className={styles.iconContainer}>
        {icons[type]}
      </div>

      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {message && <div className={styles.message}>{message}</div>}
        {action && (
          <button 
            className={styles.actionButton}
            onClick={action.onClick}
          >
            {action.label}
          </button>
        )}
      </div>

      <button 
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Cerrar notificación"
      >
        <MdClose />
      </button>
    </div>
  );
};

Toast.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  type: PropTypes.oneOf(Object.values(ToastTypes)).isRequired,
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  action: PropTypes.shape({
    label: PropTypes.string.isRequired,
    onClick: PropTypes.func.isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};

export default Toast;
