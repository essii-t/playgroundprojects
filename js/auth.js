// Lightweight session/auth flag, separate from Store's app data so that
// logging out never touches accounts/budget/goals — only the session.
const AUTH_KEY = 'meridian-auth';

const Auth = {
  isLoggedIn() {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch (e) {
      return false;
    }
  },
  login(email) {
    localStorage.setItem(AUTH_KEY, 'true');
    if (email) localStorage.setItem('meridian-auth-email', email);
  },
  logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'login.html';
  },
  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.replace('login.html');
    }
  },
  redirectIfLoggedIn() {
    if (this.isLoggedIn()) {
      window.location.replace('index.html');
    }
  },
};
