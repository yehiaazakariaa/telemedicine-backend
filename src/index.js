const express = require('express');
const cors = require('cors');
const pool = require('./db/pool'); // Ensure this path is correct
const doctorRoutes = require('./routes/doctor'); // Ensure this path is correct

const app = express();

// 1. DYNAMIC CORS (The Fix)
app.use(cors()); 
app.use(express.json());

// 2. HEALTH CHECK (To test if the function lives)
app.get('/', (req, res) => {
  res.send('Telemedicine API is Running...');
});

// 3. ROUTES
app.use('/api/doctors', doctorRoutes);

// 4. ERROR HANDLING (Prevents the 'Function Crashed' screen)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});