import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { 
  MdSave, 
  MdClose, 
  MdTimer,
  MdNotes,
  MdEmojiEvents
} from 'react-icons/md';
import { GiPodium, GiTrophy } from 'react-icons/gi';
import Modal from '../common/Modal';
import Button from '../common/Button';
import styles from './RegisterResultsModal.module.css';

/**
 * Modal para registrar resultados de una partida finalizada
 * Solo muestra jugadores que confirmaron asistencia
 */
const RegisterResultsModal = ({ 
  isOpen, 
  onClose, 
  match, 
  onSave 
}) => {
  // Form state
  const [playerResults, setPlayerResults] = useState([]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Initialize player results when modal opens
  useEffect(() => {
    if (match && isOpen) {
      // Only include players who confirmed attendance
      const confirmedPlayers = match.players?.filter(p => p.confirmed) || [];
      
      const initialResults = confirmedPlayers.map(player => ({
        userId: player.user?._id || player.user,
        name: player.user?.name || player.user?.email || 'Jugador',
        position: null,
        score: ''
      }));
      
      setPlayerResults(initialResults);
      setDuration(match.duration?.value?.toString() || '');
      setNotes(match.notes || '');
      setErrors({});
    }
  }, [match, isOpen]);

  // Handle position change
  const handlePositionChange = (userId, position) => {
    setPlayerResults(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, position: position ? parseInt(position) : null }
          : p
      )
    );
    // Clear error if exists
    if (errors.positions) {
      setErrors(prev => ({ ...prev, positions: '' }));
    }
  };

  // Handle score change (optional)
  const handleScoreChange = (userId, score) => {
    setPlayerResults(prev => 
      prev.map(p => 
        p.userId === userId 
          ? { ...p, score }
          : p
      )
    );
  };

  // Format duration to show hours/minutes
  const formatDurationDisplay = (minutes) => {
    if (!minutes || isNaN(minutes)) return '';
    const mins = parseInt(minutes);
    if (mins < 60) return `${mins} minutos`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 
      ? `${hours}h ${remainingMins}min` 
      : `${hours} hora${hours > 1 ? 's' : ''}`;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Check that all have assigned position
    const playersWithPosition = playerResults.filter(p => p.position !== null);
    if (playersWithPosition.length === 0) {
      newErrors.positions = 'Debes asignar al menos una posición';
    }

    // Check that no positions are empty for any player
    const playersWithoutPosition = playerResults.filter(p => p.position === null);
    if (playersWithoutPosition.length > 0 && playersWithPosition.length > 0) {
      newErrors.positions = 'Todos los jugadores deben tener una posición asignada';
    }

    // Validate duration if provided
    if (duration && (isNaN(duration) || parseInt(duration) < 1)) {
      newErrors.duration = 'La duración debe ser un número positivo';
    }

    if (duration && parseInt(duration) > 1440) {
      newErrors.duration = 'La duración máxima es 24 horas (1440 minutos)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit results
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Determine winner (position 1)
      const winner = playerResults.find(p => p.position === 1);
      
      // Prepare data to send
      const resultData = {
        winnerId: winner?.userId || null,
        results: playerResults.map(p => ({
          userId: p.userId,
          position: p.position,
          score: p.score ? parseInt(p.score) : 0
        })),
        duration: duration ? {
          value: parseInt(duration),
          unit: 'minutos'
        } : null,
        notes: notes.trim() || undefined
      };

      await onSave(match._id, resultData);
    } catch (error) {
      console.error('Error saving results:', error);
      setErrors({ submit: error.message || 'Error al guardar los resultados' });
    } finally {
      setLoading(false);
    }
  };

  if (!match) return null;

  // Obtener posiciones disponibles (1 hasta número de jugadores)
  const availablePositions = Array.from(
    { length: playerResults.length }, 
    (_, i) => i + 1
  );

  const footer = (
    <div className={styles.footerActions}>
      <Button variant="outline" onClick={onClose} disabled={loading}>
        <MdClose /> Cancelar
      </Button>
      <Button variant="primary" onClick={handleSubmit} disabled={loading}>
        <MdSave /> {loading ? 'Guardando...' : 'Guardar Resultados'}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Resultados"
      footer={footer}
      size="medium"
      closeOnBackdrop={false}
    >
      <div className={styles.content}>
        {/* Información del juego */}
        <div className={styles.gameHeader}>
          <div className={styles.gameInfo}>
            {match.game?.image ? (
              <img 
                src={match.game.image} 
                alt={match.game.name} 
                className={styles.gameImage}
              />
            ) : (
              <div className={styles.gameImagePlaceholder}>
                <GiTrophy />
              </div>
            )}
            <div>
              <h3 className={styles.gameName}>{match.game?.name || 'Partida'}</h3>
              <p className={styles.gameDate}>
                {new Date(match.scheduledDate).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Sección de posiciones */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <GiPodium className={styles.sectionIcon} />
            Posiciones Finales
          </h4>
          <p className={styles.sectionHint}>
            Asigna la posición final de cada jugador (1º = Ganador)
          </p>

          <div className={styles.playersList}>
            {playerResults.map((player) => (
              <div key={player.userId} className={styles.playerRow}>
                <div className={styles.playerInfo}>
                  <div className={styles.playerAvatar}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={styles.playerName}>{player.name}</span>
                </div>

                <div className={styles.playerInputs}>
                  <div className={styles.positionSelect}>
                    <label className={styles.inputLabel}>Posición</label>
                    <select
                      value={player.position || ''}
                      onChange={(e) => handlePositionChange(player.userId, e.target.value)}
                      className={`${styles.select} ${player.position === 1 ? styles.winner : ''}`}
                    >
                      <option value="">--</option>
                      {availablePositions.map(pos => (
                        <option key={pos} value={pos}>
                          {pos}º {pos === 1 && '🏆'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.scoreInput}>
                    <label className={styles.inputLabel}>Puntos (opcional)</label>
                    <input
                      type="number"
                      value={player.score}
                      onChange={(e) => handleScoreChange(player.userId, e.target.value)}
                      placeholder="0"
                      className={styles.input}
                      min="0"
                    />
                  </div>
                </div>

                {player.position === 1 && (
                  <div className={styles.winnerBadge}>
                    <MdEmojiEvents /> Ganador
                  </div>
                )}
              </div>
            ))}
          </div>

          {errors.positions && (
            <div className={styles.error}>
              <span>⚠️ {errors.positions}</span>
            </div>
          )}
        </div>

        {/* Duración */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <MdTimer className={styles.sectionIcon} />
            Duración (opcional)
          </h4>
          
          <div className={styles.durationInput}>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duración en minutos"
              className={styles.input}
              min="1"
              max="1440"
            />
            <span className={styles.durationHint}>
              {formatDurationDisplay(duration)}
            </span>
          </div>

          {errors.duration && (
            <div className={styles.error}>
              <span>⚠️ {errors.duration}</span>
            </div>
          )}
        </div>

        {/* Notas */}
        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>
            <MdNotes className={styles.sectionIcon} />
            Notas (opcional)
          </h4>
          
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade comentarios sobre la partida..."
            className={styles.textarea}
            maxLength={1000}
            rows={3}
          />
          <span className={styles.charCount}>{notes.length}/1000</span>
        </div>

        {/* Error general */}
        {errors.submit && (
          <div className={styles.errorGeneral}>
            <span>❌ {errors.submit}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};

RegisterResultsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  match: PropTypes.object,
  onSave: PropTypes.func.isRequired
};

export default RegisterResultsModal;
