import { useState } from 'react';
import { Button, Form, Input, Modal, Select, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { feedbackApi } from '../api/feedback.api';
import styles from './FeedbackModal.module.scss';

const FEEDBACK_TYPES = [
  { value: 'SUBTITLE_ERROR', labelKey: 'feedback.types.subtitleError' },
  { value: 'UI_UX_BUG', labelKey: 'feedback.types.uiUxBug' },
  { value: 'CONTENT_REQUEST', labelKey: 'feedback.types.contentRequest' },
  { value: 'OTHER', labelKey: 'feedback.types.other' },
];

const FeedbackModal = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const selectedType = Form.useWatch('type', form);

  const handleSubmit = async (values) => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await feedbackApi.submitFeedback({
        type: values.type,
        videoReference: values.videoReference?.trim() || null,
        content: values.content.trim(),
      });

      message.success(t('feedback.success'));
      form.resetFields();
      onClose();
    } catch (error) {
      if (error?.status === 429 || error?.code === 'FEEDBACK_RATE_LIMIT_EXCEEDED') {
        message.warning(error.message || t('feedback.rateLimited'));
      } else {
        message.error(error?.message || t('common.notifications.errorOccurred'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!submitting) {
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      centered
      destroyOnHidden
      rootClassName={styles.feedbackModalRoot}
      title={<span className={styles.title}>{t('feedback.title')}</span>}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ type: 'SUBTITLE_ERROR' }}
        onFinish={handleSubmit}
        disabled={submitting}
        className={styles.form}
      >
        <Form.Item
          name="type"
          label={t('feedback.type')}
          rules={[{ required: true, message: t('feedback.validation.typeRequired') }]}
        >
          <Select
            options={FEEDBACK_TYPES.map((type) => ({
              value: type.value,
              label: t(type.labelKey),
            }))}
          />
        </Form.Item>

        <Form.Item
          name="videoReference"
          label={t('feedback.videoReference')}
          extra={selectedType === 'SUBTITLE_ERROR' ? t('feedback.videoReferenceHint') : null}
          rules={[{ max: 255, message: t('feedback.validation.videoReferenceMax') }]}
        >
          <Input placeholder={t('feedback.videoReferencePlaceholder')} allowClear />
        </Form.Item>

        <Form.Item
          name="content"
          label={t('feedback.message')}
          rules={[
            { required: true, whitespace: true, message: t('feedback.validation.messageRequired') },
            { max: 4000, message: t('feedback.validation.messageMax') },
          ]}
        >
          <Input.TextArea
            placeholder={t('feedback.messagePlaceholder')}
            autoSize={{ minRows: 5, maxRows: 8 }}
            showCount
            maxLength={4000}
          />
        </Form.Item>

        <div className={styles.actions}>
          <Button onClick={handleCancel} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={submitting}
            disabled={submitting}
          >
            {t('feedback.submit')}
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default FeedbackModal;
