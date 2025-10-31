import { Task, TaskStatus } from '../types';

export type TaskListFilter = 'all' | TaskStatus;

export interface TaskListProps {
  tasks: Task[];
  activeFilter: TaskListFilter;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, nextStatus: TaskStatus) => void;
  busyTaskId: number | null;
}

const columns: Array<{
  key: TaskStatus;
  title: string;
  accent: string;
 
  matcher: (task: Task) => boolean;
  actions: Array<{ label: string; nextStatus: TaskStatus }>;
}> = [
  {
    key: 'todo',
    title: 'To Do',
    accent: '#f97316',
    
    matcher: (task: Task) => task.status === 'todo',
    actions: [{ label: 'Mark in progress', nextStatus: 'in_progress' }]
  },
  {
    key: 'in_progress',
    title: 'In Progress',
    accent: '#3b82f6',
   
    matcher: (task: Task) => task.status === 'in_progress',
    actions: [
      { label: 'Mark completed', nextStatus: 'done' },
      { label: 'Move to To Do', nextStatus: 'todo' }
    ]
  },
  {
    key: 'done',
    title: 'Done',
    accent: '#10b981',
    
    matcher: (task: Task) => task.status === 'done',
    actions: [{ label: 'Reopen', nextStatus: 'in_progress' }]
  }
];

const formatUpdatedAt = (date: string) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  } catch {
    return '';
  }
};

const TaskList = ({ tasks, activeFilter, onEdit, onDelete, onStatusChange, busyTaskId }: TaskListProps) => {
  const hasTasks = tasks.length > 0;

  return (
    <div className={`task-board${hasTasks ? '' : ' empty'}`}>
      {columns.map((column) => {
        const columnTasks = tasks.filter(column.matcher);
        const muted = activeFilter !== 'all' && activeFilter !== column.key;
        return (
          <section key={column.key} className={`board-column${muted ? ' muted' : ''}`}>
            <header className="column-header">
              <div className="column-title">
                <span className="column-indicator" style={{ backgroundColor: column.accent }} />
                <div>
                  <h2>{column.title}</h2>
                  
                </div>
              </div>
              <span className="column-count">{columnTasks.length}</span>
            </header>

            <div className="column-body">
              {columnTasks.length === 0 ? (
                <p className="column-empty">No tasks.</p>
              ) : (
                columnTasks.map((task) => {
                  const assignedLabel = task.assignee ? task.assignee.name : 'Unassigned';
                  const isBusy = busyTaskId === task.id;
                  return (
                    <article key={task.id} className="task-card">
                      <header className="task-card-header">
                        <span className="assignee-chip">{assignedLabel}</span>
                        <span className="updated-at">Updated {formatUpdatedAt(task.updatedAt)}</span>
                      </header>
                      <h3>{task.title}</h3>
                      {task.description && <p className="description">{task.description}</p>}
                      <footer className="task-card-actions">
                        <button type="button" onClick={() => onEdit(task)} disabled={isBusy}>
                          Edit
                        </button>
                        {column.actions.map(({ label, nextStatus }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => onStatusChange(task, nextStatus)}
                            disabled={isBusy}
                          >
                            {label}
                          </button>
                        ))}
                        <button type="button" onClick={() => onDelete(task)} className="danger" disabled={isBusy}>
                          Delete
                        </button>
                      </footer>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
      {!hasTasks && <p className="board-empty">No tasks yet. Create one to get started.</p>}
    </div>
  );
};

export default TaskList;
