import { useState, useEffect } from 'react';
import { Menu, Button, Modal, Input, Typography, message, Dropdown } from 'antd';
import { PlusOutlined, MoreOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { groupApi } from '../../../services/api/group.api';

const { confirm } = Modal;
const { Text } = Typography;

const VocabularyGroupList = ({ selectedGroupId, onSelectGroup }) => {
  const { t } = useTranslation();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await groupApi.getGroups();
      setGroups(response.data || []);
      if (!selectedGroupId && response.data?.length > 0) {
        onSelectGroup(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch groups', error);
      const mockGroups = [{ id: '1', name: 'General' }, { id: '2', name: 'Idioms' }];
      setGroups(mockGroups);
      if (!selectedGroupId) onSelectGroup(mockGroups[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleMenuClick = ({ key }) => {
    const group = groups.find((g) => g.id.toString() === key);
    if (group) onSelectGroup(group);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setGroupNameInput('');
    setIsModalVisible(true);
  };

  const openRenameModal = (group, e) => {
    e.domEvent.stopPropagation();
    setModalMode('rename');
    setEditingGroupId(group.id);
    setGroupNameInput(group.name);
    setIsModalVisible(true);
  };

  const handleDeleteGroup = (group, e) => {
    e.domEvent.stopPropagation();
    confirm({
      title: t('notebook.deleteGroupConfirmTitle').replace('{{groupName}}', group.name),
      icon: <ExclamationCircleOutlined />,
      content: t('notebook.deleteGroupConfirmContent'),
      okText: t('common.yes'),
      cancelText: t('common.no'),
      onOk: async () => {
        try {
          // await groupApi.deleteGroup(group.id);
          message.success(t('notebook.deleteGroupSuccess'));
          fetchGroups();
          if (selectedGroupId === group.id) onSelectGroup(null);
        } catch (error) {
          message.error(t('notebook.deleteGroupFailed'));
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    if (!groupNameInput.trim()) return;
    
    try {
      if (modalMode === 'create') {
        // await groupApi.createGroup({ name: groupNameInput });
        message.success(t('notebook.createGroupSuccess'));
      } else {
        // await groupApi.renameGroup(editingGroupId, { name: groupNameInput });
        message.success(t('notebook.renameGroupSuccess'));
      }
      setIsModalVisible(false);
      fetchGroups();
    } catch (error) {
      message.error(t('notebook.groupActionFailed'));
    }
  };

  const ActionMenu = ({ group }) => (
    <Dropdown
      menu={{
        items: [
          { key: 'rename', label: t('common.rename') },
          { key: 'delete', label: t('common.delete'), danger: true },
        ],
        onClick: (e) => {
          if (e.key === 'rename') openRenameModal(group, e);
          if (e.key === 'delete') handleDeleteGroup(group, e);
        }
      }}
      trigger={['click']}
    >
      <Button type="text" size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
    </Dropdown>
  );

  const menuItems = groups.map((g) => ({
    key: g.id.toString(),
    label: (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text ellipsis style={{ flex: 1 }}>{g.name}</Text>
        <ActionMenu group={g} />
      </div>
    ),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #E4E4E4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>{t('notebook.myGroups')}</Text>
        <Button type="text" icon={<PlusOutlined />} size="small" onClick={openCreateModal} />
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={selectedGroupId ? [selectedGroupId.toString()] : []}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 'none', flex: 1, overflowY: 'auto' }}
        loading={loading}
      />

      <Modal
        title={modalMode === 'create' ? t('notebook.createGroupTitle') : t('notebook.renameGroupTitle')}
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={() => setIsModalVisible(false)}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
      >
        <Input
          placeholder={t('notebook.groupNamePlaceholder')}
          value={groupNameInput}
          onChange={(e) => setGroupNameInput(e.target.value)}
          onPressEnter={handleModalSubmit}
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default VocabularyGroupList;
