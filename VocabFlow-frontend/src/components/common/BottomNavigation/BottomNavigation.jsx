import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    HomeFilled,
    PlaySquareFilled,
    ReadFilled,
    ThunderboltFilled,
    VideoCameraFilled
} from '@ant-design/icons';
import './BottomNavigation.scss';

const BottomNavigation = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            key: '/',
            icon: <HomeFilled />,
            label: t('common.navigation.home')
        },
        {
            key: '/videos',
            icon: <PlaySquareFilled />,
            label: t('common.navigation.videos')
        },
        {
            key: '/game/setup',
            icon: <ThunderboltFilled />,
            label: t('common.navigation.gameHub')
        },
        {
            key: '/notebook',
            icon: <ReadFilled />,
            label: t('common.navigation.notebook')
        },
        {
            key: '/my-video',
            icon: <VideoCameraFilled />,
            label: t('common.navigation.myVideo')
        }
    ];

    // Hide on learning routes as per SKILL.md
    const isLearningPath = 
        /^\/videos\/[^/]+/.test(location.pathname) || 
        location.pathname.startsWith('/study/') ||
        location.pathname.startsWith('/game/dictation');

    if (isLearningPath) return null;

    return (
        <div className="bottom-navigation">
            {navItems.map((item) => {
                const isActive = item.key === '/' 
                    ? location.pathname === '/' 
                    : location.pathname.startsWith(item.key);
                
                return (
                    <div
                        key={item.key}
                        className={`bottom-nav-item ${isActive ? 'active' : ''}`}
                        onClick={() => navigate(item.key)}
                    >
                        <div className="nav-icon">{item.icon}</div>
                        <span className="nav-label">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default BottomNavigation;
