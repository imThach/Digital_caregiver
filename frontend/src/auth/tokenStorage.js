const ROLE_KEY = 'user_role';
const TOKEN_KEY = 'jwt_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function getUserRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function saveAuthSession(role, token) {
  if (role) {
    localStorage.setItem(ROLE_KEY, role);
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem('cached_elderly_user');
}
