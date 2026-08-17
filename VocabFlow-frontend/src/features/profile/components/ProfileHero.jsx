import React from 'react';
import { Tag, Typography } from 'antd';
import AvatarUpload from './AvatarUpload';

const { Title, Text } = Typography;

const ProfileHero = ({ user, onAvatarUpdate, t }) => {
  return (
    <div className="profile-hero">
      <div className="profile-hero__avatar-wrap">
        <AvatarUpload 
          currentAvatarUrl={user.avatarUrl} 
          onUploadSuccess={onAvatarUpdate} 
        />
      </div>
      
      <div className="profile-hero__content">
        <h1 className="profile-hero__name">{user.fullName}</h1>
        <p className="profile-hero__email">{user.email}</p>
        {user.ankiDeckName && (
          <p className="profile-hero__anki" style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '2px' }}>
            {t('profile.hero.ankiVocab')}: {user.ankiDeckName}
          </p>
        )}
        {user.ankiVideoDeckName && (
          <p className="profile-hero__anki" style={{ fontSize: '0.875rem', opacity: 0.7 }}>
            {t('profile.hero.ankiVideo')}: {user.ankiVideoDeckName}
          </p>
        )}
        <div className="profile-hero__badge">
          <Tag color={user.provider === 'LOCAL' ? 'blue' : 'orange'}>
            {user.provider === 'LOCAL' 
              ? t('profile.providerLocal', 'Tài khoản thường') 
              : t('profile.providerGoogle', 'Tài khoản Google')}
          </Tag>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
