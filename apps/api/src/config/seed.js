/**
 * Seed script — populates the DB with sample data for development.
 * Usage: npm run seed
 *
 * Creates:
 *  - 1 admin, 3 faculty, 5 students
 *  - 5 courses
 *  - 8 timetable slots
 *  - Enrollments for all students
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function seed() {
  console.log('🌱 Starting database seed…\n');

  const hash = async (pw) => bcrypt.hash(pw, 10);

  // ─── Users ───────────────────────────────────────────────
  const users = [
    { name: 'Admin User',      email: 'admin@school.com',    password: 'Admin@123',    role: 'admin'   },
    { name: 'Dr. Anika Rao',   email: 'anika@school.com',    password: 'Faculty@123',  role: 'faculty' },
    { name: 'Prof. Kiran Lal', email: 'kiran@school.com',    password: 'Faculty@123',  role: 'faculty' },
    { name: 'Dr. Suresh Nair', email: 'suresh@school.com',   password: 'Faculty@123',  role: 'faculty' },
    { name: 'Alice Johnson',   email: 'alice@student.com',   password: 'Student@123',  role: 'student' },
    { name: 'Bob Mehta',       email: 'bob@student.com',     password: 'Student@123',  role: 'student' },
    { name: 'Carol Das',       email: 'carol@student.com',   password: 'Student@123',  role: 'student' },
    { name: 'David Thomas',    email: 'david@student.com',   password: 'Student@123',  role: 'student' },
    { name: 'Eva Sharma',      email: 'eva@student.com',     password: 'Student@123',  role: 'student' },
  ];

  console.log('👤 Creating users…');
  const userIds = {};
  for (const u of users) {
    const [res] = await pool.query(
      'INSERT IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [u.name, u.email, await hash(u.password), u.role]
    );
    if (res.insertId) {
      userIds[u.email] = res.insertId;
      console.log(`   ✅ ${u.role.padEnd(8)} ${u.name} (${u.email})`);
    } else {
      // Already exists — look up ID
      const [[row]] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
      userIds[u.email] = row.id;
      console.log(`   ⏭️  ${u.name} already exists — skipped`);
    }
  }

  // ─── Courses ─────────────────────────────────────────────
  const courses = [
    { code: 'CS101', name: 'Introduction to Programming' },
    { code: 'CS201', name: 'Data Structures & Algorithms' },
    { code: 'CS301', name: 'Database Management Systems' },
    { code: 'CS401', name: 'Computer Networks' },
    { code: 'CS501', name: 'Machine Learning Fundamentals' },
  ];

  console.log('\n📚 Creating courses…');
  const courseIds = {};
  for (const c of courses) {
    const [res] = await pool.query(
      'INSERT IGNORE INTO courses (name, code) VALUES (?, ?)',
      [c.name, c.code]
    );
    if (res.insertId) {
      courseIds[c.code] = res.insertId;
      console.log(`   ✅ ${c.code} — ${c.name}`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM courses WHERE code = ?', [c.code]);
      courseIds[c.code] = row.id;
      console.log(`   ⏭️  ${c.code} already exists — skipped`);
    }
  }

  // ─── Timetable Slots ─────────────────────────────────────
  const f1 = userIds['anika@school.com'];
  const f2 = userIds['kiran@school.com'];
  const f3 = userIds['suresh@school.com'];

  const slots = [
    { course: 'CS101', faculty: f1, room: 'Hall-A',  day: 'MON', start: '09:00', end: '10:30' },
    { course: 'CS201', faculty: f2, room: 'Lab-101',  day: 'MON', start: '11:00', end: '12:30' },
    { course: 'CS301', faculty: f3, room: 'Hall-B',  day: 'TUE', start: '09:00', end: '10:30' },
    { course: 'CS401', faculty: f1, room: 'Lab-102',  day: 'TUE', start: '14:00', end: '15:30' },
    { course: 'CS501', faculty: f2, room: 'Hall-C',  day: 'WED', start: '10:00', end: '11:30' },
    { course: 'CS101', faculty: f1, room: 'Hall-A',  day: 'WED', start: '13:00', end: '14:30' },
    { course: 'CS201', faculty: f2, room: 'Lab-101',  day: 'THU', start: '09:00', end: '10:30' },
    { course: 'CS301', faculty: f3, room: 'Hall-B',  day: 'FRI', start: '11:00', end: '12:30' },
  ];

  console.log('\n📅 Creating timetable slots…');
  const slotMap = [];
  for (const s of slots) {
    const [res] = await pool.query(
      'INSERT IGNORE INTO timetable_slots (course_id, faculty_id, room, day, start_time, end_time) VALUES (?,?,?,?,?,?)',
      [courseIds[s.course], s.faculty, s.room, s.day, s.start, s.end]
    );
    if (res.insertId) {
      slotMap.push({ slotId: res.insertId, courseCode: s.course });
      console.log(`   ✅ ${s.day} ${s.start}-${s.end} | ${s.course} @ ${s.room}`);
    } else {
      console.log(`   ⏭️  Slot already exists — skipped`);
    }
  }

  // ─── Rooms ──────────────────────────────────────────────
  const roomData = [
    { name: 'Hall-A', capacity: 50 },
    { name: 'Hall-B', capacity: 40 },
    { name: 'Hall-C', capacity: 35 },
    { name: 'Lab-101', capacity: 25 },
    { name: 'Lab-102', capacity: 25 },
  ];

  console.log('\n🏛️ Creating rooms…');
  for (const r of roomData) {
    const [res] = await pool.query(
      'INSERT IGNORE INTO rooms (name, capacity) VALUES (?, ?)',
      [r.name, r.capacity]
    );
    if (res.insertId) {
      console.log(`   ✅ ${r.name} (capacity: ${r.capacity})`);
    } else {
      console.log(`   ⏭️  ${r.name} already exists — skipped`);
    }
  }

  // ─── Faculty Availability ─────────────────────────────────
  const facultyEmails = ['anika@school.com', 'kiran@school.com', 'suresh@school.com'];
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

  console.log('\n🕐 Setting faculty availability…');
  for (const email of facultyEmails) {
    const fId = userIds[email];
    if (!fId) continue;
    for (const day of DAYS) {
      await pool.query(
        `INSERT IGNORE INTO faculty_availability (faculty_id, day, start_time, end_time)
         VALUES (?, ?, '08:00', '17:00')`,
        [fId, day]
      );
    }
    console.log(`   ✅ ${email.split('@')[0]} — MON-FRI 08:00-17:00`);
  }

  // ─── Course-Faculty Assignments ────────────────────────────
  const courseFacultyMap = [
    { course: 'CS101', faculty: 'anika@school.com' },
    { course: 'CS201', faculty: 'kiran@school.com' },
    { course: 'CS301', faculty: 'suresh@school.com' },
    { course: 'CS401', faculty: 'anika@school.com' },
    { course: 'CS501', faculty: 'kiran@school.com' },
  ];

  console.log('\n👨‍🏫 Assigning faculty to courses…');
  for (const cf of courseFacultyMap) {
    const cId = courseIds[cf.course];
    const fId = userIds[cf.faculty];
    if (!cId || !fId) continue;
    await pool.query(
      'INSERT IGNORE INTO course_faculty (course_id, faculty_id) VALUES (?, ?)',
      [cId, fId]
    );
    console.log(`   ✅ ${cf.course} → ${cf.faculty.split('@')[0]}`);
  }

  // ─── Enrollments ─────────────────────────────────────────
  const studentEmails = ['alice@student.com', 'bob@student.com', 'carol@student.com', 'david@student.com', 'eva@student.com'];
  const allCourseCodes = Object.keys(courseIds);

  console.log('\n👥 Creating enrollments…');
  for (const email of studentEmails) {
    for (const code of allCourseCodes) {
      const [res] = await pool.query(
        'INSERT IGNORE INTO enrollments (student_id, course_id) VALUES (?,?)',
        [userIds[email], courseIds[code]]
      );
      if (res.insertId) {
        console.log(`   ✅ ${email.split('@')[0]} → ${code}`);
      }
    }
  }

  console.log('\n✅ Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@school.com   / Admin@123');
  console.log('  Faculty: anika@school.com   / Faculty@123');
  console.log('  Student: alice@student.com  / Student@123\n');

  await pool.end();
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
