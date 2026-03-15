import { Modal, Input, Button, Space, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useI18n } from '../../i18n/i18n-config.jsx';
import ParsedTaskPreviewTable from './parsed-task-preview-table.jsx';
import { useMagicInput } from './use-magic-input.js';

const { TextArea } = Input;
const { Text } = Typography;

export default function MagicInputModal({ open, onClose, onTasksCreated }) {
  const { t } = useI18n();
  const {
    rawText, setRawText,
    parsedTasks, feedbackItems, warnings,
    loading, parsed, setParsed,
    handleClose, handleParse, handleTaskEdit,
    handleSave, handleDismissFeedback,
  } = useMagicInput({ onClose, onTasksCreated });

  return (
    <Modal
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#faad14' }} />
          {t('magic.title')}
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnHidden
    >
      {/* Raw text input */}
      <TextArea
        rows={6}
        value={rawText}
        onChange={e => { setRawText(e.target.value); setParsed(false); }}
        placeholder={t('magic.placeholder')}
        style={{ fontFamily: 'monospace', marginBottom: 12 }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={handleParse} loading={loading}>
          {t('magic.parse')}
        </Button>
        {parsed && parsedTasks.length > 0 && (
          <Text type="secondary">
            {parsedTasks.length} task(s) | {feedbackItems.length} feedback(s)
          </Text>
        )}
      </Space>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {warnings.map((w, i) => (
            <Text key={i} type="warning" style={{ display: 'block' }}>{w}</Text>
          ))}
        </div>
      )}

      {/* Preview table */}
      {parsed && parsedTasks.length > 0 && (
        <>
          <ParsedTaskPreviewTable
            tasks={parsedTasks}
            feedbackItems={feedbackItems}
            onEditTask={handleTaskEdit}
            onDismissFeedback={handleDismissFeedback}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleClose}>{t('magic.cancel')}</Button>
              <Button type="primary" onClick={handleSave} loading={loading}>
                {t('magic.save')}
              </Button>
            </Space>
          </div>
        </>
      )}

      {parsed && parsedTasks.length === 0 && (
        <Text type="secondary">{t('magic.no_tasks')}</Text>
      )}
    </Modal>
  );
}
