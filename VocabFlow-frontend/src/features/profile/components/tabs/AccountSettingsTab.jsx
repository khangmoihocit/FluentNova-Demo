import React from 'react';
import { Row, Col, Segmented, Button, Space } from 'antd';
import { 
  FormatPainterOutlined, 
  SafetyCertificateOutlined, 
  LogoutOutlined, 
} from '@ant-design/icons';
import { logoutClientSession } from '../../../../utils/authSession';

const AccountSettingsTab = ({ 
  user, 
  theme, 
  setTheme, 
  i18n, 
  t, 
  onOpenPasswordModal, 
  onOpenDeleteModal 
}) => {
  const handleLogout = () => {
    logoutClientSession();
  };

  return (
    <div className="tab-pane-content">
      <div className="settings-grid">
        {/* App Settings Section */}
        <div className="tab-pane-content__section">
          <h3 className="tab-pane-content__title">
            <FormatPainterOutlined />
            {t('profile.appSettings', 'Cài đặt ứng dụng')}
          </h3>
          
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <p className="tab-pane-content__subtitle" style={{ marginBottom: 8, opacity: 0.7 }}>
                {t('profile.theme', 'Giao diện')}
              </p>
              <Segmented
                block
                value={theme}
                onChange={(value) => setTheme(value)}
                options={[
                  { label: t('profile.themeBasic', 'Cơ bản'), value: 'basic', icon: '☀️' },
                  { label: t('profile.themeDark', 'Tối'), value: 'dark', icon: '🌙' },
                  { label: t('profile.themeSolar', 'Solar'), value: 'solar', icon: '🔥' },
                ]}
              />
            </div>

            <div>
              <p className="tab-pane-content__subtitle" style={{ marginBottom: 8, opacity: 0.7 }}>
                {t('profile.language', 'Ngôn ngữ')}
              </p>
              <Segmented
                block
                value={i18n.language}
                onChange={(value) => i18n.changeLanguage(value)}
                options={[
                  { label: 'Tiếng Việt', value: 'vi', icon: <span style={{ fontSize: 12 }}>🇻🇳</span> },
                  { label: 'English', value: 'en', icon: <span style={{ fontSize: 12 }}>🇺🇸</span> },
                ]}
              />
            </div>
          </Space>
        </div>

        {/* Security Section */}
        <div className="tab-pane-content__section">
          <h3 className="tab-pane-content__title">
            <SafetyCertificateOutlined />
            {t('profile.settings.security')}
          </h3>
          
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {user.provider === 'LOCAL' && (
              <Button 
                block 
                onClick={onOpenPasswordModal}
                style={{ height: 48, borderRadius: 12 }}
              >
                {t('profile.settings.changePassword')}
              </Button>
            )}
            
            <Button 
              block 
              danger 
              onClick={onOpenDeleteModal}
              style={{ height: 48, borderRadius: 12 }}
            >
              {t('profile.settings.deleteAccount')}
            </Button>
          </Space>
        </div>
      </div>

      {/* Logout Action */}
      <div className="tab-pane-content__section" style={{ borderTop: '1px solid var(--color-surface-container-high)', paddingTop: '2rem', marginTop: '2rem' }}>
        <Button 
          className="logout-button" 
          icon={<LogoutOutlined />} 
          onClick={handleLogout}
        >
          {t('common.logout')}
        </Button>
      </div>
    </div>
  );
};

export default AccountSettingsTab;
