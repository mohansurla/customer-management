// src/components/CustomerList.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, TableBody, TableCell, TableHead, TableRow, Box, Typography, TableSortLabel } from '@mui/material';
import { toast } from 'react-toastify';
import { getCustomers, deleteCustomer, clearCustomers, clearAddresses } from '../utils/api';
import Pagination from './Pagination';
import SearchBar from './SearchBar';

function CustomerList() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ search: '', city: '', state: '', pin_code: '' });
  const [sort, setSort] = useState({ sortBy: 'id', order: 'asc' });

  const fetchCustomers = async () => {
    try {
      const response = await getCustomers({ page, limit: 10, ...filters, ...sort });
      setCustomers(response.data.data);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);
    } catch (error) {
      toast.error('Failed to fetch customers');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, filters, sort]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer? This will also delete all associated addresses.')) {
      try {
        await deleteCustomer(id);
        toast.success('Customer deleted successfully!');
        fetchCustomers();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete customer');
      }
    }
  };

  const handleClearFilters = () => {
    setFilters({ search: '', city: '', state: '', pin_code: '' });
    setPage(1);
    setSort({ sortBy: 'id', order: 'asc' });
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all customers and addresses?')) {
      try {
        await clearAddresses();
        await clearCustomers();
        toast.success('All data cleared!');
        fetchCustomers();
      } catch (error) {
        toast.error('Failed to clear data');
      }
    }
  };

  const handleSort = (field) => {
    const newOrder = sort.sortBy === field && sort.order === 'asc' ? 'desc' : 'asc';
    setSort({ sortBy: field, order: newOrder });
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Customer List ({total} total)</Typography>
      <SearchBar filters={filters} setFilters={setFilters} />
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button onClick={handleClearFilters} variant="outlined">Clear Filters</Button>
        <Button onClick={handleClearAllData} variant="outlined" color="error">Clear All Data</Button>
      </Box>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={sort.sortBy === 'id'}
                direction={sort.order}
                onClick={() => handleSort('id')}
              >
                ID
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.sortBy === 'first_name'}
                direction={sort.order}
                onClick={() => handleSort('first_name')}
              >
                First Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.sortBy === 'last_name'}
                direction={sort.order}
                onClick={() => handleSort('last_name')}
              >
                Last Name
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.sortBy === 'phone_number'}
                direction={sort.order}
                onClick={() => handleSort('phone_number')}
              >
                Phone
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={sort.sortBy === 'address_count'}
                direction={sort.order}
                onClick={() => handleSort('address_count')}
              >
                Addresses
              </TableSortLabel>
            </TableCell>
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
                  <Button onClick={() => navigate(`/customer/${customer.id}`)} size="small">View</Button>
                  <Button onClick={() => navigate(`/update/${customer.id}`)} size="small">Edit</Button>
                  <Button onClick={() => handleDelete(customer.id)} color="error" size="small">Delete</Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </Box>
  );
}

export default CustomerList;