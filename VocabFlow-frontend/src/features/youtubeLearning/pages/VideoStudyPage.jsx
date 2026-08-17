import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';

const VideoStudyPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 64px)', background: '#F3F3F3' }}>
            <Result
                status="404"
                title={`Study feature for video ${id} is coming soon!`}
                subTitle="We are currently building this feature."
                extra={<Button type="primary" onClick={() => navigate('/videos')} style={{ background: '#07070A', borderColor: '#07070A' }}>Back to Video List</Button>}
            />
        </div>
    );
};

export default VideoStudyPage;
