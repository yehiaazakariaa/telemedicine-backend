const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authMiddleware = require('../middleware/auth');

// Book appointment
router.post('/', authMiddleware, async (req, res) => {
  const { doctor_id, appointment_date, appointment_time, type, reason } = req.body;
  if (!doctor_id || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'doctor_id, appointment_date, and appointment_time are required' });
  }
  try {
    // Check slot availability
    const conflict = await pool.query(
      `SELECT id FROM appointments WHERE doctor_id=$1 AND appointment_date=$2 AND appointment_time=$3 AND status != 'cancelled'`,
      [doctor_id, appointment_date, appointment_time]
    );
    if (conflict.rows.length > 0) return res.status(409).json({ error: 'This slot is already booked' });

    const meetingLink = `https://meet.telemedicine.app/room/${Math.random().toString(36).substr(2, 9)}`;
    const result = await pool.query(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, type, reason, meeting_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, doctor_id, appointment_date, appointment_time, type || 'video', reason || null, meetingLink]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get my appointments
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.*, u.full_name AS doctor_name, s.name AS specialization, d.avatar_url, d.consultation_fee
      FROM appointments a
      JOIN doctors d ON d.id = a.doctor_id
      JOIN users u ON u.id = d.user_id
      JOIN specializations s ON s.id = d.specialization_id
      WHERE a.patient_id = $1
      ORDER BY a.appointment_date DESC, a.appointment_time DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Cancel appointment
router.patch('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE appointments SET status='cancelled', updated_at=NOW()
       WHERE id=$1 AND patient_id=$2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
