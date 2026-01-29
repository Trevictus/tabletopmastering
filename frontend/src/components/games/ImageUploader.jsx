import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from './ImageUploader.module.css';
import gameService from '../../services/gameService';
import { useToast } from '../../context/ToastContext';

const ImageUploader = ({ gameId, currentImage, onImageUploaded }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Solo se permiten imágenes (JPEG, PNG, GIF, WEBP)', 'error');
      return;
    }

    // Validate size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showToast('La imagen no puede superar los 5MB', 'error');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    try {
      setUploading(true);
      const response = await gameService.uploadGameImage(gameId, file);
      
      showToast('Imagen subida exitosamente', 'success');
      
      if (onImageUploaded) {
        onImageUploaded(response.data.imageUrl);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast(
        error.response?.data?.message || 'Error al subir la imagen',
        'error'
      );
      // Restore previous preview
      setPreview(currentImage);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.imageUploader}>
      <div className={styles.imagePreview} onClick={handleClick}>
        {preview ? (
          <img src={preview} alt="Preview" className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <svg
              className={styles.uploadIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p>Click para subir imagen</p>
          </div>
        )}
        {uploading && (
          <div className={styles.uploadingOverlay}>
            <div className={styles.spinner}></div>
            <p>Subiendo...</p>
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className={styles.fileInput}
        disabled={uploading}
      />
      
      <div className={styles.info}>
        <p className={styles.infoText}>
          Formatos: JPEG, PNG, GIF, WEBP • Máximo: 5MB
        </p>
      </div>
    </div>
  );
};

ImageUploader.propTypes = {
  gameId: PropTypes.string.isRequired,
  currentImage: PropTypes.string,
  onImageUploaded: PropTypes.func,
};

export default ImageUploader;
