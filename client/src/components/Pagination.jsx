// src/components/Pagination.js
import { Button, Box, Typography } from '@mui/material';

function Pagination({ page, totalPages, setPage }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 2 }}>
      <Button
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
        variant="contained"
      >
        Previous
      </Button>
      <Typography>Page {page} of {totalPages}</Typography>
      <Button
        disabled={page >= totalPages}
        onClick={() => setPage(page + 1)}
        variant="contained"
      >
        Next
      </Button>
    </Box>
  );
}

export default Pagination;