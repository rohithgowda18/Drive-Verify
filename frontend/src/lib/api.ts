import { auth } from "./auth";

export const API_BASE_URL = "http://localhost:8080";

async function handleResponse(response: Response) {
  const text = await response.text();
  
  if (!response.ok) {
    let msg = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.error) msg = parsed.error;
    } catch {}
    throw new Error(msg || `HTTP Error: ${response.status}`);
  }
  
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = auth.getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  auth: {
    adminLogin: async (adminKey: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminKey }),
      });
      return handleResponse(response);
    },
  },
  rc: {
    // Public endpoints
    search: async (rcNumber: string) => {
      const response = await fetch(
        `${API_BASE_URL}/api/rc/search?rcNumber=${encodeURIComponent(rcNumber)}`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );
      return handleResponse(response);
    },

    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/rc`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getPage: async (params: {
      page?: number; size?: number; registrationState?: string; stolen?: boolean; suspicious?: boolean; make?: string; ownerName?: string;
    }) => {
      const q = new URLSearchParams();
      if (params.page != null) q.set("page", String(params.page));
      if (params.size != null) q.set("size", String(params.size));
      if (params.registrationState) q.set("registrationState", params.registrationState);
      if (params.stolen != null) q.set("stolen", String(params.stolen));
      if (params.suspicious != null) q.set("suspicious", String(params.suspicious));
      if (params.make) q.set("make", params.make);
      if (params.ownerName) q.set("ownerName", params.ownerName);
      const response = await fetch(`${API_BASE_URL}/api/rc/page?${q.toString()}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    getHistory: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}/history`, {
        method: "GET",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },

    // Admin-only endpoints
    create: async (rc: any) => {
      const response = await fetch(`${API_BASE_URL}/api/rc`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(rc),
      });
      return handleResponse(response);
    },

    update: async (id: string, rc: any) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(rc),
      });
      return handleResponse(response);
    },

    remove: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      return handleResponse(response);
    },
  },
  verifications: {
    create: async (data: { rcNumber: string; sellerClaim?: any }) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/evaluate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return handleResponse(response);
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/verifications/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse(response);
    },

    getByRcNumber: async (rcNumber: string) => {
      const response = await fetch(`${API_BASE_URL}/api/verifications/vehicle/${encodeURIComponent(rcNumber)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse(response);
    },

    getTimeline: async (rcNumber: string) => {
      const response = await fetch(`${API_BASE_URL}/api/verifications/vehicle/${encodeURIComponent(rcNumber)}/timeline`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse(response);
    },
  },
};
