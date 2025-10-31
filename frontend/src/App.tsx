import { useCallback, useEffect, useState } from 'react';
import AuthForm, { AuthMode } from './components/AuthForm';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import { AuthResponse, Task, TaskPayload, User } from './types';

type FilterOption = 'all' | 'todo' | 'in_progress' | 'done';

const filters: Array<{ key: FilterOption; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authLoading, setAuthLoading] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<FilterOption>('all');
  const [tasksLoading, setTasksLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<Task | null>(null);

  const closeForm = useCallback(() => {
    setIsFormVisible(false);
    setEditingTask(null);
  }, []);

  const resetSession = useCallback(
    (message?: string) => {
      closeForm();
      setTasks([]);
      setUsers([]);
      setBusyTaskId(null);
      setEditingTask(null);
  setPendingDeleteTask(null);
      setCurrentUser(null);
      setError(null);
      setFilter('all');
      setAuthMode('login');
      setAuthError(message ?? null);
    },
    [closeForm]
  );

  const handleUnauthorized = useCallback(() => {
    resetSession('Your session has expired. Please log in again.');
  }, [resetSession]);

  const extractErrorMessage = useCallback(async (response: Response) => {
    try {
      const payload = await response.json();
      if (Array.isArray(payload?.errors) && payload.errors.length) {
        return payload.errors.map((err: { msg?: string }) => err.msg).filter(Boolean).join(', ');
      }
      if (typeof payload?.message === 'string') {
        return payload.message;
      }
    } catch (parseError) {
      console.error('Failed to parse error payload:', parseError);
    }
    return `${response.status} ${response.statusText}`;
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const response = await fetch('/api/users', { credentials: 'include' });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: User[] = await response.json();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    } finally {
      setUsersLoading(false);
    }
  }, [extractErrorMessage, handleUnauthorized]);

  const refreshTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const response = await fetch('/api/tasks?status=all', { credentials: 'include' });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: Task[] = await response.json();
      setTasks(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load tasks.');
    } finally {
      setTasksLoading(false);
    }
  }, [extractErrorMessage, handleUnauthorized]);

  useEffect(() => {
    if (!isFormVisible && !pendingDeleteTask) {
      document.body.style.overflow = '';
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isFormVisible, pendingDeleteTask]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'include' });
        if (!response.ok) {
          if (response.status !== 401) {
            console.error(await extractErrorMessage(response));
          }
          resetSession();
          return;
        }
        const data: AuthResponse = await response.json();
        setCurrentUser(data.user);
        setAuthError(null);
      } catch (err) {
        console.error('Failed to load current user:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    loadCurrentUser();
  }, [extractErrorMessage, resetSession]);

  useEffect(() => {
    if (currentUser) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [currentUser, loadUsers]);

  useEffect(() => {
    if (currentUser) {
      refreshTasks();
    } else {
      setTasks([]);
    }
  }, [currentUser, refreshTasks]);

  const openCreateForm = () => {
    setEditingTask(null);
    setIsFormVisible(true);
  };

  const handleLogin = async ({ email, password }: { email: string; password: string }) => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: AuthResponse = await response.json();
      setCurrentUser(data.user);
      setAuthMode('login');
      setAuthError(null);
    } catch (err) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : 'Unable to log in.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleRegister = async ({
    name,
    email,
    password,
    confirmPassword
  }: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, confirmPassword })
      });
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: AuthResponse = await response.json();
      setCurrentUser(data.user);
      setAuthMode('login');
      setAuthError(null);
    } catch (err) {
      console.error(err);
      setAuthError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Error logging out:', err);
    } finally {
      resetSession();
    }
  };

  const isLoading = tasksLoading || usersLoading;
  const showLoader = isLoading && !tasks.length;

  const handleCreateTask = async (payload: TaskPayload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...payload, status: payload.status ?? 'todo' })
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      await refreshTasks();
      closeForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (payload: TaskPayload) => {
    if (!editingTask) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...payload,
          status: payload.status ?? editingTask.status
        })
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      await refreshTasks();
      closeForm();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = (task: Task) => {
    setPendingDeleteTask(task);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteTask) {
      return;
    }
    const task = pendingDeleteTask;
    setBusyTaskId(task.id);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      await refreshTasks();
      setPendingDeleteTask(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleCancelDelete = () => {
    if (busyTaskId !== null && pendingDeleteTask && busyTaskId === pendingDeleteTask.id) {
      return;
    }
    setPendingDeleteTask(null);
  };

  const handleUpdateStatus = async (task: Task, nextStatus: Task['status']) => {
    setBusyTaskId(task.id);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      if (response.status === 401) {
        handleUnauthorized();
        return;
      }
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      await refreshTasks();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to update task.');
    } finally {
      setBusyTaskId(null);
    }
  };

  const formMode = editingTask ? 'edit' : 'create';

  const handleFormSubmit = async (payload: TaskPayload) => {
    if (editingTask) {
      await handleUpdateTask(payload);
    } else {
      await handleCreateTask(payload);
    }
  };

  if (!currentUser) {
    return (
      <AuthForm
        mode={authMode}
        onModeChange={setAuthMode}
        onLogin={handleLogin}
        onRegister={handleRegister}
        isSubmitting={authSubmitting}
        error={authError}
        isLoading={authLoading}
        onClearError={() => setAuthError(null)}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Task Manager</h1>
          <p>Easily track tasks, assign people, and see progress in one place.</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={openCreateForm} disabled={usersLoading}>
            Add Task
          </button>
          <div className="user-pill">
            <span>{currentUser.name}</span>
            <button type="button" onClick={handleLogout} className="ghost">
              Log out
            </button>
          </div>
        </div>
      </header>

      <section className="toolbar">
        <div className="filters">
          {filters.map(({ key, label}) => (
            <button
              key={key}
              type="button"
              className={key === filter ? 'active' : ''}
              onClick={() => setFilter(key)}
              disabled={filter === key}
            >
              <span>{label}</span>
             
            </button>
          ))}
        </div>
        <div className="status">
          {isLoading ? <span>Loading…</span> : <span>{tasks.length} total</span>}
        </div>
      </section>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="main">
        <div className="task-panel">
          {showLoader ? (
            <p>Loading tasks…</p>
          ) : (
            <TaskList
              tasks={tasks}
              activeFilter={filter}
              onEdit={(task) => {
                setEditingTask(task);
                setIsFormVisible(true);
              }}
              onDelete={handleDeleteTask}
              onStatusChange={handleUpdateStatus}
              busyTaskId={busyTaskId}
            />
          )}
        </div>
      </div>

      {isFormVisible && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={formMode === 'create' ? 'Create task' : 'Edit task'}
          onClick={closeForm}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <button type="button" className="modal-dismiss" onClick={closeForm}>
                Close
              </button>
            </div>
            <div className="form-panel">
              <TaskForm
                mode={formMode}
                users={users}
                initialTask={editingTask ?? undefined}
                isSubmitting={isSubmitting}
                onSubmit={handleFormSubmit}
                onCancel={closeForm}
              />
            </div>
          </div>
        </div>
      )}

      {pendingDeleteTask && (
        <div
          className="modal-overlay confirm-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm task deletion"
          onClick={handleCancelDelete}
        >
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="confirm-card">
              <h3>Delete this task?</h3>
              <p>
                Are you sure you want to delete "{pendingDeleteTask.title}"? This action cannot be undone.
              </p>
              <div className="confirm-actions">
                <button
                  type="button"
                  className="danger"
                  onClick={handleConfirmDelete}
                  disabled={busyTaskId === pendingDeleteTask.id}
                >
                  {busyTaskId === pendingDeleteTask.id ? 'Deleting…' : 'OK'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={handleCancelDelete}
                  disabled={busyTaskId === pendingDeleteTask.id}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
