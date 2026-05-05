// Crypto utility functions for encrypting/decrypting sensitive data
// Using a simple XOR cipher for client-side encryption
// Note: This is basic encryption for client-side storage, not for highly sensitive data

// Generate a consistent key from browser fingerprint
const generateKey = () => {
  const fingerprint = navigator.userAgent + navigator.language + screen.width + screen.height;
  let key = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    key = ((key << 5) - key) + fingerprint.charCodeAt(i);
    key = key & key; // Convert to 32-bit integer
  }
  return Math.abs(key).toString(16);
};

// XOR encryption function
const xorEncrypt = (text, key) => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode the result
};

// XOR decryption function
const xorDecrypt = (encryptedText, key) => {
  try {
    const text = atob(encryptedText); // Base64 decode first
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
};

// Encrypt password
export const encryptPassword = (password) => {
  if (!password) return '';
  const key = generateKey();
  return xorEncrypt(password, key);
};

// Decrypt password
export const decryptPassword = (encryptedPassword) => {
  if (!encryptedPassword) return '';
  const key = generateKey();
  return xorDecrypt(encryptedPassword, key);
};
