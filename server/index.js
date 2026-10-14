import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';
import { isEligibleForShift } from './utils/matching.js';
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

app.post('/shifts', async (req, res) => {
  try {
    const {
      facility_id,
      role_needed,
      shift_date,
      start_time,
      end_time,
      workers_needed,
      created_by,
    } = req.body;

    if (!facility_id || !role_needed || !shift_date || !start_time || !end_time || !created_by) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['facility_id', 'role_needed', 'shift_date', 'start_time', 'end_time', 'created_by'],
      });
    }

    const workersCount = workers_needed || 1;

    const result = await pool.query(
      `INSERT INTO shift 
        (facility_id, role_needed, shift_date, start_time, end_time, workers_needed, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7)
       RETURNING *`,
      [facility_id, role_needed, shift_date, start_time, end_time, workersCount, created_by]
    );

    const shift = result.rows[0];

    // Find eligible workers
    const workersResult = await pool.query(
      `SELECT id, full_name, phone_number, license_number, license_status
       FROM health_worker
       WHERE license_status != 'expired'
       ORDER BY id`
    );

    const eligibleWorkers = workersResult.rows.filter((worker) =>
      isEligibleForShift(worker, shift)
    );

    // Create shift_assignment rows with 'offered' status
    for (const worker of eligibleWorkers) {
      await pool.query(
        `INSERT INTO shift_assignment (shift_id, health_worker_id, status)
         VALUES ($1, $2, 'offered')
         ON CONFLICT (shift_id, health_worker_id) DO NOTHING`,
        [shift.id, worker.id]
      );
    }

    res.status(201).json({
      message: 'Shift created and offers sent',
      shift,
      eligible_workers_count: eligibleWorkers.length,
      eligible_workers: eligibleWorkers,
    });
  } catch (error) {
    console.error('Error creating shift:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/shifts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         s.*,
         f.name AS facility_name,
         (SELECT COUNT(*) FROM shift_assignment sa WHERE sa.shift_id = s.id AND sa.status = 'accepted') AS confirmed_count
       FROM shift s
       JOIN facility f ON f.id = s.facility_id
       ORDER BY s.shift_date DESC, s.start_time DESC`
    );

    res.json({
      count: result.rows.length,
      shifts: result.rows,
    });
  } catch (error) {
    console.error('Error fetching shifts:', error.message);
    res.status(500).json({ error: error.message });
  }
});


app.get('/shifts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const shiftResult = await pool.query(
      `SELECT s.*, f.name AS facility_name
       FROM shift s
       JOIN facility f ON f.id = s.facility_id
       WHERE s.id = $1`,
      [id]
    );

    if (shiftResult.rows.length === 0) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    const shift = shiftResult.rows[0];

    const responsesResult = await pool.query(
      `SELECT 
         sa.id AS assignment_id,
         sa.status AS response_status,
         sa.offered_at,
         sa.responded_at,
         hw.id AS worker_id,
         hw.full_name,
         hw.phone_number,
         hw.license_number,
         ar.status AS attendance_status,
         ar.check_in_time
       FROM shift_assignment sa
       JOIN health_worker hw ON hw.id = sa.health_worker_id
       LEFT JOIN attendance_record ar ON ar.shift_assignment_id = sa.id
       WHERE sa.shift_id = $1
       ORDER BY sa.id`,
      [id]
    );

    res.json({
      shift,
      responses: responsesResult.rows,
    });
  } catch (error) {
    console.error('Error fetching shift:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});