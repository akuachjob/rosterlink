import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';
import { calculateLicenseStatus } from './utils/licenseStatus.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'RosterLink API is running' });
});

app.get('/workers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, phone_number, license_number, license_status FROM health_worker ORDER BY id'
    );
    res.json({
      count: result.rows.length,
      workers: result.rows,
    });
  } catch (error) {
    console.error('Error fetching workers:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.post('/workers', async (req, res) => {
  try {
    const {
      full_name,
      phone_number,
      license_number,
      license_expiry,
    } = req.body;

    if (!full_name || !phone_number || !license_number || !license_expiry) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['full_name', 'phone_number', 'license_number', 'license_expiry'],
      });
    }

    const license_status = calculateLicenseStatus(license_expiry);

    const result = await pool.query(
      `INSERT INTO health_worker 
        (full_name, phone_number, license_number, license_expiry, license_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, phone_number, license_number, license_expiry, license_status, is_verified, created_at`,
      [full_name, phone_number, license_number, license_expiry, license_status]
    );

    res.status(201).json({
      message: 'Worker registered successfully',
      worker: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        error: 'A worker with this phone number already exists',
      });
    }
    console.error('Error registering worker:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});