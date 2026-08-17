import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  message,
  Modal,
  Input,
  Empty,
  Spin,
  Tooltip,
  Dropdown,
  Button,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderOpenFilled,
  FileTextOutlined,
  MoreOutlined,
  BookOutlined,
  ExclamationCircleFilled,
  UnorderedListOutlined,
  AppstoreOutlined,
  CloudSyncOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { vocabularyGroupApi, vocabularyUnitApi } from '../api/notebookApi';
import { extractErrorMessage } from '@/utils/apiError';
import { isAuthenticated } from '@/utils/auth';
import { syncVocabularyUnitsToAnki } from '../utils/notebookAnkiSync';
import { getAnkiSyncSummary } from '@/utils/ankiSync';
import styles from '../styles/NotebookPage.module.scss';

const { confirm } = Modal;

const NotebookPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAuth = isAuthenticated();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null); // Track group drill-down

  // Anki sync
  const [syncing, setSyncing] = useState(false);
  const [syncingUnitId, setSyncingUnitId] = useState(null);

  // Group modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  // Unit modals
  const [unitModalOpen, setUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitName, setUnitName] = useState('');
  const [unitDesc, setUnitDesc] = useState('');
  const [unitTargetGroupId, setUnitTargetGroupId] = useState(null);
  const [unitSubmitting, setUnitSubmitting] = useState(false);

  // ── Load groups ──
  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vocabularyGroupApi.findAll('createdAt,desc');
      setGroups(res.data || []);
    } catch (err) {
      message.error(extractErrorMessage(err, t('notebook.loadGroupsError')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAuth) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [isAuth, loadGroups]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    if (group) {
      sessionStorage.setItem('notebookSelectedGroupId', group.vocabularyGroupResponse.id);
    } else {
      sessionStorage.removeItem('notebookSelectedGroupId');
    }
  };

  // Sync selectedGroup when groups data changes or restore from session
  useEffect(() => {
    const savedId = sessionStorage.getItem('notebookSelectedGroupId');
    
    if (selectedGroup) {
      const updated = groups.find(g => g.vocabularyGroupResponse.id === selectedGroup.vocabularyGroupResponse.id);
      if (updated) {
        setSelectedGroup(updated);
      } else {
        setSelectedGroup(null);
        sessionStorage.removeItem('notebookSelectedGroupId');
      }
    } else if (savedId && groups.length > 0) {
      const restored = groups.find(g => String(g.vocabularyGroupResponse.id) === savedId);
      if (restored) {
        setSelectedGroup(restored);
      }
    }
  }, [groups]);

  // ── Group CRUD ──
  const openGroupModal = (group = null) => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    setEditingGroup(group);
    setGroupName(group?.vocabularyGroupResponse?.name || '');
    setGroupModalOpen(true);
  };

  const handleGroupSubmit = async () => {
    if (!groupName.trim()) {
      message.warning(t('notebook.nameRequired'));
      return;
    }
    setGroupSubmitting(true);
    try {
      if (editingGroup) {
        await vocabularyGroupApi.update(editingGroup.vocabularyGroupResponse.id, groupName.trim());
        message.success(t('notebook.updateSuccess'));
      } else {
        await vocabularyGroupApi.create(groupName.trim());
        message.success(t('notebook.createSuccess'));
      }
      setGroupModalOpen(false);
      loadGroups();
    } catch (err) {
      message.error(extractErrorMessage(err, t('common.notifications.errorOccurred')));
    } finally {
      setGroupSubmitting(false);
    }
  };

  const handleGroupDelete = (group) => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    const gName = group.vocabularyGroupResponse?.name;
    confirm({
      title: t('notebook.deleteGroupTitle'),
      icon: <ExclamationCircleFilled />,
      content: t('notebook.deleteGroupConfirm', { name: gName }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      async onOk() {
        try {
          await vocabularyGroupApi.delete(group.vocabularyGroupResponse.id);
          message.success(t('notebook.deleteSuccess'));
          loadGroups();
        } catch (err) {
          message.error(extractErrorMessage(err, t('notebook.deleteError')));
        }
      },
    });
  };

  // ── Unit CRUD ──
  const openUnitModal = (groupId, unit = null) => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    setUnitTargetGroupId(groupId);
    setEditingUnit(unit);
    setUnitName(unit?.name || '');
    setUnitDesc(unit?.description || '');
    setUnitModalOpen(true);
  };

  const handleUnitSubmit = async () => {
    if (!unitName.trim()) {
      message.warning(t('notebook.unitNameRequired'));
      return;
    }
    setUnitSubmitting(true);
    try {
      if (editingUnit) {
        await vocabularyUnitApi.update(editingUnit.id, {
          name: unitName.trim(),
          description: unitDesc.trim(),
          vocabularyGroupId: unitTargetGroupId,
          orderIndex: editingUnit.orderIndex,
        });
        message.success(t('notebook.unitUpdateSuccess'));
      } else {
        await vocabularyUnitApi.create({
          name: unitName.trim(),
          description: unitDesc.trim(),
          vocabularyGroupId: unitTargetGroupId,
        });
        message.success(t('notebook.unitCreateSuccess'));
      }
      setUnitModalOpen(false);
      loadGroups();
    } catch (err) {
      message.error(extractErrorMessage(err, t('common.notifications.errorOccurred')));
    } finally {
      setUnitSubmitting(false);
    }
  };

  const handleUnitDelete = (unit) => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    confirm({
      title: t('notebook.deleteUnitTitle'),
      icon: <ExclamationCircleFilled />,
      content: t('notebook.deleteUnitConfirm', { name: unit.name }),
      okText: t('common.delete'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      async onOk() {
        try {
          await vocabularyUnitApi.delete(unit.id);
          message.success(t('notebook.unitDeleteSuccess'));
          loadGroups();
        } catch (err) {
          message.error(extractErrorMessage(err, t('notebook.unitDeleteError')));
        }
      },
    });
  };

  // ── Navigate to saved words ──
  const goToUnit = (unit, group) => {
    navigate(`/notebook/units/${unit.id}/words`, {
      state: {
        groupName: group?.vocabularyGroupResponse?.name,
        unitName: unit?.name,
      },
    });
  };

  // ── Sync ALL to Anki ──
  const handleSyncAnki = async () => {
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    setSyncing(true);
    try {
      const result = await syncVocabularyUnitsToAnki({ groups, pendingOnly: false });
      const count = result.syncedCount || 0;
      if (result.errors.length > 0 && count === 0 && !result.duplicateCount) {
        message.error(result.errors[0]?.message || t('notebook.syncAnkiError'));
      } else {
        message.success(getAnkiSyncSummary(result, 'từ'));
      }
    } catch (err) {
      message.error(extractErrorMessage(err, t('notebook.syncAnkiError')));
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncUnitAnki = async (e, unitId) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (!isAuth) {
      message.warning(t('common.notifications.loginRequired'));
      return;
    }
    setSyncingUnitId(unitId);
    try {
      const result = await syncVocabularyUnitsToAnki({ groups, unitId, pendingOnly: false });
      const count = result.syncedCount || 0;
      if (result.errors.length > 0 && count === 0 && !result.duplicateCount) {
        message.error(result.errors[0]?.message || t('notebook.syncAnkiError'));
      } else {
        message.success(getAnkiSyncSummary(result, 'từ'));
      }
    } catch (err) {
      message.error(extractErrorMessage(err, t('notebook.syncAnkiError')));
    } finally {
      setSyncingUnitId(null);
    }
  };



  return (
    <div className={styles.page}>
      {/* ── Page Header ── */}
      <div className={styles.header}>
        <div className={styles.headerText}>
          {selectedGroup && (
            <button 
              type="button"
              className={styles.backBtn} 
              onClick={() => handleSelectGroup(null)}
            >
              <ArrowLeftOutlined /> {t('learning.page.back')}
            </button>
          )}
          <div className={styles.titleRow}>
            <h1>{selectedGroup ? selectedGroup.vocabularyGroupResponse.name : t('common.navigation.notebook')}</h1>
            <div className={styles.syncGuideNote}>
              <span>
                {t('notebook.syncGuideNote')} <Link to="/guide" className={styles.guideLink}>{t('notebook.syncGuideLink')}</Link>.
              </span>
            </div>
          </div>
          <p>{selectedGroup ? t('notebook.unitListDesc') : t('notebook.manageDesc')}</p>
        </div>
        <div className={styles.headerActions}>
          {/* Sync Anki */}
          <Tooltip title={t('notebook.syncAllTooltip')}>
            <button
              type="button"
              className={styles.ankiSyncBtn}
              onClick={handleSyncAnki}
              disabled={syncing}
            >
              <CloudSyncOutlined spin={syncing} />
              <span>{t('notebook.syncAnkiBtn')}</span>
            </button>
          </Tooltip>

          {/* Create group / unit */}
          {selectedGroup ? (
            <button 
              type="button"
              className={styles.addGroupBtn} 
              onClick={() => openUnitModal(selectedGroup.vocabularyGroupResponse.id)}
            >
              <PlusOutlined />
              <span>{t('notebook.createUnitBtn')}</span>
            </button>
          ) : (
            <button type="button" className={styles.addGroupBtn} onClick={() => openGroupModal()}>
              <PlusOutlined />
              <span>{t('notebook.createGroupBtn')}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className={styles.loadingWrap}>
          <Spin size="large" />
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <FolderOpenFilled className={styles.emptyIcon} />
          <h2>{t('notebook.noGroups')}</h2>
          <p>{t('notebook.noGroupsDesc')}</p>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openGroupModal()}>
            {t('notebook.createGroupBtn')}
          </Button>
        </div>
      ) : selectedGroup ? (
        /* ── Unit View ── */
        <div className={`${styles.unitView} ${styles.unitGridView}`}>
          {!selectedGroup.vocabularyUnitResponseList?.length ? (
            <div className={styles.emptyState}>
              <FileTextOutlined className={styles.emptyIcon} />
              <h2>{t('notebook.noUnits')}</h2>
              <p>{t('notebook.noUnitsDesc')}</p>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => openUnitModal(selectedGroup.vocabularyGroupResponse.id)}
              >
                {t('notebook.createUnitBtn')}
              </Button>
            </div>
          ) : (
            (selectedGroup.vocabularyUnitResponseList ?? []).map((unit) => {
              const unitMenuItems = [
                {
                  key: 'edit',
                  label: t('common.edit'),
                  icon: <EditOutlined />,
                  onClick: () => openUnitModal(selectedGroup.vocabularyGroupResponse.id, unit),
                },
                { type: 'divider' },
                {
                  key: 'delete',
                  label: t('notebook.deleteUnit'),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => handleUnitDelete(unit),
                },
              ];

              return (
                <div key={unit.id} className={styles.unitCardDrillDown}>
                  <div className={styles.unitDrillInfo} onClick={() => goToUnit(unit, selectedGroup)}>
                    <div className={styles.unitIconContainer}>
                      <FileTextOutlined className={styles.unitIconDrill} />
                    </div>
                    <div className={styles.unitText}>
                      <h4 className={styles.unitNameDrill}>{unit.name}</h4>
                      {unit.description && (
                        <p className={styles.unitDescDrill}>{unit.description}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className={styles.unitDrillActions}
                    style={{ display: 'flex', gap: '4px' }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Tooltip title={t('notebook.syncUnitTooltip')}>
                      <button 
                        type="button"
                        className={styles.iconBtn} 
                        onClick={(e) => handleSyncUnitAnki(e, unit.id)}
                        disabled={syncingUnitId === unit.id}
                      >
                        <CloudSyncOutlined spin={syncingUnitId === unit.id} />
                      </button>
                    </Tooltip>
                    <Dropdown menu={{ items: unitMenuItems }} trigger={['click']}>
                      <button type="button" className={styles.iconBtn}>
                        <MoreOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── Group View ── */
        <div className={`${styles.groupList} ${styles.gridView}`}>
          {groups.map((group) => {
            const gRes = group.vocabularyGroupResponse;
            const units = group.vocabularyUnitResponseList || [];

            const groupMenuItems = [
              {
                key: 'edit',
                label: t('notebook.renameGroup'),
                icon: <EditOutlined />,
                onClick: () => openGroupModal(group),
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: t('notebook.deleteGroup'),
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleGroupDelete(group),
              },
            ];

            return (
              <div 
                key={gRes.id} 
                className={styles.groupCard}
                onClick={() => handleSelectGroup(group)}
              >
                <div className={styles.groupHeader}>
                  <div className={styles.groupInfo}>
                    <FolderOpenFilled className={styles.groupIcon} />
                    <h3 className={styles.groupName}>{gRes.name}</h3>
                    <span className={styles.groupMeta}>{units.length} {t('notebook.unitCount')}</span>
                  </div>
                  
                  <div className={styles.groupActions} onClick={(e) => e.stopPropagation()}>
                    <Dropdown menu={{ items: groupMenuItems }} trigger={['click']}>
                      <button type="button" className={styles.iconBtn}>
                        <MoreOutlined />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Group Modal ── */}
      <Modal
        title={editingGroup ? t('notebook.renameGroup') : t('notebook.createGroupBtn')}
        open={groupModalOpen}
        onCancel={() => setGroupModalOpen(false)}
        onOk={handleGroupSubmit}
        confirmLoading={groupSubmitting}
        okText={editingGroup ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <div style={{ marginTop: 16 }}>
          <Input
            placeholder={t('notebook.groupNamePlaceholder')}
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            onPressEnter={handleGroupSubmit}
            size="large"
            autoFocus
          />
        </div>
      </Modal>

      {/* ── Unit Modal ── */}
      <Modal
        title={editingUnit ? t('common.edit') : t('notebook.createUnitBtn')}
        open={unitModalOpen}
        onCancel={() => setUnitModalOpen(false)}
        onOk={handleUnitSubmit}
        confirmLoading={unitSubmitting}
        okText={editingUnit ? t('common.save') : t('common.create')}
        cancelText={t('common.cancel')}
        destroyOnHidden
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <Input
            placeholder={t('notebook.unitNamePlaceholder')}
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            size="large"
            autoFocus
          />
          <Input.TextArea
            placeholder={t('notebook.unitDescPlaceholder')}
            value={unitDesc}
            onChange={(e) => setUnitDesc(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
};

export default NotebookPage;
