import React, { useEffect, useRef, useState } from 'react';
import { EMPLOYEE_PROFILE_IMAGE_URL } from '../../constants/apiConstants';
import styles from './EmployeeManagement.module.css';
 
// Track fetched images globally per session
const fetchedImages = new Set();
 
const getImageStorageKey = (emailId) => `employee_image_${emailId}`;
 
const EmployeeProfileImage = ({ emailId, index }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
 
  const isMounted = useRef(true);
 
  useEffect(() => {
    isMounted.current = true;
 
    return () => {
      isMounted.current = false;
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);
 
  useEffect(() => {
    if (!emailId) return;
 
    const storageKey = getImageStorageKey(emailId);
    const cached = sessionStorage.getItem(storageKey);
 
    // ✅ Prevent re-fetch if cached or already fetched
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const blob = new Blob([new Uint8Array(parsed.data)], { type: parsed.type });
        const url = URL.createObjectURL(blob);
        if (isMounted.current) {
          setImageUrl(url);
          setLoading(false);
        }
        return;
      } catch {
        sessionStorage.removeItem(storageKey); // corrupted
      }
    } else if (fetchedImages.has(emailId)) {
      setLoading(false);
      return;
    }
 
    // ✅ Fetch from backend
    const fetchImage = async () => {
      setLoading(true);
      setError(false);
 
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${EMPLOYEE_PROFILE_IMAGE_URL}?emailId=${encodeURIComponent(emailId)}&index=${index}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
 
        if (!response.ok) throw new Error('Failed to fetch image');
 
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
 
        if (isMounted.current) {
          setImageUrl(objectUrl);
          setLoading(false);
          fetchedImages.add(emailId);
        }
 
        // Save to sessionStorage
        const buffer = await blob.arrayBuffer();
        const data = {
          data: Array.from(new Uint8Array(buffer)),
          type: blob.type,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(storageKey, JSON.stringify(data));
 
      } catch (err) {
        if (isMounted.current) {
          setError(true);
          setLoading(false);
        }
      }
    };
 
    fetchImage();
  }, [emailId, index]);
 
  if (loading) {
    return <div className={styles.profileImageContainer}>Loading...</div>;
  }
 
  if (error || !imageUrl) {
    return (
<div className={styles.profileImageContainer}>
<div className={styles.profileImagePlaceholder}>
<span className={styles.placeholderText}>No Image</span>
</div>
</div>
    );
  }
 
  return (
<div className={styles.profileImageContainer}>
<img src={imageUrl} alt={`Employee ${emailId}`} className={styles.profileImage} />
</div>
  );
};
 
export default EmployeeProfileImage;