import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      // Try to parse the response as JSON first
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Clone the response since we can only read the body once
        const clonedRes = res.clone();
        const jsonData = await clonedRes.json();
        const errorMessage = jsonData.message || jsonData.error || JSON.stringify(jsonData);
        throw new Error(`${res.status}: ${errorMessage}`);
      } else {
        // Fall back to text if not JSON
        const text = await res.text() || res.statusText;
        throw new Error(`${res.status}: ${text}`);
      }
    } catch (parseError) {
      // If we can't parse the response, just use the status text
      if (parseError instanceof Error && parseError.message.includes(res.status.toString())) {
        throw parseError;
      } else {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    }
  }
}

const API_BASE = "http://localhost:5000";

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;
  console.log(`API Request: ${method} ${fullUrl}`, data);
  
  try {
    const res = await fetch(fullUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    
    // Check if there's content to parse
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await res.json();
      console.log(`API Response: ${method} ${fullUrl}`, jsonData);
      return jsonData as T;
    } else if (res.status === 204) {
      // No content
      console.log(`API Response: ${method} ${fullUrl} - No content`);
      return {} as T;
    } else {
      // Try to parse as text
      const text = await res.text();
      console.log(`API Response: ${method} ${fullUrl} - Text:`, text);
      return text as unknown as T;
    }
  } catch (error) {
    console.error(`API Error: ${method} ${fullUrl}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    const fullUrl = url.startsWith("/") ? `${API_BASE}${url}` : url;
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
