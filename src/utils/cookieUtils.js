import Cookies from 'js-cookie';
import { encryptPassword, decryptPassword } from './crypto.js';

// Cookie names
const REMEMBER_ME_EMAIL = 'fittrack_remember_email';
const REMEMBER_ME_PASSWORD = 'fittrack_remember_password';
const REMEMBER_ME_FLAG = 'fittrack_remember_flag';

// Cookie expiration (30 days)
const COOKIE_EXPIRES = 30;

// Store credentials in cookies
export const storeCredentialsInCookies = (email, password) => {
  try {
    // Store email
    Cookies.set(REMEMBER_ME_EMAIL, email, { 
      expires: COOKIE_EXPIRES, 
      secure: true, 
      sameSite: 'strict' 
    });
    
    // Store encrypted password
    const encryptedPassword = encryptPassword(password);
    Cookies.set(REMEMBER_ME_PASSWORD, encryptedPassword, { 
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
    
    console.log('Credentials stored in cookies successfully');
  } catch (error) {
    console.error('Error storing credentials in cookies:', error);
  }
};

// Retrieve credentials from cookies
export const getCredentialsFromCookies = () => {
  try {
    const rememberFlag = Cookies.get(REMEMBER_ME_FLAG);
    if (!rememberFlag || rememberFlag !== 'true') {
      return null;
    }
    
    const email = Cookies.get(REMEMBER_ME_EMAIL) || '';
    const encryptedPassword = Cookies.get(REMEMBER_ME_PASSWORD) || '';
    
    if (!email || !encryptedPassword) {
      return null;
    }
    
    const password = decryptPassword(encryptedPassword);
    
    return {
      email,
      password
    };
  } catch (error) {
    console.error('Error retrieving credentials from cookies:', error);
    return null;
  }
};

// Clear all remember me cookies
export const clearRememberMeCookies = () => {
  try {
    Cookies.remove(REMEMBER_ME_EMAIL);
    Cookies.remove(REMEMBER_ME_PASSWORD);
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
