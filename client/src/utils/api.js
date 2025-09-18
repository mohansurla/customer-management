// src/utils/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const createCustomer = (data) => axios.post(`${API_URL}/customers`, data);
export const getCustomers = (params) => axios.get(`${API_URL}/customers`, { params });
export const getCustomerById = (id) => axios.get(`${API_URL}/customers/${id}`);
export const getCustomerDetails = (id) => axios.get(`${API_URL}/customers/${id}/details`);
export const updateCustomer = (id, data) => axios.put(`${API_URL}/customers/${id}`, data);
export const deleteCustomer = (id) => axios.delete(`${API_URL}/customers/${id}`);
export const createAddress = (customerId, data) => axios.post(`${API_URL}/customers/${customerId}/addresses`, data);
export const updateAddress = (addressId, data) => axios.put(`${API_URL}/addresses/${addressId}`, data);
export const setDefaultAddress = (addressId) => axios.post(`${API_URL}/addresses/${addressId}/set-default`);
export const deleteAddress = (addressId) => axios.delete(`${API_URL}/addresses/${addressId}`);
export const getSingleAddressCustomers = () => axios.get(`${API_URL}/customers/single-address`);
export const getMultipleAddressCustomers = () => axios.get(`${API_URL}/customers/multiple-addresses`);
export const clearCustomers = () => axios.delete(`${API_URL}/customers/clear`);
export const clearAddresses = () => axios.delete(`${API_URL}/addresses/clear`);