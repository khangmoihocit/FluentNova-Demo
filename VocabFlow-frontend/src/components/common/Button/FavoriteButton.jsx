import React, { useState } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { isAuthenticated } from '../../../utils/auth';
import { useToggleFavoriteMutation } from '../../../hooks/queries/useFavoriteQueries';
import styles from './FavoriteButton.module.scss';

// Use a simple SVG heart icon
const HeartIcon = ({ filled }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={filled ? "currentColor" : "none"} 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={`${styles.icon} ${filled ? styles.filled : ''}`}
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const FavoriteButton = ({ videoId, initialIsFavorite = false, onToggle }) => {
  const { t } = useTranslation();
  const [optimisticFavorite, setOptimisticFavorite] = useState(null);
  const toggleFavoriteMutation = useToggleFavoriteMutation(videoId);
  const isFavorited = optimisticFavorite ?? initialIsFavorite;

  const toggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated()) {
      message.warning(t('favorites.loginRequired'));
      return;
    }

    if (toggleFavoriteMutation.isPending) return;
    
    // Optimistic update
    const prevStatus = isFavorited;
    setOptimisticFavorite(!prevStatus);

    try {
      const res = await toggleFavoriteMutation.mutateAsync(!prevStatus);
      if (res.success) {
        const newStatus = res.data?.isFavorited ?? !prevStatus;
        if (onToggle) onToggle(newStatus);
      } else {
        // Revert on backend error
        setOptimisticFavorite(prevStatus);
      }
    } catch {
      // Revert on network error
      setOptimisticFavorite(prevStatus);
      message.error(t('favorites.toggleError'));
    } finally {
      setOptimisticFavorite(null);
    }
  };

  return (
    <button 
      className={`${styles.favoriteBtn} ${isFavorited ? styles.active : ''}`}
      onClick={toggleFavorite}
      disabled={toggleFavoriteMutation.isPending}
      aria-label="Toggle favorite"
      title={isFavorited ? t('favorites.removeTooltip') : t('favorites.addTooltip')}
    >
      <HeartIcon filled={isFavorited} />
    </button>
  );
};

export default FavoriteButton;
