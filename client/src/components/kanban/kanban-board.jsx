import { useMemo, useState } from 'react';
import { Row, Col, Card, Empty, Typography } from 'antd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { STATUSES } from '../../utils/status-constants.js';
import { useI18n } from '../../i18n/i18n-config.jsx';
import KanbanTaskCard from './kanban-task-card.jsx';
import EditTaskModal from './edit-task-modal.jsx';
import { useKanbanBoard } from './use-kanban-board.js';

const { Text } = Typography;

const COLUMN_COLORS = {
  todo:        { header: 'var(--col-todo-header)', body: 'var(--col-todo-body)' },
  in_progress: { header: 'var(--col-progress-header)', body: 'var(--col-progress-body)' },
  done:        { header: 'var(--col-done-header)', body: 'var(--col-done-body)' },
};

export default function KanbanBoard({ refreshKey, onRefresh }) {
  const { t } = useI18n();
  const { columns, handleDragEnd, handleEdit, handleDelete, handleDeleteFeedback, handleUpdateFeedback } =
    useKanbanBoard({ refreshKey, onRefresh });

  const [editingTask, setEditingTask] = useState(null);

  // Derive unique project/type options from all tasks
  const allTasks = useMemo(() => Object.values(columns).flat(), [columns]);
  const projectOptions = useMemo(() => [...new Set(allTasks.map(t => t.project).filter(Boolean))], [allTasks]);
  const typeOptions = useMemo(() => [...new Set(allTasks.map(t => t.type).filter(Boolean))], [allTasks]);

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
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
                        <KanbanTaskCard
                          key={task.id}
                          task={task}
                          index={index}
                          onOpenEditModal={setEditingTask}
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

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onDeleteFeedback={handleDeleteFeedback}
          onUpdateFeedback={handleUpdateFeedback}
          projectOptions={projectOptions}
          typeOptions={typeOptions}
        />
      )}
    </>
  );
}
