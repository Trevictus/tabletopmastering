import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, 
  MdSearch, 
  MdFilterList,
  MdRefresh,
  MdArrowBack,
  MdArrowForward
} from 'react-icons/md';
import { GiCardPlay } from 'react-icons/gi';
import { FiBox, FiUsers } from 'react-icons/fi';
import { useGroup } from '../../context/GroupContext';
import GameCard from '../../components/games/GameCard';
import AddGameModal from '../../components/games/AddGameModal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import gameService from '../../services/gameService';
import styles from './Games.module.css';

/**
 * Games management page
 * Lists all group games with filters, search and pagination
 */
const Games = () => {
  const navigate = useNavigate();
  const { selectedGroup, groups, loadGroups, selectGroup } = useGroup();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  
  // Ref to avoid double loading
  const loadingRef = useRef(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Load groups on mount (only if no groups loaded)
  useEffect(() => {
    if (groups.length === 0) {
      loadGroups();
    }
  }, [groups.length, loadGroups]);

  // Debounce for search - ONLY updates debouncedSearch
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, sourceFilter, selectedGroup]);

  // Load games - ONLY effect for loading data
  useEffect(() => {
    const loadGames = async () => {
      // Avoid duplicate loads
      if (loadingRef.current) return;
      loadingRef.current = true;

      // Only show loading on first load or group change
      if (isFirstLoad) {
        setLoading(true);
      }
      setError('');

      try {
        const params = {
          page: currentPage,
          limit: 12,
          search: debouncedSearch || undefined,
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          groupId: selectedGroup?._id || undefined
        };

        const response = await gameService.getGames(params);
        
        if (mountedRef.current) {
          setGames(response.data || []);
          setTotalPages(response.pages || 1);
          setTotalGames(response.total || 0);
          setIsFirstLoad(false);
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err.response?.data?.message || 'Error al cargar los juegos');
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
        loadingRef.current = false;
      }
    };

    loadGames();
  }, [selectedGroup?._id, currentPage, sourceFilter, debouncedSearch, isFirstLoad]);

  // Handlers - defined before useMemo so they can be used
  const handleGameAdded = useCallback((newGame) => {
    setGames(prev => [newGame, ...prev]);
    setTotalGames(prev => prev + 1);
  }, []);

  const handleDelete = useCallback(async (game) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar "${game.name}"?`)) {
      return;
    }

    try {
      await gameService.deleteGame(game._id);
      setGames(prev => prev.filter(g => g._id !== game._id));
      setTotalGames(prev => prev - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el juego');
    }
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSourceFilter('all');
    setCurrentPage(1);
  }, []);

  // Memoize the games list to avoid unnecessary re-renders
  const renderedGames = useMemo(() => (
    games.map((game) => (
      <GameCard
        key={game._id}
        game={game}
        onDelete={handleDelete}
        canDelete={!selectedGroup}
        showOwners={!!selectedGroup}
      />
    ))
  ), [games, selectedGroup, handleDelete]);

  return (
    <div className={styles.gamesPage}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerTitle}>
            <GiCardPlay className={styles.headerIcon} />
            <div>
              <h1>Catálogo de Juegos</h1>
              <p className={styles.subtitle}>
                {totalGames} {totalGames === 1 ? 'juego' : 'juegos'}
                {selectedGroup && ' (compartidos por miembros)'}
              </p>
            </div>
          </div>
          {/* Solo mostrar botón Añadir en "Mis Juegos" (sin grupo seleccionado) */}
          {!selectedGroup && (
            <Button
              variant="primary"
              size="small"
              onClick={() => setShowAddModal(true)}
            >
              <MdAdd /> Añadir Juego
            </Button>
          )}
        </div>
      </div>

      {/* Nav de Grupos */}
      {(groups.length > 0 || selectedGroup) && (
        <div className={styles.groupNav}>
          <div className={styles.groupNavContent}>
            <button
              className={`${styles.groupNavButton} ${!selectedGroup ? styles.active : ''}`}
              onClick={() => selectGroup(null)}
            >
              <FiBox className={styles.navIcon} /> Mis Juegos
            </button>
            {groups.map(group => (
              <button
                key={group._id}
                className={`${styles.groupNavButton} ${selectedGroup?._id === group._id ? styles.active : ''}`}
                onClick={() => selectGroup(group)}
              >
                <FiUsers className={styles.navIcon} /> {group.name}
              </button>
            ))}
          </div>
        </div>
      )}



      {/* No hay grupos */}
      {!loading && groups.length === 0 && (
        <Card variant="elevated" className={styles.infoCard}>
          <p className={styles.infoText}>
            💡 <strong>Tip:</strong> Puedes crear grupos para compartir juegos con otros usuarios.
          </p>
          <Button
            variant="outline"
            size="small"
            onClick={() => navigate('/groups')}
          >
            Crear o Unirse a Grupos
          </Button>
        </Card>
      )}

      {/* Filtros y búsqueda */}
      <Card variant="elevated" className={styles.filtersCard}>
          <div className={styles.searchBar}>
            <Input
              name="search"
              type="text"
              placeholder="Buscar juegos por nombre, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MdSearch />}
              variant="compact"
              className={styles.searchInput}
            />
            
            <Button
              variant="outline"
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              className={styles.filterButton}
            >
              <MdFilterList />
              {showFilters ? 'Ocultar' : 'Filtros'}
            </Button>
          </div>

          {showFilters && (
            <div className={styles.filters}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fuente:</label>
                <div className={styles.filterButtons}>
                  <Button
                    variant={sourceFilter === 'all' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSourceFilter('all')}
                  >
                    Todos
                  </Button>
                  <Button
                    variant={sourceFilter === 'bgg' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSourceFilter('bgg')}
                  >
                    <GiCardPlay /> BGG
                  </Button>
                  <Button
                    variant={sourceFilter === 'custom' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => setSourceFilter('custom')}
                  >
                    Personalizados
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                size="small"
                onClick={clearFilters}
                className={styles.clearButton}
              >
                <MdRefresh /> Limpiar
              </Button>
            </div>
          )}
      </Card>

      {/* Mensajes de error */}
      {error && (
        <div className={styles.error}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Grid de juegos - solo visible cuando hay contenido o cargando */}
      {(loading && isFirstLoad) || games.length > 0 ? (
        <div className={`${styles.gamesGrid} ${loading && isFirstLoad ? styles.loading : ''}`}>
          {loading && isFirstLoad ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonContent}>
                  <div className={styles.skeletonTitle} />
                  <div className={styles.skeletonText} />
                  <div className={styles.skeletonText} style={{ width: '60%' }} />
                </div>
              </div>
            ))
          ) : (
            renderedGames
          )}
        </div>
      ) : null}

      {/* Paginación - solo si hay juegos y más de una página */}
      {!loading && games.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || loading}
          >
            <MdArrowBack /> Anterior
          </Button>

          <div className={styles.pageInfo}>
            Página {currentPage} de {totalPages}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages || loading}
          >
            Siguiente <MdArrowForward />
          </Button>
        </div>
      )}

      {/* Empty state - solo mostrar si no está cargando y no hay juegos */}
      {!loading && !isFirstLoad && games.length === 0 && (
        <Card variant="elevated" className={styles.emptyState}>
          <GiCardPlay className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>
            {searchTerm || sourceFilter !== 'all'
              ? 'No se encontraron juegos'
              : 'No hay juegos en el catálogo'}
          </h2>
          <p className={styles.emptyDescription}>
            {searchTerm || sourceFilter !== 'all'
              ? 'Intenta con otros términos de búsqueda o limpia los filtros'
              : selectedGroup 
                ? 'Los miembros del grupo aún no han añadido juegos a sus bibliotecas personales'
                : 'Añade tu primer juego a tu colección personal'}
          </p>
          {!searchTerm && sourceFilter === 'all' && !selectedGroup && (
            <Button
              variant="primary"
              onClick={() => setShowAddModal(true)}
              className={styles.emptyButton}
            >
              <MdAdd /> Añadir Primer Juego
            </Button>
          )}
        </Card>
      )}

      {/* Modal de añadir juego - siempre añade a biblioteca personal (sin groupId) */}
      <AddGameModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onGameAdded={handleGameAdded}
        groupId={null}
      />
    </div>
  );
};

export default Games;
