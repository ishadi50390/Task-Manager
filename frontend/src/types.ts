export interface User {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  userId: number | null;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export type TaskPayload = {
  title: string;
  description?: string | null;
  userId: number | null;
  status?: TaskStatus;
};

export interface AuthResponse {
  user: User;
}
