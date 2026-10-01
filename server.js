// Standalone Express Server with Server-Sent Events (SSE) & JSON persistence
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

// Ensure data folder and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
}

function readBookings() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading bookings file:', err);
    return [];
  }
}

function writeBookings(bookings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing bookings file:', err);
  }
}

// Connected SSE clients for real-time live push updates
let sseClients = [];

function broadcastBookings(bookings) {
  const payload = `data: ${JSON.stringify(bookings)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// API Routes
app.get('/api/bookings', (req, res) => {
  const bookings = readBookings();
  res.json(bookings);
});

app.get('/api/export-csv', (req, res) => {
  const queryDate = req.query.date || 'all';
  let bookings = readBookings();
  if (queryDate && queryDate !== 'all') {
    bookings = bookings.filter(b => b.date === queryDate);
  }

  const headers = [
    'Scheduled Day & Date',
    'Slot Time',
    'Student Name',
    'Student Number',
    'Gender',
    'Course & Section',
    'Student Email',
    'Booking Reference ID',
    'Booking Timestamp'
  ];
  const rows = bookings.map(b => [
    `"${b.date || ''}"`,
    `"${b.timeDisplay || ''}"`,
    `"${(b.fullName || '').replace(/"/g, '""')}"`,
    `"${(b.studentNumber || '').replace(/"/g, '""')}"`,
    `"${(b.gender || '').replace(/"/g, '""')}"`,
    `"${(b.course || '').replace(/"/g, '""')}"`,
    `"${(b.email || '').replace(/"/g, '""')}"`,
    `"${(b.id || '').replace(/"/g, '""')}"`,
    `"${(b.createdAt || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\r\n');
  const filename = `Mapua_Consultations_${queryDate === 'all' ? 'All_Dates' : queryDate}.csv`;

  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': Buffer.byteLength(csvContent, 'utf-8'),
  });
  res.end(csvContent);
});

app.post('/api/bookings', (req, res) => {
  const newBooking = req.body;
  if (!newBooking || !newBooking.slotId) {
    return res.status(400).json({ success: false, error: 'Invalid booking data. slotId is required.' });
  }

  const bookings = readBookings();
  // Atomic collision check: Ensure slot is not already booked!
  const isAlreadyBooked = bookings.some(b => b.slotId === newBooking.slotId);
  if (isAlreadyBooked) {
    return res.status(409).json({ 
      success: false, 
      error: 'This slot was just claimed by another student. Please select an available slot.' 
    });
  }

  // Prevent duplicate submission by the same student number on this date
  const cleanStudentNum = String(newBooking.studentNumber || '').trim().toLowerCase();
  const existingStudent = bookings.find(b => 
    String(b.studentNumber || '').trim().toLowerCase() === cleanStudentNum && b.date === newBooking.date
  );
  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: `Duplicate submission rejected: Student Number "${newBooking.studentNumber}" is already booked for ${existingStudent.timeDisplay}. Each student may only hold one reservation. You can retract your existing booking to select a new time.`
    });
  }

  bookings.push(newBooking);
  writeBookings(bookings);

  // Instantly broadcast to all active student screens
  broadcastBookings(bookings);

  res.status(201).json({ success: true, booking: newBooking });
});

app.delete('/api/bookings/:slotId', (req, res) => {
  const slotId = decodeURIComponent(req.params.slotId || '').trim();
  let bookings = readBookings();
  const initialLength = bookings.length;
  bookings = bookings.filter(b => b.slotId !== slotId && b.id !== slotId);

  if (bookings.length !== initialLength) {
    writeBookings(bookings);
    broadcastBookings(bookings);
  }

  res.json({ success: true });
});

// Server-Sent Events (SSE) route
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current bookings immediately on connection
  const bookings = readBookings();
  res.write(`data: ${JSON.stringify(bookings)}\n\n`);

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// Serve frontend build if dist folder exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Mapua Student Scheduler Server running on http://localhost:${PORT}`);
});
