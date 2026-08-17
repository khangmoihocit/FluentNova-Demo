import { useState, useMemo, useEffect } from 'react';
import {
  Modal, Form, Input, Switch, Button, Upload, Tabs, Alert, message, Typography, Tag, Space,
} from 'antd';
import {
  InboxOutlined, CopyOutlined, FileWordOutlined, EditOutlined, BulbOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { translationApi } from '../api/translationApi';
import { translationDocxApi } from '../api/translationDocxApi';
import styles from '../styles/PracticeTranslatePage.module.scss';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Text, Paragraph } = Typography;

const MAX_SENTENCES = 500;

// System prompt the user pastes into an external AI chat to generate sentences.
const AI_PROMPT = `Bạn là trợ lý tạo câu luyện dịch Việt - Anh. Hãy tạo cho tôi danh sách các câu TIẾNG VIỆT theo chủ đề tôi yêu cầu.

YÊU CẦU:
- Mỗi câu nằm trên MỘT DÒNG riêng.
- CHỈ xuất ra câu tiếng Việt, KHÔNG kèm số thứ tự, KHÔNG kèm bản dịch tiếng Anh, KHÔNG giải thích.
- Câu tự nhiên, độ dài vừa phải, phù hợp luyện dịch.
- Số lượng: [SỐ CÂU] câu. Chủ đề: [CHỦ ĐỀ CỦA BẠN].

Bắt đầu xuất danh sách câu ngay bây giờ.`;

export default function CreateTopicModal({ open, onClose, onCreated, editTopic = null }) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('paste');
  const [rawText, setRawText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEdit = !!editTopic;

  // Prefill form when editing an existing topic
  useEffect(() => {
    if (open && editTopic) {
      form.setFieldsValue({
        title: editTopic.title,
        description: editTopic.description,
        isPublic: !!editTopic.isPublic,
      });
    }
  }, [open, editTopic, form]);

  // Parse the textarea into sentences (one per non-empty line).
  const parsedSentences = useMemo(() => {
    return rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, MAX_SENTENCES);
  }, [rawText]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      message.success(t('practiceTranslate.create.promptCopied'));
    } catch {
      message.error(t('practiceTranslate.create.copyFailed'));
    }
  };

  const handleDocxUpload = async (file) => {
    const nameLower = (file.name || '').toLowerCase();
    if (!nameLower.endsWith('.docx')) {
      message.error(t('practiceTranslate.create.onlyDocx'));
      return false;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error(t('practiceTranslate.create.fileTooBig'));
      return false;
    }
    setParsing(true);
    try {
      const res = await translationDocxApi.parseDocx(file);
      const sentences = res?.sentences || [];
      if (sentences.length === 0) {
        message.warning(t('practiceTranslate.create.noSentencesInFile'));
      } else {
        // Append parsed sentences into the textarea so the user can review/edit before saving.
        setRawText((prev) => {
          const merged = prev ? `${prev}\n${sentences.join('\n')}` : sentences.join('\n');
          return merged;
        });
        setActiveTab('paste');
        message.success(t('practiceTranslate.create.parsedCount', { count: sentences.length }));
      }
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.create.parseError'));
    } finally {
      setParsing(false);
    }
    return false; // prevent antd auto-upload
  };

  const handleSubmit = async () => {
    let values;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        // Edit mode: update metadata only.
        const res = await translationApi.updateTopic(editTopic.id, {
          title: values.title.trim(),
          description: values.description?.trim() || '',
          isPublic: !!values.isPublic,
        });
        message.success(t('practiceTranslate.manage.topicUpdated'));
        onCreated?.(res.data);
        onClose();
        return;
      }

      if (parsedSentences.length === 0) {
        message.warning(t('practiceTranslate.create.needSentences'));
        setSaving(false);
        return;
      }
      const res = await translationApi.createTopic({
        title: values.title.trim(),
        description: values.description?.trim() || '',
        isPublic: !!values.isPublic,
        difficultyLevel: 'MEDIUM',
        sentences: parsedSentences,
      });
      message.success(t('practiceTranslate.create.success', { count: parsedSentences.length }));
      form.resetFields();
      setRawText('');
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      message.error(err?.message || t('practiceTranslate.create.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const tabItems = [
    {
      key: 'paste',
      label: <span><EditOutlined /> {t('practiceTranslate.create.pasteTab')}</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('practiceTranslate.create.pasteHint')}
          </Text>
          <TextArea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={t('practiceTranslate.create.pastePlaceholder')}
            autoSize={{ minRows: 8, maxRows: 16 }}
            style={{ borderRadius: 10, fontSize: 14 }}
          />
        </div>
      ),
    },
    {
      key: 'docx',
      label: <span><FileWordOutlined /> {t('practiceTranslate.create.docxTab')}</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Alert
            type="info"
            showIcon
            message={t('practiceTranslate.create.docxInfo')}
            style={{ borderRadius: 10 }}
          />
          <Dragger
            accept=".docx"
            maxCount={1}
            beforeUpload={handleDocxUpload}
            showUploadList={false}
            disabled={parsing}
          >
            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
            <p className="ant-upload-text">{t('practiceTranslate.create.docxDragText')}</p>
            <p className="ant-upload-hint">{t('practiceTranslate.create.docxDragHint')}</p>
          </Dragger>
        </div>
      ),
    },
    {
      key: 'ai',
      label: <span><BulbOutlined /> {t('practiceTranslate.create.aiTab')}</span>,
      children: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('practiceTranslate.create.aiGuide')}
          </Text>
          <ol style={{ paddingLeft: 18, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            <li>{t('practiceTranslate.create.aiStep1')}</li>
            <li>{t('practiceTranslate.create.aiStep2')}</li>
            <li>{t('practiceTranslate.create.aiStep3')}</li>
          </ol>
          <div style={{ background: 'var(--color-surface-container-low)', borderRadius: 10, padding: 12 }}>
            <Paragraph style={{ whiteSpace: 'pre-wrap', fontSize: 12.5, margin: 0, fontFamily: 'var(--font-body)' }}>
              {AI_PROMPT}
            </Paragraph>
          </div>
          <Button icon={<CopyOutlined />} onClick={handleCopyPrompt} style={{ borderRadius: 8, alignSelf: 'flex-start' }}>
            {t('practiceTranslate.create.copyPrompt')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={isEdit ? t('practiceTranslate.manage.editTopicTitle') : t('practiceTranslate.create.title')}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose}>{t('common.cancel')}</Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSubmit}>
          {isEdit ? t('common.save') : t('practiceTranslate.create.submit')}
        </Button>,
      ]}
      styles={{ body: { maxHeight: '74vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical" initialValues={{ isPublic: false }}>
        <Form.Item
          name="title"
          label={t('practiceTranslate.create.topicTitle')}
          rules={[{ required: true, message: t('practiceTranslate.create.titleRequired') }]}
        >
          <Input placeholder={t('practiceTranslate.create.topicTitlePlaceholder')} maxLength={255} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item name="description" label={t('practiceTranslate.create.topicDesc')}>
          <TextArea placeholder={t('practiceTranslate.create.topicDescPlaceholder')} autoSize={{ minRows: 1, maxRows: 3 }} maxLength={1000} style={{ borderRadius: 8 }} />
        </Form.Item>

        <Form.Item
          name="isPublic"
          label={t('practiceTranslate.create.visibility')}
          valuePropName="checked"
          tooltip={t('practiceTranslate.create.visibilityTip')}
        >
          <Switch
            checkedChildren={t('practiceTranslate.create.public')}
            unCheckedChildren={t('practiceTranslate.create.private')}
          />
        </Form.Item>
      </Form>

      {!isEdit && (
        <>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

          <Space style={{ marginTop: 8 }}>
            <Tag color={parsedSentences.length > 0 ? 'green' : 'default'}>
              {t('practiceTranslate.create.sentenceCount', { count: parsedSentences.length })}
            </Tag>
            {parsedSentences.length >= MAX_SENTENCES && (
              <Tag color="warning">{t('practiceTranslate.create.maxReached', { max: MAX_SENTENCES })}</Tag>
            )}
          </Space>
        </>
      )}

      {isEdit && (
        <Alert
          type="info"
          showIcon
          message={t('practiceTranslate.manage.editTopicNote')}
          style={{ borderRadius: 10 }}
        />
      )}
    </Modal>
  );
}
