const ROLE_KEY = 'user_role';

export function getUserRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function saveAuthSession(role) {
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
}

export function clearAuthSession() {
  localStorage.removeItem('jwt_token');
  localStorage.removeItem(ROLE_KEY);
}
