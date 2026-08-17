import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { userApi } from '../api/user.api';
import { handleFormError } from '../../../utils/apiError';

const ProfileForm = ({ initialData, onUpdateSuccess }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await userApi.updateProfile(values);
      if (res.success) {
        message.success(t('profile.updateSuccess', 'Cập nhật hồ sơ thành công'));
        onUpdateSuccess(res.data);
      }
    } catch (error) {
      const errMsg = handleFormError(error, form, t('profile.updateFailed', 'Cập nhật thất bại'));
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ 
        fullName: initialData.fullName, 
        ankiDeckName: initialData.ankiDeckName,
        ankiVideoDeckName: initialData.ankiVideoDeckName
      }}
      onFinish={handleSubmit}
    >
      <Form.Item
        name="fullName"
        label={t('profile.personalInfo.name')}
        rules={[
          { required: true, message: t('validation.requiredFullName') }
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        name="ankiDeckName"
        label={t('profile.personalInfo.deckName')}
        rules={[
          { required: true, message: t('profile.personalInfo.deckNameRequired', 'Vui lòng nhập tên Deck') }
        ]}
      >
        <Input placeholder={t('profile.personalInfo.deckPlaceholder')} />
      </Form.Item>

      <Form.Item
        name="ankiVideoDeckName"
        label={t('profile.personalInfo.videoDeckName')}
        rules={[
          { required: true, message: t('profile.personalInfo.videoDeckNameRequired', 'Vui lòng nhập tên Deck') }
        ]}
      >
        <Input placeholder={t('profile.personalInfo.videoDeckPlaceholder')} />
      </Form.Item>

      <Form.Item style={{ marginBottom: 0 }}>
        <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#07070A', borderColor: '#07070A' }}>
          {t('common.save')}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default ProfileForm;
