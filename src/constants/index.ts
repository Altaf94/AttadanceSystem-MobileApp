// Service units and services mapping
export const SERVICE_UNIT_OPTIONS = [
  "Prayer Hall Management Unit",
  "Safety and Security Unit",
  "Ancillary Service Unit",
];

export const SERVICE_OPTIONS: Record<string, string[]> = {
  "Prayer Hall Management Unit": [
    "Announcement & Notice Board Services",
    "Audio Visual",
    "Electric Services",
    "Facilitation Services",
    "Flower Decoration Services",
    "Jura/Tabaruk Services",
    "Nandi Services",
    "Nikkah Services",
    "Paat Services",
    "Other",
  ],
  "Safety and Security Unit": [
    "Perimeter Security, Access Control and Guard Management",
    "JK CCTV / Surveillance System",
    "LEAs Liaison & Public Affairs",
    "Traffic and Parking Management",
    "Safety and Security Patrolling",
    "Emergency Preparedness and Response",
    "First Aid and Fire Safety",
    "JK Safety and Security Training and Reporting",
    "JK Safety and Security Assessment",
    "Other",
  ],
  "Ancillary Service Unit": [
    "Canteen Services",
    "Child Care Services",
    "Decoration & Event Management Services",
    "Elevator Services",
    "Wheel Chair Assistance",
    "Funeral Services",
    "House Keeping Services",
    "Kitchen / Sufra Services",
    "Landscaping Services",
    "Maintenance Services",
    "Water & Shoe Services",
    "Transport Services",
    "Other",
  ],
};

export const DAY_TYPE_OPTIONS = [
  { value: "WORKING_DAYS", label: "Working Days", color: "#3498db", bgColor: "#e5f0ff" },
  { value: "FESTIVAL", label: "Festival", color: "#e67e22", bgColor: "#fff5eb" },
  { value: "GENERAL_EVENT", label: "General", color: "#27ae60", bgColor: "#e9f8ef" },
];

export const SPECIAL_USER_EMAILS = ["noorabaddefault@gmail.com"];

// Colors
export const COLORS = {
  primary: '#3498db',
  primaryDark: '#2980b9',
  secondary: '#667eea',
  success: '#27ae60',
  danger: '#e74c3c',
  warning: '#e67e22',
  info: '#00bfff',
  background: '#f0f4f8',
  white: '#ffffff',
  black: '#000000',
  gray: '#7f8c8d',
  lightGray: '#e6e9ef',
  darkGray: '#34495e',
  textPrimary: '#2c3e50',
  textSecondary: '#7f8c8d',
  border: '#bdc3c7',
  cardBackground: '#f8f9fa',
  gradient: {
    purple: ['#667eea', '#764ba2'],
    pink: ['#f093fb', '#f5576c'],
    blue: ['#3498db', '#2980b9'],
    green: ['#27ae60', '#1abc9c'],
    red: ['#e74c3c', '#c0392b'],
  },
};

// API Base URL - Update this with your actual API URL
// For development, you can use your local machine's IP address
// For production, use your deployed API URL
// Example: 'http://192.168.1.100:3000' (local) or 'https://your-api.vercel.app' (deployed)
export const API_BASE_URL = 'https://qr-attendance-api-95f62209cfd8.herokuapp.com'; // Replace with your actual API URL
