import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { GiScrollUnfurled, GiTrophy } from 'react-icons/gi';
import { FiCalendar, FiUsers, FiClock } from 'react-icons/fi';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import matchService from '../../services/matchService';
import styles from './History.module.css';

const History = () => {
  const { user, refreshUser } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Refresh user data on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        // Load all matches and filter the finalized ones
        const response = await matchService.getAllUserMatches({ limit: 100 });
        const finalized = (response.data || []).filter(m => m.status === 'finalizada');
        const sorted = finalized.sort((a, b) => 
          new Date(b.actualDate || b.scheduledDate) - new Date(a.actualDate || a.scheduledDate)
        );
        setMatches(sorted);
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const { stats, filtered } = useMemo(() => {
    const currentUserId = user?._id?.toString();
    
    // Check if user won (is the winner or has position 1)
    const isWinner = (match) => {
      const winnerId = match.winner?._id?.toString() || match.winner?.toString();
      if (winnerId === currentUserId) return true;
      const userPlayer = match.players?.find(p => {
        const playerId = p.user?._id?.toString() || p.user?.toString();
        return playerId === currentUserId;
      });
      return userPlayer?.position === 1;
    };
    
    const wins = matches.filter(isWinner).length;
    const stats = { total: matches.length, wins, losses: matches.length - wins };
    
    let filtered = matches;
    if (filter === 'won') filtered = matches.filter(isWinner);
    if (filter === 'lost') filtered = matches.filter(m => !isWinner(m));
    
    return { stats, filtered };
  }, [matches, filter, user]);

  if (loading) return <Loading message="Cargando historial..." />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GiScrollUnfurled className={styles.icon} />
        <div>
          <h1>Historial de Partidas</h1>
          <p>Revisa todas tus partidas completadas</p>
        </div>
      </header>

      <div className={styles.stats}>
        <StatCard label="Partidas" value={stats.total} />
        <StatCard label="Victorias" value={stats.wins} color="#10b981" />
        <StatCard label="Derrotas" value={stats.losses} color="#ef4444" />
        <StatCard label="Win Rate" value={`${stats.total ? Math.round((stats.wins / stats.total) * 100) : 0}%`} color="#d4af37" />
      </div>

      <div className={styles.filters}>
        {['all', 'won', 'lost'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `Todas (${stats.total})` : f === 'won' ? `Ganadas (${stats.wins})` : `Perdidas (${stats.losses})`}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 ? (
          <Card variant="elevated" className={styles.empty}>
            <GiScrollUnfurled />
            <h3>No hay partidas</h3>
            <p>Las partidas completadas aparecerán aquí</p>
          </Card>
        ) : (
          filtered.map(match => <MatchCard key={match._id} match={match} userId={user?._id} />)
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <Card variant="outlined" className={styles.stat}>
    <span className={styles.statLabel}>{label}</span>
    <span className={styles.statValue} style={color ? { color } : undefined}>{value}</span>
  </Card>
);

const MatchCard = ({ match, userId }) => {
  const userIdStr = userId?.toString();
  const winnerId = match.winner?._id?.toString() || match.winner?.toString();
  const userPlayer = match.players?.find(p => {
    const playerId = p.user?._id?.toString() || p.user?.toString();
    return playerId === userIdStr;
  });
  const isWinner = winnerId === userIdStr || userPlayer?.position === 1;
  const date = new Date(match.actualDate || match.scheduledDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const playersWithPosition = match.players?.filter(p => p.position) || [];
  const durationMinutes = match.duration?.value || match.duration;

  return (
    <Card variant="elevated" className={`${styles.match} ${isWinner ? styles.won : ''}`}>
      <div className={styles.matchHeader}>
        <div>
          <h3>{match.game?.name || 'Juego desconocido'}</h3>
          <div className={styles.meta}>
            <span><FiCalendar /> {date}</span>
            <span><FiUsers /> {playersWithPosition.length || match.players?.length || 0}</span>
            {durationMinutes && <span><FiClock /> {durationMinutes}min</span>}
          </div>
        </div>
        {isWinner && <div className={styles.winBadge}><GiTrophy /> Victoria</div>}
      </div>

      <div className={styles.results}>
        {playersWithPosition.sort((a, b) => (a.position || 99) - (b.position || 99)).map((p, i) => {
          const playerId = p.user?._id?.toString() || p.user?.toString();
          const isMe = playerId === userIdStr;
          return (
            <div key={i} className={`${styles.result} ${isMe ? styles.me : ''}`}>
              <span className={styles.place}>
                {p.position === 1 ? '🥇' : p.position === 2 ? '🥈' : p.position === 3 ? '🥉' : `${p.position}º`}
              </span>
              <span className={styles.playerName}>
                {p.user?.name || 'Jugador'}{isMe && ' (Tú)'}
              </span>
              {p.pointsEarned > 0 && <span className={styles.pts}>+{p.pointsEarned} pts</span>}
            </div>
          );
        })}
      </div>

      {match.group && <span className={styles.group}>Grupo: {match.group.name}</span>}
    </Card>
  );
};

export default History;
