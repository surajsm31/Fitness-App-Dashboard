import Cookies from 'js-cookie';
import { encryptPassword, decryptPassword } from './crypto.js';

// Cookie names
const REMEMBER_ME_EMAIL = 'fittrack_remember_email';
const REMEMBER_ME_PASSWORD = 'fittrack_remember_password';
const REMEMBER_ME_FLAG = 'fittrack_remember_flag';

// Cookie expiration (30 days)
const COOKIE_EXPIRES = 30;

// Store credentials in cookies (email only)
export const storeCredentialsInCookies = (email) => {
  try {
    // Store email only
    Cookies.set(REMEMBER_ME_EMAIL, email, { 
      expires: COOKIE_EXPIRES, 
      secure: true, 
      sameSite: 'strict' 
    });
    
    // Set remember me flag
    Cookies.set(REMEMBER_ME_FLAG, 'true', { 
      expires: COOKIE_EXPIRES, 
      secure: true, 
      sameSite: 'strict' 
    });
    
    console.log('Email stored in cookies successfully');
  } catch (error) {
    console.error('Error storing email in cookies:', error);
  }
};

// Retrieve credentials from cookies (email only)
export const getCredentialsFromCookies = () => {
  try {
    const rememberFlag = Cookies.get(REMEMBER_ME_FLAG);
    if (!rememberFlag || rememberFlag !== 'true') {
      return null;
    }
    
    const email = Cookies.get(REMEMBER_ME_EMAIL) || '';
    
    if (!email) {
      return null;
    }
    
    return {
      email,
      password: '' // Password is not stored
    };
  } catch (error) {
    console.error('Error retrieving email from cookies:', error);
    return null;
  }
};

// Clear all remember me cookies
export const clearRememberMeCookies = () => {
  try {
    Cookies.remove(REMEMBER_ME_EMAIL);
    Cookies.remove(REMEMBER_ME_PASSWORD); // Clear password cookie if it exists
    Cookies.remove(REMEMBER_ME_FLAG);
    console.log('Remember me cookies cleared successfully');
  } catch (error) {
    console.error('Error clearing remember me cookies:', error);
  }
};

// Check if remember me is active
export const isRememberMeActive = () => {
  const flag = Cookies.get(REMEMBER_ME_FLAG);
  return flag === 'true';
};

// Check if credentials are already stored (email only)
export const areCredentialsStored = () => {
  const email = Cookies.get(REMEMBER_ME_EMAIL);
  const flag = Cookies.get(REMEMBER_ME_FLAG);
  return !!(email && flag === 'true');
};
