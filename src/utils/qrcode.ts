/**
 * Generate QR code payload for a volunteer
 * Format: volunteerId|volunteerName|cnic
 */
export const generateVolunteerQRPayload = (
  volunteerId: string,
  volunteerName: string,
  cnic?: string
): string => {
  const parts = [volunteerId, volunteerName];
  if (cnic) {
    parts.push(cnic);
  }
  return parts.join('|');
};

/**
 * Generate a shareable QR code data URL (base64)
 * This can be used for printing or sharing
 */
export const generateQRCodeData = async (
  value: string
): Promise<string> => {
  // This would require integration with a QR code generator library
  // that can return base64 data. For now, returning the value as-is
  // In production, you might use a service like QR Server
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(value)}`;
};

/**
 * Generate batch QR codes for multiple volunteers
 */
export const generateBatchQRPayloads = (
  volunteers: Array<{ id: string; name: string; cnic?: string }>
): string[] => {
  return volunteers.map(vol =>
    generateVolunteerQRPayload(vol.id, vol.name, vol.cnic)
  );
};
