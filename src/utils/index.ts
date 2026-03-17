import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, QRPayload } from '../types';

const USER_STORAGE_KEY = 'vas_user';

export const getPakistanTime = (customDate?: Date | string): string => {
  let sourceDate: Date;
  
  if (customDate) {
    sourceDate = typeof customDate === 'string' ? new Date(customDate) : customDate;
  } else {
    sourceDate = new Date();
  }
  
  // Get UTC time and add 5 hours for Pakistan
  const utcTime = sourceDate.getTime() + sourceDate.getTimezoneOffset() * 60000;
  const pakistanTime = new Date(utcTime + 5 * 60 * 60 * 1000);

  const year = pakistanTime.getFullYear();
  const month = String(pakistanTime.getMonth() + 1).padStart(2, '0');
  const day = String(pakistanTime.getDate()).padStart(2, '0');
  let hours = pakistanTime.getHours();
  const minutes = String(pakistanTime.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
};

export const saveUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const getUser = async (): Promise<User | null> => {
  try {
    const raw = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

export const removeUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

export const isAdmin = (email?: string): boolean => {
  return !!(email && String(email).toLowerCase().includes('admin'));
};

export const isSpecialUser = (email?: string, specialEmails: string[] = []): boolean => {
  return specialEmails.includes(String(email).toLowerCase());
};

export const parseQrPayload = (raw: string): QRPayload | null => {
  const text = String(raw ?? '').trim();
  if (!text) return null;
  const parts = text.split('|').map(p => p.trim()).filter(Boolean);
  // Expected: volunteerId|volunteerName|cnic
  const volunteerId = parts[0] ?? '';
  const volunteerName = parts[1] ?? '';
  const cnic = parts[2];
  if (!volunteerId || !volunteerName) return null;
  return { volunteerId, volunteerName, cnic };
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};
