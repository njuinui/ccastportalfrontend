// src/utils/errorHelpers.js
import toast from 'react-hot-toast';
export function getValidationErrors(error) {
  if (error.response?.status === 422) {
    const errors = error.response.data.errors || {};
    const messages = [];
    
    Object.entries(errors).forEach(([field, fieldErrors]) => {
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(msg => {
          messages.push({ field, message: msg });
        });
      } else {
        messages.push({ field, message: fieldErrors });
      }
    });
    
    return messages;
  }
  return [];
}

export function displayValidationErrors(error) {
  const errors = getValidationErrors(error);
  if (errors.length > 0) {
    errors.forEach(({ field, message }) => {
      toast.error(`${field}: ${message}`);
    });
    return true;
  }
  return false;
}