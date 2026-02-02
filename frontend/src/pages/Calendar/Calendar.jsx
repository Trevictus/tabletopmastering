import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MdAdd, MdCalendarToday } from 'react-icons/md';
import { GiSandsOfTime } from 'react-icons/gi';
import { FiClock, FiLayers } from 'react-icons/fi';
import CalendarGrid from '../../components/calendar/CalendarGrid';
import CreateEditMatchModal from '../../components/calendar/CreateEditMatchModal';
import MatchDetailsModal from '../../components/calendar/MatchDetailsModal';
import RegisterResultsModal from '../../components/calendar/RegisterResultsModal';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import matchService from '../../services/matchService';
import styles from './Calendar.module.css';

/**
 * Página de Calendario de Partidas
 */
const Calendar = () => {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editingMatch, setEditingMatch] = useState(null);

  // Open modal if coming from Dashboard with state
  useEffect(() => {
    if (location.state?.openCreateModal) {
      setShowCreateModal(true);
      // Clear state so it doesn't open again when navigating
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Load matches
  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Get all user matches without group filter
      const response = await matchService.getAllUserMatches({
        page: 1,
        limit: 1000 // Load all matches
      });
      
      // Response has structure { success, count, total, pages, currentPage, data }
      // where 'data' is the matches array
      setMatches(response.data || []);
    } catch (err) {
      console.error('Error loading matches:', err);
      // If endpoint doesn't exist (404), show informative message
      if (err.response?.status === 404) {
        setError('El módulo de partidas aún no está disponible. Próximamente podrás gestionar tu calendario.');
      } else {
        setError(err.response?.data?.message || 'Failed to load matches');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load matches on mount
  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  // Handlers
  const handleCreateMatch = async (matchData) => {
    try {
      const response = await matchService.createMatch(matchData);
      setMatches(prev => [...prev, response.data]);
      toast.success('Partida creada exitosamente');
      setShowCreateModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al crear la partida');
      throw err;
    }
  };

  const handleUpdateMatch = async (matchData, matchId) => {
    try {
      const response = await matchService.updateMatch(matchId, matchData);
      setMatches(prev => prev.map(m => m._id === matchId ? response.data : m));
      toast.success('Partida actualizada exitosamente');
      setShowCreateModal(false);
      setEditingMatch(null);
      
      // Also update the selected match if details modal is open
      if (selectedMatch?._id === matchId) {
        setSelectedMatch(response.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar la partida');
      throw err;
    }
  };

  const handleSaveMatch = async (matchData, matchId) => {
    if (matchId) {
      await handleUpdateMatch(matchData, matchId);
    } else {
      await handleCreateMatch(matchData);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      await matchService.deleteMatch(matchId);
      setMatches(prev => prev.filter(m => m._id !== matchId));
      toast.success('Partida eliminada exitosamente');
      setShowDetailsModal(false);
      setSelectedMatch(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al eliminar la partida');
      throw err;
    }
  };

  const handleConfirmAttendance = async (matchId) => {
    try {
      const response = await matchService.confirmAttendance(matchId);
      
      // Update the match in the list
      setMatches(prev => prev.map(m => m._id === matchId ? response.data : m));
      
      // Also update the selected match
      if (selectedMatch?._id === matchId) {
        setSelectedMatch(response.data);
      }
      
      toast.success('Asistencia confirmada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al confirmar asistencia');
      throw err;
    }
  };

  const handleCancelConfirmation = async (matchId) => {
    try {
      const response = await matchService.cancelAttendance(matchId);
      
      // If the match was deleted due to lack of players
      if (response.deleted) {
        setMatches(prev => prev.filter(m => m._id !== matchId));
        setShowDetailsModal(false);
        setSelectedMatch(null);
        toast.success('La partida fue eliminada por falta de jugadores.');
        return;
      }
      
      // Update the match in the list
      setMatches(prev => prev.map(m => m._id === matchId ? response.data : m));
      
      // Close the modal
      setShowDetailsModal(false);
      setSelectedMatch(null);
      
      toast.success('Asistencia actualizada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar asistencia');
      throw err;
    }
  };

  const handleMatchClick = (match) => {
    setSelectedMatch(match);
    setShowDetailsModal(true);
  };

  const handleEditMatch = (match) => {
    setEditingMatch(match);
    setShowDetailsModal(false);
    setShowCreateModal(true);
  };

  const handleDayClick = (date) => {
    // Function to format date to YYYY-MM-DD
    // For database dates (ISO strings), extracts the date part directly
    // to avoid timezone conversion issues
    const formatDateLocal = (d) => {
      // Si es un string ISO (de la base de datos), extraer la fecha directamente
      if (typeof d === 'string' && d.includes('T')) {
        return d.split('T')[0];
      }
      
      const dateObj = new Date(d);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Filter matches of the selected day using local time
    const dateStr = formatDateLocal(date);
    const dayMatches = matches.filter(match => {
      return formatDateLocal(match.scheduledDate) === dateStr;
    });

    if (dayMatches.length === 1) {
      handleMatchClick(dayMatches[0]);
    } else if (dayMatches.length > 1) {
      // If there are multiple matches, show the first one
      handleMatchClick(dayMatches[0]);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditingMatch(null);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedMatch(null);
  };

  // Handler for opening results recording modal
  const handleOpenResultsModal = (match) => {
    setSelectedMatch(match);
    setShowDetailsModal(false);
    setShowResultsModal(true);
  };

  // Handler for closing results modal
  const handleCloseResultsModal = () => {
    setShowResultsModal(false);
    setSelectedMatch(null);
  };

  // Handler for saving match results
  const handleSaveResults = async (matchId, resultData) => {
    try {
      const response = await matchService.finishMatch(matchId, resultData);
      
      // Update the match in the list with the new state
      setMatches(prev => prev.map(m => m._id === matchId ? response.data : m));
      
      // Refresh user data to update stats (points, wins, etc.)
      await refreshUser();
      
      // Close results modal
      setShowResultsModal(false);
      setSelectedMatch(null);
      
      // Show success message with ranking info if available
      if (response.ranking?.updatedPlayers?.length > 0) {
        const winnerInfo = response.ranking.updatedPlayers.find(p => p.isWinner);
        if (winnerInfo) {
          toast.success(`¡Partida finalizada! ${winnerInfo.stats?.name || 'Ganador'} suma ${winnerInfo.points} puntos al ranking.`);
        } else {
          toast.success('¡Resultados guardados correctamente!');
        }
      } else {
        toast.success('¡Resultados guardados correctamente!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar los resultados');
      throw err;
    }
  };

  // Estadísticas rápidas
  const upcomingMatches = matches.filter(m => {
    const matchDate = new Date(m.scheduledDate);
    const now = new Date();
    return matchDate > now && m.status === 'programada';
  }).length;

  const pendingConfirmations = matches.filter(m => {
    const userPlayer = m.players?.find(p => p.user?._id);
    return m.status === 'programada' && userPlayer && !userPlayer.confirmed;
  }).length;

  return (
    <div className={styles.calendarPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <MdCalendarToday className={styles.headerIcon} />
            <h1>Calendario</h1>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={() => setShowCreateModal(true)}
          >
            <MdAdd /> Nueva Partida
          </Button>
        </div>
      </div>

      {/* Estadísticas compactas */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <FiLayers className={styles.statIcon} />
          <span className={styles.statValue}>{matches.length}</span>
          <span className={styles.statLabel}>Total</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <GiSandsOfTime className={styles.statIcon} />
          <span className={styles.statValue}>{upcomingMatches}</span>
          <span className={styles.statLabel}>Próximas</span>
        </div>
        {pendingConfirmations > 0 && (
          <>
            <div className={styles.statDivider}></div>
            <div className={`${styles.statItem} ${styles.warning}`}>
              <FiClock className={styles.statIcon} />
              <span className={styles.statValue}>{pendingConfirmations}</span>
              <span className={styles.statLabel}>Pendientes</span>
            </div>
          </>
        )}
      </div>

      {/* Calendario */}
      {!loading ? (
        <Card variant="elevated" className={styles.calendarCard}>
          <CalendarGrid
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            matches={matches}
            onDayClick={handleDayClick}
            onMatchClick={handleMatchClick}
          />
        </Card>
      ) : (
        <Loading message="Cargando..." />
      )}

      {/* Modal de crear/editar partida */}
      <CreateEditMatchModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSave={handleSaveMatch}
        match={editingMatch}
      />

      {/* Modal de detalles de partida */}
      <MatchDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        match={selectedMatch}
        onEdit={handleEditMatch}
        onDelete={handleDeleteMatch}
        onConfirm={handleConfirmAttendance}
        onCancelConfirmation={handleCancelConfirmation}
        onRegisterResults={handleOpenResultsModal}
      />

      {/* Modal de registro de resultados */}
      <RegisterResultsModal
        isOpen={showResultsModal}
        onClose={handleCloseResultsModal}
        match={selectedMatch}
        onSave={handleSaveResults}
      />
    </div>
  );
};

export default Calendar;
