import React, { useState, useEffect } from 'react';
import { Calendar, Skeleton, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { FireFilled } from '@ant-design/icons';
import { gameApi } from '../api/gameApi';
import { isAuthenticated } from '@/utils/auth';
import styles from '../styles/GameActivityCalendar.module.scss';

const GameActivityCalendar = () => {
    const [activeDates, setActiveDates] = useState(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            setLoading(false);
            return;
        }

        const fetchCalendarData = async () => {
            try {
                setLoading(true);
                // Fetch up to 100 recent sessions to cover the current month's activity
                const res = await gameApi.getHistory({ pageNo: 1, pageSize: 100 });
                const sessions = res.data.content || [];
                
                const dates = new Set();
                sessions.forEach(session => {
                    if (session.createdAt) {
                        dates.add(dayjs(session.createdAt).format('YYYY-MM-DD'));
                    }
                });
                setActiveDates(dates);
            } catch (err) {
                console.error('Failed to load activity calendar', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCalendarData();
    }, []);

    const dateCellRender = (value) => {
        const dateStr = value.format('YYYY-MM-DD');
        const isActive = activeDates.has(dateStr);

        if (isActive) {
            return (
                <div className={styles['active-day-wrapper']}>
                    <Tooltip title="Đã hoàn thành thử thách">
                        <div className={styles['fire-icon']}>
                            <FireFilled />
                        </div>
                    </Tooltip>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className={styles['calendar-card']}>
                <Skeleton active />
            </div>
        );
    }

    return (
        <div className={styles['calendar-card']}>
            <div className={styles['calendar-header']}>
                <h3 className={styles['calendar-title']}>Chuỗi Thử Thách</h3>
                <div className={styles['streak-badge']}>
                    <FireFilled />
                    <span>{activeDates.size} Ngày</span>
                </div>
            </div>
            {!isAuthenticated() ? (
                <div className={styles['unauth-overlay']}>
                    Đăng nhập để theo dõi chuỗi ngày học của bạn!
                </div>
            ) : (
                <div className={styles['calendar-wrapper']}>
                    <Calendar 
                        fullscreen={false} 
                        fullCellRender={(date) => {
                            const dateStr = date.format('YYYY-MM-DD');
                            const isActive = activeDates.has(dateStr);
                            const isToday = date.isSame(dayjs(), 'day');
                            const isCurrentMonth = date.isSame(dayjs(), 'month');

                            if (!isCurrentMonth) {
                                return <div className={styles['empty-cell']}></div>;
                            }

                            return (
                                <div className={`${styles['custom-cell']} ${isActive ? styles['active'] : ''} ${isToday ? styles['today'] : ''}`}>
                                    <span className={styles['cell-text']}>{date.date()}</span>
                                    {isActive && <FireFilled className={styles['fire-icon']} />}
                                </div>
                            );
                        }}
                        headerRender={({ value, onChange }) => {
                            return (
                                <div className={styles['custom-header']}>
                                    <span className={styles['month-text']}>{value.format('MMMM YYYY')}</span>
                                </div>
                            );
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default GameActivityCalendar;
