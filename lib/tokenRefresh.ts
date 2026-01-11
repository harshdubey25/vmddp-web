// Token refresh utility with automatic retry logic

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem("frappe_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("frappe_refresh_token", data.refresh_token);
      }
      return data.access_token;
    }

    return null;
  } catch (error) {
    console.error("Token refresh failed:", error);
    // Clear tokens and redirect to login
    localStorage.removeItem("frappe_access_token");
    localStorage.removeItem("frappe_refresh_token");
    return null;
  }
}

export async function fetchWithTokenRefresh(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem("frappe_access_token");

  // Add authorization header if token exists
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // If unauthorized, try to refresh token
  if (response.status === 401 || response.status === 403) {
    if (!isRefreshing) {
      isRefreshing = true;

      const newToken = await refreshAccessToken();

      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);

        // Retry original request with new token
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(input, { ...init, headers });
      } else {
        // Redirect to login if refresh failed
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    } else {
      // Wait for the ongoing refresh to complete
      return new Promise((resolve) => {
        subscribeTokenRefresh(async (newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          const retryResponse = await fetch(input, { ...init, headers });
          resolve(retryResponse);
        });
      });
    }
  }

  return response;
}

// Hook to setup automatic token refresh before expiry
export function setupTokenRefreshTimer() {
  // Check token every 5 minutes and refresh if needed
  const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const TOKEN_EXPIRY_BUFFER = 10 * 60 * 1000; // 10 minutes before expiry

  const checkAndRefresh = async () => {
    const token = localStorage.getItem("frappe_access_token");
    if (!token) return;

    try {
      // Decode JWT to check expiry (if it's a JWT)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiresAt = payload.exp * 1000;
      const now = Date.now();

      // Refresh if token expires within buffer time
      if (expiresAt - now < TOKEN_EXPIRY_BUFFER) {
        await refreshAccessToken();
      }
    } catch {
      // Token might not be JWT, skip proactive refresh
    }
  };

  // Run immediately and then on interval
  checkAndRefresh();
  return setInterval(checkAndRefresh, REFRESH_INTERVAL);
}
