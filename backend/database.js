const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'quiz_secure.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeTables();
  }

  initializeTables() {
    // Users table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('student', 'professor', 'admin')),
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Quizzes table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        questions TEXT NOT NULL,
        duration INTEGER,
        scheduled_start DATETIME,
        scheduled_end DATETIME,
        published BOOLEAN DEFAULT 0,
        creator_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `);

    // Submissions table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        quiz_id TEXT NOT NULL,
        student_id TEXT NOT NULL,
        answers TEXT NOT NULL,
        submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
        FOREIGN KEY (student_id) REFERENCES users(id)
      )
    `);

    // Security violations table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS security_violations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        quiz_id TEXT NOT NULL,
        violation_type TEXT NOT NULL,
        details TEXT,
        reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
      )
    `);

    console.log('Database tables initialized');
  }

  // User operations
  getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  createUser(id, username, password, role, email) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO users (id, username, password, role, email) VALUES (?, ?, ?, ?, ?)',
        [id, username, password, role, email],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Quiz operations
  createQuiz(id, title, description, questions, duration, scheduledStart, scheduledEnd, creatorId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO quizzes (id, title, description, questions, duration, scheduled_start, scheduled_end, creator_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, title, description, JSON.stringify(questions), duration, scheduledStart, scheduledEnd, creatorId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getQuizById(id) {
    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM quizzes WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else {
          if (row && row.questions) {
            row.questions = JSON.parse(row.questions);
          }
          resolve(row);
        }
      });
    });
  }

  getAllQuizzes(userId, role) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM quizzes';
      const params = [];

      if (role === 'student') {
        query += ' WHERE published = 1';
      } else if (role === 'professor') {
        query += ' WHERE creator_id = ? OR published = 1';
        params.push(userId);
      }

      query += ' ORDER BY created_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else {
          const quizzes = rows.map(row => ({
            ...row,
            questions: row.questions ? JSON.parse(row.questions) : []
          }));
          resolve(quizzes);
        }
      });
    });
  }

  publishQuiz(id, published) {
    return new Promise((resolve, reject) => {
      this.db.run('UPDATE quizzes SET published = ? WHERE id = ?', [published ? 1 : 0, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  updateQuiz(id, updates) {
    const fields = [];
    const values = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.questions !== undefined) {
      fields.push('questions = ?');
      values.push(JSON.stringify(updates.questions));
    }
    if (updates.duration !== undefined) {
      fields.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.scheduledStart !== undefined) {
      fields.push('scheduled_start = ?');
      values.push(updates.scheduledStart);
    }
    if (updates.scheduledEnd !== undefined) {
      fields.push('scheduled_end = ?');
      values.push(updates.scheduledEnd);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  deleteQuiz(id) {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM quizzes WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Submission operations
  createSubmission(id, quizId, studentId, answers) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO submissions (id, quiz_id, student_id, answers) VALUES (?, ?, ?, ?)',
        [id, quizId, studentId, JSON.stringify(answers)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getSubmissionsByQuizId(quizId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT s.*, u.username, u.email 
         FROM submissions s 
         JOIN users u ON s.student_id = u.id 
         WHERE s.quiz_id = ? 
         ORDER BY s.submitted_at DESC`,
        [quizId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const submissions = rows.map(row => ({
              ...row,
              answers: row.answers ? JSON.parse(row.answers) : {}
            }));
            resolve(submissions);
          }
        }
      );
    });
  }

  // Security violation operations
  createViolation(id, userId, quizId, type, details) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO security_violations (id, user_id, quiz_id, violation_type, details) VALUES (?, ?, ?, ?, ?)',
        [id, userId, quizId, type, details ? JSON.stringify(details) : null],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getViolationsByQuizId(quizId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT v.*, u.username 
         FROM security_violations v 
         JOIN users u ON v.user_id = u.id 
         WHERE v.quiz_id = ? 
         ORDER BY v.reported_at DESC`,
        [quizId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;
