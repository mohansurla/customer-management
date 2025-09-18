// index.js
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { body, validationResult } from "express-validator";

const app = express();
app.use(cors());
app.use(express.json());

// SQLite connection
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
  } else {
    console.log('✅ Connected to SQLite database.');
  }
});

// Create tables + enable FKs
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone_number TEXT NOT NULL UNIQUE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    address_details TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    pin_code TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE CASCADE
)
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_addresses_customer_id ON addresses(customer_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_addresses_city ON addresses(city)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_addresses_state ON addresses(state)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_addresses_pin ON addresses(pin_code)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number)`);
  db.run(`
    CREATE TRIGGER IF NOT EXISTS trg_addresses_updated_at
    AFTER UPDATE ON addresses
    BEGIN
      UPDATE addresses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);


  console.log('✅ Tables ready.');
});

// ───────────── CRUD ROUTES ─────────────

// Create customer
app.post('/api/customers',[
    body('first_name').trim().isLength({ min: 1 }).withMessage('First name required'),
    body('last_name').trim().isLength({ min: 1 }).withMessage('Last name required'),
    body('phone_number').matches(/^\+?\d{10,15}$/).withMessage('Invalid phone number'),
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { first_name, last_name, phone_number } = req.body;
  db.run(
    `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`,
    [first_name, last_name, phone_number],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ message: 'Customer created ✅', data: { id: this.lastID, first_name, last_name, phone_number } });
    }
  );
});

// Set default address
app.post('/api/addresses/:addressId/set-default', (req, res) => {
  const addressId = Number(req.params.addressId);
  db.get('SELECT customer_id FROM addresses WHERE id = ?', [addressId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Address not found' });

    const customerId = row.customer_id;
    db.run('BEGIN TRANSACTION', (beginErr) => {
      if (beginErr) return res.status(500).json({ error: beginErr.message });

      db.run('UPDATE addresses SET is_default = 0 WHERE customer_id = ?', [customerId], function (uErr1) {
        if (uErr1) {
          return db.run('ROLLBACK', () => res.status(500).json({ error: uErr1.message }));
        }

        db.run('UPDATE addresses SET is_default = 1 WHERE id = ?', [addressId], function (uErr2) {
          if (uErr2) {
            return db.run('ROLLBACK', () => res.status(500).json({ error: uErr2.message }));
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) return res.status(500).json({ error: commitErr.message });
            res.json({ message: 'Default address updated' });
          });
        });
      });
    });
  });
});


// Add address for customer
app.post(
  '/api/customers/:id/addresses',
  [
    body('address_details').trim().notEmpty().withMessage('address_details is required'),
    body('city').trim().notEmpty().withMessage('city is required'),
    body('state').trim().notEmpty().withMessage('state is required'),
    // Indian PIN code: exactly 6 digits
    body('pin_code').trim().matches(/^\d{6}$/).withMessage('pin_code must be exactly 6 digits'),
    // optional boolean flag to mark this address as default
    body('is_default').optional().toBoolean(),
  ],
  (req, res) => {
    // collect validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const customer_id = Number(req.params.id);
    const { address_details, city, state, pin_code } = req.body;
    const is_default = req.body.is_default ? 1 : 0;

    // ensure customer exists before inserting (better UX than FK error)
    db.get('SELECT id FROM customers WHERE id = ?', [customer_id], (getErr, row) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      if (!row) return res.status(404).json({ error: 'Customer not found' });

      const insertSql = `INSERT INTO addresses (customer_id, address_details, city, state, pin_code, is_default)
                         VALUES (?, ?, ?, ?, ?, ?)`;

      db.run(insertSql, [customer_id, address_details, city, state, pin_code, is_default], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const newAddressId = this.lastID;

        // If this address must be default, make sure it's the only default for that customer (atomic)
        if (is_default === 1) {
          db.run('BEGIN TRANSACTION', (beginErr) => {
            if (beginErr) {
              // We still created the address; return that info and warn about default-setting failure
              return res.status(201).json({
                message: 'Address added (created) but failed to start transaction to set default.',
                data: { id: newAddressId, customer_id, address_details, city, state, pin_code, is_default: 0 }
              });
            }

            db.run('UPDATE addresses SET is_default = 0 WHERE customer_id = ?', [customer_id], function (uErr1) {
              if (uErr1) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: uErr1.message }));
              }

              db.run('UPDATE addresses SET is_default = 1 WHERE id = ?', [newAddressId], function (uErr2) {
                if (uErr2) {
                  return db.run('ROLLBACK', () => res.status(500).json({ error: uErr2.message }));
                }

                db.run('COMMIT', (commitErr) => {
                  if (commitErr) return res.status(500).json({ error: commitErr.message });
                  return res.status(201).json({
                    message: 'Address added ✅ (and set as default)',
                    data: { id: newAddressId, customer_id, address_details, city, state, pin_code, is_default: 1 }
                  });
                });
              });
            });
          });
        } else {
          // Not default — just return created
          return res.status(201).json({
            message: 'Address added ✅',
            data: { id: newAddressId, customer_id, address_details, city, state, pin_code, is_default: 0 }
          });
        }
      });
    });
  }
);



// List customers
app.get('/api/customers', (req, res) => {
  let { page = 1, limit = 10, search, city, state, pin_code, sortBy = 'id', order = 'asc' } = req.query;
  page = Math.max(parseInt(page, 10) || 1, 1);
  limit = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  const whereClauses = [];
  const params = [];
  if (search) {
    whereClauses.push(
      '(c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ? OR c.id IN (SELECT customer_id FROM addresses WHERE address_details LIKE ?))'
    );
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (city) {
    whereClauses.push('c.id IN (SELECT customer_id FROM addresses WHERE city LIKE ?)');
    params.push(`%${city}%`);
  }
  if (state) {
    whereClauses.push('c.id IN (SELECT customer_id FROM addresses WHERE state LIKE ?)');
    params.push(`%${state}%`);
  }
  if (pin_code) {
    whereClauses.push('c.id IN (SELECT customer_id FROM addresses WHERE pin_code LIKE ?)');
    params.push(`%${pin_code}%`);
  }
  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const SORT_FIELDS = new Set(['id', 'first_name', 'last_name', 'phone_number', 'address_count']);
  const sortField = SORT_FIELDS.has(String(sortBy)) ? String(sortBy) : 'id';
  const sortOrder = String(order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const countSql = `SELECT COUNT(*) AS total FROM customers c ${whereSQL}`;
  const dataSql = `
    SELECT c.*, (SELECT COUNT(*) FROM addresses a WHERE a.customer_id = c.id) AS address_count
    FROM customers c
    ${whereSQL}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  db.get(countSql, params, (countErr, countRow) => {
    if (countErr) return res.status(500).json({ error: countErr.message });
    const total = countRow?.total ?? 0;
    const totalPages = Math.ceil(total / limit) || 0;
    const offset = (page - 1) * limit;

    db.all(dataSql, [...params, limit, offset], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'success', page, limit, total, totalPages, hasNext: page < totalPages, data: rows });
    });
  });
});

// Update customer (partial updates supported)
app.put('/api/customers/:id', [
  body('first_name').optional().trim().isLength({ min: 1 }).withMessage('First name required'),
  body('last_name').optional().trim().isLength({ min: 1 }).withMessage('Last name required'),
  body('phone_number').optional().matches(/^\+?\d{10,15}$/).withMessage('Invalid phone number'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { first_name, last_name, phone_number } = req.body;
  db.run(
    `UPDATE customers SET
       first_name = COALESCE(?, first_name),
       last_name = COALESCE(?, last_name),
       phone_number = COALESCE(?, phone_number)
     WHERE id = ?`,
    [first_name, last_name, phone_number, req.params.id],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ message: 'Customer not found' });
      // return updated row
      db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (e, row) => {
        if (e) return res.status(500).json({ error: e.message });
        res.json({ message: 'Customer updated ✅', data: row });
      });
    }
  );
});


// Update address
app.put(
  '/api/addresses/:addressId',
  [
    // all fields are optional for partial updates
    body('address_details').optional().trim().notEmpty().withMessage('address_details cannot be empty'),
    body('city').optional().trim().notEmpty().withMessage('city cannot be empty'),
    body('state').optional().trim().notEmpty().withMessage('state cannot be empty'),
    body('pin_code').optional().trim().matches(/^\d{6}$/).withMessage('pin_code must be exactly 6 digits'),
    body('is_default').optional().toBoolean(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const addressId = Number(req.params.addressId);
    const { address_details, city, state, pin_code } = req.body || {};
    const hasIsDefault = Object.prototype.hasOwnProperty.call(req.body, 'is_default');
    const is_default = hasIsDefault ? (req.body.is_default ? 1 : 0) : null;

    // fetch existing address to get customer_id and confirm existence
    db.get('SELECT * FROM addresses WHERE id = ?', [addressId], (getErr, existing) => {
      if (getErr) return res.status(500).json({ error: getErr.message });
      if (!existing) return res.status(404).json({ error: 'Address not found' });

      const customerId = existing.customer_id;

      // Helper: after any update, fetch and return the updated row
      const returnUpdated = () => {
        db.get('SELECT * FROM addresses WHERE id = ?', [addressId], (err2, row2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          return res.json({ message: 'Address updated ✏️', data: row2 });
        });
      };

      // If client requests this address to become the default, do atomic transaction:
      if (hasIsDefault && is_default === 1) {
        db.run('BEGIN TRANSACTION', (beginErr) => {
          if (beginErr) return res.status(500).json({ error: beginErr.message });

          // Clear other defaults for this customer
          db.run('UPDATE addresses SET is_default = 0 WHERE customer_id = ?', [customerId], function (uErr1) {
            if (uErr1) {
              return db.run('ROLLBACK', () => res.status(500).json({ error: uErr1.message }));
            }

            // Update this address with provided fields + is_default = 1
            const updateSql = `UPDATE addresses
                               SET address_details = COALESCE(?, address_details),
                                   city = COALESCE(?, city),
                                   state = COALESCE(?, state),
                                   pin_code = COALESCE(?, pin_code),
                                   is_default = 1
                               WHERE id = ?`;
            db.run(updateSql, [address_details, city, state, pin_code, addressId], function (uErr2) {
              if (uErr2) {
                return db.run('ROLLBACK', () => res.status(500).json({ error: uErr2.message }));
              }

              db.run('COMMIT', (commitErr) => {
                if (commitErr) return res.status(500).json({ error: commitErr.message });
                returnUpdated();
              });
            });
          });
        });

      } else {
        // No request to set as default, or request to set is_default = 0.
        // If is_default === 0 explicitly provided, include it in update; otherwise leave as-is.
        const updateSql = `UPDATE addresses
                           SET address_details = COALESCE(?, address_details),
                               city = COALESCE(?, city),
                               state = COALESCE(?, state),
                               pin_code = COALESCE(?, pin_code)
                           ${hasIsDefault ? ', is_default = ?' : ''}
                           WHERE id = ?`;

        const params = [address_details, city, state, pin_code];
        if (hasIsDefault) params.push(is_default);
        params.push(addressId);

        db.run(updateSql, params, function (err) {
          if (err) return res.status(400).json({ error: err.message });
          if (this.changes === 0) return res.status(404).json({ error: 'Address not found' });
          returnUpdated();
        });
      }
    });
  }
);



// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted 🗑️' });
  });
});

// Delete address
app.delete('/api/addresses/:addressId', (req, res) => {
  db.run('DELETE FROM addresses WHERE id = ?', [req.params.addressId], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Address not found' });
    res.json({ message: 'Address deleted 🗑️' });
  });
});

// ───────────── SPECIAL ROUTES ─────────────

// Customer with addresses
app.get('/api/customers/:id/details', (req, res) => {
  const customerId = req.params.id;
  db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    db.all('SELECT * FROM addresses WHERE customer_id = ?', [customerId], (err, addresses) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'success', data: { ...customer, addresses } });
    });
  });
});

// Customers with single address
app.get('/api/customers/single-address', (req, res) => {
  const sql = `
    SELECT c.*, COUNT(a.id) AS address_count
    FROM customers c
    LEFT JOIN addresses a ON c.id = a.customer_id
    GROUP BY c.id
    HAVING address_count = 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'success', data: rows });
  });
});

// Customers with multiple addresses
app.get('/api/customers/multiple-addresses', (req, res) => {
  const sql = `
    SELECT c.*, COUNT(a.id) AS address_count
    FROM customers c
    LEFT JOIN addresses a ON c.id = a.customer_id
    GROUP BY c.id
    HAVING address_count > 1
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'success', data: rows });
  });
});

// Get customer by ID
app.get('/api/customers/:id', (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!row) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'success', data: row });
  });
});


// Clear all customers
app.delete("/api/customers/clear", (req, res) => {
  db.run("DELETE FROM customers", [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All customers deleted" });
  });
});

// Clear all addresses
app.delete("/api/addresses/clear", (req, res) => {
  db.run("DELETE FROM addresses", [], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "All addresses deleted" });
  });
});

// ───────────── START SERVER ─────────────
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
