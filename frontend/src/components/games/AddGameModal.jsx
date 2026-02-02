import { useState } from 'react';
import PropTypes from 'prop-types';
import { 
  MdSearch, 
  MdAdd,
  MdPeople,
  MdTimer,
  MdStar,
  MdArrowBack
} from 'react-icons/md';
import { GiDiceFire } from 'react-icons/gi';
import { useToast } from '../../context/ToastContext';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Loading from '../common/Loading';
import gameService from '../../services/gameService';
import styles from './AddGameModal.module.css';

/**
 * Modal para añadir juegos desde BGG o crear uno personalizado
 */
const AddGameModal = ({ isOpen, onClose, onGameAdded, groupId }) => {
  const toast = useToast();
  const [mode, setMode] = useState('search'); // 'search', 'preview', 'custom'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [gamePreview, setGamePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for custom game
  const [customGame, setCustomGame] = useState({
    name: '',
    description: '',
    minPlayers: 1,
    maxPlayers: 4,
    playingTime: 60,
    yearPublished: new Date().getFullYear(),
    image: '',
    categories: '',
    mechanics: ''
  });

  const resetModal = () => {
    setMode('search');
    setSearchQuery('');
    setSearchResults([]);
    setGamePreview(null);
    setError('');
    setCustomGame({
      name: '',
      description: '',
      minPlayers: 1,
      maxPlayers: 4,
      playingTime: 60,
      yearPublished: new Date().getFullYear(),
      image: '',
      categories: '',
      mechanics: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Search games in BGG
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      toast.warning('Escribe el nombre de un juego para buscar');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const response = await gameService.searchBGG(searchQuery);
      setSearchResults(response.data || []);
      
      if (response.data?.length === 0) {
        toast.info('No se encontraron juegos con ese nombre. ¿Quieres crearlo como juego personalizado?', {
          title: 'Sin resultados'
        });
      } else {
        toast.success(`Se encontraron ${response.data.length} juego${response.data.length !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al buscar juegos en BoardGameGeek';
      const isBGGUnavailable = err.response?.data?.error === 'BGG_UNAVAILABLE' || err.response?.status === 503;
      
      setError(errorMsg);
      
      if (isBGGUnavailable) {
        // BGG no disponible - mostrar mensaje amigable
        toast.warning(
          'BoardGameGeek no está disponible temporalmente. Puedes crear juegos manualmente.',
          { 
            title: 'Servicio Temporalmente No Disponible',
            duration: 5000,
          }
        );
      } else {
        // Otro tipo de error
        toast.error(errorMsg, { title: 'Error de búsqueda' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Ver preview de juego BGG
  const handlePreview = async (game) => {
    setLoading(true);
    setError('');

    try {
      const response = await gameService.getBGGDetails(game.bggId);
      setGamePreview(response.data);
      setMode('preview');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch game details');
    } finally {
      setLoading(false);
    }
  };

  // Add game from BGG
  const handleAddFromBGG = async () => {
    if (!gamePreview) return;

    setLoading(true);
    setError('');

    try {
      const response = await gameService.addFromBGG(
        gamePreview.bggId,
        groupId || null,
        ''
      );
      
      toast.success(`${gamePreview.name} añadido correctamente`, {
        title: 'Juego añadido'
      });
      
      onGameAdded(response.data);
      handleClose();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al añadir juego';
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Error al añadir' });
    } finally {
      setLoading(false);
    }
  };

  // Crear juego personalizado
  const handleCreateCustom = async (e) => {
    e.preventDefault();

    if (!customGame.name.trim()) {
      toast.warning('El nombre del juego es obligatorio');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Limpiar y preparar los datos antes de enviar
      const gameData = {
        name: customGame.name.trim(),
        description: customGame.description?.trim() || '',
        minPlayers: parseInt(customGame.minPlayers) || 1,
        maxPlayers: parseInt(customGame.maxPlayers) || 4,
        playingTime: parseInt(customGame.playingTime) || 0,
        yearPublished: parseInt(customGame.yearPublished) || undefined,
        groupId: groupId || null,
        categories: customGame.categories 
          ? customGame.categories.split(',').map(c => c.trim()).filter(c => c.length > 0)
          : [],
        mechanics: customGame.mechanics 
          ? customGame.mechanics.split(',').map(m => m.trim()).filter(m => m.length > 0)
          : []
      };

      // Only include image if it's a valid URL
      const imageUrl = customGame.image?.trim();
      if (imageUrl && imageUrl.length > 1) {
        try {
          new URL(imageUrl);
          gameData.image = imageUrl;
        } catch {
          // If it's not a valid URL, we don't include it
        }
      }

      const response = await gameService.createCustomGame(gameData);
      
      toast.success(`${customGame.name} creado correctamente`, {
        title: 'Juego creado'
      });
      
      onGameAdded(response.data);
      handleClose();
    } catch (err) {
      // Mostrar errores de validación específicos si existen
      const validationErrors = err.response?.data?.errors;
      let errorMsg = err.response?.data?.message || 'Error al crear juego';
      
      if (validationErrors && Array.isArray(validationErrors)) {
        errorMsg = validationErrors.map(e => e.message).join('. ');
      }
      
      setError(errorMsg);
      toast.error(errorMsg, { title: 'Error al crear' });
    } finally {
      setLoading(false);
    }
  };

  // Renderizar contenido según modo
  const renderContent = () => {
    if (mode === 'search') {
      return (
        <>
          <div className={styles.modeSelector}>
            <Button
              variant={mode === 'search' ? 'primary' : 'outline'}
              size="small"
              fullWidth
              onClick={() => setMode('search')}
            >
              <GiDiceFire /> BGG
            </Button>
            <Button
              variant={mode === 'custom' ? 'primary' : 'outline'}
              size="small"
              fullWidth
              onClick={() => setMode('custom')}
            >
              <MdAdd /> Personalizado
            </Button>
          </div>

          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              name="search"
              type="text"
              placeholder="Nombre del juego..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<MdSearch />}
              variant="compact"
            />
            <Button type="submit" size="small" disabled={loading || !searchQuery.trim()}>
              {loading ? 'Buscando...' : 'Buscar'}
            </Button>
          </form>

          {/* Mostrar resultados de búsqueda */}
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              <h4 className={styles.resultsTitle}>
                {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''} encontrado{searchResults.length !== 1 ? 's' : ''}
              </h4>
              <div className={styles.resultsList}>
                {searchResults.map((game) => (
                  <div
                    key={game.bggId}
                    className={styles.resultItem}
                    onClick={() => handlePreview(game)}
                  >
                    {game.thumbnail && (
                      <img
                        src={game.thumbnail}
                        alt={game.name}
                        className={styles.resultThumbnail}
                      />
                    )}
                    <div className={styles.resultInfo}>
                      <h5 className={styles.resultName}>{game.name}</h5>
                      {game.yearPublished && (
                        <span className={styles.resultYear}>({game.yearPublished})</span>
                      )}
                    </div>
                    <Button variant="outline" size="small">
                      Ver detalles
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay resultados después de buscar */}
          {!loading && searchQuery && searchResults.length === 0 && (
            <div className={styles.noResults}>
              <p>No se encontraron juegos para "{searchQuery}"</p>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomGame({ ...customGame, name: searchQuery });
                  setMode('custom');
                }}
              >
                Crear "{searchQuery}" como juego personalizado
              </Button>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className={styles.errorBanner}>
              <p>{error}</p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCustomGame({ ...customGame, name: searchQuery });
                    setMode('custom');
                  }}
                >
                  Crear como juego personalizado
                </Button>
              )}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className={styles.loadingState}>
              <Loading size="medium" />
              <p>Buscando en BoardGameGeek...</p>
            </div>
          )}
        </>
      );
    }

    if (mode === 'preview' && gamePreview) {
      return (
        <>
          <Button
            variant="outline"
            size="small"
            onClick={() => setMode('search')}
            className={styles.backButton}
          >
            <MdArrowBack /> Volver a resultados
          </Button>

          <div className={styles.preview}>
            {(gamePreview.image || gamePreview.thumbnail) && (
              <img
                src={gamePreview.image || gamePreview.thumbnail}
                alt={gamePreview.name}
                className={styles.previewImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            <h3 className={styles.previewTitle}>{gamePreview.name}</h3>
            {gamePreview.yearPublished && (
              <p className={styles.previewYear}>({gamePreview.yearPublished})</p>
            )}

            <div className={styles.previewStats}>
              {gamePreview.rating?.average && (
                <div className={styles.previewStat}>
                  <MdStar />
                  <span>{gamePreview.rating.average.toFixed(1)}/10</span>
                </div>
              )}
              <div className={styles.previewStat}>
                <MdPeople />
                <span>
                  {gamePreview.minPlayers === gamePreview.maxPlayers
                    ? `${gamePreview.minPlayers}`
                    : `${gamePreview.minPlayers}-${gamePreview.maxPlayers}`}{' '}
                  jugadores
                </span>
              </div>
              {gamePreview.playingTime > 0 && (
                <div className={styles.previewStat}>
                  <MdTimer />
                  <span>{gamePreview.playingTime} min</span>
                </div>
              )}
            </div>

            {gamePreview.description && (
              <div className={styles.previewDescription}>
                <h4>Descripción</h4>
                <p>{gamePreview.description}</p>
              </div>
            )}

            {gamePreview.categories?.length > 0 && (
              <div className={styles.previewTags}>
                <h4>Categorías</h4>
                <div className={styles.tags}>
                  {gamePreview.categories.map((cat, idx) => (
                    <span key={idx} className={styles.tag}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {gamePreview.mechanics?.length > 0 && (
              <div className={styles.previewTags}>
                <h4>Mecánicas</h4>
                <div className={styles.tags}>
                  {gamePreview.mechanics.map((mech, idx) => (
                    <span key={idx} className={styles.tag}>
                      {mech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {error && <div className={styles.error}>{error}</div>}
          </div>
        </>
      );
    }

    if (mode === 'custom') {
      return (
        <>
          <Button
            variant="outline"
            size="small"
            onClick={() => setMode('search')}
            className={styles.backButton}
          >
            <MdArrowBack /> Volver
          </Button>

          <form onSubmit={handleCreateCustom} className={styles.customForm}>
            <Input
              label="Nombre del juego"
              name="name"
              type="text"
              value={customGame.name}
              onChange={(e) => setCustomGame({ ...customGame, name: e.target.value })}
              required
            />

            <Input
              label="Descripción"
              name="description"
              type="text"
              value={customGame.description}
              onChange={(e) => setCustomGame({ ...customGame, description: e.target.value })}
            />

            <div className={styles.formRow}>
              <Input
                label="Jugadores mín."
                name="minPlayers"
                type="number"
                min="1"
                value={customGame.minPlayers}
                onChange={(e) => setCustomGame({ ...customGame, minPlayers: parseInt(e.target.value) })}
                required
              />
              <Input
                label="Jugadores máx."
                name="maxPlayers"
                type="number"
                min="1"
                value={customGame.maxPlayers}
                onChange={(e) => setCustomGame({ ...customGame, maxPlayers: parseInt(e.target.value) })}
                required
              />
            </div>

            <div className={styles.formRow}>
              <Input
                label="Duración (min)"
                name="playingTime"
                type="number"
                min="0"
                value={customGame.playingTime}
                onChange={(e) => setCustomGame({ ...customGame, playingTime: parseInt(e.target.value) })}
              />
              <Input
                label="Año publicación"
                name="yearPublished"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                value={customGame.yearPublished}
                onChange={(e) => setCustomGame({ ...customGame, yearPublished: parseInt(e.target.value) })}
              />
            </div>

            <Input
              label="URL de imagen"
              name="image"
              type="url"
              value={customGame.image}
              onChange={(e) => setCustomGame({ ...customGame, image: e.target.value })}
              helpText="URL de una imagen del juego"
            />

            <Input
              label="Categorías (separadas por comas)"
              name="categories"
              type="text"
              value={customGame.categories}
              onChange={(e) => setCustomGame({ ...customGame, categories: e.target.value })}
              helpText="Ej: Estrategia, Familiar, Cartas"
            />

            <Input
              label="Mecánicas (separadas por comas)"
              name="mechanics"
              type="text"
              value={customGame.mechanics}
              onChange={(e) => setCustomGame({ ...customGame, mechanics: e.target.value })}
              helpText="Ej: Gestión de mano, Colocación de trabajadores"
            />

            {error && <div className={styles.error}>{error}</div>}
          </form>
        </>
      );
    }
  };

  const renderFooter = () => {
    if (mode === 'preview') {
      return (
        <>
          <Button variant="outline" onClick={() => setMode('search')}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAddFromBGG} disabled={loading}>
            {loading ? 'Añadiendo...' : 'Añadir al Grupo'}
          </Button>
        </>
      );
    }

    if (mode === 'custom') {
      return (
        <>
          <Button variant="outline" onClick={() => setMode('search')}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCreateCustom} 
            disabled={loading || !customGame.name.trim()}
          >
            {loading ? 'Creando...' : 'Crear Juego'}
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        mode === 'search'
          ? groupId ? 'Añadir Juego al Grupo' : 'Añadir Juego Personal'
          : mode === 'preview'
          ? 'Vista Previa del Juego'
          : groupId ? 'Crear Juego para el Grupo' : 'Crear Juego Personal'
      }
      size="large"
      footer={renderFooter()}
    >
      <div className={styles.modalContent}>
        {renderContent()}
      </div>
    </Modal>
  );
};

AddGameModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onGameAdded: PropTypes.func.isRequired,
  groupId: PropTypes.string // Opcional: null = juegos personales
};

export default AddGameModal;
