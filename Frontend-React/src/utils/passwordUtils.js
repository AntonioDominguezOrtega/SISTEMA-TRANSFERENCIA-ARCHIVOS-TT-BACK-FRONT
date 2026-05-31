export function getPasswordErrors(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres.');
  }
  if (password && !/[A-Z]/.test(password)) {
    errors.push('Debe contener al menos una letra mayúscula.');
  }
  if (password && !/[0-9]/.test(password)) {
    errors.push('Debe contener al menos un número.');
  }
  return errors;
}

export function isPasswordValid(password) {
  return getPasswordErrors(password).length === 0;
}
