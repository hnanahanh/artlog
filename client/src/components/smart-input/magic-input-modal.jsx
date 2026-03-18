import { useEffect, useState } from 'react';
import { Modal, Input, Button, Space, Typography, List } from 'antd'; // Thêm List vào đây
import { ThunderboltOutlined, PlusOutlined } from '@ant-design/icons'; // Thêm PlusOutlined
import { useI18n } from '../../i18n/i18n-config.jsx';
import { fetchRules } from '../../api/task-api-client.js';
import ParsedTaskPreviewTable from './parsed-task-preview-table.jsx';
import { useMagicInput } from './use-magic-input.js';

export default function MagicInputModal({ open, onClose, onTasksCreated }) {
  // ... logic giữ nguyên

  // 1. Định nghĩa Style giống tiêu đề Kanban
  const kanbanTitleStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#FDE047', // Màu vàng đặc trưng
    padding: '8px 16px',
    border: '3px solid #000',
    borderRadius: '8px',
    boxShadow: '4px 4px 0px #000',
    marginBottom: '20px',
    fontWeight: '900',
    fontSize: '18px',
    textTransform: 'uppercase', // Chữ hoa giống style Kanban
    letterSpacing: '1px'
  };

  return (
    <Modal
      title={null} // Ẩn tiêu đề mặc định của Modal để dùng tiêu đề tự chế
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnHidden
      bodyStyle={{ padding: '24px' }}
    >
      {/* 2. Tiêu đề mới theo style Kanban */}
      <div style={kanbanTitleStyle}>
        <ThunderboltOutlined />
        {t('magic.title') || 'DAILY REMINDER'}
      </div>

      <TextArea
        rows={6}
        value={rawText}
        onChange={e => { setRawText(e.target.value); setParsed(false); }}
        placeholder={t('magic.placeholder')}
        style={{ 
          fontFamily: "'Google Sans Code', monospace", 
          marginBottom: 16,
          border: '3px solid #000',
          borderRadius: '8px',
          boxShadow: '4px 4px 0px #000'
        }}
      />

      {/* ... Phần Parse Button giữ nguyên ... */}

      {parsed && parsedTasks.length > 0 && (
        <>
          {/* Tiêu đề cho phần Preview cũng theo style này nếu muốn */}
          <div style={{ ...kanbanTitleStyle, backgroundColor: '#a855f7', color: '#fff', fontSize: '14px', padding: '4px 12px' }}>
            PREVIEW TASKS
          </div>

          <ParsedTaskPreviewTable
            tasks={parsedTasks}
            feedbackItems={feedbackItems}
            onEditTask={handleTaskEdit}
            onDismissFeedback={handleDismissFeedback}
          />
          
          {/* ... Phần Footer Buttons ... */}
        </>
      )}
    </Modal>
  );
}