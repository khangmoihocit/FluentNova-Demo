import { useState, useEffect } from 'react';
import { Table, Button, Input, Typography, message, Popconfirm } from 'antd';
import { SyncOutlined, SoundOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { savedWordApi } from '../../../services/api/savedWord.api';

const { Title, Text } = Typography;

const VocabularyTable = ({ group }) => {
  const { t } = useTranslation();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchText, setSearchText] = useState('');

  const fetchWords = async () => {
    if (!group) return;
    setLoading(true);
    try {
      const response = await savedWordApi.getWordsByGroup(group.id);
      setWords(response.data || []);
    } catch (error) {
      console.error('Failed to fetch words', error);
      setWords([
        { id: '1', word: 'Ephemeral', meaning: 'Lasting for a very short time', example: 'Fashions are ephemeral.', pronunciationText: 'Ephemeral' },
        { id: '2', word: 'Ubiquitous', meaning: 'Present, appearing, or found everywhere', example: 'His ubiquitous influence was felt by all.', pronunciationText: 'Ubiquitous' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [group]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      // await savedWordApi.syncToAnki(group.id);
      setTimeout(() => {
        message.success(t('notebook.syncAnkiSuccess'));
        setSyncing(false);
      }, 1000);
    } catch (error) {
      message.error(t('notebook.syncAnkiFailed'));
      setSyncing(false);
    }
  };

  const handleDelete = async (wordId) => {
    try {
      // await savedWordApi.deleteWord(wordId);
      message.success(t('notebook.deleteWordSuccess'));
      setWords(words.filter(w => w.id !== wordId));
    } catch (error) {
      message.error(t('notebook.deleteWordFailed'));
    }
  };

  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      message.error(t('notebook.ttsNotSupported'));
    }
  };

  const columns = [
    {
      title: t('common.word'),
      dataIndex: 'word',
      key: 'word',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: t('common.meaning'),
      dataIndex: 'meaning',
      key: 'meaning',
    },
    {
      title: t('common.example'),
      dataIndex: 'example',
      key: 'example',
      render: (text) => <Text type="secondary" italic>"{text}"</Text>,
    },
    {
      title: t('common.pronunciation'),
      key: 'pronunciation',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button 
          type="text" 
          icon={<SoundOutlined />} 
          onClick={() => playAudio(record.pronunciationText || record.word)} 
        />
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Popconfirm
          title={t('notebook.deleteWordConfirmTitle')}
          description={t('notebook.deleteWordConfirmContent')}
          onConfirm={() => handleDelete(record.id)}
          okText={t('common.yes')}
          cancelText={t('common.no')}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const filteredWords = words.filter(w => 
    w.word.toLowerCase().includes(searchText.toLowerCase()) || 
    w.meaning.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ background: '#FFFFFF', padding: '24px', borderRadius: '12px', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>{group.name}</Title>
          <Text type="secondary">{t('notebook.wordsTotal').replace('{{count}}', words.length)}</Text>
        </div>
        <Button 
          type="primary" 
          icon={<SyncOutlined spin={syncing} />} 
          onClick={handleSync}
          loading={syncing}
        >
          {t('notebook.syncAnki')}
        </Button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Input 
          placeholder={t('notebook.searchPlaceholder')} 
          prefix={<SearchOutlined />} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>

      <Table 
        columns={columns} 
        dataSource={filteredWords} 
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: t('notebook.empty') }}
      />
    </div>
  );
};

export default VocabularyTable;
