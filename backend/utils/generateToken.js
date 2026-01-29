/**
 * @fileoverview JWT Token Generator
 * @description Creates signed authentication tokens
 * @module utils/generateToken
 * @requires jsonwebtoken
 */

const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token
 * @param {string} id - User ID
 * @returns {string} JWT Token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = generateToken;
