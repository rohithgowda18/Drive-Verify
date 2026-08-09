// API client for Spring Boot backend
export const API_BASE_URL = "http://localhost:8080";

async function handleResponse(response: Response) {
  const text = await response.text();
  
  if (!response.ok) {
    const errorMsg = text || `HTTP Error: ${response.status}`;
    throw new Error(errorMsg);
  }
  
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON response: ${text}`);
  }
}

export const apiClient = {
  baseUrl: API_BASE_URL,
  // Placeholder auth methods (backend auth not present in this module)
  auth: {
    signUp: async (_email: string, _password: string, _fullName: string) => {
      throw new Error("Auth API not implemented in backend");
    },
    signIn: async (_email: string, _password: string) => {
      throw new Error("Auth API not implemented in backend");
    },
  },
  rc: {
    // Public endpoints
    search: async (rcNumber: string) => {
      const response = await fetch(
        `${API_BASE_URL}/api/rc/search?rcNumber=${encodeURIComponent(rcNumber)}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      return handleResponse(response);
    },

    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/api/rc`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
      return handleResponse(response);
    },

    getById: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      return handleResponse(response);
    },

    getHistory: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}/history`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
      });
      return handleResponse(response);
    },

    // Admin-only endpoints (automatically read X-ADMIN-KEY from localStorage)
    create: async (rc: any) => {
      const adminKey = localStorage.getItem("adminKey") || "";
      const response = await fetch(`${API_BASE_URL}/api/rc`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": adminKey,
        },
        body: JSON.stringify(rc),
      });
      return handleResponse(response);
    },

    update: async (id: string, rc: any) => {
      const adminKey = localStorage.getItem("adminKey") || "";
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-ADMIN-KEY": adminKey,
        },
        body: JSON.stringify(rc),
      });
      return handleResponse(response);
    },

    remove: async (id: string) => {
      const adminKey = localStorage.getItem("adminKey") || "";
      const response = await fetch(`${API_BASE_URL}/api/rc/${id}`, {
        method: "DELETE",
        headers: {
          "X-ADMIN-KEY": adminKey,
        },
      });
      return handleResponse(response);
    },
  },
};
