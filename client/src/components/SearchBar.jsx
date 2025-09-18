// src/components/SearchBar.js
import { TextField, Box } from '@mui/material';

function SearchBar({ filters, setFilters }) {
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
      <TextField
        label="Search (Name/Phone/Address)"
        name="search"
        value={filters.search}
        onChange={handleChange}
        variant="outlined"
        size="small"
      />
      <TextField
        label="City"
        name="city"
        value={filters.city}
        onChange={handleChange}
        variant="outlined"
        size="small"
      />
      <TextField
        label="State"
        name="state"
        value={filters.state}
        onChange={handleChange}
        variant="outlined"
        size="small"
      />
      <TextField
        label="Pin Code"
        name="pin_code"
        value={filters.pin_code}
        onChange={handleChange}
        variant="outlined"
        size="small"
      />
    </Box>
  );
}

export default SearchBar;