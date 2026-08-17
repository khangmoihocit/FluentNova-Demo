import React from 'react';
import { useTranslation } from 'react-i18next';
import ProfileForm from '../ProfileForm';

const PersonalInfoTab = ({ user, onUpdateSuccess }) => {
  const { t } = useTranslation();

  return (
    <div className="tab-pane-content">
      <div className="tab-pane-content__section">
        <h3 className="tab-pane-content__title">{t('profile.personalInfo.basic')}</h3>
        <ProfileForm 
          initialData={user} 
          onUpdateSuccess={onUpdateSuccess} 
        />
      </div>
    </div>
  );
};

export default PersonalInfoTab;
