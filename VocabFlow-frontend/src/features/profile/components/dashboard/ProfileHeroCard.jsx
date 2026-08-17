import React from 'react';
import { Tag, Button, Tooltip } from 'antd';
import { EditOutlined, SettingOutlined } from '@ant-design/icons';
import AvatarUpload from '../AvatarUpload';

const ProfileHeroCard = ({ user, gameStats, videoQuota, onAvatarUpdate, onEditClick, onSettingsClick, t }) => {
  const bestScore = gameStats 
    ? Math.max(gameStats.bestDictationScore || 0, gameStats.bestShadowingScore || 0) 
    : 0;

  return (
    <div className="dashboard-card hero-card">
      <div className="hero-card__actions">
        <Tooltip title={t('profile.hero.editProfile')}>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={onEditClick}
            className="hero-card__btn hero-card__btn--edit"
          />
        </Tooltip>
        <Tooltip title={t('profile.hero.settings')}>
          <Button 
            type="text" 
            icon={<SettingOutlined />} 
            onClick={onSettingsClick}
            className="hero-card__btn hero-card__btn--settings"
          />
        </Tooltip>
      </div>

      <div className="hero-card__avatar-wrap">
        <AvatarUpload 
          currentAvatarUrl={user.avatarUrl} 
          onUploadSuccess={onAvatarUpdate} 
        />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h1 className="hero-card__name">{user.fullName}</h1>
        <p className="hero-card__email">{user.email}</p>
        {user.ankiDeckName && (
          <p className="hero-card__anki">{t('profile.hero.ankiVocab')}: {user.ankiDeckName}</p>
        )}
        {user.ankiVideoDeckName && (
          <p className="hero-card__anki">{t('profile.hero.ankiVideo')}: {user.ankiVideoDeckName}</p>
        )}
        {videoQuota && (
          <div style={{ marginTop: '0.25rem', borderTop: '1px dashed var(--color-border)', paddingTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <p className="hero-card__anki">Giới hạn video hôm nay: <strong>{videoQuota.dailyQuotaLimit - videoQuota.dailyUsedCount}/{videoQuota.dailyQuotaLimit} lượt</strong></p>
            <p className="hero-card__anki">Thời lượng tạo còn lại: <strong>{Math.max(0, Math.floor((videoQuota.dailyDurationLimit - videoQuota.dailyUsedDuration) / 60))} phút</strong></p>
            <p className="hero-card__anki">Giới hạn video tháng này: <strong>{videoQuota.monthlyQuotaLimit - videoQuota.monthlyUsedCount}/{videoQuota.monthlyQuotaLimit} lượt</strong></p>
          </div>
        )}
      </div>

      {bestScore > 0 && (
        <div className="hero-card__game-badge">
          {t('profile.hero.gameRecord')}: {bestScore.toFixed(0)}/100 🏆
        </div>
      )}

      <Tag color={user.provider === 'LOCAL' ? 'blue' : 'orange'} style={{ border: 'none', borderRadius: '9999px', padding: '4px 16px', fontWeight: 600 }}>
        {user.provider === 'LOCAL' 
          ? t('profile.providerLocal', 'Tài khoản thường') 
          : t('profile.providerGoogle', 'Tài khoản Google')}
      </Tag>
    </div>
  );
};

export default ProfileHeroCard;
