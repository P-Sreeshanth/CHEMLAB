const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database('./database/database.sqlite', (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Create tables if they don't exist
    db.serialize(() => {
      // Create users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS experiments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT,
        expectedReaction TEXT,
        evaluationCriteria TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        experimentId INTEGER,
        studentName TEXT,
        submissionDate TEXT,
        status TEXT,
        totalMarks INTEGER,
        evaluation TEXT, -- Store as JSON string
        overallFeedback TEXT,
        simulatedResults TEXT, -- Add simulatedResults column as TEXT
        FOREIGN KEY (experimentId) REFERENCES experiments(id)
      )`);

      // Insert some dummy data if tables were just created (optional)
      db.get('SELECT COUNT(*) AS count FROM experiments', (err, row) => {
        if (err) {
          console.error('Error checking experiments table:', err.message);
          return;
        }
        if (row.count === 0) {
          db.run('INSERT INTO experiments (title, description, status, expectedReaction, evaluationCriteria) VALUES (?, ?, ?, ?, ?)', 
            ['Effect of Temperature on Reaction Rate', 'Study the relationship between temperature and reaction rate using Na₂S₂O₃ and HCl', 'active', 'Sodium Thiosulfate and Hydrochloric Acid', 'Observation accuracy, Data analysis, Conclusion quality'],
            function(err) {
              if (err) console.error(err.message);
              else console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
          );
        }
      });

      db.get('SELECT COUNT(*) AS count FROM submissions', (err, row) => {
        if (err) {
          console.error('Error checking submissions table:', err.message);
          return;
        }
        if (row.count === 0) {
          // Assuming experiment with id 1 exists from the above insert
          db.run('INSERT INTO submissions (experimentId, studentName, submissionDate, status, totalMarks, evaluation, overallFeedback) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [1, 'Alice Smith', '2023-10-27', 'Evaluated', 85, JSON.stringify({ 'Observation accuracy': { marks: 30, feedback: 'Good observations.' }, 'Data analysis': { marks: 35, feedback: 'Analysis is mostly correct.' }, 'Conclusion quality': { marks: 20, feedback: 'Conclusion could be more detailed.' } }), 'Good work, minor improvements needed.'],
            function(err) {
              if (err) console.error(err.message);
              else console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
          );
          db.run('INSERT INTO submissions (experimentId, studentName, submissionDate, status, totalMarks, evaluation, overallFeedback) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [1, 'Bob Johnson', '2023-10-26', 'Pending Evaluation', null, JSON.stringify({ 'Observation accuracy': { marks: null, feedback: '' }, 'Data analysis': { marks: null, feedback: '' }, 'Conclusion quality': { marks: null, feedback: '' } }), ''],
            function(err) {
              if (err) console.error(err.message);
              else console.log(`A row has been inserted with rowid ${this.lastID}`);
            }
          );
        }
      });
    });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Chemistry Lab Simulator API' });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// API routes

// User authentication routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          res.status(400).json({ error: 'Email already exists' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.json({ id: row.id, name: row.name, email: row.email, role: row.role });
  });
});

// Get all experiments
app.get('/api/experiments', (req, res) => {
  db.all('SELECT * FROM experiments', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Add a new experiment
app.post('/api/experiments', (req, res) => {
  const { title, description, status, expectedReaction, evaluationCriteria } = req.body;
  db.run('INSERT INTO experiments (title, description, status, expectedReaction, evaluationCriteria) VALUES (?, ?, ?, ?, ?)', 
    [title, description, status || 'active', expectedReaction || '', evaluationCriteria || ''], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Update an experiment
app.put('/api/experiments/:id', (req, res) => {
  const { title, description, status, expectedReaction, evaluationCriteria } = req.body;
  const { id } = req.params;
  db.run('UPDATE experiments SET title = ?, description = ?, status = ?, expectedReaction = ?, evaluationCriteria = ? WHERE id = ?', 
    [title, description, status, expectedReaction, evaluationCriteria, id], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ changes: this.changes });
    }
  );
});

// Delete an experiment
app.delete('/api/experiments/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM experiments WHERE id = ?', id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ changes: this.changes });
  });
});

// Get submissions for an experiment
app.get('/api/experiments/:experimentId/submissions', (req, res) => {
  const { experimentId } = req.params;
  console.log(`Fetching submissions for experiment ID: ${experimentId}`);
  db.all('SELECT * FROM submissions WHERE experimentId = ?', [experimentId], (err, rows) => {
    if (err) {
      console.error('Error fetching submissions:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`Found ${rows.length} submissions for experiment ID ${experimentId}`);
    // Parse the evaluation JSON string back to an object and simulatedResults
    const submissionsWithParsedData = rows.map(row => ({
      ...row,
      evaluation: JSON.parse(row.evaluation),
      simulatedResults: JSON.parse(row.simulatedResults) // Parse simulatedResults back to object
    }));
    console.log('Fetched submissions data:', submissionsWithParsedData);
    res.json(submissionsWithParsedData);
  });
});

// Add a new submission (student side would use this)
app.post('/api/submissions', (req, res) => {
  const { experimentId, studentName, submissionDate, status, totalMarks, evaluation, overallFeedback, simulatedResults } = req.body;
  console.log('Received submission data:', req.body);
  db.run('INSERT INTO submissions (experimentId, studentName, submissionDate, status, totalMarks, evaluation, overallFeedback, simulatedResults) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [experimentId, studentName, submissionDate, status || 'Pending Evaluation', totalMarks, JSON.stringify(evaluation) || '{}', overallFeedback || '', JSON.stringify(simulatedResults)], // Store simulatedResults as JSON string
    function(err) {
      if (err) {
        console.error('Error inserting submission:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`Submission inserted with rowid ${this.lastID}`);
      res.json({ id: this.lastID });
    }
  );
});

// Update a submission (faculty side would use this for evaluation)
app.put('/api/submissions/:id', (req, res) => {
  const { status, totalMarks, evaluation, overallFeedback } = req.body;
  const { id } = req.params;
  db.run('UPDATE submissions SET status = ?, totalMarks = ?, evaluation = ?, overallFeedback = ? WHERE id = ?', 
    [status, totalMarks, JSON.stringify(evaluation), overallFeedback, id], 
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ changes: this.changes });
    }
  );
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 