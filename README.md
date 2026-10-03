# Mapúa SchedPoint — Student Consultation & Presentation Scheduler

A modern scheduling web application engineered for student consultations, defenses, and presentations with **instant slot collision prevention**, **real-time synchronization**, and **Excel export**.

---

## Schedule Windows & Intervals

* **Morning Session**: **7:00 AM – 11:00 AM** (24 individual 10-minute slots)
  * `07:00 - 07:10 AM`, `07:10 - 07:20 AM`, ... `10:50 - 11:00 AM`
* **Afternoon Session**: **1:00 PM – 4:00 PM** (18 individual 10-minute slots)
  * `01:00 - 01:10 PM`, `01:10 - 01:20 PM`, ... `03:50 - 04:00 PM`
* **Total Slots per Date**: **42 slots**

---

## Collision Prevention & Locking

* When a student selects and submits an open slot, the slot is **permanently marked as Taken** with an atomic collision check.
* If another student is viewing the page at the same time, the slot updates to **"Taken"** in real time.
* If two students attempt to confirm the same slot at the exact same second, the server awards the slot to the first request and alerts the second student with a conflict banner prompting them to select a different schedule.

---

## Student Data Collected

1. **Full Name** (Last Name, First Name)
2. **Student Number** (e.g., `2022104592`)
3. **Course & Section** (e.g., `BSCS - CS121 / A1`)
4. **Student Email** (e.g., `jddelacruz@mymail.mapua.edu.ph`)

---

## Student Features

* **Booking Pass / Ticket**: Displays booking reference code, date, slot time, and student details.
* **Print Pass**: Formatted for paper or PDF save.
* **Add to Google Calendar**: Direct one-click link pre-populated with appointment details.

---

## Instructor Portal (Admin Dashboard)

* **Access**: Click **Instructor Portal** in top navigation and enter PIN (Default: `1234`).
* **Live Roster**: View all appointments sorted by time slot with real-time fill rates.
* **Search & Filters**: Search across name, ID, course, or filter by Morning/Afternoon session.
* **Export to Excel (CSV)**: One-click export with UTF-8 BOM ready for Microsoft Excel.
* **Release Slot**: Cancel or free up a slot if a student requests to reschedule.

---

## How to Run Locally

Inside the project directory:

```bash
cd "06_Web_Projects/student-scheduler"
npm run dev
```

* **Local browser**: `http://localhost:5173/`
* **Network Wi-Fi access**: The terminal will display your LAN IP (e.g., `http://192.168.x.x:5173/` or `http://10.1.24.12:5173/`) so students on the same network can access it directly from their phones or laptops.

---

## Optional Cloud Hosting (Vercel / Firebase)

If you wish to deploy this on the web with a public URL:
1. Create a free project on [Firebase Console](https://console.firebase.google.com/).
2. Enable Cloud Firestore.
3. Click the **Cloud / Storage** button in the app navbar and paste your Firebase config.
4. Deploy the frontend for free to **Vercel** (`npx vercel`) or **Firebase Hosting**.
