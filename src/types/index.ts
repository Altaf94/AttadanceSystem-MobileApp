export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  service?: string;
  serviceUnit?: string;
  active?: boolean;
}

export interface EventItem {
  id: string;
  occasion: string;
  category: string;
}

export interface CheckIn {
  id: string;
  volunteerId: string;
  volunteerName: string;
  event: string;
  service?: string | null;
  serviceUnit?: string | null;
  checkinAt: string;
  checkinAtClient?: string | null;
}

export interface LastAttendance {
  volunteerId: string;
  volunteerName: string;
  action: string;
  time?: string;
}

export interface ReportSummary {
  totalCheckins: number;
  uniqueVolunteers: number;
  totalEvents: number;
  todayCheckins: number;
}

export interface ReportData {
  summary: ReportSummary;
  eventStats: { name: string; count: number }[];
  serviceStats: { name: string; count: number }[];
  dailyStats: { date: string; count: number }[];
  hourlyStats: { hour: string; count: number }[];
  topVolunteers: { volunteerId: string; volunteerName: string; count: number }[];
  categoryStats: { name: string; count: number }[];
  checkins: CheckIn[];
  filters: {
    events: string[];
    services: string[];
  };
}

export interface QRPayload {
  volunteerId: string;
  volunteerName: string;
  cnic?: string;
}

// User Management Types
export interface UserListItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  active: boolean;
  service: string | null;
  serviceUnit: string | null;
  createdAt: string;
}

// Service Unit Types (dynamic from API)
export interface ServiceItem {
  id: string;
  name: string;
  serviceUnitId: string;
}

export interface ServiceUnitItem {
  id: string;
  name: string;
  services: ServiceItem[];
}

export type ServiceRequisitionStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';

export interface ServiceRequisition {
  id: string;
  requestDate: string;
  programTitle: string;
  organisingInstitution: string | null;
  collaboratingInstitutes: string | null;
  invitedGuest: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  duration: string | null;
  targetAudience: string | null;
  ageGroup: string | null;
  expectedGathering: string | null;
  objectives: string | null;
  prfAttachment?: string | null;
  venues: string[];
  otherVenue: string | null;
  chairsRequired: number | null;
  requirements: string[];
  otherRequirements: string | null;
  servicesRequired: boolean;
  serviceVolunteers: Record<string, string>;
  tkService: string | null;
  requestorName: string | null;
  contactDetails: string | null;
  mukhiSaheb: string | null;
  kamadiaSaheb: string | null;
  directorGent: string | null;
  directorLadies: string | null;
  rec: string | null;
  studyCircle: string | null;
  status: ServiceRequisitionStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt?: string;
}

export type ServiceRequisitionInput = {
  id?: string | null;
  status: ServiceRequisitionStatus;
  chairsRequired?: string | number | null;
  requestDate?: string | null;
  programTitle: string;
  organisingInstitution?: string | null;
  collaboratingInstitutes?: string | null;
  invitedGuest?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: string | null;
  targetAudience?: string | null;
  ageGroup?: string | null;
  expectedGathering?: string | null;
  objectives?: string | null;
  prfAttachment?: string | null;
  venues?: string[];
  otherVenue?: string | null;
  requirements?: string[];
  otherRequirements?: string | null;
  servicesRequired?: boolean;
  serviceVolunteers?: Record<string, string>;
  tkService?: string | null;
  requestorName?: string | null;
  contactDetails?: string | null;
  mukhiSaheb?: string | null;
  kamadiaSaheb?: string | null;
  directorGent?: string | null;
  directorLadies?: string | null;
  rec?: string | null;
  studyCircle?: string | null;
};

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  CheckIn: { 
    event?: string;
    service?: string;
    serviceUnit?: string;
    scannedData?: {
      volunteerId: string;
      volunteerName: string;
      cnic?: string;
    };
  };
  RegisterUser: undefined;
  Reports: undefined;
  AddEvent: undefined;
  ManageEvents: undefined;
  GenerateQR: undefined;
  QRScanner: { event: string; service?: string; serviceUnit?: string };
  UserManagement: undefined;
  BackdatedAttendance: undefined;
  ServiceRequisition: undefined;
  ServiceRequisitions: undefined;
};
