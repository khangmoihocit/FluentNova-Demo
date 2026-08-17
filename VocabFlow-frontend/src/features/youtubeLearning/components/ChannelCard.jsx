import React from 'react';
import { Card, Typography, Avatar } from 'antd';

const { Title, Text } = Typography;

const ChannelCard = ({ channel, isActive, onClick }) => {
    return (
        <Card
            hoverable
            onClick={onClick}
            className={isActive ? 'channel-card-active' : ''}
            styles={{ body: { padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
            style={{ 
                minWidth: '140px', 
                borderRadius: '12px',
                borderColor: '#E4E4E4',
                boxShadow: 'none',
                transition: 'all 0.3s ease',
                flexShrink: 0
            }}
        >
            <Avatar 
                src={channel.avatarUrl} 
                size={56} 
                style={{ marginBottom: '8px', border: '1px solid #E4E4E4' }}
            />
            <Title level={5} style={{ margin: 0, textAlign: 'center', fontSize: '14px', color: '#07070A' }} ellipsis={{ rows: 2 }}>
                {channel.name}
            </Title>
        </Card>
    );
};

export default ChannelCard;
