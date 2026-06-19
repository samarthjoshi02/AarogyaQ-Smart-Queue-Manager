import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import {
  initDb,
  addPatient,
  getAllPatients,
  getActiveQueue,
  callNextPatient,
  cancelToken,
  completeToken,
  resetQueue,
  getQueueAnalytics,
  getSetting,
  updateSetting
} from './db.js';
import { syncToExcel } from './excelSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Allow connections from Vite frontend
}));
app.use(express.json());

// Serve static frontend files in production, otherwise serve API guide in development
// Serving the synced Excel file as static download link
app.get('/api/download-excel', (req, res) => {
  const file = path.resolve(__dirname, '../AarogyaQ_Queue_Data.xlsx');
  if (fs.existsSync(file)) {
    res.download(file, 'AarogyaQ_Queue_Data.xlsx');
  } else {
    res.status(404).json({ error: 'Excel report not generated yet.' });
  }
});

// REST API for raw queue data
app.get('/api/queue', async (req, res) => {
  try {
    const queue = await getAllPatients();
    const active = await getActiveQueue();
    const analytics = await getQueueAnalytics();
    const avgTime = await getSetting('averageConsultationTime');
    const currentToken = await getSetting('currentToken');

    res.json({
      success: true,
      queue,
      active,
      analytics,
      averageConsultationTime: parseInt(avgTime, 10),
      currentToken
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Production environment: Serve React frontend static files
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(distPath));

  // Client-side fallback routing for React Router paths
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
} else {
  // Local development fallback: Return API server details
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AarogyaQ API Server</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; background: #f8fafc; color: #0f172a; line-height: 1.6; }
            .container { max-width: 600px; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); margin: 0 auto; border: 1px solid #e2e8f0; }
            h1 { color: #2563EB; margin-top: 0; display: flex; align-items: center; gap: 10px; font-size: 28px; }
            a { color: #2563EB; text-decoration: none; font-weight: 600; }
            a:hover { text-decoration: underline; }
            .badge { background: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 6px; font-size: 13px; font-family: monospace; font-weight: bold; }
            ul { padding-left: 20px; margin: 16px 0; }
            li { margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>AarogyaQ Backend Server</h1>
            <p>This is the backend API and real-time Socket.IO communications hub for AarogyaQ.</p>
            <p>To access the clinic user interfaces, open the frontend portals:</p>
            <ul>
              <li><strong>Receptionist Dashboard:</strong> <a href="http://localhost:5173/receptionist">http://localhost:5173/receptionist</a></li>
              <li><strong>Patient Waiting Room:</strong> <a href="http://localhost:5173/waiting-room">http://localhost:5173/waiting-room</a></li>
            </ul>
            <p>Developer REST APIs:</p>
            <ul>
              <li><span class="badge">GET /api/queue</span> — <a href="/api/queue">View Live Queue JSON</a></li>
              <li><span class="badge">GET /api/download-excel</span> — <a href="/api/download-excel">Download Synced Excel Spreadsheet</a></li>
            </ul>
          </div>
        </body>
      </html>
    `);
  });
}

// Create HTTP server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Broadcast the latest queue state to all connected clients
const broadcastQueueState = async () => {
  try {
    const queue = await getAllPatients();
    const active = await getActiveQueue();
    const analytics = await getQueueAnalytics();
    const avgTimeStr = await getSetting('averageConsultationTime') || '7';
    const currentToken = await getSetting('currentToken') || '';

    const payload = {
      queue,
      active,
      analytics,
      averageConsultationTime: parseInt(avgTimeStr, 10),
      currentToken
    };

    io.emit('queueUpdated', payload);
  } catch (error) {
    console.error('Error broadcasting queue state:', error);
  }
};

// Handle Socket.IO connections
io.on('connection', async (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Send initial queue state to newly connected client
  try {
    const queue = await getAllPatients();
    const active = await getActiveQueue();
    const analytics = await getQueueAnalytics();
    const avgTimeStr = await getSetting('averageConsultationTime') || '7';
    const currentToken = await getSetting('currentToken') || '';

    socket.emit('queueUpdated', {
      queue,
      active,
      analytics,
      averageConsultationTime: parseInt(avgTimeStr, 10),
      currentToken
    });
  } catch (err) {
    console.error('Error sending initial queue state:', err);
  }

  // Event: Add Patient
  socket.on('addPatient', async (data) => {
    try {
      const { name, mobile, age } = data;
      if (!name) return;

      const newPatient = await addPatient(name, mobile, age);
      await syncToExcel();

      // Emit specific confirmation to requester
      socket.emit('patientAdded', {
        success: true,
        patient: newPatient
      });

      // Broadcast updated queue to all screens
      await broadcastQueueState();
    } catch (err) {
      console.error('Socket error adding patient:', err);
      socket.emit('patientAdded', { success: false, error: err.message });
    }
  });

  // Event: Call Next Patient
  socket.on('callNext', async () => {
    try {
      const calledPatient = await callNextPatient();
      await syncToExcel();

      if (calledPatient) {
        // Broadcast specific token called event for waiting room alerts/audio
        io.emit('tokenCalled', {
          tokenNumber: calledPatient.tokenNumber,
          patientName: calledPatient.patientName
        });
      }

      await broadcastQueueState();
    } catch (err) {
      console.error('Socket error calling next patient:', err);
    }
  });

  // Event: Cancel Token
  socket.on('cancelToken', async (data) => {
    try {
      const { tokenNumber } = data;
      if (!tokenNumber) return;

      const success = await cancelToken(tokenNumber);
      if (success) {
        await syncToExcel();
        await broadcastQueueState();
      }
    } catch (err) {
      console.error('Socket error cancelling token:', err);
    }
  });

  // Event: Complete Token (manual receptionist action)
  socket.on('completeToken', async (data) => {
    try {
      const { tokenNumber } = data;
      if (!tokenNumber) return;

      await completeToken(tokenNumber);
      await syncToExcel();
      await broadcastQueueState();
    } catch (err) {
      console.error('Socket error completing token:', err);
    }
  });

  // Event: Update Consultation Time
  socket.on('updateConsultationTime', async (data) => {
    try {
      const { minutes } = data;
      const mins = Math.max(1, Math.min(60, parseInt(minutes, 10) || 7));

      await updateSetting('averageConsultationTime', mins);
      await syncToExcel();

      // Broadcast specific time updated event
      io.emit('consultationTimeUpdated', { minutes: mins });
      await broadcastQueueState();
    } catch (err) {
      console.error('Socket error updating consultation time:', err);
    }
  });

  // Event: Reset Queue
  socket.on('resetQueue', async () => {
    try {
      await resetQueue();
      await syncToExcel();
      await broadcastQueueState();
    } catch (err) {
      console.error('Socket error resetting queue:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Bootstrap Database & Start Server
const initServer = async () => {
  try {
    console.log('[Server] Initializing database...');
    await initDb();

    console.log('[Server] Performing initial sync to Excel...');
    await syncToExcel();

    httpServer.listen(PORT, () => {
      console.log(`[Server] AarogyaQ backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize backend server:', err);
    process.exit(1);
  }
};

initServer();
