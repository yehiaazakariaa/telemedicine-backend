const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// Get all doctors with optional filters
router.get('/', async (req, res) => {
  try {
    const { specialization, search } = req.query;
    let query = `
      SELECT d.*, u.full_name, s.name AS specialization_name, s.icon AS specialization_icon
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE d.is_available = true
    `;
    
    const params = [];

    if (specialization) {
      params.push(specialization);
      query += ` AND s.id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    query += ` ORDER BY d.rating DESC`;

    const result = await pool.query(query, params);
    res.json({ doctors: result.rows });
  } catch (err) {
    console.error("DATABASE ERROR:", err.message); // This will show the real error in Vercel logs
    res.status(500).json({ error: 'Server error', details: err.message }); 
  }
});

// Get single doctor
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT d.*, u.full_name, u.email, u.phone, s.name AS specialization_name, s.icon AS specialization_icon
      FROM doctors d
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE d.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Doctor not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get doctor's booked slots for a date
router.get('/:id/slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Date required' });
  try {
    const booked = await pool.query(
      `SELECT appointment_time FROM appointments
       WHERE doctor_id = $1 AND appointment_date = $2 AND status != 'cancelled'`,
      [req.params.id, date]
    );
    const doctorResult = await pool.query(
      `SELECT start_time, end_time, slot_duration_minutes, availability_days FROM doctors WHERE id = $1`,
      [req.params.id]
    );
    const doctor = doctorResult.rows[0];
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    // Generate slots
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const availableDays = doctor.availability_days.split(',');
    if (!availableDays.includes(dayName)) return res.json({ slots: [], message: 'Doctor not available this day' });

    const slots = [];
    const bookedTimes = booked.rows.map(r => r.appointment_time.slice(0, 5));
    let [sh, sm] = doctor.start_time.split(':').map(Number);
    const [eh, em] = doctor.end_time.split(':').map(Number);
    const endMinutes = eh * 60 + em;
    while (sh * 60 + sm < endMinutes) {
      const timeStr = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      slots.push({ time: timeStr, available: !bookedTimes.includes(timeStr) });
      sm += doctor.slot_duration_minutes;
      if (sm >= 60) { sh++; sm -= 60; }
    }
    res.json({ slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specializations
router.get('/meta/specializations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM specializations ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
