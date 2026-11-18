export interface User {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface AuthStatus {
  authenticated: boolean;
  user: User | null;
}

export async function fetchAuthStatus(): Promise<AuthStatus> {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
    });
    if (!res.ok) {
      return { authenticated: false, user: null };
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch auth status:', err);
    return { authenticated: false, user: null };
  }
}

export async function loginUser(identifier: string, password: string): Promise<AuthStatus> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      username_or_email: identifier,
      password: password,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Login failed. Please check your credentials.');
  }
  return data;
}

export async function registerUser(username: string, email: string, password: string): Promise<AuthStatus> {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || data.message || 'Registration failed.');
  }
  return data;
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}
