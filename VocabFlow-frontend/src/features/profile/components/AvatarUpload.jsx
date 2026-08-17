import { useState } from 'react';
import { Avatar, Upload, Button, message, Spin } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/user.api';
import { extractErrorMessage } from '../../../utils/apiError';

const AvatarUpload = ({ currentAvatarUrl, onUploadSuccess }) => {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const customRequest = async ({ file, onSuccess, onError }) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error(t('profile.imageOnly', 'Chỉ có thể tải lên file JPG/PNG!'));
      onError();
      return;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error(t('profile.imageSizeLimit', 'Kích thước ảnh phải nhỏ hơn 5MB!'));
      onError();
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await userApi.uploadAvatar(formData);
      if (res.success) {
        message.success(t('profile.uploadSuccess', 'Tải ảnh lên thành công'));
        if (onUploadSuccess) onUploadSuccess(res.data);
        onSuccess(res.data);
      }
    } catch (err) {
      message.error(extractErrorMessage(err, t('profile.uploadFailed', 'Tải ảnh lên thất bại')));
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <Avatar 
        size={140} 
        src={currentAvatarUrl} 
        icon={!currentAvatarUrl && <UserOutlined />} 
        style={{ border: '2px solid #E4E4E4', background: '#F3F3F3', color: '#07070A' }}
      />
      {uploading && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: '50%' }}>
          <Spin />
        </div>
      )}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <Upload
          customRequest={customRequest}
          showUploadList={false}
          accept="image/png, image/jpeg"
        >
          <Button icon={<UploadOutlined />} disabled={uploading}>
            {t('profile.uploadAvatar', 'Tải ảnh lên')}
          </Button>
        </Upload>
      </div>
    </div>
  );
};

export default AvatarUpload;
