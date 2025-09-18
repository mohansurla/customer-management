// src/pages/MultipleAddresses.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableRow, Button, Box, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import { getMultipleAddressCustomers } from '../utils/api';

function MultipleAddresses() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getMultipleAddressCustomers();
        setCustomers(response.data.data);
      } catch (error) {
        toast.error('Failed to fetch customers with multiple addresses');
      }
    };
    fetchData();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Customers with Multiple Addresses</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>First Name</TableCell>
            <TableCell>Last Name</TableCell>
            <TableCell>Phone</TableCell>
            <TableCell>Address Count</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">No customers found</TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.first_name}</TableCell>
                <TableCell>{customer.last_name}</TableCell>
                <TableCell>{customer.phone_number}</TableCell>
                <TableCell>{customer.address_count}</TableCell>
                <TableCell>
                  <Button onClick={() => navigate(`/customer/${customer.id}`)} size="small">View Details</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Box>
  );
}

export default MultipleAddresses;