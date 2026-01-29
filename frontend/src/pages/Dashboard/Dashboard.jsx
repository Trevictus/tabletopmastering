import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { GiPerspectiveDiceSixFacesRandom, GiDiceFire, GiTrophy, GiTeamIdea } from 'react-icons/gi';
import { FiPlus, FiAward, FiCalendar, FiClock } from 'react-icons/fi';
import Button from '../../components/common/Button';
import matchService from '../../services/matchService';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const { groups, loadGroups } = useGroup();
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState('');
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refresh user data on mount to have updated stats
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await matchService.getAllUserMatches({ limit: 50 });
        const matches = res.data || [];
        const now = new Date();
        
        // Filter upcoming matches: status 'programada' and future date
        const upcoming = matches
          .filter(m => m.status === 'programada' && new Date(m.scheduledDate) >= now)
          .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))
          .slice(0, 5);
        
        // Filter recent matches: status 'finalizada', sorted by most recent date
        const recent = matches
          .filter(m => m.status === 'finalizada')
          .sort((a, b) => new Date(b.actualDate || b.scheduledDate) - new Date(a.actualDate || a.scheduledDate))
          .slice(0, 5);
        
        setUpcomingMatches(upcoming);
        setRecentMatches(recent);
      } catch {
        // Silent error
      } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      setToast(location.state.message);
      setTimeout(() => setToast(''), 4000);
    }
  }, [location]);

  const stats = {
    matches: user?.stats?.totalMatches || 0,
    wins: user?.stats?.totalWins || 0,
    groups: groups.length
  };
  const winRate = stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;

  return (
    <div className={styles.page}>
      {toast && <div className={styles.toast}>{toast}</div>}

      {/* Hero */}
      <section className={styles.hero}>
        <GiPerspectiveDiceSixFacesRandom className={styles.heroIcon} />
        <div>
          <h1>Bienvenido/a, {user?.name?.split(' ')[0]}</h1>
          <p>Gestiona tus partidas, grupos y estadísticas desde aquí</p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className={styles.statsBar}>
        <div className={styles.statsLeft}>
          <div className={styles.stat}>
            <GiDiceFire style={{ color: '#8b4513' }} />
            <span>{stats.matches}</span>
            <small>Partidas</small>
          </div>
          <div className={styles.stat}>
            <GiTrophy style={{ color: '#10b981' }} />
            <span>{stats.wins}</span>
            <small>Victorias</small>
          </div>
          <div className={styles.stat}>
            <FiAward style={{ color: '#f59e0b' }} />
            <span>{winRate}%</span>
            <small>Win Rate</small>
          </div>
          <div className={styles.stat}>
            <GiTeamIdea style={{ color: '#8b5cf6' }} />
            <span>{stats.groups}</span>
            <small>Grupos</small>
          </div>
        </div>
        <Button onClick={() => navigate('/calendar', { state: { openCreateModal: true } })}>
          <FiPlus /> Nueva Partida
        </Button>
      </section>

      {/* Content */}
      <div className={styles.content}>
        <section className={styles.section}>
          <h2><FiCalendar /> Próximas Partidas</h2>
          <div className={styles.sectionContent}>
            {loading ? (
              <p className={styles.loading}>Cargando...</p>
            ) : upcomingMatches.length > 0 ? (
              <ul className={styles.matchList}>
                {upcomingMatches.map(m => (
                  <li key={m._id} onClick={() => navigate('/calendar')}>
                    <strong>{m.game?.name || 'Partida'}</strong>
                    <span>{new Date(m.scheduledDate).toLocaleDateString('es-ES', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <p>No tienes partidas programadas</p>
                <Button variant="outline" size="small" onClick={() => navigate('/calendar', { state: { openCreateModal: true } })}>
                  Programar una
                </Button>
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h2><FiClock /> Actividad Reciente</h2>
          <div className={styles.sectionContent}>
            {loading ? (
              <p className={styles.loading}>Cargando...</p>
            ) : recentMatches.length > 0 ? (
              <ul className={styles.matchList}>
                {recentMatches.map(m => (
                  <li key={m._id} onClick={() => navigate('/history')}>
                    <strong>{m.game?.name || 'Partida'}</strong>
                    <span>{new Date(m.actualDate || m.scheduledDate).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                <p>Aún no has jugado partidas</p>
                <Button variant="outline" size="small" onClick={() => navigate('/games')}>
                  Explorar juegos
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
