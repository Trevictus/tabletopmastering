import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MdRefresh } from 'react-icons/md';
import { FaUserCircle } from 'react-icons/fa';
import { GiTrophy, GiPodium } from 'react-icons/gi';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import rankingService from '../../services/rankingService';
import { isValidAvatar, capitalize } from '../../utils/validators';
import styles from './Rankings.module.css';

/**
 * Rankings Page - Global and by group
 */

const Rankings = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { groups, loadGroups } = useGroup();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams.get('group') || null);
  const [sortBy, setSortBy] = useState('points');

  // Load groups on mount
  useEffect(() => {
    if (groups.length === 0) loadGroups();
  }, [groups.length, loadGroups]);

  // Load ranking
  const loadRanking = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      let response;
      if (selectedGroupId) {
        response = await rankingService.getGroupRanking(selectedGroupId);
        const data = response.data?.ranking || response.data || [];
        setRanking(data.map(item => ({
          id: item.user?._id || item.userId || item._id,
          nickname: item.user?.nickname || item.nickname,
          name: item.user?.name || item.name,
          avatar: item.user?.avatar || item.avatar,
          totalPoints: item.totalPoints || 0,
          totalWins: item.totalWins || 0,
          totalMatches: item.totalMatches || 0,
        })));
      } else {
        response = await rankingService.getGlobalRanking();
        const data = response.data || [];
        setRanking(data.map(item => ({
          id: item.userId || item._id,
          nickname: item.nickname,
          name: item.name,
          avatar: item.avatar,
          totalPoints: item.totalPoints || 0,
          totalWins: item.totalWins || 0,
          totalMatches: item.totalMatches || 0,
        })));
      }
    } catch {
      setError('Error al cargar el ranking');
      setRanking([]);
    } finally {
      setLoading(false);
    }
  }, [selectedGroupId]);

  useEffect(() => { loadRanking(); }, [loadRanking]);

  // Sort ranking
  const sortedRanking = useMemo(() => {
    const sorted = [...ranking];
    if (sortBy === 'points') sorted.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
    else if (sortBy === 'wins') sorted.sort((a, b) => (b.totalWins || 0) - (a.totalWins || 0));
    return sorted;
  }, [ranking, sortBy]);

  // Normalize current user ID
  const currentUserId = user?._id?.toString?.() || user?._id || '';

  // Top 20 + current user if outside top
  const { displayRanking, currentUserEntry } = useMemo(() => {
    const top20 = sortedRanking.slice(0, 20);
    const userIndex = sortedRanking.findIndex(p => {
      const playerId = p.id?.toString?.() || p.id || '';
      return playerId && currentUserId && playerId === currentUserId;
    });
    const isUserOutsideTop = userIndex >= 20;
    
    return {
      displayRanking: top20,
      currentUserEntry: isUserOutsideTop ? { ...sortedRanking[userIndex], position: userIndex + 1 } : null
    };
  }, [sortedRanking, currentUserId]);

  // Current view info
  const groupName = selectedGroupId 
    ? groups.find(g => g._id === selectedGroupId)?.name || 'Grupo'
    : 'Global';
  const totalPlayers = sortedRanking.length;

  return (
    <div className={styles.rankingsPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <GiTrophy className={styles.headerIcon} />
          <div>
            <h1>Ranking {groupName}</h1>
            <p className={styles.subtitle}>{totalPlayers} jugadores</p>
          </div>
        </div>
        <Button variant="outline" size="small" onClick={loadRanking} disabled={loading}>
          <MdRefresh className={loading ? styles.spinning : ''} />
        </Button>
      </div>

      {/* Group navigation */}
      <div className={styles.groupNav}>
        <button
          className={`${styles.navBtn} ${!selectedGroupId ? styles.active : ''}`}
          onClick={() => setSelectedGroupId(null)}
        >
          Global
        </button>
        {groups.map(g => (
          <button
            key={g._id}
            className={`${styles.navBtn} ${selectedGroupId === g._id ? styles.active : ''}`}
            onClick={() => setSelectedGroupId(g._id)}
          >
            {g.name}
          </button>
        ))}
      </div>      {/* Ordenación */}
      <div className={styles.sortBar}>
        <span>Ordenar:</span>
        <Button variant={sortBy === 'points' ? 'primary' : 'outline'} size="small" onClick={() => setSortBy('points')}>
          Puntos
        </Button>
        <Button variant={sortBy === 'wins' ? 'primary' : 'outline'} size="small" onClick={() => setSortBy('wins')}>
          Victorias
        </Button>
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      {/* Tabla */}
      <Card variant="elevated" className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Jugador</th>
              <th>Puntos</th>
              <th>Victorias</th>
              <th>Partidas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className={styles.skeleton}>
                  <td><div className={styles.skelBox} /></td>
                  <td><div className={styles.skelPlayer}><div className={styles.skelAvatar} /><div className={styles.skelName} /></div></td>
                  <td><div className={styles.skelBox} /></td>
                  <td><div className={styles.skelBox} /></td>
                  <td><div className={styles.skelBox} /></td>
                </tr>
              ))
            ) : sortedRanking.length > 0 ? (
              <>
                {displayRanking.map((p, i) => {
                  const playerId = p.id?.toString?.() || p.id || '';
                  const isMe = playerId && currentUserId && playerId === currentUserId;
                  const pos = i + 1;
                  return (
                    <tr key={p.id || i} className={`${isMe ? styles.me : ''} ${pos <= 3 ? styles[`top${pos}`] : ''}`}>
                      <td className={styles.pos}>
                        {pos <= 3 ? (
                          <span className={`${styles.medal} ${styles[`medal${pos}`]}`}>
                            {pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className={styles.posNumber}>{pos}</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.player}>
                          <div className={styles.avatar}>
                            {isValidAvatar(p.avatar) ? (
                              <img src={p.avatar} alt="" />
                            ) : (
                              <FaUserCircle className={styles.avatarFallback} />
                            )}
                          </div>
                          <span className={styles.name}>{capitalize(p.nickname) || p.name}</span>
                          {isMe && <span className={styles.badge}>Tú</span>}
                        </div>
                      </td>
                      <td className={styles.points}>{p.totalPoints || 0}</td>
                      <td className={styles.wins}>{p.totalWins || 0}</td>
                      <td>{p.totalMatches || 0}</td>
                    </tr>
                  );
                })}
                {currentUserEntry && (
                  <>
                    <tr className={styles.separator}>
                      <td colSpan={5}><div className={styles.separatorLine}><span>···</span></div></td>
                    </tr>
                    <tr className={styles.me}>
                      <td className={styles.pos}>
                        <span className={styles.posNumber}>{currentUserEntry.position}</span>
                      </td>
                      <td>
                        <div className={styles.player}>
                          <div className={styles.avatar}>
                            {isValidAvatar(currentUserEntry.avatar) ? (
                              <img src={currentUserEntry.avatar} alt="" />
                            ) : (
                              <FaUserCircle className={styles.avatarFallback} />
                            )}
                          </div>
                          <span className={styles.name}>{capitalize(currentUserEntry.nickname) || currentUserEntry.name}</span>
                          <span className={styles.badge}>Tú</span>
                        </div>
                      </td>
                      <td className={styles.points}>{currentUserEntry.totalPoints || 0}</td>
                      <td className={styles.wins}>{currentUserEntry.totalWins || 0}</td>
                      <td>{currentUserEntry.totalMatches || 0}</td>
                    </tr>
                  </>
                )}
              </>
            ) : (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  <GiPodium className={styles.emptyIcon} />
                  <p>No hay datos de ranking</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Rankings;
