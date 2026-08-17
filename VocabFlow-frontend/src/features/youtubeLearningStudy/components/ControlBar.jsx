import React from 'react';
import { Button, Tooltip } from 'antd';
import {
    PlayCircleOutlined,
    PauseCircleOutlined,
    StepForwardOutlined,
    StepBackwardOutlined,
} from '@ant-design/icons';
import styles from '../styles/ControlBar.module.scss';

const ControlBar = ({ isPlaying, onTogglePlay, onPrev, onNext, disablePrev, disableNext }) => {
    return (
        <div className={styles['control-bar']}>
            <Tooltip title="Previous (Ctrl + ←)">
                <Button
                    className={styles['nav-btn']}
                    icon={<StepBackwardOutlined />}
                    disabled={disablePrev}
                    onClick={onPrev}
                />
            </Tooltip>
            <Tooltip title="Play/Replay (Ctrl)">
                <Button
                    className={styles['play-btn']}
                    type="primary"
                    size="large"
                    icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                    onClick={onTogglePlay}
                    style={{ backgroundColor: '#FFFFFF', borderColor: '#E4E4E4', color: '#07070A' }}
                >
                    {isPlaying ? 'Pause' : 'Play'}
                </Button>
            </Tooltip>
            <Tooltip title="Next (Ctrl + →)">
                <Button
                    className={styles['nav-btn']}
                    icon={<StepForwardOutlined />}
                    disabled={disableNext}
                    onClick={onNext}
                />
            </Tooltip>
        </div>
    );
};

export default ControlBar;
