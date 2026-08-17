import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Switch,
  Popconfirm,
  Tag,
  message,
  Typography,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { translationApi } from '../api/translationApi';

const { Text, Paragraph } = Typography;

export default function GeminiKeysManager() {
  const [form] = Form.useForm();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await translationApi.getGeminiKeys();
      setKeys(res?.data || []);
    } catch (err) {
      message.error(err?.message || 'Không thể tải danh sách API Key.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleAddKey = async (values) => {
    setSaving(true);
    try {
      await translationApi.addGeminiKey({
        keyName: values.keyName?.trim(),
        apiKey: values.apiKey?.trim(),
      });
      message.success('Đã thêm API Key thành công và mã hoá bảo mật!');
      form.resetFields();
      fetchKeys();
    } catch (err) {
      message.error(err?.message || 'Không thể thêm API Key.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (record) => {
    try {
      await translationApi.toggleGeminiKey(record.id);
      message.success(`Đã cập nhật trạng thái hoạt động của key!`);
      fetchKeys();
    } catch (err) {
      message.error(err?.message || 'Không thể cập nhật trạng thái.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await translationApi.deleteGeminiKey(id);
      message.success('Đã xoá API Key khỏi hệ thống!');
      fetchKeys();
    } catch (err) {
      message.error(err?.message || 'Không thể xoá API Key.');
    }
  };

  const columns = [
    {
      title: 'Tên Key',
      dataIndex: 'keyName',
      key: 'keyName',
      render: (text) => (
        <span style={{ fontWeight: 600, color: '#1f2937' }}>
          <KeyOutlined style={{ marginRight: 6, color: '#6366f1' }} />
          {text}
        </span>
      ),
    },
    {
      title: 'Mã Key (Masked)',
      dataIndex: 'maskedKey',
      key: 'maskedKey',
      render: (text) => (
        <Text code style={{ fontSize: 13, background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Kích hoạt',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggle(record)}
          checkedChildren="Bật"
          unCheckedChildren="Tắt"
        />
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (dateStr) => {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Bạn có chắc chắn muốn xoá API Key này?"
          okText="Xoá"
          cancelText="Huỷ"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record.id)}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="middle"
            className="hover:scale-105 transition-transform"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Alert
        message={
          <span style={{ fontWeight: 600, color: '#0369a1' }}>
            <SafetyCertificateOutlined style={{ marginRight: 8, color: '#0284c7' }} />
            Cam kết bảo mật
          </span>
        }
        description={
          <div style={{ marginTop: 4, fontSize: 13, color: '#0e7490' }}>
            Mọi Gemini API Key bạn nhập vào đây sẽ được hệ thống mã hoá trước khi lưu vào cơ sở dữ liệu, ngay cả admin cũng không thể biết được key của bạn.
            Quá trình gọi Gemini AI diễn ra hoàn toàn trên Server* bảo mật. Khoá API Key của bạn không bao giờ bị lộ ra ngoài.
            <div style={{ marginTop: 6 }}>
              💡 Nếu không điền key riêng, hệ thống sẽ tự động dùng key mặc định.
            </div>
          <div style={{ marginTop: 6 }}>
              💡 Hệ thống sử dụng cơ chế xoay vòng api key, nên bạn có thể thêm nhiều api key để trải nghiệm tốt hơn
            </div>
          </div>
        }
        type="info"
        showIcon={false}
        style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
          border: '1px solid #7dd3fc',
          borderRadius: 12,
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }} className="lg:grid-cols-3">
        {/* Form add key */}
        <Card
          title={
            <span style={{ fontWeight: 700, fontSize: 16 }}>
              <PlusOutlined style={{ marginRight: 8, color: '#4f46e5' }} />
              Thêm Gemini API Key riêng
            </span>
          }
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6',
          }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddKey}
            requiredMark={false}
            autoComplete="off"
          >
            <Form.Item
              name="keyName"
              label={<span style={{ fontWeight: 600 }}>Tên gợi nhớ</span>}
              rules={[{ max: 50, message: 'Tên quá dài!' }]}
            >
              <Input placeholder="Ví dụ: My Gemini Pro Key" size="large" style={{ borderRadius: 8 }} autoComplete="off" />
            </Form.Item>

            <Form.Item
              name="apiKey"
              label={<span style={{ fontWeight: 600 }}>Google Gemini API Key</span>}
              rules={[{ required: true, message: 'Vui lòng nhập API Key!' }]}
            >
              <Input.Password
                placeholder="AIzaSy..."
                size="large"
                style={{ borderRadius: 8 }}
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                block
                size="large"
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  height: 44,
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                {saving ? 'Đang lưu an toàn...' : 'Lưu API Key'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* List keys */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>Danh sách Key của bạn</span>
              <Tag color={keys.length > 0 ? 'processing' : 'default'} style={{ borderRadius: 6 }}>
                {keys.length} Keys
              </Tag>
            </div>
          }
          bordered={false}
          style={{
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            border: '1px solid #f3f4f6',
          }}
        >
          <Table
            dataSource={keys}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={false}
            locale={{
              emptyText: (
                <div style={{ padding: '32px 0', textAlign: 'center' }}>
                  <Paragraph type="secondary">Chưa có API Key nào được cài đặt riêng.</Paragraph>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Hệ thống đang chạy bằng shared pool. Hãy điền key của bạn để có trải nghiệm nhanh và không giới hạn!
                  </Text>
                </div>
              ),
            }}
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>
      </div>
    </div>
  );
}
