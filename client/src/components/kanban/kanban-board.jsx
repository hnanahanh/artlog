import { Row, Col, Card, Empty } from 'antd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { STATUSES } from '../../utils/status-constants.js';
import { useI18n } from '../../i18n/i18n-config.jsx';
import KanbanTaskCard from './kanban-task-card.jsx';
import { useKanbanBoard } from './use-kanban-board.js';

// Column header colors matching status
const COLUMN_BORDER_COLORS = {
  todo: '#8c8c8c',
  in_progress: '#1677ff',
  review: '#fa8c16',
  done: '#52c41a',
};

export default function KanbanBoard({ refreshKey, onRefresh }) {
  const { t } = useI18n();
  const { columns, handleDragEnd, handleEdit, handleDelete, handleDeleteFeedback, handleUpdateFeedback } =
    useKanbanBoard({ refreshKey, onRefresh });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Row gutter={[12, 12]}>
        {STATUSES.map(status => (
          <Col xs={24} sm={12} md={6} key={status}>
            <Card
              title={`${t(`status.${status}`)} (${columns[status].length})`}
              size="small"
              style={{ borderTop: `3px solid ${COLUMN_BORDER_COLORS[status]}` }}
              styles={{ body: { padding: 8, minHeight: 200 } }}
            >
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      minHeight: 150,
                      background: snapshot.isDraggingOver ? '#f0f5ff' : 'transparent',
                      borderRadius: 4,
                      transition: 'background 0.2s',
                    }}
                  >
                    {columns[status].length === 0 && !snapshot.isDraggingOver && (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="" />
                    )}
                    {columns[status].map((task, index) => (
                      <KanbanTaskCard
                        key={task.id}
                        task={task}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onDeleteFeedback={handleDeleteFeedback}
                        onUpdateFeedback={handleUpdateFeedback}
                        t={t}
                      />
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
