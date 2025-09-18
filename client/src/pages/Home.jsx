// src/pages/Home.js
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';
import CustomerList from '../components/CustomerList';

function Home() {
  const navigate = useNavigate();
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Customer Management</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button variant="contained" onClick={() => navigate('/create')}>
          Create New Customer
        </Button>
        <Button variant="outlined" onClick={() => navigate('/single-address')}>
          View Single Address Customers
        </Button>
        <Button variant="outlined" onClick={() => navigate('/multiple-addresses')}>
          View Multiple Address Customers
        </Button>
      </Box>
      <CustomerList />
    </Box>
  );
}

export default Home;