const encryptNote = (content, password) => {
  if (!content || !password) return content;
  
  try {
    // Simple XOR encryption (for demonstration - in production use proper encryption libraries)
    const encrypted = content.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(0));
    }).join('');
    
    return `encrypted:${encrypted}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    return content;
  }
};

const decryptNote = (content, password) => {
  if (!content || !password || !content.startsWith('encrypted:')) return content;
  
  try {
    const encryptedContent = content.slice(10); // Remove 'encrypted:' prefix
    
    // Simple XOR decryption
    const decrypted = encryptedContent.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) ^ password.charCodeAt(0));
    }).join('');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return content;
  }
};

const isEncrypted = (content) => {
  return content && content.startsWith('encrypted:');
};

export default {
  encryptNote,
  decryptNote,
  isEncrypted
};
