import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import axios from 'axios';
import styles from './TestImageView.module.css';
import { TEST_SS_VIEW } from '../../constants/apiConstants';

const TestImageView = ({ testAllotmentId, onClose }) => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchImages = async (id) => {
    if (!id) {
      console.log("fetchImages called with empty id");
      setError('No allotment ID provided');
      return;
    }

    console.log("fetchImages called with id:", id);
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = `${TEST_SS_VIEW}?allotmentId=${id}`;
      console.log("Making API call to:", apiUrl);
      
      const response = await axios.get(apiUrl);
      console.log("API response:", response.data);
      
      const imageBytesList = response.data;
      
      if (!imageBytesList || imageBytesList.length === 0) {
        console.log("No images found in response");
        setImages([]);
        return;
      }

      const imageUrls = imageBytesList.map((bytes, index) => {
        try {
          // Convert array of numbers to base64 string
          let base64String;
          
          if (Array.isArray(bytes)) {
            // If bytes is an array of numbers
            const uint8Array = new Uint8Array(bytes);
            base64String = btoa(String.fromCharCode.apply(null, uint8Array));
          } else if (typeof bytes === 'string') {
            // If bytes is already a base64 string
            base64String = bytes;
          } else {
            // If bytes is a Uint8Array or similar
            base64String = btoa(String.fromCharCode(...new Uint8Array(bytes)));
          }
          
          return `data:image/jpeg;base64,${base64String}`;
        } catch (err) {
          console.error(`Error processing image ${index}:`, err);
          return null;
        }
      }).filter(Boolean);

      console.log("Processed image URLs:", imageUrls.length);
      setImages(imageUrls);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError('Error loading images: ' + (err.response?.data?.message || err.message));
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("useEffect triggered with testAllotmentId:", testAllotmentId);
    
    if (testAllotmentId) {
      const trimmedId = String(testAllotmentId).trim();
      console.log("Trimmed ID:", trimmedId);
      
      if (trimmedId) {
        fetchImages(trimmedId);
      } else {
        console.log("testAllotmentId is empty after trimming");
        setError('Invalid allotment ID');
      }
    } else {
      console.log("testAllotmentId is null/undefined");
      setError('No allotment ID provided');
    }
  }, [testAllotmentId]);

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

  const handleReload = () => {
    if (testAllotmentId) {
      const trimmedId = String(testAllotmentId).trim();
      if (trimmedId) {
        fetchImages(trimmedId);
      }
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <h2>Test Images Gallery</h2>
          <button className={styles.closeBtn} onClick={closeModal}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.infoBar}>
            <span><strong>Allotment ID:</strong> {testAllotmentId || 'Not provided'}</span>
            <button onClick={handleReload} disabled={loading || !testAllotmentId}>
              {loading ? 'Loading...' : 'Reload Images'}
            </button>
          </div>

          {error && (
            <div className={styles.errorMsg}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading && (
            <div className={styles.loadingMsg}>
              Loading images...
            </div>
          )}

          {!loading && images.length === 0 && !error && (
            <div className={styles.noImagesMsg}>
              No images found for this allotment ID.
            </div>
          )}

          {!loading && images.length > 0 && (
            <div className={styles.imageGrid}>
              {images.slice(0, 10).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  className={styles.thumb}
                  onClick={() => openImage(idx)}
                  onError={(e) => {
                    console.error(`Error loading thumbnail ${idx}:`, e);
                    e.target.style.display = 'none';
                  }}
                />
              ))}
              {images.length > 10 && (
                <div className={styles.moreImagesMsg}>
                  ... and {images.length - 10} more images
                </div>
              )}
            </div>
          )}

          {currentImageIndex !== null && (
            <div className={styles.overlayViewer}>
              <button 
                className={styles.closeBtnTopRight} 
                onClick={() => setCurrentImageIndex(null)}
              >
                <X size={24} />
              </button>
              <img 
                src={images[currentImageIndex]} 
                className={styles.largeImage} 
                alt="Enlarged view"
                onError={(e) => {
                  console.error(`Error loading large image ${currentImageIndex}:`, e);
                }}
              />
              {images.length > 1 && (
                <>
                  <button className={styles.navBtnLeft} onClick={prevImage}>
                    <ChevronLeft size={32} />
                  </button>
                  <button className={styles.navBtnRight} onClick={nextImage}>
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
              <div className={styles.imageCounter}>
                {currentImageIndex + 1} / {images.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestImageView;