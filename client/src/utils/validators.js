// src/utils/validators.js
export const validateCustomer = (data) => {
  const errors = {};
  if (!data.first_name?.trim()) errors.first_name = 'First name is required';
  if (!data.last_name?.trim()) errors.last_name = 'Last name is required';
  if (!data.phone_number || !/^\+?\d{10,15}$/.test(data.phone_number)) {
    errors.phone_number = 'Valid phone number is required (10-15 digits, optional +)';
  }
  return errors;
};

export const validateAddress = (data) => {
  const errors = {};
  if (!data.address_details?.trim()) errors.address_details = 'Address details are required';
  if (!data.city?.trim()) errors.city = 'City is required';
  if (!data.state?.trim()) errors.state = 'State is required';
  if (!data.pin_code || !/^\d{6}$/.test(data.pin_code)) {
    errors.pin_code = 'Pin code must be exactly 6 digits';
  }
  return errors;
};