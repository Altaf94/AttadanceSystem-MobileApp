import { API_BASE_URL } from '../constants';
import { User, EventItem, ReportData, UserListItem, ServiceUnitItem } from '../types';

const logApi = (label: string, data: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[API] ${label}`, data);
  }
};

const redactBodyForLog = (body: RequestInit['body']): unknown => {
  if (typeof body !== 'string') {
    return body ?? null;
  }
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>;
    if (typeof parsed.password === 'string') {
      return {
        ...parsed,
        password: `[${parsed.password.length} chars]`,
      };
    }
    return parsed;
  } catch {
    return body;
  }
};

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const method = options.method ?? 'GET';

  logApi('request', {
    method,
    url,
    body: redactBodyForLog(options.body),
  });

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    logApi('error response', {
      method,
      url,
      status: response.status,
      payload,
    });
    throw new Error(
      typeof payload.message === 'string' ? payload.message : 'Request failed'
    );
  }

  const data = await response.json();
  logApi('success', { method, url, status: response.status });
  return data as T;
};

// Auth APIs
export const loginUser = async (email: string, password: string): Promise<{ user: User }> => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim().toLowerCase(), password: password.trim() }),
  });
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  service: string;
  serviceUnit: string;
}): Promise<{ message: string }> => {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...data, name: data.name.trim(), email: data.email.trim().toLowerCase(), password: data.password.trim() }),
  });
};

// Check-in APIs
export const submitCheckIn = async (data: {
  volunteerId: string;
  volunteerName: string;
  event: string;
  takenByUserId: string;
  service?: string;
  serviceUnit?: string;
  actionAt?: string;
  actionAtClient?: string;
}): Promise<{
  action: 'checked_in' | 'checked_out';
  message: string;
  checkIn?: any;
}> => {
  return apiCall('/api/checkin', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Events APIs
export const fetchEvents = async (): Promise<string[] | Record<string, string[]>> => {
  return apiCall('/api/events');
};

export const fetchEventsWithId = async (): Promise<EventItem[]> => {
  return apiCall('/api/events?withId=true');
};

export const createEvent = async (title: string): Promise<{ message: string }> => {
  return apiCall('/api/events', {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
};

export const deleteEvent = async (id: string): Promise<{ deleted: string }> => {
  return apiCall('/api/events', {
    method: 'DELETE',
    body: JSON.stringify({ id }),
  });
};

// Reports APIs
export const fetchReports = async (params?: {
  startDate?: string;
  endDate?: string;
  event?: string;
  service?: string;
  search?: string;
}): Promise<ReportData> => {
  const searchParams = new URLSearchParams();
  if (params?.startDate) searchParams.set('startDate', params.startDate);
  if (params?.endDate) searchParams.set('endDate', params.endDate);
  if (params?.event) searchParams.set('event', params.event);
  if (params?.service) searchParams.set('service', params.service);
  if (params?.search) searchParams.set('search', params.search);
  
  const queryString = searchParams.toString();
  return apiCall(`/api/reports${queryString ? `?${queryString}` : ''}`);
};

// User Management APIs
export const fetchUsers = async (): Promise<UserListItem[]> => {
  return apiCall('/api/users');
};

export const updateUserPassword = async (
  userId: string,
  password: string
): Promise<{ message: string }> => {
  return apiCall(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  });
};

export const updateUserService = async (
  userId: string,
  serviceUnit: string,
  service: string
): Promise<{ message: string }> => {
  return apiCall(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ serviceUnit, service }),
  });
};

export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  return apiCall(`/api/users/${userId}`, {
    method: 'DELETE',
  });
};

export const deleteCheckIn = async (id: string): Promise<{ message: string }> => {
  return apiCall(`/api/checkin/${id}`, {
    method: 'DELETE',
  });
};

export const updateCheckIn = async (
  id: string,
  data: {
    volunteerId?: string;
    volunteerName?: string;
    event?: string;
    service?: string | null;
    serviceUnit?: string | null;
    checkinAt?: string;
    checkinAtClient?: string | null;
  }
): Promise<{ ok: boolean; checkIn?: any }> => {
  return apiCall(`/api/checkin/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

// Services APIs (dynamic service units and services from database)
export const fetchServices = async (): Promise<ServiceUnitItem[]> => {
  return apiCall('/api/services');
};
