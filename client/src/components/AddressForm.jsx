// src/components/AddressForm.js
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Box, Typography, FormControlLabel, Checkbox } from '@mui/material';
import { toast } from 'react-toastify';
import { createAddress, updateAddress, getCustomerDetails } from '../utils/api';
import { validateAddress } from '../utils/validators';

function AddressForm({ isUpdate = false }) {
  const navigate = useNavigate();
  const { customerId, addressId } = useParams();
  const [formData, setFormData] = useState({
    address_details: '',
    city: '',
    state: '',
    pin_code: '',
    is_default: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isUpdate && addressId) {
      const fetchAddress = async () => {
        try {
          const response = await getCustomerDetails(customerId);
          const address = response.data.data.addresses.find(a => a.id === Number(addressId));
          if (address) {
            setFormData({
              ...address,
              is_default: !!address.is_default,
            });
          } else {
            toast.error('Address not found');
          }
        } catch (error) {
          toast.error('Failed to load address data');
        }
      };
      fetchAddress();
    }
  }, [isUpdate, addressId, customerId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setErrors({ ...errors, [name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateAddress(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (isUpdate) {
        await updateAddress(addressId, formData);
        toast.success('Address updated successfully!');
      } else {
        await createAddress(customerId, formData);
        toast.success('Address added successfully!');
      }
      navigate(`/customer/${customerId}`);
    } catch (error) {
      const errMsg = error.response?.data?.error || 'An error occurred';
      toast.error(errMsg);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {isUpdate ? 'Update Address' : 'Add New Address'}
      </Typography>
      <TextField
        label="Address Details"
        name="address_details"
        value={formData.address_details}
        onChange={handleChange}
        error={!!errors.address_details}
        helperText={errors.address_details}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="City"
        name="city"
        value={formData.city}
        onChange={handleChange}
        error={!!errors.city}
        helperText={errors.city}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="State"
        name="state"
        value={formData.state}
        onChange={handleChange}
        error={!!errors.state}
        helperText={errors.state}
        fullWidth
        margin="normal"
        required
      />
      <TextField
        label="Pin Code"
        name="pin_code"
        value={formData.pin_code}
        onChange={handleChange}
        error={!!errors.pin_code}
        helperText={errors.pin_code}
        fullWidth
        margin="normal"
        required
      />
      <FormControlLabel
        control={
          <Checkbox
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
          />
        }
        label="Set as Default Address"
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        {isUpdate ? 'Update' : 'Add'}
      </Button>
    </Box>
  );
}

export default AddressForm;