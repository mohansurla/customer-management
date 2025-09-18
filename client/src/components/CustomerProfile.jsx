// src/components/CustomerProfile.js
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { toast } from 'react-toastify';
import { getCustomerDetails, deleteAddress } from '../utils/api';
import AddressForm from './AddressForm';

function CustomerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCustomer = async () => {
    try {
      const response = await getCustomerDetails(id);
      setCustomer(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customer details');
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await deleteAddress(addressId);
        toast.success('Address deleted successfully!');
        fetchCustomer();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete address');
      }
    }
  };

  if (!customer) return <Typography>Loading...</Typography>;

  const hasMultipleAddresses = customer.addresses.length > 1;
  const hasSingleAddress = customer.addresses.length === 1;

  return (
    <Box sx={{ p: 2, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Customer Profile</Typography>
      <Typography>ID: {customer.id}</Typography>
      <Typography>First Name: {customer.first_name}</Typography>
      <Typography>Last Name: {customer.last_name}</Typography>
      <Typography>Phone: {customer.phone_number}</Typography>
      <Typography variant="h6" sx={{ mt: 3 }}>
        Addresses ({customer.addresses.length}) {hasSingleAddress ? '- Only One Address' : ''}
      </Typography>
      {hasMultipleAddresses && <Typography color="primary">This customer has multiple addresses.</Typography>}
      <Table sx={{ mt: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell>Details</TableCell>
            <TableCell>City</TableCell>
            <TableCell>State</TableCell>
            <TableCell>Pin Code</TableCell>
            <TableCell>Default</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customer.addresses.map((address) => (
            <TableRow key={address.id}>
              <TableCell>{address.address_details}</TableCell>
              <TableCell>{address.city}</TableCell>
              <TableCell>{address.state}</TableCell>
              <TableCell>{address.pin_code}</TableCell>
              <TableCell>{address.is_default ? 'Yes' : 'No'}</TableCell>
              <TableCell>
                <Button onClick={() => navigate(`/customer/${id}/address/${address.id}/edit`)} size="small">Edit</Button>
                <Button onClick={() => handleDeleteAddress(address.id)} color="error" size="small">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button onClick={() => setShowAddForm(!showAddForm)} variant="contained" sx={{ mt: 3 }}>
        {showAddForm ? 'Cancel' : 'Add New Address'}
      </Button>
      {showAddForm && <AddressForm />}
    </Box>
  );
}

export default CustomerProfile;