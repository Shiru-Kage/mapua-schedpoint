import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// In serverless (Vercel), only /tmp is writable
const isVercel = process.env.VERCEL === '1' || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = isVercel ? '/tmp/schedpoint_data' : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'bookings.json');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    // Seed with existing repo data if available
    const repoData = path.join(process.cwd(), 'data', 'bookings.json');
    if (fs.existsSync(repoData)) {
      fs.copyFileSync(repoData, DATA_FILE);
    } else {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
  }
} catch (e) {
  console.warn('Filesystem init warning:', e);
}

function readBookings() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading bookings:', err);
  }
  return [];
}

function writeBookings(bookings) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing bookings:', err);
  }
}

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
  const isAlreadyBooked = bookings.some(b => b.slotId === newBooking.slotId);
  if (isAlreadyBooked) {
    return res.status(409).json({ 
      success: false, 
      error: 'This slot was just claimed by another student. Please select an available slot.' 
    });
  }

  const cleanStudentNum = String(newBooking.studentNumber || '').trim().toLowerCase();
  const existingStudent = bookings.find(b => 
    String(b.studentNumber || '').trim().toLowerCase() === cleanStudentNum && b.date === newBooking.date
  );
  if (existingStudent) {
    return res.status(400).json({
      success: false,
      error: `Duplicate submission rejected: Student Number "${newBooking.studentNumber}" is already booked for ${existingStudent.timeDisplay}. Each student may only hold one reservation.`
    });
  }

  bookings.push(newBooking);
  writeBookings(bookings);
  res.status(201).json({ success: true, booking: newBooking });
});

app.delete('/api/bookings/:slotId', (req, res) => {
  const slotId = decodeURIComponent(req.params.slotId || '').trim();
  let bookings = readBookings();
  bookings = bookings.filter(b => b.slotId !== slotId && b.id !== slotId);
  writeBookings(bookings);
  res.json({ success: true });
});

export default app;
