/**
 * Utilitários para aplicar máscaras em campos de formulário
 */

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export const removeNonNumeric = (value: string): string => {
  return value.replace(/\D/g, '');
};

/**
 * Aplica máscara de celular brasileiro: (00) 00000-0000 ou (00) 0000-0000
 */
export const maskPhone = (value: string): string => {
  const numbers = removeNonNumeric(value);
  
  if (numbers.length <= 2) {
    return numbers.length > 0 ? `(${numbers}` : '';
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    // Celular com 11 dígitos
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
};

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export const maskCPF = (value: string): string => {
  const numbers = removeNonNumeric(value);
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  } else if (numbers.length <= 9) {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  } else {
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  }
};

/**
 * Valida formato de celular brasileiro
 */
export const validatePhone = (phone: string): boolean => {
  const numbers = removeNonNumeric(phone);
  // Aceita 10 ou 11 dígitos (fixo ou celular)
  return numbers.length >= 10 && numbers.length <= 11;
};

/**
 * Valida formato de CPF (apenas formato, não valida dígitos verificadores)
 */
export const validateCPFFormat = (cpf: string): boolean => {
  const numbers = removeNonNumeric(cpf);
  return numbers.length === 11;
};

/**
 * Valida se uma data não é no futuro
 */
export const validateBirthDate = (dateString: string): boolean => {
  if (!dateString) return true; // Opcional
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};
