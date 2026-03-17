import { useMemo } from 'react';
import { Row, Col, Card, Empty, Typography } from 'antd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { STATUSES } from '../../utils/status-constants.js';
import { useI18n } from '../../i18n/i18n-config.jsx';
import KanbanTaskCard from './kanban-task-card.jsx';
import { useKanbanBoard } from './use-kanban-board.js';

const { Text } = Typography;

// Neo-brutalism column palette via CSS variables
const COLUMN_COLORS = {
  todo:        { header: 'var(--col-todo-header)', body: 'var(--col-todo-body)' },
  in_progress: { header: 'var(--col-progress-header)', body: 'var(--col-progress-body)' },
  done:        { header: 'var(--col-done-header)', body: 'var(--col-done-body)' },
};

/* Daily Progress Bar — neo-brutalism style */
function ProgressBar({ columns, t }) {
  const { total, done, percent } = useMemo(() => {
    const total = STATUSES.reduce((sum, s) => sum + columns[s].length, 0);
    const done = columns.done?.length || 0;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percent };
  }, [columns]);

  return (
    <div style={{
      marginBottom: 12, border: '2px solid var(--border-color)', borderRadius: 2,
      overflow: 'hidden', height: 28, background: 'var(--bg-secondary)',
      boxShadow: '3px 3px 0px var(--shadow-color)', position: 'relative',
    }}>
      <div style={{
        width: `${percent}%`, height: '100%',
        background: 'var(--accent-color)', transition: 'width 0.4s ease',
      }} />
      <Text style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', fontWeight: 900, fontSize: 12,
        color: 'var(--text-primary)', whiteSpace: 'nowrap',
      }}>
        {t('kanban.progress')}: {done}/{total} ({percent}%)
      </Text>
    </div>
  );
}

export default function KanbanBoard({ refreshKey, onRefresh }) {
  const { t } = useI18n();
  const { columns, handleDragEnd, handleEdit, handleDelete, handleDeleteFeedback, handleUpdateFeedback } =
    useKanbanBoard({ refreshKey, onRefresh });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <ProgressBar columns={columns} t={t} />
      <Row gutter={[12, 12]}>
        {STATUSES.map(status => (
          <Col xs={24} sm={12} md={8} key={status}>
            <Card
              title={`${t(`status.${status}`)} (${columns[status].length})`}
              size="small"
              style={{
                border: '2px solid var(--border-color)',
                borderRadius: 0,
                backgroundColor: COLUMN_COLORS[status].header,
              }}
              styles={{ body: { padding: 8, minHeight: 200, backgroundColor: COLUMN_COLORS[status].body } }}
            >
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    style={{ minHeight: 150, background: 'transparent' }}>
                    {columns[status].length === 0 && !snapshot.isDraggingOver && (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
                    )}
                    {columns[status].map((task, index) => (
                      <KanbanTaskCard key={task.id} task={task} index={index}
                        onEdit={handleEdit} onDelete={handleDelete}
                        onDeleteFeedback={handleDeleteFeedback}
                        onUpdateFeedback={handleUpdateFeedback} t={t} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          </Col>
        ))}
      </Row>
    </DragDropContext>
  );
}
