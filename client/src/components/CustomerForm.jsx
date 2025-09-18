// src/components/CustomerForm.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { createCustomer, updateCustomer, getCustomerById } from '../utils/api';
import { validateCustomer } from '../utils/validators';

function CustomerForm({ isUpdate = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isUpdate && id) {
      const fetchCustomer = async () => {
        try {
          const response = await getCustomerById(id);
          setFormData(response.data.data);
        } catch (error) {
          toast.error('Failed to load customer data');
        }
      };
      fetchCustomer();
    }
  }, [isUpdate, id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCustomer(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isUpdate) {
        await updateCustomer(id, formData);
        toast.success('Customer updated successfully!');
      } else {
        const response = await createCustomer(formData);
        toast.success('Customer created successfully!');
        navigate(`/customer/${response.data.data.id}`);
        return;
      }
      navigate('/');
    } catch (error) {
      const errMsg = error.response?.data?.error || 'An error occurred';
      toast.error(errMsg);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {isUpdate ? 'Update Customer' : 'Create New Customer'}
      </Typography>
      <TextField
        label="First Name"
        name="first_name"
        value={formData.first_name}
        onChange={handleChange}
        error={!!errors.first_name}
        helperText={errors.first_name}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Last Name"
        name="last_name"
        value={formData.last_name}
        onChange={handleChange}
        error={!!errors.last_name}
        helperText={errors.last_name}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Phone Number"
        name="phone_number"
        value={formData.phone_number}
        onChange={handleChange}
        error={!!errors.phone_number}
        helperText={errors.phone_number}
        fullWidth
        margin="normal"
        required
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        {isUpdate ? 'Update' : 'Create'}
      </Button>
    </Box>
  );
}

export default CustomerForm;