/**
 * @fileoverview Validators
 * @description Validation functions for forms (email, password, etc.)
 * @module utils/validators
 */

/**
 * Validates an email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validates a password (minimum 6 characters)
 * @param {string} password - Password to validate
 * @returns {boolean} True if valid
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validates a username (minimum 3 characters)
 * @param {string} username - Username to validate
 * @returns {boolean} True if valid
 */
export const validateUsername = (username) => {
  return username && username.length >= 3;
};

/**
 * Validates that a field is not empty
 * @param {string} value - Value to validate
 * @returns {boolean} True if not empty
 */
export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

/**
 * Validates an invitation code (8 alphanumeric characters)
 * @param {string} code - Code to validate
 * @returns {boolean} True if valid
 */
export const validateInviteCode = (code) => {
  const re = /^[A-Z0-9]{8}$/;
  return re.test(code);
};

/**
 * Validates if an avatar is a real image uploaded by the user
 * Only accepts images in data:image format (base64)
 * @param {string} avatar - URL or data URI of the avatar
 * @returns {boolean} True if it's a valid uploaded avatar
 */
export const isValidAvatar = (avatar) => {
  return avatar && avatar.startsWith('data:image');
};

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} String with the first letter capitalized
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
