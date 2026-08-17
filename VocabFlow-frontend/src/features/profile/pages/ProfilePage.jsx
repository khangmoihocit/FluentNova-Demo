import { useEffect, useMemo, useState } from 'react';
import { message, Skeleton, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

import { extractErrorMessage } from '../../../utils/apiError';
import { setUser as setUserCookie } from '../../../utils/cookie';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import {
  useCurrentUserQuery,
  useGameStatsQuery,
  useLearningStatsQuery,
  useUserStreakQuery,
} from '../../../hooks/queries/useUserQueries';
import { useLearningHistoryInfiniteQuery } from '../../../hooks/queries/useHistoryQueries';
import { useTheme } from '../../theme/context/ThemeContext';

import PersonalInfoTab from '../components/tabs/PersonalInfoTab';
import AccountSettingsTab from '../components/tabs/AccountSettingsTab';
import ChangePasswordModal from '../components/ChangePasswordModal';
import DeleteAccountModal from '../components/DeleteAccountModal';

import ProfileHeroCard from '../components/dashboard/ProfileHeroCard';
import StreakGemsCard from '../components/dashboard/StreakGemsCard';
import QuickStatsCard from '../components/dashboard/QuickStatsCard';
import { myVideoApi } from '../../../services/api/myVideo.api';
import LearningHistoryCard from '../components/dashboard/LearningHistoryCard';
import StreakCalendarCard from '../components/dashboard/StreakCalendarCard';

import './ProfilePage.scss';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [localUser, setLocalUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPwdModalOpen, setIsPwdModalOpen] = useState(false);
  const [isDelModalOpen, setIsDelModalOpen] = useState(false);

  const userQuery = useCurrentUserQuery();
  const statisticsQuery = useLearningStatsQuery();
  const streakQuery = useUserStreakQuery();
  const gameStatsQuery = useGameStatsQuery();
  const historyQuery = useLearningHistoryInfiniteQuery(10);
  const [videoQuota, setVideoQuota] = useState(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const res = await myVideoApi.getUserVideoQuota();
        setVideoQuota(res.data);
      } catch (err) {
        console.error('Error fetching video quota:', err);
      }
    };
    fetchQuota();
  }, []);

  useEffect(() => {
    if (userQuery.data) {
      setUserCookie(userQuery.data);
    }
  }, [userQuery.data]);

  useEffect(() => {
    if (userQuery.isError) {
      message.error(extractErrorMessage(userQuery.error, t('profile.fetchError')));
    }
  }, [t, userQuery.error, userQuery.isError]);

  const history = useMemo(() => {
    const pages = historyQuery.data?.pages || [];
    const firstPage = pages[0] || {};

    return {
      ...firstPage,
      data: pages.flatMap((page) => page?.data || []),
    };
  }, [historyQuery.data]);

  const user = localUser || userQuery.data;

  const handleUserUpdate = (newData) => {
    const updatedUser = { ...user, ...newData };
    setLocalUser(updatedUser);
    setUserCookie(updatedUser);
    queryClient.setQueryData(QUERY_KEYS.currentUser, updatedUser);
    setIsEditModalOpen(false);
  };

  if (userQuery.isLoading && !user) {
    return (
      <div className="profile-dashboard">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!user) return <div className="profile-dashboard">{t('profile.loadError')}</div>;

  const loadingProgress = !statisticsQuery.data && statisticsQuery.isLoading;
  const loadingHistory = !historyQuery.data && historyQuery.isLoading;

  return (
    <div className="profile-dashboard">
      <div className="profile-dashboard__grid">
        <div className="profile-dashboard__sidebar">
          <ProfileHeroCard
            user={user}
            gameStats={gameStatsQuery.data}
            videoQuota={videoQuota}
            onAvatarUpdate={(url) => handleUserUpdate({ avatarUrl: url })}
            onEditClick={() => setIsEditModalOpen(true)}
            onSettingsClick={() => setIsSettingsModalOpen(true)}
            t={t}
          />
          <StreakCalendarCard />
          <StreakGemsCard streak={streakQuery.data} />
          {loadingProgress ? <Skeleton active /> : <QuickStatsCard statistics={statisticsQuery.data} />}
        </div>

        <div className="profile-dashboard__main">
          <LearningHistoryCard
            history={history}
            loading={loadingHistory}
            hasMore={historyQuery.hasNextPage}
            onLoadMore={() => historyQuery.fetchNextPage()}
            loadingMore={historyQuery.isFetchingNextPage}
          />
        </div>
      </div>

      <Modal
        title={<span style={{ fontFamily: 'Manrope', fontSize: '1.25rem' }}>{t('profile.editInfo')}</span>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <PersonalInfoTab user={user} onUpdateSuccess={handleUserUpdate} />
      </Modal>

      <Modal
        title={<span style={{ fontFamily: 'Manrope', fontSize: '1.25rem' }}>{t('profile.accountSettings')}</span>}
        open={isSettingsModalOpen}
        onCancel={() => setIsSettingsModalOpen(false)}
        footer={null}
        width={600}
      >
        <AccountSettingsTab
          user={user}
          theme={theme}
          setTheme={setTheme}
          i18n={i18n}
          t={t}
          onOpenPasswordModal={() => { setIsSettingsModalOpen(false); setIsPwdModalOpen(true); }}
          onOpenDeleteModal={() => { setIsSettingsModalOpen(false); setIsDelModalOpen(true); }}
        />
      </Modal>

      <ChangePasswordModal
        open={isPwdModalOpen}
        onCancel={() => setIsPwdModalOpen(false)}
      />
      <DeleteAccountModal
        open={isDelModalOpen}
        onCancel={() => setIsDelModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
