import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'aarogyaq.db');
const db = new sqlite3.Database(dbPath);

// Helper to wrap sqlite3 queries in promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize the SQLite tables
export const initDb = async () => {
  // Create patients table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS patients (
      tokenNumber TEXT PRIMARY KEY,
      patientName TEXT NOT NULL,
      mobile TEXT,
      age INTEGER,
      status TEXT NOT NULL DEFAULT 'waiting',
      joinedAt TEXT NOT NULL,
      servedAt TEXT,
      completedAt TEXT
    )
  `);

  // Create settings table
  await runQuery(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  // Seed default settings if not exists
  const seedSetting = async (key, defaultValue) => {
    const row = await getQuery('SELECT value FROM settings WHERE key = ?', [key]);
    if (!row) {
      await runQuery('INSERT INTO settings (key, value) VALUES (?, ?)', [key, defaultValue]);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  await seedSetting('averageConsultationTime', '7');
  await seedSetting('currentToken', '');
  await seedSetting('tokenCounter', '0');
  await seedSetting('lastTokenResetDate', todayStr);
};

// Retrieve settings helper
export const getSetting = async (key) => {
  const row = await getQuery('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
};

// Update settings helper
export const updateSetting = async (key, value) => {
  await runQuery('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
};

// Check and perform token counter reset if date changed
const checkAndResetTokenCounter = async () => {
  const lastResetDate = await getSetting('lastTokenResetDate');
  const todayStr = new Date().toISOString().split('T')[0];

  if (lastResetDate !== todayStr) {
    await updateSetting('tokenCounter', '0');
    await updateSetting('lastTokenResetDate', todayStr);
    await updateSetting('currentToken', '');
  }
};

// Add Patient to queue
export const addPatient = async (name, mobile, age) => {
  await checkAndResetTokenCounter();

  // Get and increment token counter
  const counterStr = await getSetting('tokenCounter');
  const nextCounter = parseInt(counterStr, 10) + 1;
  const tokenNumber = `AQ-${String(nextCounter).padStart(3, '0')}`;

  const joinedAt = new Date().toISOString();
  await runQuery(
    `INSERT INTO patients (tokenNumber, patientName, mobile, age, status, joinedAt)
     VALUES (?, ?, ?, ?, 'waiting', ?)`,
    [tokenNumber, name, mobile || null, age ? parseInt(age, 10) : null, joinedAt]
  );

  // Update token counter in settings
  await updateSetting('tokenCounter', nextCounter);

  return {
    tokenNumber,
    patientName: name,
    mobile: mobile || '',
    age: age ? parseInt(age, 10) : null,
    status: 'waiting',
    joinedAt
  };
};

// Get all patients in database
export const getAllPatients = async () => {
  return await allQuery('SELECT * FROM patients ORDER BY joinedAt DESC');
};

// Get the current active queue (Waiting & Serving)
export const getActiveQueue = async () => {
  return await allQuery(
    "SELECT * FROM patients WHERE status IN ('waiting', 'serving') ORDER BY joinedAt ASC"
  );
};

// Call Next Patient
export const callNextPatient = async () => {
  // 1. Complete the current serving patient if there is one
  const currentServing = await getQuery("SELECT tokenNumber FROM patients WHERE status = 'serving'");
  if (currentServing) {
    const now = new Date().toISOString();
    await runQuery(
      "UPDATE patients SET status = 'completed', completedAt = ? WHERE tokenNumber = ?",
      [now, currentServing.tokenNumber]
    );
  }

  // 2. Fetch the next waiting patient
  const nextWaiting = await getQuery("SELECT * FROM patients WHERE status = 'waiting' ORDER BY joinedAt ASC LIMIT 1");
  if (!nextWaiting) {
    // No one is waiting
    await updateSetting('currentToken', '');
    return null;
  }

  // 3. Update next waiting status to serving
  const now = new Date().toISOString();
  await runQuery(
    "UPDATE patients SET status = 'serving', servedAt = ? WHERE tokenNumber = ?",
    [now, nextWaiting.tokenNumber]
  );
  await updateSetting('currentToken', nextWaiting.tokenNumber);

  return {
    ...nextWaiting,
    status: 'serving',
    servedAt: now
  };
};

// Cancel a Token
export const cancelToken = async (tokenNumber) => {
  const patient = await getQuery("SELECT status FROM patients WHERE tokenNumber = ?", [tokenNumber]);
  if (!patient) return false;

  await runQuery("UPDATE patients SET status = 'cancelled' WHERE tokenNumber = ?", [tokenNumber]);

  // If we cancelled the current serving token, clean it from settings
  const currentServingToken = await getSetting('currentToken');
  if (currentServingToken === tokenNumber) {
    await updateSetting('currentToken', '');
  }
  return true;
};

// Complete a specific Token manually
export const completeToken = async (tokenNumber) => {
  const now = new Date().toISOString();
  await runQuery(
    "UPDATE patients SET status = 'completed', completedAt = ? WHERE tokenNumber = ?",
    [now, tokenNumber]
  );

  const currentServingToken = await getSetting('currentToken');
  if (currentServingToken === tokenNumber) {
    await updateSetting('currentToken', '');
  }
};

// Reset/Clear Entire Queue (mostly for daily diagnostics/testing)
export const resetQueue = async () => {
  await runQuery("DELETE FROM patients");
  const todayStr = new Date().toISOString().split('T')[0];
  await updateSetting('tokenCounter', '0');
  await updateSetting('currentToken', '');
  await updateSetting('lastTokenResetDate', todayStr);
};

// Compute analytics from the patients table
export const getQueueAnalytics = async () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const startOfDay = `${todayStr}T00:00:00.000Z`;
  const endOfDay = `${todayStr}T23:59:59.999Z`;

  // 1. Patients Served Today (Status = 'completed')
  const completedToday = await getQuery(
    "SELECT COUNT(*) as count FROM patients WHERE status = 'completed' AND joinedAt >= ? AND joinedAt <= ?",
    [startOfDay, endOfDay]
  );
  const patientsServedToday = completedToday ? completedToday.count : 0;

  // 2. Queue metrics for today's completed/serving patients (to get wait times)
  const waitTimes = await allQuery(
    `SELECT joinedAt, servedAt FROM patients 
     WHERE servedAt IS NOT NULL AND joinedAt >= ? AND joinedAt <= ?`,
    [startOfDay, endOfDay]
  );

  let totalWaitMs = 0;
  let longestWaitMins = 0;
  waitTimes.forEach((p) => {
    const waitMs = new Date(p.servedAt) - new Date(p.joinedAt);
    totalWaitMs += waitMs;
    const waitMins = Math.round(waitMs / (1000 * 60));
    if (waitMins > longestWaitMins) {
      longestWaitMins = waitMins;
    }
  });

  const averageWaitMins = waitTimes.length > 0 
    ? Math.round((totalWaitMs / waitTimes.length) / (1000 * 60)) 
    : 0;

  // 3. Peak Hour (Hour of the day with most entries today)
  const hourlyCount = await allQuery(
    `SELECT strftime('%H', joinedAt) as hour, COUNT(*) as count 
     FROM patients 
     WHERE joinedAt >= ? AND joinedAt <= ?
     GROUP BY hour 
     ORDER BY count DESC LIMIT 1`,
    [startOfDay, endOfDay]
  );

  let peakHour = "N/A";
  if (hourlyCount && hourlyCount.length > 0) {
    const hr = parseInt(hourlyCount[0].hour, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const displayHr = hr % 12 === 0 ? 12 : hr % 12;
    peakHour = `${displayHr} ${ampm}`;
  }

  // 4. Current Queue Length (Waiting patients)
  const waitingCount = await getQuery(
    "SELECT COUNT(*) as count FROM patients WHERE status = 'waiting'"
  );
  const currentQueueLength = waitingCount ? waitingCount.count : 0;

  // 5. Timeline Chart Data: Patients served by hour (12-hour slots)
  // Let's generate a list of hours from 08:00 to 20:00 (or custom range)
  const hourlyServedData = await allQuery(
    `SELECT strftime('%H', completedAt) as hour, COUNT(*) as count 
     FROM patients 
     WHERE status = 'completed' AND completedAt >= ? AND completedAt <= ?
     GROUP BY hour`,
    [startOfDay, endOfDay]
  );

  const servedByHour = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i + 8; // 8 AM to 7 PM
    const hourStr = String(hourNum).padStart(2, '0');
    const matched = hourlyServedData.find(d => d.hour === hourStr);
    const label = hourNum === 12 ? '12 PM' : hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`;
    return {
      hour: label,
      count: matched ? matched.count : 0
    };
  });

  // 6. Timeline Chart Data: Queue length over the day (simulated/computed based on joins vs completions)
  // We can compute current active sizes in 1-hour intervals
  const queueLengthTimeline = Array.from({ length: 12 }, (_, i) => {
    const hourNum = i + 8; // 8 AM to 7 PM
    const hourStr = String(hourNum).padStart(2, '0');
    const timeLimit = `${todayStr}T${hourStr}:00:00.000Z`;
    // Patients who joined before timeLimit and completed after timeLimit (or are still not completed)
    return {
      hour: hourNum === 12 ? '12 PM' : hourNum > 12 ? `${hourNum - 12} PM` : `${hourNum} AM`,
      length: 0 // Will populate dynamically based on loaded records
    };
  });

  // Calculate actual historical queue lengths at each hour threshold
  const allTodayPatients = await allQuery(
    "SELECT joinedAt, servedAt, completedAt, status FROM patients WHERE joinedAt >= ? AND joinedAt <= ?",
    [startOfDay, endOfDay]
  );

  queueLengthTimeline.forEach((slot, index) => {
    const hourNum = index + 8;
    const dateLimit = new Date(`${todayStr}T${String(hourNum).padStart(2, '0')}:00:00.000Z`);
    
    // Count how many patients had joined by this time and were not yet completed or cancelled
    const activeAtTime = allTodayPatients.filter(p => {
      const joinTime = new Date(p.joinedAt);
      if (joinTime > dateLimit) return false;
      
      // If completed, did they complete after this hour limit?
      if (p.completedAt) {
        const completeTime = new Date(p.completedAt);
        return completeTime > dateLimit;
      }
      
      // If they were serving, did they start serving after?
      if (p.status === 'cancelled') {
        return false; // exclude cancelled
      }
      
      return true;
    }).length;

    slot.length = activeAtTime;
  });

  return {
    patientsServedToday,
    averageWaitMins,
    longestWaitMins,
    peakHour,
    currentQueueLength,
    servedByHour,
    queueLengthTimeline
  };
};
