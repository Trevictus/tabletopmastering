import { memo, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  MdPeople, 
  MdTimer, 
  MdStar, 
  MdDelete,
  MdPerson,
  MdGroup
} from 'react-icons/md';
import { GiDiceFire, GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import Card from '../common/Card';
import Button from '../common/Button';
import styles from './GameCard.module.css';

/**
 * GameCard Component - Game card
 * Displays game information in a visual and compact format
 */
const GameCard = ({ 
  game, 
  onDelete, 
  canDelete = false,
  showOwners = false // Only show owners in group view
}) => {
  const {
    name,
    image,
    thumbnail,
    minPlayers,
    maxPlayers,
    playingTime,
    rating,
    source,
    categories,
    yearPublished,
    owners = [], // Array of owners (when there's deduplication)
    addedBy // Single owner (when there's no deduplication)
  } = game;

  // Check if there's a valid image
  const defaultPlaceholder = 'https://via.placeholder.com/300x400?text=Board+Game';
  const hasValidImage = (thumbnail || image) && 
    (thumbnail || image) !== defaultPlaceholder &&
    (thumbnail || image).trim() !== '';
  
  const imageUrl = hasValidImage ? (thumbnail || image) : null;
  const [imageLoaded, setImageLoaded] = useState(false);
  const players = minPlayers === maxPlayers 
    ? `${minPlayers}` 
    : `${minPlayers}-${maxPlayers}`;

  /**
   * Format the owners list for display
   * - 1 owner: "From: John"
   * - 2 owners: "From: John, Mary"
   * - 3+ owners: "From: John, Mary +1"
   */
  const formatOwners = () => {
    // Use owners if it exists, otherwise use addedBy
    const ownerList = owners.length > 0 ? owners : (addedBy ? [addedBy] : []);
    
    if (ownerList.length === 0) return null;

    const MAX_VISIBLE = 2;
    const visibleOwners = ownerList.slice(0, MAX_VISIBLE);
    const remainingCount = ownerList.length - MAX_VISIBLE;

    const ownerNames = visibleOwners.map(o => o.name || 'Usuario').join(', ');
    
    if (remainingCount > 0) {
      return `${ownerNames} +${remainingCount}`;
    }
    
    return ownerNames;
  };

  const ownerDisplay = showOwners ? formatOwners() : null;
  const hasMultipleOwners = owners.length > 1;

  return (
    <Card variant="elevated" noPadding className={styles.gameCard}>
      <div className={styles.imageContainer}>
        {hasValidImage ? (
          <>
            {!imageLoaded && (
              <div className={styles.imageSkeleton} />
            )}
            <img 
              src={imageUrl} 
              alt={name}
              className={`${styles.gameImage} ${imageLoaded ? styles.imageLoaded : styles.imageLoading}`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)} // Show placeholder if fails
            />
          </>
        ) : (
          <div className={styles.placeholderImage}>
            <GiPerspectiveDiceSixFacesRandom className={styles.placeholderDice} />
            <span className={styles.placeholderText}>Sin imagen</span>
          </div>
        )}
        {source === 'bgg' && (
          <span className={styles.badge} title="Desde BoardGameGeek">
            <GiDiceFire />
          </span>
        )}
        {rating?.average && (
          <div className={styles.rating}>
            <MdStar />
            <span>{rating.average.toFixed(1)}</span>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Información principal - crece según contenido */}
        <div className={styles.mainInfo}>
          <h3 className={styles.title} title={name}>
            {name}
          </h3>

          {yearPublished && (
            <p className={styles.year}>({yearPublished})</p>
          )}

          <div className={styles.stats}>
            <div className={styles.stat}>
              <MdPeople />
              <span>{players} jugadores</span>
            </div>
            {playingTime > 0 && (
              <div className={styles.stat}>
                <MdTimer />
                <span>{playingTime} min</span>
              </div>
            )}
          </div>

          {categories && categories.length > 0 && (
            <div className={styles.categories}>
              {categories.slice(0, 2).map((category, index) => (
                <span key={index} className={styles.category}>
                  {category}
                </span>
              ))}
              {categories.length > 2 && (
                <span className={styles.category}>+{categories.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer fijo - siempre al fondo */}
        {(ownerDisplay || canDelete) && (
          <div className={styles.cardFooter}>
            {/* Mostrar propietarios solo en vista de grupo */}
            {ownerDisplay && (
              <div className={styles.owners} title={owners.map(o => o.name).join(', ')}>
                {hasMultipleOwners ? <MdGroup className={styles.ownerIcon} /> : <MdPerson className={styles.ownerIcon} />}
                <span className={styles.ownerText}>De: {ownerDisplay}</span>
              </div>
            )}

            {canDelete && (
              <div className={styles.actions}>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => onDelete(game)}
                  className={styles.deleteButton}
                >
                  <MdDelete />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

GameCard.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    image: PropTypes.string,
    thumbnail: PropTypes.string,
    minPlayers: PropTypes.number,
    maxPlayers: PropTypes.number,
    playingTime: PropTypes.number,
    rating: PropTypes.shape({
      average: PropTypes.number
    }),
    source: PropTypes.oneOf(['bgg', 'custom']),
    categories: PropTypes.arrayOf(PropTypes.string),
    yearPublished: PropTypes.number,
    owners: PropTypes.arrayOf(PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string
    })),
    addedBy: PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      email: PropTypes.string
    })
  }).isRequired,
  onDelete: PropTypes.func,
  canDelete: PropTypes.bool,
  showOwners: PropTypes.bool
};

export default memo(GameCard);
