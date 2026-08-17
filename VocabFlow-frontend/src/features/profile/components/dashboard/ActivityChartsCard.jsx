import React from 'react';

const ActivityChartsCard = () => {
  return (
    <div className="dashboard-card activity-charts">
      <div className="dashboard-card__header">
        <h2 className="dashboard-card__title">Tổng quan & Tiến độ</h2>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.75rem' }}>
            Năng suất học tập (Heatmap)
          </h3>
          <div className="activity-charts__placeholder">
            [Biểu đồ Heatmap Sẽ Tích Hợp Ở Đây]
          </div>
        </div>
        
        <div>
          <h3 style={{ fontFamily: 'Inter', fontSize: '0.875rem', color: 'var(--color-on-surface-variant)', marginBottom: '0.75rem' }}>
            Thời gian học gần đây (Line Chart)
          </h3>
          <div className="activity-charts__placeholder">
            [Biểu đồ Line Chart Sẽ Tích Hợp Ở Đây]
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityChartsCard;
