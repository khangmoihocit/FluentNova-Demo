import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { myVideoSegmentApi } from '../api/myVideoSegment.api';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

const emptyOption = (order = 1) => ({ optionText: '', isCorrect: order === 1, optionOrder: order });
const defaultOptions = () => [emptyOption(1), emptyOption(2), emptyOption(3)];

export default function QuizTab({ videoId, onStartAiTask, isAiGenerating, refreshTrigger }) {
  const [form] = Form.useForm();
  const [quizzes, setQuizzes] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [quizRes, segmentRes] = await Promise.all([
        myVideoSegmentApi.getQuizzes(videoId),
        myVideoSegmentApi.getByVideoId(videoId),
      ]);
      setQuizzes(quizRes?.data || []);
      setSegments(segmentRes?.data?.segments || []);
    } catch (error) {
      message.error(error?.message || 'Không thể tải danh sách câu hỏi Quiz.');
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

  const resetForm = useCallback(() => {
    setEditingQuiz(null);
    form.resetFields();
    form.setFieldsValue({
      questionType: 'MULTIPLE_CHOICE',
      difficultyLevel: 'MEDIUM',
      orderIndex: (quizzes?.length || 0) + 1,
      isPublished: true,
      options: defaultOptions(),
    });
  }, [form, quizzes?.length]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    form.setFieldsValue({
      questionText: quiz.questionText,
      explanation: quiz.explanation,
      questionType: quiz.questionType || 'MULTIPLE_CHOICE',
      difficultyLevel: quiz.difficultyLevel || 'MEDIUM',
      orderIndex: quiz.orderIndex || 0,
      isPublished: quiz.isPublished ?? true,
      options: quiz.options?.length ? quiz.options : defaultOptions(),
    });
  };

  const validateOptions = (options = []) => {
    const validOptions = options.filter((option) => option?.optionText?.trim());
    if (validOptions.length < 3) {
      throw new Error('Loại MULTIPLE_CHOICE cần ít nhất 3 tuỳ chọn đáp án!');
    }
    const correctCount = validOptions.filter((option) => option.isCorrect).length;
    if (correctCount < 1) {
      throw new Error('Vui lòng chọn ít nhất 1 đáp án ĐÚNG!');
    }
    return validOptions.map((option, index) => ({
      id: option.id, // Keep ID if editing existing option
      optionText: option.optionText.trim(),
      isCorrect: Boolean(option.isCorrect),
      optionOrder: option.optionOrder ?? index + 1,
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        options: validateOptions(values.options),
      };

      setSaving(true);
      if (editingQuiz) {
        await myVideoSegmentApi.updateQuiz(editingQuiz.id, payload);
        message.success('Đã cập nhật câu hỏi Quiz thành công!');
      } else {
        await myVideoSegmentApi.createQuiz(videoId, payload);
        message.success('Đã tạo câu hỏi Quiz mới thành công!');
      }
      resetForm();
      loadData();
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.message || 'Không thể lưu câu hỏi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (quizId) => {
    try {
      await myVideoSegmentApi.deleteQuiz(quizId);
      message.success('Đã xoá câu hỏi Quiz thành công!');
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể xoá câu hỏi.');
    }
  };

  const handleBulkDelete = async (targetIds, label) => {
    if (!targetIds.length) {
      message.warning('Không có câu hỏi nào để xoá.');
      return;
    }
    setDeletingBulk(true);
    try {
      const res = await myVideoSegmentApi.bulkDeleteQuizzes(videoId, targetIds);
      const data = res?.data || {};
      const deleted = data.deleted ?? targetIds.length;
      message.success(`Đã xoá ${deleted} câu hỏi ${label}!`);
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
      const res = await myVideoSegmentApi.deleteAllQuizzes(videoId);
      const data = res?.data || {};
      message.success(`Đã xoá toàn bộ ${data.deleted ?? 0} câu hỏi của bài học!`);
      setSelectedRowKeys([]);
      loadData();
    } catch (error) {
      message.error(error?.message || 'Không thể xoá tất cả câu hỏi.');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleAiGenerateQuizzes = () => {
    if (!onStartAiTask) {
      message.warning('Tính năng auto AI chưa sẵn sàng. Vui lòng tải lại trang.');
      return;
    }
    onStartAiTask('quiz');
  };

  const columns = [
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: 80,
      align: 'center',
    },
    {
      title: 'Câu hỏi',
      dataIndex: 'questionText',
      key: 'questionText',
      render: (text) => <span style={{ fontWeight: 600, color: '#1e1b4b' }}>{text}</span>,
    },
    {
      title: 'Loại',
      dataIndex: 'questionType',
      key: 'questionType',
      width: 140,
      render: (value) => <Tag color="blue">{value}</Tag>,
    },
    {
      title: 'Độ khó',
      dataIndex: 'difficultyLevel',
      key: 'difficultyLevel',
      width: 100,
      render: (value) => {
        let color = 'default';
        if (value === 'EASY') color = 'success';
        if (value === 'MEDIUM') color = 'warning';
        if (value === 'HARD') color = 'error';
        return <Tag color={color}>{value}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isPublished',
      key: 'isPublished',
      width: 110,
      render: (value) => (
        <Tag color={value ? 'green' : 'default'} style={{ borderRadius: 4 }}>
          {value ? 'Published' : 'Draft'}
        </Tag>
      ),
    },
    {
      title: 'Số đáp án',
      dataIndex: 'options',
      key: 'options',
      width: 100,
      align: 'center',
      render: (options = []) => options.length,
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
            title="Xoá câu hỏi trắc nghiệm này?"
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
      <Card
        title={
          <span style={{ fontWeight: 700, fontSize: 15 }}>
            <QuestionCircleOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
            {editingQuiz ? 'Chỉnh sửa Câu hỏi Trắc nghiệm' : 'Soạn Câu hỏi Trắc nghiệm mới'}
          </span>
        }
        extra={
          <Space>
            <Button
              type="primary"
              ghost
              icon={<RobotOutlined />}
              onClick={handleAiGenerateQuizzes}
              loading={isAiGenerating}
              style={{ borderRadius: 6, borderColor: '#6366f1', color: '#6366f1' }}
            >
              Auto AI
            </Button>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading} />
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            questionType: 'MULTIPLE_CHOICE',
            difficultyLevel: 'MEDIUM',
            orderIndex: 1,
            isPublished: true,
            options: defaultOptions(),
          }}
        >
          <Form.Item
            name="questionText"
            label={<span style={{ fontWeight: 600 }}>Nội dung câu hỏi</span>}
            rules={[{ required: true, message: 'Nội dung câu hỏi không được để trống!' }]}
          >
            <TextArea rows={2} placeholder="Nhập câu hỏi trắc nghiệm (ví dụ: What is the main message of the speaker?)" style={{ borderRadius: 8 }} />
          </Form.Item>

          <Form.Item name="explanation" label={<span style={{ fontWeight: 600 }}>Giải thích đáp án (Explanation)</span>}>
            <TextArea rows={2} placeholder="Giải thích vì sao đáp án đó đúng..." style={{ borderRadius: 8 }} />
          </Form.Item>

          <Space size="large" wrap style={{ width: '100%', marginBottom: 12 }}>
            <Form.Item name="questionType" label={<span style={{ fontWeight: 600 }}>Loại câu hỏi</span>} style={{ minWidth: 200 }}>
              <Select options={[{ value: 'MULTIPLE_CHOICE', label: 'MULTIPLE_CHOICE (Trắc nghiệm)' }]} style={{ borderRadius: 8 }} size="large" />
            </Form.Item>
            <Form.Item name="difficultyLevel" label={<span style={{ fontWeight: 600 }}>Độ khó</span>} style={{ minWidth: 150 }}>
              <Select
                options={['EASY', 'MEDIUM', 'HARD'].map((value) => ({ value, label: value }))}
                style={{ borderRadius: 8 }}
                size="large"
              />
            </Form.Item>
            <Form.Item name="orderIndex" label={<span style={{ fontWeight: 600 }}>Thứ tự hiển thị</span>}>
              <InputNumber min={1} style={{ borderRadius: 8 }} size="large" />
            </Form.Item>
            <Form.Item name="isPublished" label={<span style={{ fontWeight: 600 }}>Công khai ngay</span>} valuePropName="checked">
              <Switch style={{ marginTop: 8 }} />
            </Form.Item>
          </Space>

          <Divider style={{ margin: '16px 0' }} />

          <Form.List name="options">
            {(fields, { add, remove }) => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Text strong style={{ fontSize: 14 }}>Các phương án trả lời (Options - Tối thiểu 3 phương án)</Text>
                {fields.map((field, index) => (
                  <Space key={field.key} align="baseline" wrap style={{ display: 'flex' }}>
                    <Form.Item
                      name={[field.name, 'optionOrder']}
                      style={{ width: 80 }}
                    >
                      <InputNumber min={1} placeholder="Order" size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'optionText']}
                      rules={[{ required: true, message: 'Nhập nội dung đáp án!' }]}
                      style={{ width: 440 }}
                    >
                      <Input placeholder={`Nhập nội dung đáp án ${index + 1}`} size="large" style={{ borderRadius: 8 }} />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'isCorrect']}
                      valuePropName="checked"
                    >
                      <Switch checkedChildren="Đúng" unCheckedChildren="Sai" />
                    </Form.Item>
                    <Button
                      danger
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                      disabled={fields.length <= 3}
                    />
                  </Space>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add(emptyOption(fields.length + 1))}
                  style={{ width: 200, borderRadius: 8 }}
                >
                  Thêm đáp án lựa chọn
                </Button>
              </div>
            )}
          </Form.List>

          <Divider style={{ margin: '24px 0' }} />
          <Space>
            <Button
              type="primary"
              loading={saving}
              onClick={handleSubmit}
              size="large"
              style={{
                borderRadius: 8,
                fontWeight: 600,
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                border: 'none',
                height: 44,
                padding: '0 24px',
              }}
            >
              {editingQuiz ? 'Cập nhật câu hỏi' : 'Tạo câu hỏi'}
            </Button>
            <Button onClick={resetForm} size="large" style={{ borderRadius: 8, height: 44 }}>Nhập lại</Button>
          </Space>
        </Form>
      </Card>

      <Card
        title={<span style={{ fontWeight: 700, fontSize: 15 }}>Danh sách câu hỏi trắc nghiệm ({quizzes.length})</span>}
        extra={
          <Space>
            <Popconfirm
              title={`Xoá ${selectedRowKeys.length} câu hỏi đã chọn?`}
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
              title={`Xoá TẤT CẢ ${quizzes.length} câu hỏi của bài học này?`}
              description="Hành động này không thể hoàn tác."
              onConfirm={handleDeleteAll}
              okText="Xoá tất cả"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              disabled={quizzes.length === 0}
            >
              <Button
                danger
                type="primary"
                icon={<DeleteOutlined />}
                disabled={quizzes.length === 0}
                loading={deletingBulk}
                style={{ borderRadius: 6 }}
              >
                Xoá tất cả
              </Button>
            </Popconfirm>
          </Space>
        }
        bordered={false}
        style={{ borderRadius: 16, boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', border: '1px solid #f3f4f6' }}
      >
        <Table
          rowKey="id"
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          columns={columns}
          dataSource={quizzes}
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ padding: '8px 16px', background: '#fafafa', borderRadius: 8 }}>
                {record.explanation && (
                  <Paragraph style={{ marginBottom: 12 }}>
                    <Text strong>Giải thích đáp án: </Text>
                    <Text type="secondary">{record.explanation}</Text>
                  </Paragraph>
                )}
                <div>
                  <Text strong>Danh sách đáp án lựa chọn:</Text>
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {record.options?.map((option) => (
                      <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tag color={option.isCorrect ? 'green' : 'default'} style={{ borderRadius: 4, padding: '2px 8px' }}>
                          Thứ tự #{option.optionOrder}
                        </Tag>
                        <span style={{ fontWeight: option.isCorrect ? 600 : 400, color: option.isCorrect ? '#10b981' : '#374151' }}>
                          {option.optionText} {option.isCorrect ? '✔ (Đáp án ĐÚNG)' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ),
          }}
          style={{ borderRadius: 8, overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
}
