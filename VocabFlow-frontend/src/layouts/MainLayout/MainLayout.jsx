import { lazy, Suspense, useState } from 'react';
import { Layout, Menu, Avatar, Typography, Button, Dropdown, message } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getUser } from '../../utils/cookie';
import { isAuthenticated } from '../../utils/auth';
import { logoutClientSession } from '../../utils/authSession';
import { useTheme } from '../../features/theme/context/ThemeContext';
import {
  UserOutlined,
  HomeFilled,
  ReadFilled,
  AudioFilled,
  EditFilled,
  SoundFilled,
  TranslationOutlined,
  PlaySquareFilled,
  ThunderboltFilled,
  LogoutOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  CheckOutlined,
  FormatPainterOutlined,
  HeartFilled,
  MessageOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useDictionary } from '../../features/dictionary/context/DictionaryContext';
import FluentNovaLogo from '../../components/common/Logo/FluentNovaLogo';
import BottomNavigation from '../../components/common/BottomNavigation/BottomNavigation';
import { useLayout } from '../../context/LayoutContext';
import './MainLayout.scss';

const { Sider, Content } = Layout;

const FeedbackModal = lazy(() => import('../../features/feedback/components/FeedbackModal'));

const THEME_META = (t) => ({
  basic: { label: t('common.theme.basic'), icon: '☀️' },
  dark: { label: t('common.theme.dark'), icon: '🌙' },
  solar: { label: t('common.theme.solar'), icon: '🔥' },
});

const MainLayout = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();
  const isAuth = isAuthenticated();
  const { collapsed, setSidebarCollapsed: setCollapsed, isMobile } = useLayout();
  const { theme, setTheme, themes } = useTheme();
  const themeMeta = THEME_META(t);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { openDrawer, closeDrawer, open: isDictOpen } = useDictionary();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logoutClientSession();
  };

  const handleFeedbackClick = () => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }

    setFeedbackOpen(true);
  };

  const menuItems = [
    { key: '/', icon: <HomeFilled />, label: t('common.navigation.home') },
    { key: '/videos', icon: <PlaySquareFilled />, label: t('common.navigation.videos') },
    { key: '/notebook', icon: <ReadFilled />, label: t('common.navigation.notebook') },
    { key: '/favorites', icon: <HeartFilled />, label: t('common.navigation.favorites') },
    { key: '/my-video', icon: <PlaySquareFilled />, label: t('common.navigation.myVideo') },
    { key: '/game/setup', icon: <ThunderboltFilled />, label: t('common.navigation.gameHub') },
    { key: '/practice/translate', icon: <TranslationOutlined />, label: t('practiceTranslate.title') },
    { 
      key: '/guide', 
      icon: <InfoCircleOutlined />, 
      label: t('common.i18nGuide', 'Hướng dẫn') 
    }
  ];

  const getSelectedKeys = () => {
    if (location.pathname.startsWith('/guide')) return ['/guide'];
    if (location.pathname.startsWith('/intro')) return ['/intro'];
    if (location.pathname.startsWith('/notebook')) return ['/notebook'];
    if (location.pathname.startsWith('/favorites')) return ['/favorites'];
    if (location.pathname.startsWith('/my-video')) return ['/my-video'];
    if (location.pathname.startsWith('/game')) return ['/game/setup'];
    if (location.pathname.startsWith('/practice/translate')) return ['/practice/translate'];
    if (location.pathname.startsWith('/videos')) return ['/videos'];
    if (location.pathname.startsWith('/profile')) return ['/profile'];
    return ['/'];
  };

  // Build theme dropdown items
  const themeDropdownItems = {
    items: themes.map((t) => ({
      key: t,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{themeMeta[t]?.icon}</span>
          <span>{themeMeta[t]?.label}</span>
          {theme === t && <CheckOutlined style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />}
        </span>
      ),
    })),
    onClick: ({ key }) => setTheme(key),
  };

  const isLearningPath =
    /^\/videos\/[^/]+/.test(location.pathname) ||
    location.pathname.startsWith('/study/') ||
    location.pathname.startsWith('/game/dictation');

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      {isMobile && !isLearningPath && (
        <div className="mobile-header">
          <div className="mobile-header-left">
            <FluentNovaLogo size={28} />
          </div>
          <div className="mobile-header-right">
            <Button
              type="text"
              icon={<SearchOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />}
              onClick={() => (isDictOpen ? closeDrawer() : openDrawer())}
              className="mobile-dict-btn"
              style={{ marginRight: '4px' }}
              title={t('profile.dictionary.fabClose')}
            />
            <Button
              type="text"
              icon={<HeartFilled style={{ fontSize: '18px', color: 'var(--color-primary)' }} />}
              onClick={() => navigate('/favorites')}
              className="mobile-favorites-btn"
              style={{ marginRight: '8px' }}
              title={t('common.navigation.favorites')}
            />
            <Button
              type="text"
              icon={<MessageOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />}
              onClick={handleFeedbackClick}
              className="mobile-feedback-btn"
              style={{ marginRight: '8px' }}
            />
            <Button
              type="text"
              icon={<InfoCircleOutlined style={{ fontSize: '18px', color: 'var(--color-primary)' }} />}
              onClick={() => navigate('/guide')}
              className="mobile-guide-btn"
              style={{ marginRight: '8px' }}
              title={t('common.i18nGuide', 'Hướng dẫn')}
            />
            <div onClick={() => navigate('/profile')}>
              <Avatar 
                size="default"
                src={user?.avatarUrl} 
                icon={!user?.avatarUrl && <UserOutlined />}
                className="mobile-avatar-trigger"
              />
            </div>
          </div>
        </div>
      )}
      <Layout>
        <Sider
          className="desktop-sider"
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
          width={240}
          theme="light"
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ── Logo Header ── */}
            <div className={`sider-header ${collapsed ? 'collapsed' : ''}`}>
              <div className="logo-wrapper">
                <FluentNovaLogo collapsed={collapsed} size={32} />
                <Button
                  type="text"
                  className="collapse-toggle-btn"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
                />
              </div>
            </div>

            {/* ── Navigation Menu ── */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
              <Menu
                mode="inline"
                selectedKeys={getSelectedKeys()}
                style={{ borderRight: 0, fontSize: 16 }}
                items={menuItems}
                onClick={handleMenuClick}
              />
            </div>

            {/* ── Footer Actions ── */}
            <div className="sider-footer">

              {/* Feedback Button */}
              <button
                type="button"
                onClick={handleFeedbackClick}
                className={`sider-footer-btn ${collapsed ? 'collapsed' : ''}`}
              >
                <MessageOutlined />
                {!collapsed && <span>{t('feedback.title', 'Góp ý')}</span>}
              </button>

              {/* Theme Dropdown */}
              <Dropdown menu={themeDropdownItems} trigger={['click']} placement="topRight">
                <button className={`theme-dropdown-btn ${collapsed ? 'collapsed' : ''}`}>
                  <FormatPainterOutlined />
                  {!collapsed && (
                    <span>{themeMeta[theme]?.icon} {themeMeta[theme]?.label}</span>
                  )}
                </button>
              </Dropdown>

              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLanguage}
                className={`sider-footer-btn ${collapsed ? 'collapsed' : ''}`}
              >
                <GlobalOutlined />
                {!collapsed && <span>{i18n.language === 'vi' ? 'English' : 'Tiếng Việt'}</span>}
              </button>

              {isAuth ? (
                <>
                  <div
                    className={`profile-row ${collapsed ? 'collapsed' : ''}`}
                    onClick={() => navigate('/profile')}
                  >
                    <Avatar
                      style={{ backgroundColor: 'var(--color-primary)', flexShrink: 0 }}
                      src={user?.avatarUrl}
                      icon={!user?.avatarUrl && <UserOutlined />}
                    />
                    {!collapsed && (
                      <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span className="profile-name" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.1 }}>
                          {user?.fullName || t('common.navigation.profile')}
                        </span>
                        {user?.email && (
                          <span style={{ fontSize: 11, color: 'var(--color-muted)', lineHeight: 1.1 }}>
                            {user.email.split('@')[0]}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`sider-footer-btn ${collapsed ? 'collapsed' : ''}`}
                  >
                    <LogoutOutlined />
                    {!collapsed && <span>{t('common.navigation.logout')}</span>}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className={`sider-footer-btn primary-action ${collapsed ? 'collapsed' : ''}`}
                  onClick={() => navigate('/login')}
                >
                  <UserOutlined />
                  {!collapsed && <span>{t('common.navigation.login')}</span>}
                </button>
              )}
            </div>
          </div>
        </Sider>

        <Layout className={`main-content-wrapper ${collapsed && !isMobile ? 'sider-collapsed' : ''} ${isLearningPath ? 'full-screen-layout' : ''}`}>
          <Content className="main-content" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1 }}>
              <Outlet />
            </div>
            {!isLearningPath && (
              <footer className="main-layout-footer">
                <p className="copyright">© 2026 FluentNova — khangmoihocit. All rights reserved.</p>
              </footer>
            )}
          </Content>
        </Layout>
      </Layout>
      {feedbackOpen && (
        <Suspense fallback={null}>
          <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </Suspense>
      )}
      <BottomNavigation />
    </Layout>
  );
};

export default MainLayout;
