import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import vi_VN from 'antd/locale/vi_VN';
import en_US from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from './routes/ProtectedRoute';
import PublicRoute from './routes/PublicRoute';
import MainLayout from './layouts/MainLayout/MainLayout';
import AuthLayout from './layouts/AuthLayout/AuthLayout';
import Home from './pages/Home/Home';
import GuidePage from './pages/Guide/GuidePage';
import PrivacyPolicy from './pages/Guide/PrivacyPolicy';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOtp from './pages/Auth/VerifyOtp';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import { NotebookPage, SavedWordsPage } from './features/notebook';
import Profile from './features/profile/pages/ProfilePage';
import { YoutubeLearningPage } from './features/youtubeLearning';
import { LearningPage as VideoStudyPage } from './features/youtubeLearningStudy';
import { LandingPage } from './features/landing';
import { MyVideoSegmentsPage } from './features/myVideo';
import { PracticeTranslatePage } from './features/practiceTranslate';
import FavoriteVideosPage from './pages/Practice/FavoriteVideosPage';
import MyVideoPage from './pages/MyVideo/MyVideoPage';
import CommunityVideosPage from './pages/MyVideo/CommunityVideosPage';
import { LayoutProvider } from './context/LayoutContext';
import ScrollRestoration from './components/common/ScrollRestoration';

import GameHubDashboard from './features/gameHub/pages/GameHubDashboard';
import GameEngine from './features/gameHub/pages/GameEngine';
import { useEffect } from 'react';

function TitleManager() {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const path = location.pathname;
    let title = '';

    if (path === '/') {
      title = 'Trang chủ';
    } else if (path === '/my-video') {
      title = 'Video của tôi';
    } else if (path === '/my-video/community') {
      title = 'Video cộng đồng';
    } else if (path.startsWith('/my-video/') && path.endsWith('/segments')) {
      title = 'Quản lý phân đoạn';
    } else if (path === '/videos') {
      title = 'Kho Video học';
    } else if (path.includes('/study')) {
      title = 'Study';
    } else if (path === '/notebook') {
      title = 'Sổ tay từ vựng';
    } else if (path.includes('/words')) {
      title = 'Từ vựng đã lưu';
    } else if (path === '/favorites') {
      title = 'Video yêu thích';
    } else if (path === '/profile') {
      title = 'Trang cá nhân';
    } else if (path === '/game/setup') {
      title = 'Challenge';
    } else if (path === '/game/dictation') {
      title = 'Dictation challenge';
    } else if (path === '/practice/translate') {
      title = 'Luyện viết';
    } else if (path === '/guide') {
      title = 'Hướng dẫn sử dụng';
    } else if (path === '/privacy') {
      title = 'Chính sách bảo mật';
    } else if (path === '/login') {
      title = 'Đăng nhập';
    } else if (path === '/register') {
      title = 'Đăng ký';
    } else if (path === '/forgot-password') {
      title = 'Quên mật khẩu';
    } else if (path === '/reset-password') {
      title = 'Đặt lại mật khẩu';
    } else if (path === '/verify-otp') {
      title = 'Xác thực OTP';
    }

    document.title = title ? `${title} | FluentNova` : 'FluentNova - Học tiếng Anh qua YouTube';
  }, [location, t]);

  return null;
}

function App() {
  const { i18n } = useTranslation();
  const antLocale = i18n.language === 'en' ? en_US : vi_VN;

  return (
    <ConfigProvider locale={antLocale}>
      <LayoutProvider>
        <BrowserRouter>
          <ScrollRestoration />
          <TitleManager />
          <Routes>
          {/* Landing / Intro page — standalone layout */}
          <Route path="/intro" element={<LandingPage />} />

          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="privacy" element={<PrivacyPolicy />} />

            <Route path="videos">
              <Route index element={<YoutubeLearningPage />} />
              <Route path=":id/study" element={<VideoStudyPage />} />
            </Route>

              {/* Game Hub (Public/Optional Auth) */}
              <Route path="game/setup" element={<GameHubDashboard />} />

              {/* Translation Practice — Luyện viết (Optional Auth to browse, login to submit) */}
              <Route path="practice/translate" element={<PracticeTranslatePage />} />

              {/* Notebook — vocabulary management (Optional Auth) */}
              <Route path="notebook">
                <Route index element={<NotebookPage />} />
                <Route path="units/:unitId/words" element={<SavedWordsPage />} />
              </Route>

              <Route path="favorites" element={<FavoriteVideosPage />} />
              <Route path="my-video" element={<MyVideoPage />} />
              <Route path="my-video/community" element={<CommunityVideosPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="profile" element={<Profile />} />
              <Route path="my-video/:id/segments" element={<MyVideoSegmentsPage />} />

              {/* Game Hub (Protected) */}
              <Route path="game/dictation" element={<GameEngine />} />
            </Route>
          </Route>

          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </LayoutProvider>
  </ConfigProvider>
);
}

export default App;
