import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { Task, TaskPayload, TaskStatus, User } from '../types';

type TaskFormMode = 'create' | 'edit';

type TaskFormState = {
  title: string;
  description: string;
  userId: number | null;
  status: TaskStatus;
};

interface TaskFormProps {
  mode: TaskFormMode;
  users: User[];
  initialTask?: Task;
  isSubmitting: boolean;
  onSubmit: (payload: TaskPayload) => Promise<void> | void;
  onCancel: () => void;
}

const buildInitialState = (task?: Task): TaskFormState => {
  if (task) {
    return {
      title: task.title,
      description: task.description ?? '',
      userId: task.userId,
      status: task.status
    };
  }
  return {
    title: '',
    description: '',
    userId: null,
    status: 'todo'
  };
};

const TaskForm = ({ mode, users, initialTask, isSubmitting, onSubmit, onCancel }: TaskFormProps) => {
  const [formState, setFormState] = useState<TaskFormState>(() => buildInitialState(initialTask));
  const [errors, setErrors] = useState<string | null>(null);

  useEffect(() => {
    setFormState(buildInitialState(initialTask));
    setErrors(null);
  }, [initialTask, mode]);

  const handleChange = (field: keyof TaskFormState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    if (field === 'userId') {
      setFormState((prev: TaskFormState) => ({ ...prev, userId: value ? Number(value) : null }));
    } else if (field === 'status') {
      setFormState((prev: TaskFormState) => ({ ...prev, status: value as TaskStatus }));
    } else {
      setFormState((prev: TaskFormState) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formState.title || formState.title.trim().length < 3) {
      setErrors('Title must be at least 3 characters long.');
      return;
    }
    setErrors(null);
    await onSubmit({
      title: formState.title.trim(),
      description: formState.description.trim(),
      userId: formState.userId,
      status: formState.status
    });
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{mode === 'create' ? 'Add Task' : 'Edit Task'}</h2>
      <label>
        Title
        <input
          type="text"
          value={formState.title}
          onChange={handleChange('title')}
          placeholder="What needs to be done?"
          required
          minLength={3}
        />
      </label>
      <label>
        Description
        <textarea
          value={formState.description ?? ''}
          onChange={handleChange('description')}
          rows={4}
          placeholder="Optional details..."
        />
      </label>
      <label>
        Assign to
        <select value={formState.userId ?? ''} onChange={handleChange('userId')}>
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select value={formState.status} onChange={handleChange('status')}>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </label>
      {errors && <p className="error-message">{errors}</p>}
      <div className="actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create Task' : 'Save Changes'}
        </button>
        <button type="button" onClick={onCancel} className="secondary" disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
