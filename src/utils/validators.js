export const isEduEmail = (email) =>
  typeof email === 'string' && email.toLowerCase().endsWith('.edu.tr');

export const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('En az 8 karakter');
  if (!/[A-Z]/.test(password)) errors.push('Büyük harf');
  if (!/[a-z]/.test(password)) errors.push('Küçük harf');
  if (!/[0-9]/.test(password)) errors.push('Rakam');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Özel karakter');
  return errors;
};

export const getPasswordStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { level: 'weak', label: 'Zayıf', color: '#C84040', width: '33%' };
  if (score <= 4) return { level: 'medium', label: 'Orta', color: '#E8A020', width: '66%' };
  return { level: 'strong', label: 'Güçlü', color: '#3A8A5A', width: '100%' };
};
