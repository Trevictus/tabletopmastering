import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../../context/GroupContext';
import { useAuth } from '../../context/AuthContext';
import { MdArrowBack, MdInfo } from 'react-icons/md';
import { GiTeamIdea } from 'react-icons/gi';
import { FaUserCircle } from 'react-icons/fa';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import styles from './CreateGroup.module.css';
import groupService from '../../services/groupService';

// Maximum groups per user limit
const MAX_GROUPS = 7;

/**
 * Page to create a new group
 */
const CreateGroup = () => {
  const navigate = useNavigate();
  const { groups, loadGroups } = useGroup();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Check group limit on load
  useEffect(() => {
    if (groups.length >= MAX_GROUPS) {
      navigate('/groups', { 
        state: { message: `Has alcanzado el límite de ${MAX_GROUPS} grupos` } 
      });
    }
  }, [groups.length, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.name.trim()) {
        throw new Error('El nombre del grupo es requerido');
      }

      const response = await groupService.createGroup({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      // Reload groups
      await loadGroups();

      // Navigate to the newly created group or to the groups list
      const groupId = response.data?._id || response.data?.id;
      if (groupId) {
        navigate(`/groups/${groupId}`);
      } else {
        navigate('/groups', {
          state: { message: `✅ Grupo "${formData.name}" creado exitosamente` }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al crear el grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.createGroupPage}>
      {/* Header */}
      <div className={styles.header}>
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className={styles.backButton}
        >
          <MdArrowBack /> Atrás
        </Button>
        <div className={styles.headerContent}>
          <GiTeamIdea className={styles.headerIcon} />
          <h1>Crear Nuevo Grupo</h1>
        </div>
      </div>

      {/* Formulario */}
      <Card variant="elevated" className={styles.formCard}>
        {/* Indicador del usuario que crea el grupo */}
        <div className={styles.creatorInfo}>
          <MdInfo className={styles.infoIcon} />
          <span>Creando como: </span>
          <strong>{user?.name || 'Usuario'}</strong>
          <span className={styles.creatorNote}>(Serás el administrador)</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Error */}
          {error && (
            <div className={styles.error}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Nombre */}
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>
              Nombre del Grupo *
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Ej: Los Conquistadores del Multiuso"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              required
            />
            <p className={styles.hint}>
              Elige un nombre descriptivo para tu grupo
            </p>
          </div>

          {/* Descripción */}
          <div className={styles.formGroup}>
            <label htmlFor="description" className={styles.label}>
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe el propósito o tema de tu grupo (opcional)"
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
              className={styles.textarea}
              rows="4"
            />
            <p className={styles.hint}>
              Máximo 500 caracteres
            </p>
          </div>

          {/* Botones */}
          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Grupo'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Info */}
      <Card variant="bordered" className={styles.infoCard}>
        <div className={styles.infoContent}>
          <h3>💡 Información Importante</h3>
          <ul className={styles.infoList}>
            <li>Serás el administrador del grupo automáticamente</li>
            <li>Podrás invitar a otros jugadores al grupo</li>
            <li>Podrás registrar partidas y ver estadísticas del grupo</li>
            <li>El nombre del grupo debe ser único</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default CreateGroup;
