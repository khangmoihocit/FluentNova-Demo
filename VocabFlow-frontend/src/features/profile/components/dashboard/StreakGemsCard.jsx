import React from 'react';
import { FireFilled, TrophyFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const StreakGemsCard = ({ streak }) => {
  const { t } = useTranslation();

  return (
    <div className="streak-gems-solar">
      <div className="streak-gems-solar__card streak-gems-solar__card--current">
        <div className="streak-gems-solar__icon-wrap">
          <FireFilled />
        </div>
        <div className="streak-gems-solar__content">
          <span className="streak-gems-solar__value">{streak?.currentStreak || 0}</span>
          <span className="streak-gems-solar__label">{t('profile.streak.days')}</span>
        </div>
        <div className="streak-gems-solar__glow" />
      </div>
      
      <div className="streak-gems-solar__card streak-gems-solar__card--longest">
        <div className="streak-gems-solar__icon-wrap">
          <TrophyFilled />
        </div>
        <div className="streak-gems-solar__content">
          <span className="streak-gems-solar__value">{streak?.longestStreak || 0}</span>
          <span className="streak-gems-solar__label">{t('profile.streak.best')}</span>
        </div>
      </div>
    </div>
  );
};

export default StreakGemsCard;

