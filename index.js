import express from 'express';
import cors from 'cors';
import { initDb } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let db;

// Initialize database before starting server
initDb().then(database => {
  db = database;
  console.log('Database initialized');
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database', err);
});

// API Routes

// 1. Signup
app.post('/api/signup', async (req, res) => {
  const { name, email, username, password } = req.body;
  
  if (!name || !email || !username || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required' });
  }

  try {
    await db.run(
      'INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)',
      [name, email, username, password]
    );
    res.json({ success: true });
  } catch (err) {
    if (err.message.includes('UNIQUE constraint failed: users.username')) {
      return res.status(400).json({ success: false, error: 'Username already exists' });
    }
    if (err.message.includes('UNIQUE constraint failed: users.email')) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during signup' });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password required' });
  }

  try {
    const user = await db.get(
      'SELECT id, name, email, username, isAdmin FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (user) {
      res.json({ 
        success: true, 
        isAdmin: Boolean(user.isAdmin),
        user: { name: user.name, email: user.email, username: user.username }
      });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error during login' });
  }
});

// 3. Submit Form
app.post('/api/submissions', async (req, res) => {
  const data = req.body;
  const username = data.username;
  
  if (!username) {
    return res.status(400).json({ success: false, error: 'Username is required' });
  }

  try {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    
    await db.run(`
      INSERT INTO submissions (
        id, username, 
        fullName, dateOfBirth, gender, phone, email, address, city, state, zipCode, country,
        highestDegree, institution, fieldOfStudy, graduationYear,
        currentEmployer, jobTitle, yearsOfExperience, skills,
        bio, linkedIn, website
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, username,
      data.personalInfo.fullName, data.personalInfo.dateOfBirth, data.personalInfo.gender, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.address, data.personalInfo.city, data.personalInfo.state, data.personalInfo.zipCode, data.personalInfo.country,
      data.education.highestDegree, data.education.institution, data.education.fieldOfStudy, data.education.graduationYear,
      data.employment.currentEmployer, data.employment.jobTitle, data.employment.yearsOfExperience, data.employment.skills,
      data.additional.bio, data.additional.linkedIn, data.additional.website
    ]);

    res.json({ success: true, id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to submit form' });
  }
});

// 4. Get Submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM submissions ORDER BY submittedAt DESC');
    
    // Transform flat DB rows back to nested objects
    const submissions = rows.map(row => ({
      id: row.id,
      username: row.username,
      submittedAt: row.submittedAt,
      personalInfo: {
        fullName: row.fullName,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender,
        phone: row.phone,
        email: row.email,
        address: row.address,
        city: row.city,
        state: row.state,
        zipCode: row.zipCode,
        country: row.country
      },
      education: {
        highestDegree: row.highestDegree,
        institution: row.institution,
        fieldOfStudy: row.fieldOfStudy,
        graduationYear: row.graduationYear
      },
      employment: {
        currentEmployer: row.currentEmployer,
        jobTitle: row.jobTitle,
        yearsOfExperience: row.yearsOfExperience,
        skills: row.skills
      },
      additional: {
        bio: row.bio,
        linkedIn: row.linkedIn,
        website: row.website
      }
    }));

    res.json({ success: true, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
});
