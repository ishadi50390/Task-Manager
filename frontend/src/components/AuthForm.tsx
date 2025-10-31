import { FormEvent, useMemo, useState } from 'react';

export type AuthMode = 'login' | 'register';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  name: string;
  confirmPassword: string;
}

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onLogin: (payload: LoginData) => Promise<void> | void;
  onRegister: (payload: RegisterData) => Promise<void> | void;
  isSubmitting: boolean;
  error: string | null;
  isLoading: boolean;
  onClearError: () => void;
}

const AuthForm = ({
  mode,
  onModeChange,
  onLogin,
  onRegister,
  isSubmitting,
  error,
  isLoading,
  onClearError
}: AuthFormProps) => {
  const [loginData, setLoginData] = useState<LoginData>({ email: '', password: '' });
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const activeError = useMemo(() => localError || error, [localError, error]);

  const handleModeToggle = (nextMode: AuthMode) => {
    onClearError();
    if (nextMode !== mode) {
      setLocalError(null);
      if (nextMode === 'login') {
        setRegisterData({ name: '', email: '', password: '', confirmPassword: '' });
      } else {
        setLoginData({ email: '', password: '' });
      }
      onModeChange(nextMode);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || isLoading) {
      return;
    }
    onClearError();
    setLocalError(null);

    if (mode === 'login') {
      const trimmed = {
        email: loginData.email.trim(),
        password: loginData.password
      };
      if (!trimmed.email || !trimmed.password) {
        setLocalError('Enter your email and password.');
        return;
      }
      await onLogin(trimmed);
    } else {
      const trimmed = {
        name: registerData.name.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        confirmPassword: registerData.confirmPassword
      };
      if (!trimmed.name || !trimmed.email || !trimmed.password) {
        setLocalError('Complete all fields to continue.');
        return;
      }
      if (trimmed.password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
      if (trimmed.password !== trimmed.confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      await onRegister(trimmed);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-surface">
        <aside className="auth-hero">
          <figure className="hero-visual" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=960&q=80"
              alt="People collaborating around laptops"
              loading="lazy"
            />
          
          </figure>
          <div className="hero-content">
            <div className="hero-brand">
             
              <div>
                <h1>Task Manager</h1>
                <p>Keep deliveries running smoothly with an easy collaboration space.</p>
              </div>
            </div>
            <ul className="hero-list">
              <li>
                <span className="dot" />
                Real-time Assignee visibility
              </li>
              <li>
                <span className="dot" />
                Kanban board friendly views
              </li>
             
            </ul>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
            <p className="subtitle">Sign in to manage tasks with your team.</p>
          </div>
          {isLoading && <p className="info-note">Checking your session…</p>}
          <div className="auth-toggle">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => handleModeToggle('login')}>
              Log in
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'active' : ''}
              onClick={() => handleModeToggle('register')}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <label>
                Username
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(event) => {
                    onClearError();
                    setRegisterData((current) => ({ ...current, name: event.target.value }));
                  }}
                  placeholder="Kumari Munasinghe"
                  required
                />
              </label>
            )}
            <label>
              Email
              <input
                type="email"
                value={mode === 'login' ? loginData.email : registerData.email}
                onChange={(event) => {
                  onClearError();
                  if (mode === 'login') {
                    setLoginData((current) => ({ ...current, email: event.target.value }));
                  } else {
                    setRegisterData((current) => ({ ...current, email: event.target.value }));
                  }
                }}
                placeholder="abc@gmail.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={mode === 'login' ? loginData.password : registerData.password}
                onChange={(event) => {
                  onClearError();
                  if (mode === 'login') {
                    setLoginData((current) => ({ ...current, password: event.target.value }));
                  } else {
                    setRegisterData((current) => ({ ...current, password: event.target.value }));
                  }
                }}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
            {mode === 'register' && (
              <label>
                Confirm password
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(event) => {
                    onClearError();
                    setRegisterData((current) => ({ ...current, confirmPassword: event.target.value }));
                  }}
                  placeholder="Re-enter password"
                  required
                  minLength={6}
                />
              </label>
            )}

            {activeError && <p className="error-message center">{activeError}</p>}

            <button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
