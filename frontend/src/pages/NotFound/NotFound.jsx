import { Link } from 'react-router-dom';
import { GiPerspectiveDiceSixFacesRandom } from 'react-icons/gi';
import Button from '../../components/common/Button';
import styles from './NotFound.module.css';

/**
 * 404 Page - Not Found
 * Displayed when user accesses a route that doesn't exist
 */
const NotFound = () => {
  return (
    <div className={styles.notFoundPage}>
      <div className={styles.content}>
        <GiPerspectiveDiceSixFacesRandom className={styles.icon} />
        <h1 className={styles.title}>404</h1>
        <h2 className={styles.subtitle}>Página no encontrada</h2>
        <p className={styles.description}>
          Parece que has lanzado los dados y has sacado un resultado inesperado.
          La página que buscas no existe.
        </p>
        <Link to="/">
          <Button variant="primary" size="large">
            Volver al Inicio
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
