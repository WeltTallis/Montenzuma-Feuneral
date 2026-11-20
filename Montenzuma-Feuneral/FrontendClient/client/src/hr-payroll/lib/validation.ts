import { stripDiacritics } from '@hr/utils/kenyan';

// Validation helpers for Kenyan HR forms.

export const validateKenyanNationalId = (idNumber: string): { valid: boolean; error?: string } => {
  const cleanID = idNumber.replace(/\s/g, '');

  if (!cleanID) {
    return { valid: false, error: 'National ID is required.' };
  }

  if (!/^\d{7,8}$/.test(cleanID)) {
    return { valid: false, error: 'Enter a 7- or 8-digit Kenyan National ID.' };
  }

  return { valid: true };
};

export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  const cleanPhone = phone.replace(/[\s.-]/g, '');

  if (!cleanPhone) {
    return { valid: false, error: 'Mobile number is required.' };
  }

  const isValid = /^(?:\+?254|0)(?:7|1)\d{8}$/.test(cleanPhone);

  if (!isValid) {
    return { valid: false, error: 'Enter a valid Kenyan mobile number, such as 0712345678 or +254712345678.' };
  }

  return { valid: true };
};

/**
 * Kenyan National ID numbers are 7-8 digits; mobile numbers use 10 local digits
 * or the +254 country code.
 */
export const isKenyanNationalIDValue = (value: string): boolean =>
  /^\d{7,8}$/.test(value.replace(/[\s.-]/g, ''));

/** Guards the mobile field against a National ID typed into it. */
export const validateMobileNotNationalID = (mobile: string): { valid: boolean; error?: string } => {
  if (mobile && isKenyanNationalIDValue(mobile)) {
    return { valid: false, error: 'Enter a mobile number, not a National ID.' };
  }
  return { valid: true };
};
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email) {
    return { valid: false, error: 'Email is required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Enter a valid email address.' };
  }

  return { valid: true };
};

// Date validation (DD/MM/YYYY format)
export const validateDate = (dateStr: string): { valid: boolean; error?: string } => {
  if (!dateStr) {
    return { valid: false, error: 'Date is required.' };
  }

  const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dateStr.match(dateRegex);

  if (!match) {
    return { valid: false, error: 'Date must use the DD/MM/YYYY format.' };
  }

  const [, day, month, year] = match;
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

  if (
    date.getDate() !== parseInt(day) ||
    date.getMonth() !== parseInt(month) - 1 ||
    date.getFullYear() !== parseInt(year)
  ) {
    return { valid: false, error: 'Enter a valid date.' };
  }

  return { valid: true };
};

// Date range validation
export const validateDateRange = (
  startDate: string,
  endDate: string
): { valid: boolean; error?: string } => {
  const startValidation = validateDate(startDate);
  if (!startValidation.valid) {
    return { valid: false, error: `Start date: ${startValidation.error}` };
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.valid) {
    return { valid: false, error: `End date: ${endValidation.error}` };
  }

  const [startDay, startMonth, startYear] = startDate.split('/');
  const [endDay, endMonth, endYear] = endDate.split('/');

  const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
  const end = new Date(parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));

  if (end <= start) {
    return { valid: false, error: 'End date must be after the start date.' };
  }

  return { valid: true };
};

// Working hours validation (0-24)
export const validateWorkingHours = (hours: number): { valid: boolean; error?: string } => {
  if (hours === undefined || hours === null) {
    return { valid: false, error: 'Hours are required.' };
  }

  if (isNaN(hours)) {
    return { valid: false, error: 'Hours must be a number.' };
  }

  if (hours < 0 || hours > 24) {
    return { valid: false, error: 'Hours must be between 0 and 24.' };
  }

  return { valid: true };
};

// Currency validation (VND, no decimals)
export const validateCurrency = (amount: number | string): { valid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseInt(amount.replace(/[.,]/g, '')) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: 'Enter a valid amount.' };
  }

  if (numAmount < 0) {
    return { valid: false, error: 'Amount cannot be negative.' };
  }

  if (!Number.isInteger(numAmount)) {
    return { valid: false, error: 'Amount must be a whole number (VND).' };
  }

  return { valid: true };
};

// Format currency for display — delegates to canonical implementation
import { formatCurrency as _formatCurrency } from '@hr/utils/formatters';
export { _formatCurrency as formatCurrency };

// Format legacy payroll amounts in VND.
export const formatCurrencyShort = (amount: number): string => {
  return _formatCurrency(amount);
};

// Project code validation (PRJ-YYYY-XXX format)
export const validateProjectCode = (code: string): { valid: boolean; error?: string } => {
  if (!code) {
    return { valid: false, error: 'Project code is required.' };
  }

  const codeRegex = /^PRJ-\d{4}-\d{3}$/;

  if (!codeRegex.test(code)) {
    return { valid: false, error: 'Project code must use the PRJ-YYYY-XXX format.' };
  }

  return { valid: true };
};

// Password strength validation
export const validatePassword = (password: string): {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
} => {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (!password) {
    return { valid: false, strength, errors: ['Password is required.'] };
  }

  if (password.length < 8) {
    errors.push('Password must contain at least 8 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }

  // Calculate strength
  const hasLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthScore = [
    hasLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  if (strengthScore === 5) {
    strength = 'strong';
  } else if (strengthScore >= 3) {
    strength = 'medium';
  }

  return {
    valid: errors.length === 0,
    strength,
    errors
  };
};

// Format a name to title case.
// Removes numbers, special characters, normalizes whitespace, and capitalizes first letter of each word
export const formatKenyanName = (name: string): string => {
  if (!name) {
    return '';
  }

  // Keep Unicode letters used in Kenyan names.
  const isLetter = (char: string): boolean => {
    const code = char.charCodeAt(0);
    return (
      (code >= 65 && code <= 90) ||   // A-Z
      (code >= 97 && code <= 122) ||  // a-z
      code > 127                       // Unicode letters
    );
  };

  // Step 1: Remove all numbers and special characters, keep only letters and spaces
  let cleaned = '';
  for (const char of name) {
    if (isLetter(char) || char === ' ') {
      cleaned += char;
    }
  }

  // Step 2: Trim and normalize whitespace (remove leading/trailing spaces, collapse multiple spaces)
  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  // Step 3: Return empty string if nothing left after cleaning
  if (!cleaned) {
    return '';
  }

  // Step 4: Convert to title case (capitalize first letter of each word)
  const words = cleaned.split(' ');
  const titleCased = words.map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).filter(word => word !== ''); // Remove any empty strings

  return titleCased.join(' ');
};

// Full name validation (letters and spaces).
export const validateFullname = (fullname: string): { valid: boolean; error?: string } => {
  const trimmedName = fullname?.trim();

  if (!trimmedName) {
    return { valid: false, error: 'Full name is required.' };
  }

  // Normalize accented characters before checking the name.
  const normalized = stripDiacritics(trimmedName);

  const nameRegex = /^[a-zA-Z\s]+$/;

  if (!nameRegex.test(normalized)) {
    return { valid: false, error: 'Full name can contain letters and spaces only.' };
  }

  return { valid: true };
};

// Bank account validation.
export const validateBankAccount = (accountNumber: string): { valid: boolean; error?: string } => {
  const cleanAccount = accountNumber.replace(/\s/g, '');

  if (!cleanAccount) {
    return { valid: false, error: 'Bank account number is required.' };
  }

  // Kenyan bank account numbers commonly contain 9-14 digits.
  if (!/^\d{9,14}$/.test(cleanAccount)) {
    return { valid: false, error: 'Bank account number must contain 9-14 digits.' };
  }

  return { valid: true };
};

// SWIFT code validation
export const validateSWIFTCode = (code: string): { valid: boolean; error?: string } => {
  if (!code) {
    return { valid: false, error: 'Mã SWIFT là bắt buộc' };
  }

  // SWIFT code format: 8 or 11 characters
  if (!/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(code)) {
    return { valid: false, error: 'Mã SWIFT không hợp lệ' };
  }

  return { valid: true };
};

// Duplicate check helper
export const checkDuplicate = <T>(
  value: T,
  existingValues: T[],
  fieldName: string
): { valid: boolean; error?: string } => {
  if (existingValues.includes(value)) {
    return { valid: false, error: `${fieldName} đã tồn tại` };
  }

  return { valid: true };
};

// Form validation helper
export const validateForm = (
  formData: Record<string, unknown>,
  validations: Record<string, (value: unknown) => { valid: boolean; error?: string }>
): { valid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  for (const [field, validator] of Object.entries(validations)) {
    const result = validator(formData[field]);
    if (!result.valid && result.error) {
      errors[field] = result.error;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};
