import crypto from 'crypto';

/**
 * Generate a secure 6-digit numeric OTP code
 * @returns {string} 6-digit OTP code (e.g. "489201")
 */
export function generateOtp() {
  // Generate a random integer between 100000 and 999999
  const buffer = crypto.randomBytes(4);
  const randomNumber = buffer.readUInt32BE(0) % 900000 + 100000;
  return randomNumber.toString();
}

export default generateOtp;
