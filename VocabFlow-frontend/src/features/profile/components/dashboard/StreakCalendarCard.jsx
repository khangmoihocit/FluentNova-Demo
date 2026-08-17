import React, { useState, useEffect } from 'react';
import { Button, Space, Spin, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, FireFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { progressApi } from '../../../learningHub/api/progress.api';

const StreakCalendarCard = () => {
    const { t } = useTranslation();
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [activeDates, setActiveDates] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchCalendarData = async (date) => {
        setLoading(true);
        try {
            const res = await progressApi.getStreakCalendar(date.month() + 1, date.year());
            if (res.success) {
                setActiveDates(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch streak calendar:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCalendarData(currentMonth);
    }, [currentMonth]);

    const handlePrevMonth = () => setCurrentMonth(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => setCurrentMonth(currentMonth.add(1, 'month'));
    const handleToday = () => setCurrentMonth(dayjs());

    const generateCalendarGrid = () => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const startDate = startOfMonth.startOf('week');
        const endDate = endOfMonth.endOf('week');

        const rows = [];
        let days = [];
        let day = startDate;

        while (day.isBefore(endDate)) {
            for (let i = 0; i < 7; i++) {
                const dateStr = day.format('YYYY-MM-DD');
                const isCurrentMonth = day.month() === currentMonth.month();
                const isActive = activeDates.includes(dateStr);
                const isToday = day.isSame(dayjs(), 'day');

                days.push({
                    day,
                    dateStr,
                    isCurrentMonth,
                    isActive,
                    isToday
                });
                day = day.add(1, 'day');
            }
            rows.push(days);
            days = [];
        }
        return rows;
    };

    const calendarGrid = generateCalendarGrid();
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="streak-calendar-solar">
            {/* Background Decorative Element - Overlapping */}
            <div className="streak-calendar-solar__bg-fire">
                <FireFilled />
            </div>

            <div className="streak-calendar-solar__header">
                <div>
                    <h3 className="streak-calendar-solar__title">
                        {t('profile.streak.calendarTitle', 'Hành trình rực rỡ')}
                    </h3>
                    <p className="streak-calendar-solar__subtitle">
                        {t('profile.streak.calendarSubtitle', 'Ghi dấu mỗi ngày nỗ lực của bạn')}
                    </p>
                </div>
                <Space className="streak-calendar-solar__nav">
                    <Button 
                        size="small" 
                        type="text" 
                        onClick={handleToday}
                        className="streak-calendar-solar__today-btn"
                    >
                        {t('common.today', 'Hôm nay')}
                    </Button>
                    <div className="streak-calendar-solar__month-picker">
                        <Button 
                            type="text"
                            size="small" 
                            icon={<LeftOutlined />} 
                            onClick={handlePrevMonth} 
                        />
                        <span className="streak-calendar-solar__month-label">
                            {currentMonth.format('MMMM YYYY')}
                        </span>
                        <Button 
                            type="text"
                            size="small" 
                            icon={<RightOutlined />} 
                            onClick={handleNextMonth} 
                            disabled={currentMonth.isSame(dayjs(), 'month')}
                        />
                    </div>
                </Space>
            </div>

            <div className="streak-calendar-solar__body">
                {loading && (
                    <div className="streak-calendar-solar__overlay">
                        <Spin size="small" />
                    </div>
                )}
                
                <div className="streak-calendar-solar__week-header">
                    {dayLabels.map(label => (
                        <div key={label} className="streak-calendar-solar__label">{label}</div>
                    ))}
                </div>

                <div className="streak-calendar-solar__grid">
                    {calendarGrid.map((week, i) => (
                        <div key={i} className="streak-calendar-solar__week">
                            {week.map(({ day, isCurrentMonth, isActive, isToday }) => (
                                <div 
                                    key={day.toString()} 
                                    className={`streak-calendar-solar__day ${!isCurrentMonth ? 'outside' : ''} ${isActive ? 'active' : ''} ${isToday ? 'today' : ''}`}
                                >
                                    <span className="streak-calendar-solar__date-num">{day.date()}</span>
                                    {isActive && (
                                        <div className="streak-calendar-solar__active-glow">
                                            <FireFilled />
                                        </div>
                                    )}
                                    {isToday && !isActive && <div className="streak-calendar-solar__today-indicator" />}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="streak-calendar-solar__footer">
                <div className="streak-calendar-solar__legend">
                    <div className="streak-calendar-solar__legend-item">
                        <div className="streak-calendar-solar__legend-dot active" />
                        <span>{t('profile.streak.legendCompleted', 'Đã hoàn thành')}</span>
                    </div>
                    <div className="streak-calendar-solar__legend-item">
                        <div className="streak-calendar-solar__legend-dot today" />
                        <span>{t('profile.streak.legendToday', 'Hôm nay')}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StreakCalendarCard;
