import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Tooltip,
} from 'antd';
import {
  CalculatorOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { myVideoSegmentApi } from '../api/myVideoSegment.api';

const { Text, Paragraph } = Typography;

const findAnswerPosition = (segmentText = '', answerText = '') => {
  const answer = answerText.trim();
  if (!segmentText || !answer) return null;

  const lowerSegment = segmentText.toLowerCase();
  const lowerAnswer = answer.toLowerCase();
  let cursor = 0;

  while (cursor < lowerSegment.length) {
    const start = lowerSegment.indexOf(lowerAnswer, cursor);
    if (start < 0) return null;

    const end = start + answer.length;
    const before = lowerSegment[start - 1];
    const after = lowerSegment[end];
    const startsClean = !before || /[\s"'([{,.;:!?-]/.test(before);
    const endsClean = !after || /[\s"')\]},.;:!?-]/.test(after);

    if (startsClean && endsClean) {
      const tokenIndex = [...segmentText.slice(0, start).matchAll(/\S+/g)].length;
      return { startCharIndex: start, endCharIndex: end, tokenIndex };
    }

    cursor = end;
  }

  return null;
};

const formatTime = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '--:--';
  const minute = Math.floor(num / 60).toString().padStart(2, '0');
  const second = Math.floor(num % 60).toString().padStart(2, '0');
  return `${minute}:${second}`;
};

export default function FillBlankTab({ videoId, onStartAiTask, isAiGenerating, refreshTrigger }) {
  const [form] = Form.useForm();
  const [segments, setSegments] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fixingIndex, setFixingIndex] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [viewMode, setViewMode] = useState('transcript'); // 'transcript' | 'preview'
  const watchedSegmentId = Form.useWatch('segmentId', form);
  const watchedAnswerText = Form.useWatch('answerText', form);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [segmentRes, itemRes] = await Promise.all([
        myVideoSegmentApi.getByVideoId(videoId),
        myVideoSegmentApi.getBlanks(videoId),
      ]);
      setSegments(segmentRes?.data?.segments || []);
      setItems(itemRes?.data || []);
    } catch (error) {
      message.error(error?.message || 'Không thể tải dữ liệu Fill Blank.');
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  const segmentOptions = useMemo(() => segments.map((segment) => ({
    value: segment.id,
    label: `#${segment.segmentOrder} [${formatTime(segment.startTime)}] - ${segment.englishText}`,
  })), [segments]);

  const resetForm = useCallback(() => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({
      blankType: 'WORD',
      difficultyLevel: 'MEDIUM',
      points: 1,
      isActive: true,
      blankOrder: (items?.length || 0) + 1,
    });
  }, [form, items?.length]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!watchedSegmentId || !watchedAnswerText?.trim()) return;
    const segment = segments.find((item) => item.id === watchedSegmentId);
    const position = findAnswerPosition(segment?.englishText, watchedAnswerText);
    if (!position) return;

    form.setFieldsValue(position);
  }, [form, segments, watchedAnswerText, watchedSegmentId]);

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
    });
  };

  const handleCalculateCurrentIndex = () => {
    const values = form.getFieldsValue();
    const selectedSegment = segments.find((item) => item.id === values.segmentId);
    const position = findAnswerPosition(selectedSegment?.englishText, values.answerText || '');
    if (!position) {
      message.warning('Không tìm thấy từ khoá trong segment đã chọn!');
      return;
    }
    form.setFieldsValue(position);
    message.success('Đã tự động tính start/end index thành công!');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const selectedSegment = segments.find((item) => item.id === values.segmentId);
      const autoPosition = findAnswerPosition(selectedSegment?.englishText, values.answerText);
      const payload = {
        ...values,
        ...(autoPosition || {}),
        acceptedAnswers: [],
        blankType: 'WORD',
        difficultyLevel: 'MEDIUM',
        hint: null,
        points: values.points || 1,
      };

      setSaving(true);
      if (editingItem) {
        await myVideoSegmentApi.updateBlank(editingItem.id, payload);
        message.success('Đã cập nhật blank thành công!');
      } else {
        await myVideoSegmentApi.createBlank(videoId, payload);
        message.success('Đã tạo blank thành công!');
      }
      resetForm();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || 'Không thể lưu blank.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await myVideoSegmentApi.deleteBlank(itemId);
      message.success('Đã xoá blank item thành công!');
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể xoá blank.');
    }
  };

  const handleBulkDelete = async (targetIds, label) => {
    if (!targetIds.length) {
      message.warning('Không có blank nào để xoá.');
      return;
    }
    setDeletingBulk(true);
    try {
      const res = await myVideoSegmentApi.bulkDeleteBlanks(videoId, targetIds);
      const data = res?.data || {};
      const deleted = data.deleted ?? targetIds.length;
      message.success(`Đã xoá ${deleted} blank ${label}!`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể xoá hàng loạt.');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeletingBulk(true);
    try {
      const res = await myVideoSegmentApi.deleteAllBlanks(videoId);
      const data = res?.data || {};
      message.success(`Đã xoá toàn bộ ${data.deleted ?? 0} blank của bài học!`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể xoá tất cả blank.');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleFixAllIndexes = async () => {
    setFixingIndex(true);
    try {
      let updated = 0;
      for (const item of items) {
        const segment = segments.find((seg) => seg.id === item.segmentId);
        const position = findAnswerPosition(segment?.englishText, item.answerText || '');
        if (!position) continue;
        await myVideoSegmentApi.updateBlank(item.id, {
          ...item,
          ...position,
          acceptedAnswers: item.acceptedAnswers || [],
          blankType: 'WORD',
          difficultyLevel: item.difficultyLevel || 'MEDIUM',
          points: item.points || 1,
          isActive: item.isActive ?? true,
        });
        updated += 1;
      }
      message.success(`Đã tự động tính lại start/end index cho ${updated} blank!`);
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể tính lại index.');
    } finally {
      setFixingIndex(false);
    }
  };

  const handleAiGenerateBlanks = () => {
    if (!onStartAiTask) {
      message.warning('Tính năng auto AI chưa sẵn sàng. Vui lòng tải lại trang.');
      return;
    }
    onStartAiTask('fillBlank');
  };

  const handleSelection = (segment) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    if (!selectedText.trim()) return;

    const segmentText = segment.englishText || '';
    const start = segmentText.toLowerCase().indexOf(selectedText.toLowerCase());
    if (start < 0) return;

    form.setFieldsValue({
      segmentId: segment.id,
      answerText: selectedText.trim(),
      startCharIndex: start,
      endCharIndex: start + selectedText.length,
      tokenIndex: undefined,
    });
    message.info(`Đã chọn từ: "${selectedText.trim()}" từ transcript!`);
  };

  const previewSegments = useMemo(() => {
    const activeItems = items.filter((item) => item.isActive);
    return segments.map((segment) => {
      const blanks = activeItems
        .filter((item) => item.segmentId === segment.id)
        .sort((a, b) => (b.startCharIndex ?? -1) - (a.startCharIndex ?? -1));
      let text = segment.englishText || '';
      blanks.forEach((blank) => {
        if (blank.startCharIndex != null && blank.endCharIndex != null && blank.endCharIndex <= text.length) {
          text = `${text.slice(0, blank.startCharIndex)}____${text.slice(blank.endCharIndex)}`;
        } else if (blank.answerText) {
          const escaped = blank.answerText.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          text = text.replace(new RegExp(escaped, 'gi'), '____');
        }
      });
      return { ...segment, previewText: text };
    });
  }, [items, segments]);

  const groupedParagraphs = useMemo(() => {
    const paragraphs = [];
    let currentParagraph = [];

    previewSegments.forEach((seg) => {
      if (seg.lineBreakBefore && currentParagraph.length > 0) {
        paragraphs.push(currentParagraph);
        currentParagraph = [];
      }
      currentParagraph.push(seg);
    });

    if (currentParagraph.length > 0) {
      paragraphs.push(currentParagraph);
    }

    return paragraphs;
  }, [previewSegments]);

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'blankOrder',
      key: 'blankOrder',
      width: 80,
      align: 'center',
    },
    {
      title: 'Phân đoạn',
      dataIndex: 'segmentOrder',
      key: 'segmentOrder',
      width: 110,
      render: (value) => <Tag color="geekblue">Phân đoạn #{value}</Tag>,
    },
    {
      title: 'Từ khoá ẩn (Answer)',
      dataIndex: 'answerText',
      key: 'answerText',
      render: (text) => <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{text}</span>,
    },
    {
      title: 'Điểm số',
      dataIndex: 'points',
      key: 'points',
      width: 90,
      align: 'center',
    },
    {
      title: 'Kích hoạt',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (value) => (
        <Tag color={value ? 'success' : 'default'} style={{ borderRadius: 4 }}>
          {value ? 'Active' : 'Hidden'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined style={{ color: '#4f46e5' }} />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Xoá blank này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Alert
        message={
          <span style={{ fontWeight: 600, color: '#b45309' }}>
            💡 Hướng dẫn tạo điền từ (Fill Blank) nhanh bằng transcript
          </span>
        }
        description={
          <div style={{ fontSize: 13, marginTop: 4, color: '#d97706' }}>
            Bạn có thể **bôi đen từ/cụm từ** trực tiếp trong khung **Transcript** ở bên phải. Hệ thống sẽ tự động bắt lấy từ đó, tính toán vị trí chỉ mục chính xác và điền trực tiếp vào form tạo bên trái! Hoặc nhấn **Auto AI** để backend tự động phân tích và tạo điền từ thông minh bằng Gemini.
          </div>
        }
        type="warning"
        showIcon={false}
        style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '1px solid #fcd34d',
          borderRadius: 12,
        }}
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={10}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {editingItem ? 'Chỉnh sửa Blank Item' : 'Tạo mới Blank Item'}
              </span>
            }
            extra={
              <Space>
                <Button
                  type="primary"
                  ghost
                  icon={<RobotOutlined />}
                  onClick={handleAiGenerateBlanks}
                  loading={isAiGenerating}
                  style={{ borderRadius: 6, borderColor: '#6366f1', color: '#6366f1' }}
                >
                  Auto AI
                </Button>
                <Tooltip title="Tính lại index start/end cho toàn bộ blank dựa trên text segment">
                  <Button icon={<CalculatorOutlined />} onClick={handleFixAllIndexes} loading={fixingIndex}>
                    Tính lại Index
                  </Button>
                </Tooltip>
                <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} />
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' }}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{ blankType: 'WORD', difficultyLevel: 'MEDIUM', points: 1, isActive: true }}
            >
              <Form.Item name="segmentId" label={<span style={{ fontWeight: 600 }}>Phân đoạn câu gốc</span>} rules={[{ required: true, message: 'Vui lòng chọn phân đoạn!' }]}>
                <Select
                  options={segmentOptions}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Chọn phân đoạn để ẩn từ"
                  size="large"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="blankOrder" label={<span style={{ fontWeight: 600 }}>Thứ tự</span>} rules={[{ required: true, message: 'Nhập order' }]}>
                    <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="points" label={<span style={{ fontWeight: 600 }}>Điểm số</span>}>
                    <InputNumber min={1} style={{ width: '100%', borderRadius: 8 }} size="large" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isActive" label={<span style={{ fontWeight: 600 }}>Kích hoạt</span>} valuePropName="checked">
                    <Switch style={{ marginTop: 8 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="answerText"
                label={<span style={{ fontWeight: 600 }}>Từ khoá cần ẩn (Answer)</span>}
                rules={[{ required: true, message: 'Vui lòng nhập từ khoá đáp án!' }]}
              >
                <Input placeholder="Ví dụ: memorize" size="large" style={{ borderRadius: 8 }} />
              </Form.Item>

              <Row gutter={12}>
                <Col span={8}>
                  <Form.Item name="startCharIndex" label={<span style={{ fontWeight: 500, fontSize: 12 }}>Start Char Index</span>}>
                    <InputNumber min={0} style={{ width: '100%', borderRadius: 6 }} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="endCharIndex" label={<span style={{ fontWeight: 500, fontSize: 12 }}>End Char Index</span>}>
                    <InputNumber min={0} style={{ width: '100%', borderRadius: 6 }} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="tokenIndex" label={<span style={{ fontWeight: 500, fontSize: 12 }}>Token Index</span>}>
                    <InputNumber min={0} style={{ width: '100%', borderRadius: 6 }} disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Space style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  loading={saving}
                  onClick={handleSubmit}
                  size="large"
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    border: 'none',
                    height: 40,
                  }}
                >
                  {editingItem ? 'Cập nhật' : 'Tạo Blank'}
                </Button>
                <Button icon={<CalculatorOutlined />} onClick={handleCalculateCurrentIndex} size="large" style={{ borderRadius: 8, height: 40 }}>
                  Tính Index thủ công
                </Button>
                <Button onClick={resetForm} size="large" style={{ borderRadius: 8, height: 40 }}>Huỷ</Button>
              </Space>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {viewMode === 'transcript' ? 'Transcript bài học (Bôi đen từ)' : 'Xem trước bài học (Preview)'}
              </span>
            }
            extra={
              <Space size="small">
                <Button
                  type={viewMode === 'transcript' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setViewMode('transcript')}
                  style={{ borderRadius: 6 }}
                >
                  Dịch/Bôi đen
                </Button>
                <Button
                  type={viewMode === 'preview' ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setViewMode('preview')}
                  style={{ borderRadius: 6 }}
                >
                  Xem trước
                </Button>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' }}
          >
            <div style={{ maxHeight: 440, overflowY: 'auto', paddingRight: 8 }}>
              {viewMode === 'transcript' ? (
                segments.map((segment) => (
                  <div
                    key={segment.id}
                    style={{
                      padding: '12px 8px',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.2s',
                      borderRadius: 8,
                    }}
                    className="hover:bg-slate-50"
                  >
                    <Space size="small" wrap style={{ marginBottom: 4 }}>
                      <Tag color="purple" style={{ fontWeight: 600 }}>Phân đoạn #{segment.segmentOrder}</Tag>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {formatTime(segment.startTime)} - {formatTime(segment.endTime)}
                      </Text>
                    </Space>
                    <Paragraph
                      style={{ margin: 0, fontSize: 14, color: '#1f2937', cursor: 'text', lineHeight: 1.6 }}
                      onMouseUp={() => handleSelection(segment)}
                    >
                      {segment.englishText}
                    </Paragraph>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'justify', fontSize: '14px', lineHeight: '1.8', color: '#1f2937', padding: '8px' }}>
                  {groupedParagraphs.map((para, pIdx) => (
                    <p key={`p-${pIdx}`} style={{ marginBottom: '16px' }}>
                      {para.map((seg) => (
                        <span key={seg.id} style={{ marginRight: '6px' }}>
                          {seg.previewText}
                        </span>
                      ))}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <Card
        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Danh sách Blank đã tạo ({items.length})</span>}
        extra={
          <Space>
            <Popconfirm
              title={`Xoá ${selectedRowKeys.length} blank đã chọn?`}
              onConfirm={() => handleBulkDelete(selectedRowKeys, 'đã chọn')}
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              disabled={selectedRowKeys.length === 0}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
                loading={deletingBulk}
                style={{ borderRadius: 6 }}
              >
                Xoá đã chọn ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Popconfirm
              title={`Xoá TẤT CẢ ${items.length} blank của bài học này?`}
              description="Hành động này không thể hoàn tác."
              onConfirm={handleDeleteAll}
              okText="Xoá tất cả"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              disabled={items.length === 0}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                disabled={items.length === 0}
                loading={deletingBulk}
                style={{ borderRadius: 6 }}
              >
                Xoá tất cả
              </Button>
            </Popconfirm>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6', marginTop: 10 }}
      >
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={items}
          loading={loading}
          pagination={false}
          scroll={{ x: 800 }}
          style={{ borderRadius: 8, overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
}
