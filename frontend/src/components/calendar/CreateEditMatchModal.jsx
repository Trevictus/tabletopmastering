import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MdSave, MdClose } from 'react-icons/md';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import gameService from '../../services/gameService';
import groupService from '../../services/groupService';
import { useAuth } from '../../context/AuthContext';
import styles from './CreateEditMatchModal.module.css';

/**
 * Modal for creating or editing a match
 */
const CreateEditMatchModal = ({ isOpen, onClose, onSave, match = null }) => {
  const { user } = useAuth();
  const isEditing = Boolean(match);

  // Form state
  const [formData, setFormData] = useState({
    gameId: '',
    groupId: '',
    scheduledDate: '',
    scheduledTime: '18:00',
    location: '',
    notes: '',
    playerIds: []
  });

  const [games, setGames] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load groups - memoized
  const loadGroups = useCallback(async () => {
    try {
      const response = await groupService.getMyGroups();
      setGroups(response.data || []);
    } catch (err) {
      console.error('Error loading groups:', err);
      setErrors(prev => ({ ...prev, groups: 'Failed to load groups' }));
    }
  }, []);

  // Load games - memoized
  const loadGames = useCallback(async (groupId = null) => {
    try {
      const params = groupId ? { groupId } : {};
      const response = await gameService.getGames(params);
      setGames(response.data || []);
    } catch (_err) {
      setErrors(prev => ({ ...prev, games: 'Failed to load games' }));
    }
  }, []);

  // Load group members - memoized
  const loadGroupMembers = useCallback(async (groupId) => {
    try {
      const response = await groupService.getGroupMembers(groupId);
      // Response has structure { success, count, data: [...members] }
      // where data is directly the array of members
      setGroupMembers(response.data || []);
    } catch (err) {
      console.error('Error loading members:', err);
      setErrors(prev => ({ ...prev, members: 'Failed to load members' }));
    }
  }, []);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadGroups();
      loadGames();
    }
  }, [isOpen, loadGroups, loadGames]);

  // Load games for the selected group
  useEffect(() => {
    if (formData.groupId) {
      loadGames(formData.groupId);
      loadGroupMembers(formData.groupId);
    }
  }, [formData.groupId, loadGames, loadGroupMembers]);

  // Prefill form if editing or reset
  useEffect(() => {
    if (match && isOpen) {
      const matchDate = new Date(match.scheduledDate);
      setFormData({
        gameId: match.game?._id || '',
        groupId: match.group?._id || '',
        scheduledDate: matchDate.toISOString().split('T')[0],
        scheduledTime: matchDate.toTimeString().slice(0, 5),
        location: match.location || '',
        notes: match.notes || '',
        playerIds: match.players?.map(p => p.user?._id || p.user) || []
      });
      setErrors({});
    } else if (!match && isOpen) {
      // Resetear formulario con la fecha de hoy
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      setFormData({
        gameId: '',
        groupId: '',
        scheduledDate: dateStr,
        scheduledTime: '18:00',
        location: '',
        notes: '',
        playerIds: []
      });
      setErrors({});
    }
  }, [match, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePlayerToggle = (userId) => {
    setFormData(prev => {
      const isSelected = prev.playerIds.includes(userId);
      return {
        ...prev,
        playerIds: isSelected
          ? prev.playerIds.filter(id => id !== userId)
          : [...prev.playerIds, userId]
      };
    });
  };

  const handleSubmit = async () => {
    // Validate form
    const newErrors = {};

    if (!formData.groupId) {
      newErrors.groupId = 'Debes seleccionar un grupo';
    }

    if (!formData.gameId) {
      newErrors.gameId = 'Debes seleccionar un juego';
    }

    if (!formData.scheduledDate) {
      newErrors.scheduledDate = 'La fecha es obligatoria';
    }

    // Ensure current user is included in players
    const userIdStr = user?._id?.toString();
    let finalPlayerIds = [...formData.playerIds];
    if (userIdStr && !finalPlayerIds.includes(userIdStr)) {
      finalPlayerIds.push(userIdStr);
    }

    // Validate at least 2 players (including current user)
    if (finalPlayerIds.length < 2) {
      newErrors.playerIds = 'Debes seleccionar al menos 1 jugador adicional (tú ya estás incluido)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({}); // Clear previous errors

    try {
      // Combine date and time
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

      const matchData = {
        gameId: formData.gameId,
        groupId: formData.groupId,
        scheduledDate: scheduledDateTime.toISOString(),
        location: formData.location,
        notes: formData.notes,
        playerIds: finalPlayerIds
      };

      await onSave(matchData, match?._id);
      
      // Only close if there's no error
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al guardar la partida';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const footer = (
    <>
      <Button variant="outline" onClick={onClose} disabled={loading}>
        <MdClose /> Cancelar
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSubmit} 
        disabled={loading}
        type="button"
      >
        <MdSave /> {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Partida'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Partida' : 'Nueva Partida'}
      footer={footer}
      size="medium"
      closeOnBackdrop={false}
    >
      <div className={styles.form}>
        {/* Grupo */}
        <div className={styles.formGroup}>
          <label htmlFor="groupId">Grupo *</label>
          <select
            id="groupId"
            name="groupId"
            value={formData.groupId}
            onChange={handleChange}
            className={styles.select}
            disabled={isEditing}
          >
            <option value="">Selecciona un grupo</option>
            {groups.map(group => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
          {errors.groupId && <span className={styles.error}>{errors.groupId}</span>}
        </div>

        {/* Juego */}
        <div className={styles.formGroup}>
          <label htmlFor="gameId">Juego *</label>
          <select
            id="gameId"
            name="gameId"
            value={formData.gameId}
            onChange={handleChange}
            className={styles.select}
            disabled={!formData.groupId}
          >
            <option value="">Selecciona un juego</option>
            {games.map(game => (
              <option key={game._id} value={game._id}>
                {game.name}
              </option>
            ))}
          </select>
          {errors.gameId && <span className={styles.error}>{errors.gameId}</span>}
        </div>

        {/* Fecha y hora */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="scheduledDate">Fecha *</label>
            <Input
              id="scheduledDate"
              name="scheduledDate"
              type="date"
              value={formData.scheduledDate}
              onChange={handleChange}
              error={errors.scheduledDate}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scheduledTime">Hora *</label>
            <Input
              id="scheduledTime"
              name="scheduledTime"
              type="time"
              value={formData.scheduledTime}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Ubicación */}
        <div className={styles.formGroup}>
          <label htmlFor="location">Ubicación</label>
          <Input
            id="location"
            name="location"
            type="text"
            placeholder="Casa de Juan, Café El Dado, etc."
            value={formData.location}
            onChange={handleChange}
            maxLength={200}
          />
        </div>

        {/* Jugadores */}
        {formData.groupId && groupMembers.length > 0 && (
          <div className={styles.formGroup}>
            <label>Jugadores Invitados * (mínimo 1 adicional, tú ya estás incluido)</label>
            <div className={styles.playersList}>
              {groupMembers.map(member => {
                const userId = member.user?._id || member.user;
                const userName = member.user?.name || member.user?.email || 'Usuario';
                const isSelected = formData.playerIds.includes(userId);
                
                return (
                  <label key={userId} className={styles.playerCheckbox}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePlayerToggle(userId)}
                    />
                    <span>{userName}</span>
                    {userId === user?._id && <span className={styles.youBadge}>(Tú - incluido automáticamente)</span>}
                  </label>
                );
              })}
            </div>
            {errors.playerIds && <span className={styles.error}>{errors.playerIds}</span>}
          </div>
        )}

        {/* Notas */}
        <div className={styles.formGroup}>
          <label htmlFor="notes">Notas</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Observaciones, reglas especiales, etc."
            className={styles.textarea}
            maxLength={1000}
            rows={3}
          />
          <small className={styles.charCount}>
            {formData.notes.length}/1000 caracteres
          </small>
        </div>

        {errors.submit && (
          <div className={styles.submitError}>{errors.submit}</div>
        )}
      </div>
    </Modal>
  );
};

CreateEditMatchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  match: PropTypes.object
};

export default CreateEditMatchModal;
