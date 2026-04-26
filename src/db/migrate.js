require('dotenv').config();
const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        date_of_birth DATE,
        gender VARCHAR(10),
        role VARCHAR(20) DEFAULT 'patient',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Specializations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS specializations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50),
        description TEXT
      );
    `);

    // Doctors table
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        specialization_id INTEGER REFERENCES specializations(id),
        bio TEXT,
        experience_years INTEGER DEFAULT 0,
        consultation_fee DECIMAL(10,2) DEFAULT 0,
        rating DECIMAL(3,2) DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        availability_days VARCHAR(100) DEFAULT 'Mon,Tue,Wed,Thu,Fri',
        start_time TIME DEFAULT '09:00',
        end_time TIME DEFAULT '17:00',
        slot_duration_minutes INTEGER DEFAULT 30,
        avatar_url TEXT,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Appointments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        appointment_time TIME NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        type VARCHAR(20) DEFAULT 'video',
        reason TEXT,
        notes TEXT,
        meeting_link TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES doctors(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed specializations
    // FIX APPLIED HERE: Changed 'Women\'s' to 'Women''s'
    await client.query(`
      INSERT INTO specializations (name, icon, description) VALUES
        ('General Physician', '🩺', 'Primary care and general health'),
        ('Cardiologist', '❤️', 'Heart and cardiovascular system'),
        ('Dermatologist', '🧴', 'Skin, hair and nails'),
        ('Pediatrician', '👶', 'Child health and development'),
        ('Neurologist', '🧠', 'Brain and nervous system'),
        ('Orthopedic', '🦴', 'Bones, joints and muscles'),
        ('Psychiatrist', '💆', 'Mental health and behavior'),
        ('Gynecologist', '👩‍⚕️', 'Women''s reproductive health')
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

migrate();