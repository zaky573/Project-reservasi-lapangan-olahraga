export type ApiQuery = Record<string, string | number | boolean | null | undefined>;

type ApiRequestOptions = {
  body?: unknown;
  query?: ApiQuery;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  data: unknown;

  constructor(message: string, status: number, data: unknown, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.errors = errors;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export const BACKEND_ORIGIN = (
  import.meta.env.VITE_BACKEND_ORIGIN ||
  (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '')
).replace(/\/$/, '');

const TOKEN_KEY = 'auth_token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function buildUrl(path: string, query?: ApiQuery) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${cleanPath}`;
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

function resolveMessage(data: any, fallback: string) {
  if (data?.message) return data.message;

  const firstError = data?.errors && Object.values(data.errors)[0];
  if (Array.isArray(firstError) && firstError[0]) {
    return firstError[0];
  }

  return fallback;
}

export function buildStorageUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;

  const cleanPath = path.replace(/^\/+/, '');
  const storagePath = cleanPath.startsWith('storage/') ? cleanPath : `storage/${cleanPath}`;

  return BACKEND_ORIGIN ? `${BACKEND_ORIGIN}/${storagePath}` : `/${storagePath}`;
}

export function getAuthHeaders(extraHeaders?: Record<string, string>) {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers = getAuthHeaders(options.headers);

  if (!isFormData && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      resolveMessage(data, 'Request gagal'),
      response.status,
      data,
      typeof data === 'object' && data !== null ? (data as any).errors : undefined
    );
  }

  return data as T;
}

export async function apiDownloadBlob(path: string, query?: ApiQuery) {
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await response.json() : await response.text();

    throw new ApiError(resolveMessage(data, 'Download gagal'), response.status, data);
  }

  return response.blob();
}

export const apiClient = {
  get: <T>(path: string, query?: ApiQuery) => apiRequest<T>('GET', path, { query }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, { body }),
  postForm: <T>(path: string, body: FormData) => apiRequest<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => apiRequest<T>('PUT', path, { body }),
  delete: <T>(path: string) => apiRequest<T>('DELETE', path),
  downloadBlob: (path: string, query?: ApiQuery) => apiDownloadBlob(path, query),
};

const axiosLikeApi = {
  get: async <T>(path: string, config?: { params?: ApiQuery }) => ({
    data: await apiClient.get<T>(path, config?.params),
  }),
  post: async <T>(path: string, body?: unknown) => ({
    data:
      body instanceof FormData
        ? await apiClient.postForm<T>(path, body)
        : await apiClient.post<T>(path, body),
  }),
  put: async <T>(path: string, body?: unknown) => ({
    data: await apiClient.put<T>(path, body),
  }),
  delete: async <T>(path: string) => ({
    data: await apiClient.delete<T>(path),
  }),
};

export default axiosLikeApi;
