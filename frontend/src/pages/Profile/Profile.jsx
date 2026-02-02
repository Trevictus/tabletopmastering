import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGroup } from '../../context/GroupContext';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiAward, FiUsers, FiTarget, FiTrendingUp, FiStar, FiZap, FiDownload, FiTrash2, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { GiTrophy, GiDiceFire, GiPerspectiveDiceSixFacesRandom, GiTeamIdea, GiCardPlay, GiCrown, GiLaurelCrown, GiPodium, GiRocket, GiDiamondHard, GiBookCover } from 'react-icons/gi';
import { FaUserCircle } from 'react-icons/fa';
import { MdGroup } from 'react-icons/md';
import Loading from '../../components/common/Loading';
import EditProfileModal from '../../components/common/EditProfileModal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import gameService from '../../services/gameService';
import authService from '../../services/authService';
import { isValidAvatar } from '../../utils/validators';
import styles from './Profile.module.css';

const Profile = () => {
  const { user, updateProfile, refreshUser, logout } = useAuth();
  const { groups } = useGroup();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gamesCount, setGamesCount] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [_exportError, setExportError] = useState('');

  // Refresh user data on mount to have updated stats
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    if (!user) return;
    gameService.getGames({ limit: 1 }).then(r => setGamesCount(r.total || 0)).catch(() => {});
  }, [user]);

  const handleSaveProfile = async (data) => {
    await updateProfile(data);
  };

  // Export user data (GDPR)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await authService.exportUserData();
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tabletop-mastering-data-${user.nickname || 'user'}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Delete account (GDPR)
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Enter your password');
      return;
    }
    setIsDeleting(true);
    setDeleteError('');
    try {
      await authService.deleteAccount(deletePassword);
      logout();
      navigate('/', { replace: true });
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) return <Loading message="Cargando perfil..." />;

  const stats = {
    matches: user.stats?.totalMatches || 0,
    wins: user.stats?.totalWins || 0,
    points: user.stats?.totalPoints || 0,
  };
  const winRate = stats.matches > 0 ? Math.round((stats.wins / stats.matches) * 100) : 0;
  
  // Highlights based on real user data
  const highlights = [
    // Achievements for played matches
    stats.matches >= 1 && { icon: <GiDiceFire />, label: 'Primera partida jugada', color: '#8b4513' },
    stats.matches >= 5 && { icon: <GiPerspectiveDiceSixFacesRandom />, label: '5 partidas jugadas', color: '#8b4513' },
    stats.matches >= 10 && { icon: <GiPodium />, label: 'Jugador Veterano (10+)', color: '#6b7280' },
    stats.matches >= 25 && { icon: <GiCrown />, label: 'Leyenda (25+ partidas)', color: '#d4af37' },
    
    // Achievements for victories
    stats.wins >= 1 && { icon: <GiTrophy />, label: 'Primera victoria', color: '#10b981' },
    stats.wins >= 3 && { icon: <FiZap />, label: 'Racha ganadora (3+)', color: '#f59e0b' },
    stats.wins >= 10 && { icon: <FiStar />, label: 'Campeón (10+ victorias)', color: '#f59e0b' },
    
    // Achievements for win rate
    winRate >= 50 && stats.matches >= 5 && { icon: <FiTrendingUp />, label: 'Estratega (50%+ win rate)', color: '#10b981' },
    winRate >= 75 && stats.matches >= 10 && { icon: <GiDiamondHard />, label: 'Élite (75%+ win rate)', color: '#8b5cf6' },
    
    // Achievements for points
    stats.points >= 100 && { icon: <GiLaurelCrown />, label: '100 puntos acumulados', color: '#d4af37' },
    stats.points >= 500 && { icon: <GiRocket />, label: '500 puntos acumulados', color: '#ef4444' },
    
    // Social achievements
    groups.length >= 1 && { icon: <GiTeamIdea />, label: 'Miembro de grupo', color: '#8b5cf6' },
    groups.length >= 3 && { icon: <MdGroup />, label: 'Social (3+ grupos)', color: '#3b82f6' },
    
    // Collection achievements
    gamesCount >= 1 && { icon: <GiCardPlay />, label: 'Primer juego añadido', color: '#10b981' },
    gamesCount >= 5 && { icon: <GiBookCover />, label: 'Coleccionista (5+ juegos)', color: '#d4af37' },
  ].filter(Boolean);

  return (
    <div className={styles.profilePage}>
      <div className={styles.header}>
        <div className={styles.headerBg} />
        <div className={styles.headerContent}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {isValidAvatar(user.avatar) ? (
                <img src={user.avatar} alt={user.name} className={styles.avatar} />
              ) : (
                <FaUserCircle className={styles.avatarIcon} />
              )}
            </div>
            <div className={styles.joinDate}>
              <GiPerspectiveDiceSixFacesRandom />
              <span>
                {user.createdAt && !isNaN(new Date(user.createdAt).getTime())
                  ? `Desde ${new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}`
                  : 'Nuevo jugador'}
              </span>
            </div>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userMain}>
              <div className={styles.userNames}>
                <h1>{user.name}</h1>
                {user.nickname && <span className={styles.nickname}>@{user.nickname}</span>}
              </div>
              <button className={styles.editBtn} onClick={() => setIsModalOpen(true)} title="Editar perfil">
                <FiEdit2 /> Editar perfil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.statsSection}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}><GiDiceFire /></div>
            <div className={styles.statInfo}><span className={styles.statValue}>{stats.matches}</span><span className={styles.statLabel}>Partidas</span></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.gold}`}><GiTrophy /></div>
            <div className={styles.statInfo}><span className={styles.statValue}>{stats.wins}</span><span className={styles.statLabel}>Victorias</span></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.green}`}><FiTarget /></div>
            <div className={styles.statInfo}><span className={styles.statValue}>{winRate}%</span><span className={styles.statLabel}>Win Rate</span></div>
          </div>
          <div className={styles.statCard}>
            <div className={`${styles.statIcon} ${styles.purple}`}><FiTrendingUp /></div>
            <div className={styles.statInfo}><span className={styles.statValue}>{stats.points}</span><span className={styles.statLabel}>Puntos</span></div>
          </div>
        </section>

        <div className={styles.cardsGrid}>
          <div className={styles.card} onClick={() => navigate('/groups')}>
            <div className={styles.cardHeader}><FiUsers className={styles.cardIcon} /><h3>Mis Grupos</h3></div>
            <div className={styles.cardValue}>{groups.length}</div>
            <p className={styles.cardDesc}>{groups.length > 0 ? `Activo en ${groups.length} grupo${groups.length > 1 ? 's' : ''}` : 'Únete a un grupo'}</p>
          </div>
          <div className={styles.card} onClick={() => navigate('/games')}>
            <div className={styles.cardHeader}><GiPerspectiveDiceSixFacesRandom className={styles.cardIcon} /><h3>Mi Colección</h3></div>
            <div className={styles.cardValue}>{gamesCount}</div>
            <p className={styles.cardDesc}>{gamesCount > 0 ? `${gamesCount} juego${gamesCount > 1 ? 's' : ''} en tu colección` : 'Añade juegos'}</p>
          </div>
          <div className={`${styles.card} ${styles.progressCard}`}>
            <div className={styles.cardHeader}><FiAward className={styles.cardIcon} /><h3>Progreso</h3></div>
            <div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${winRate}%` }} /></div>
            <p className={styles.cardDesc}>{stats.matches > 0 ? `${stats.wins} de ${stats.matches} partidas ganadas` : 'Juega tu primera partida'}</p>
          </div>
        </div>

        <section className={styles.achievementsSection}>
          <h2><FiAward /> Destacados</h2>
          <div className={styles.achievementsList}>
            {highlights.length > 0 ? highlights.map((h, i) => (
              <div key={i} className={styles.achievement}>
                <span className={styles.achievementIcon} style={{ color: h.color }}>{h.icon}</span>
                <span>{h.label}</span>
              </div>
            )) : (
              <p className={styles.noAchievements}>¡Juega partidas para desbloquear logros!</p>
            )}
          </div>
        </section>

        {/* Sección de Datos y Privacidad (RGPD) */}
        <section className={styles.privacySection}>
          <h2><FiShield /> Datos y Privacidad</h2>
          <p className={styles.privacyDesc}>
            Conforme al RGPD, puedes exportar o eliminar todos tus datos personales.
          </p>
          <div className={styles.privacyActions}>
            <Button
              variant="secondary"
              onClick={handleExportData}
              disabled={isExporting}
            >
              <FiDownload /> {isExporting ? 'Exportando...' : 'Exportar mis datos'}
            </Button>
            <Button
              variant="danger"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <FiTrash2 /> Eliminar mi cuenta
            </Button>
          </div>
        </section>
      </div>

      <EditProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
        onSave={handleSaveProfile}
      />

      {/* Modal de confirmación de eliminación */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletePassword('');
          setDeleteError('');
        }}
        title="Eliminar cuenta"
      >
        <div className={styles.deleteModal}>
          <div className={styles.deleteWarning}>
            <FiAlertTriangle className={styles.warningIcon} />
            <p>
              <strong>Esta acción es irreversible.</strong> Se eliminarán todos tus datos, 
              incluyendo tu perfil, estadísticas y participación en partidas.
            </p>
          </div>
          <p>Introduce tu contraseña para confirmar:</p>
          <Input
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Tu contraseña"
            error={deleteError}
          />
          <div className={styles.deleteActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletePassword('');
                setDeleteError('');
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
