import React from 'react';
import { CrownFilled } from '@ant-design/icons';

const PremiumCard = () => {
  return (
    <div className="premium-card">
      <CrownFilled className="premium-card__icon" />
      <div className="premium-card__info">
        <h3 className="premium-card__title">Trạng thái Premium</h3>
        <p className="premium-card__desc">Nâng cấp để mở khóa mọi tính năng</p>
      </div>
      <button className="premium-card__btn">Nâng cấp</button>
    </div>
  );
};

export default PremiumCard;
