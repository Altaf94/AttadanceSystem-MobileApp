import { API_BASE_URL } from '../constants';
import { User, EventItem, ReportData, UserListItem } from '../types';

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(payload.message || 'Request failed');
  }

  return response.json();
};

// Auth APIs
export const loginUser = async (email: string, password: string): Promise<{ user: User }> => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
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
    body: JSON.stringify(data),
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
