require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'secretkey';

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ msg: 'No token, auth denied' });
  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access required' });
    next();
  });
};

// Routes

// 1. Register User
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length > 0) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hash, role || 'student']
    );

    const payload = { id: newUser.rows[0].id, role: newUser.rows[0].role };
    jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: payload.id, name, email, role: payload.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 2. Login User
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const payload = { id: user.rows[0].id, role: user.rows[0].role };
    jwt.sign(payload, SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token, user: { id: payload.id, name: user.rows[0].name, email, role: payload.role } });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 3. Submit Complaint (Student)
app.post('/api/complaints', auth, async (req, res) => {
  try {
    const { category, description, priority } = req.body;
    const newComplaint = await pool.query(
      'INSERT INTO complaints (category, description, priority, student_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [category, description, priority, req.user.id]
    );
    res.json(newComplaint.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 4. View My Complaints (Student)
app.get('/api/complaints/me', auth, async (req, res) => {
  try {
    const myComplaints = await pool.query(
      'SELECT * FROM complaints WHERE student_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(myComplaints.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 5. View All Complaints (Admin)
app.get('/api/complaints', adminAuth, async (req, res) => {
  try {
    const allComplaints = await pool.query(
      `SELECT c.*, u.name as student_name 
       FROM complaints c 
       JOIN users u ON c.student_id = u.id 
       ORDER BY c.created_at DESC`
    );
    res.json(allComplaints.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// 6. Update Complaint Status (Admin)
app.put('/api/complaints/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    const updatedComplaint = await pool.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(updatedComplaint.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
