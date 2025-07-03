import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';
import styles from './TestImageView.module.css';
import { TEST_SS_VIEW } from '../../constants/apiConstants';

const TestImageView = ({ allotmentId, onClose }) => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchImages = async (id) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${TEST_SS_VIEW}?allotmentId=${id}`);
      const imageBytesList = response.data;
      const imageUrls = imageBytesList.map((bytes) => {
        const base64String = btoa(String.fromCharCode(...new Uint8Array(bytes)));
        return `data:image/jpeg;base64,${base64String}`;
      });
      setImages(imageUrls);
    } catch (err) {
      setError('Error loading images: ' + (err.response?.data?.message || err.message));
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (allotmentId && allotmentId.trim()) {
      fetchImages(allotmentId.trim());
    }
  }, [allotmentId]);

  const closeModal = () => {
    setCurrentImageIndex(null);
    onClose();
  };

  const openImage = (index) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <h2>Test Images Gallery</h2>
          <button className={styles.closeBtn} onClick={closeModal}><X size={24} /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoBar}>
            <span><strong>Allotment ID:</strong> {allotmentId}</span>
            <button onClick={() => fetchImages(allotmentId)} disabled={loading}>
              {loading ? 'Loading...' : 'Reload Images'}
            </button>
          </div>

          {error && <div className={styles.errorMsg}>{error}</div>}

          {!loading && images.length === 0 && !error && <div>No images found for this allotment ID.</div>}

          {!loading && images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.slice(0, 10).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className={styles.thumb}
                  onClick={() => openImage(idx)}
                />
              ))}
            </div>
          )}

          {currentImageIndex !== null && (
            <div className={styles.overlayViewer}>
              <button className={styles.closeBtnTopRight} onClick={() => setCurrentImageIndex(null)}><X size={24} /></button>
              <img src={images[currentImageIndex]} className={styles.largeImage} alt="Enlarged view" />
              {images.length > 1 && (
                <>
                  <button className={styles.navBtnLeft} onClick={prevImage}><ChevronLeft size={32} /></button>
                  <button className={styles.navBtnRight} onClick={nextImage}><ChevronRight size={32} /></button>
                </>
              )}
              <div className={styles.imageCounter}>{currentImageIndex + 1} / {images.length}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestImageView;
