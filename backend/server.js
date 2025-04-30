require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise'); // Using promises
const PORT = process.env.PORT || 5000;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');


const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// MySQL Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


// Test database connection on startup
pool.getConnection()
  .then(conn => {
    console.log('Connected to MySQL database');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });


   // Enhanced JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      const message = err.name === 'TokenExpiredError' 
        ? 'Session expired, please login again' 
        : 'Invalid authentication token';
      return res.status(403).json({ error: message });
    }
    
    req.user = decoded;
    next();
  });
}


// Enhanced input validation middleware
function validateRegister(req, res, next) {
  const { email, password, name } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required' });
  }
  next();
}

// Add this right after your MySQL pool setup (before app.listen)

// 🟢 User Registration
app.post('/api/auth/register', validateRegister, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12); // Increased salt rounds
    
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name.trim()]
    );
    
    res.status(201).json({ 
      message: 'User registered successfully',
      user_id: result.insertId 
    });
  } catch (err) {
    console.error('Registration error:', err);
    const error = err.code === 'ER_DUP_ENTRY' 
      ? 'Email already in use' 
      : 'Registration failed';
    res.status(err.code === 'ER_DUP_ENTRY' ? 409 : 500).json({ error });
  }
});

  
  // 🟢 User Login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    try {
      // Find user
      const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
      if (users.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      const user = users[0];
      
      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
  
      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
  
      res.json({ 
        message: 'Login successful',
        token,
        user_id: user.id
      });
      
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login failed' });
    }
  });


  app.get('/api/workouts', authenticateToken, async (req, res) => {
    try {
      const [workouts] = await pool.query(
        'SELECT * FROM workouts WHERE user_id = ?',
        [req.user.id]
      );
      res.json(workouts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Create new workout

app.post('/api/workouts', authenticateToken, async (req, res) => {
  try {
    const { date, workout_type, notes, exercises } = req.body;
    
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert workout
      const [workoutResult] = await connection.query(
        `INSERT INTO workouts (user_id, date, workout_type, notes)
         VALUES (?, ?, ?, ?)`,
        [req.user.id, date, workout_type, notes]
      );

      // 2. Insert exercises
      if (exercises && exercises.length > 0) {
        await connection.query(
          `INSERT INTO exercises 
           (workout_id, name, sets, reps, weight)
           VALUES ?`,
          [exercises.map(ex => [
            workoutResult.insertId,
            ex.name,
            ex.sets,
            ex.reps,
            ex.weight
          ])]
        );
      }

      await connection.commit();
      res.status(201).json({ message: 'Workout saved' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Workout creation error:', err);
    res.status(500).json({ error: 'Failed to save workout' });
  }
});

  // Add this route to get workout analytics
app.get('/api/workouts/analytics', authenticateToken, async (req, res) => {
  try {
    const [workouts] = await pool.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m-%d') AS date,
        workout_type,
        (SELECT SUM(sets * reps * weight) 
         FROM exercises 
         WHERE exercises.workout_id = workouts.id) AS volume
      FROM workouts
      WHERE user_id = ?
      ORDER BY date DESC
    `, [req.user.id]);

    res.json(workouts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
  

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));