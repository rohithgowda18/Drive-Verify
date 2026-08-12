// Lightweight auth helper for managing session token in sessionStorage (no raw secrets saved)
const TOKEN_KEY = "drive_verify_admin_token";

export const auth = {
  getToken: (): string | null => {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken: (token: string): void => {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  clearToken: (): void => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("adminKey"); // Cleanup any legacy raw secrets
  },

  isAuthenticated: (): boolean => {
    return !!sessionStorage.getItem(TOKEN_KEY);
  },
};
