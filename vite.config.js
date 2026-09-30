import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Embedded API middleware for Vite dev server so everything runs with a single 'npm run dev' command
function apiDevPlugin() {
  const dataDir = path.resolve(process.cwd(), 'data');
  const dataFile = path.resolve(dataDir, 'bookings.json');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify([], null, 2), 'utf-8');
  }

  function readBookings() {
    try {
      return JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    } catch {
      return [];
    }
  }

  function writeBookings(bookings) {
    try {
      fs.writeFileSync(dataFile, JSON.stringify(bookings, null, 2), 'utf-8');
    } catch (e) {
      console.error(e);
    }
  }

  let sseClients = [];

  function broadcast(bookings) {
    const payload = `data: ${JSON.stringify(bookings)}\n\n`;
    sseClients.forEach(res => {
      try { res.write(payload); } catch { /* ignore */ }
    });
  }

  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0];

        // 1. GET /api/bookings
        if (url === '/api/bookings' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(readBookings()));
          return;
        }

        // GET /api/export-csv
        if (url?.startsWith('/api/export-csv') && req.method === 'GET') {
          const queryDate = req.url?.includes('date=') 
            ? decodeURIComponent(req.url.split('date=')[1].split('&')[0]) 
            : 'all';
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
            `"${(b.gender || 'Not specified').replace(/"/g, '""')}"`,
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
          return;
        }

        // 2. POST /api/bookings
        if (url === '/api/bookings' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              const newBooking = JSON.parse(body);
              if (!newBooking.slotId) {
                res.statusCode = 400;
                res.end(JSON.stringify({ success: false, error: 'slotId required' }));
                return;
              }

              const bookings = readBookings();
              
              // 1. Prevent slot collision
              if (bookings.some(b => b.slotId === newBooking.slotId)) {
                res.statusCode = 409;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ 
                  success: false, 
                  error: 'This slot was just claimed by another student. Please select an available slot.' 
                }));
                return;
              }

              // 2. Prevent duplicate submission by the same student number on this date
              const cleanStudentNum = String(newBooking.studentNumber || '').trim().toLowerCase();
              const existingStudent = bookings.find(b => 
                String(b.studentNumber || '').trim().toLowerCase() === cleanStudentNum && b.date === newBooking.date
              );
              if (existingStudent) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: `Duplicate submission rejected: Student Number "${newBooking.studentNumber}" is already booked for ${existingStudent.timeDisplay}. Each student may only hold one reservation. You can retract your existing booking to select a new time.`
                }));
                return;
              }

              bookings.push(newBooking);
              writeBookings(bookings);
              broadcast(bookings);

              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, booking: newBooking }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // 3. DELETE /api/bookings/:slotId
        if (url?.startsWith('/api/bookings/') && req.method === 'DELETE') {
          const slotId = url.replace('/api/bookings/', '');
          let bookings = readBookings();
          bookings = bookings.filter(b => b.slotId !== slotId);
          writeBookings(bookings);
          broadcast(bookings);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: true }));
          return;
        }

        // 4. GET /api/events (SSE)
        if (url === '/api/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          });
          res.write(`data: ${JSON.stringify(readBookings())}\n\n`);
          sseClients.push(res);
          req.on('close', () => {
            sseClients = sseClients.filter(c => c !== res);
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  server: {
    port: 5173,
    host: true, // Allows other devices on the same WiFi/LAN to open the app!
  },
});
