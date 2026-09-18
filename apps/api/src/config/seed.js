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

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

async function seed() {
  console.log('Seeding database (class-wise home rooms & labs)…\n');

  const hash = (pw) => bcrypt.hash(pw, 10);

  // ─── Departments ───────────────────────────────────────────
  const departments = [
    { name: 'Computer Science & Engineering',          code: 'CSE' },
    { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
    { name: 'Mechanical Engineering',                  code: 'MECH' },
  ];

  console.log('Departments');
  const deptIds = {};
  for (const d of departments) {
    const [res] = await pool.query(
      'INSERT IGNORE INTO departments (name, code) VALUES (?, ?)',
      [d.name, d.code]
    );
    if (res.insertId) {
      deptIds[d.code] = res.insertId;
      console.log(`   created  ${d.name} (${d.code})`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM departments WHERE code = ?', [d.code]);
      deptIds[d.code] = row.id;
      console.log(`   skipped  ${d.name}`);
    }
  }

  const cseId   = deptIds['CSE'];
  const aimlId  = deptIds['AIML'];
  const mechId  = deptIds['MECH'];

  // ─── Semester ─────────────────────────────────────────────
  console.log('\nSemester');
  let semesterId;
  const [semRes] = await pool.query(
    `INSERT IGNORE INTO semesters (name, academic_year, term, start_date, end_date, is_active)
     VALUES ('Fall 2026', '2026/2027', 'FALL', '2026-09-01', '2027-01-15', TRUE)`
  );
  if (semRes.insertId) {
    semesterId = semRes.insertId;
    console.log(`   created  Fall 2026 (ID: ${semesterId})`);
  } else {
    const [[row]] = await pool.query('SELECT id FROM semesters WHERE name = ?', ['Fall 2026']);
    semesterId = row.id;
    console.log(`   skipped  Fall 2026`);
  }

  // ─── Rooms (Home Classrooms & Labs) ────────────────────────
  const roomData = [
    // Lecture Classrooms (is_lab = false)
    { name: 'CSE A Room',       capacity: 40, is_lab: false },
    { name: 'CSE B Room',       capacity: 40, is_lab: false },
    { name: 'AIML A Room',      capacity: 40, is_lab: false },
    { name: 'AIML B Room',      capacity: 40, is_lab: false },
    { name: 'MECH A Room',      capacity: 40, is_lab: false },
    { name: 'MECH B Room',      capacity: 40, is_lab: false },
    // Lab Venues (is_lab = true)
    { name: 'Lab-101',          capacity: 30, is_lab: true },
    { name: 'Lab-102',          capacity: 30, is_lab: true },
    { name: 'Lab-201',          capacity: 30, is_lab: true },
    { name: 'Lab-202',          capacity: 30, is_lab: true },
  ];

  console.log('\nRooms (classrooms & labs)');
  const roomIds = {};
  for (const r of roomData) {
    const [res] = await pool.query(
      'INSERT INTO rooms (name, capacity, is_lab) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE capacity = VALUES(capacity), is_lab = VALUES(is_lab)',
      [r.name, r.capacity, r.is_lab]
    );
    if (res.insertId) {
      roomIds[r.name] = res.insertId;
      console.log(`   created  ${r.name} (Capacity: ${r.capacity}, Lab: ${r.is_lab})`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM rooms WHERE name = ?', [r.name]);
      roomIds[r.name] = row.id;
      console.log(`   updated  ${r.name}`);
    }
  }

  // ─── Classes (Sections/Cohorts) ───────────────────────────
  const classData = [
    { name: 'CSE A',  deptId: cseId,  homeRoom: 'CSE A Room' },
    { name: 'CSE B',  deptId: cseId,  homeRoom: 'CSE B Room' },
    { name: 'AIML A', deptId: aimlId, homeRoom: 'AIML A Room' },
    { name: 'AIML B', deptId: aimlId, homeRoom: 'AIML B Room' },
    { name: 'MECH A', deptId: mechId, homeRoom: 'MECH A Room' },
    { name: 'MECH B', deptId: mechId, homeRoom: 'MECH B Room' },
  ];

  console.log('\nClasses');
  const classIds = {};
  for (const cl of classData) {
    const homeRoomId = roomIds[cl.homeRoom];
    const [res] = await pool.query(
      'INSERT INTO classes (name, department_id, home_room_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE home_room_id = VALUES(home_room_id)',
      [cl.name, cl.deptId, homeRoomId]
    );
    if (res.insertId) {
      classIds[cl.name] = res.insertId;
      console.log(`   created  Class: ${cl.name} (Home: ${cl.homeRoom})`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM classes WHERE name = ?', [cl.name]);
      classIds[cl.name] = row.id;
      console.log(`   skipped  Class ${cl.name}`);
    }
  }

  const cseAId  = classIds['CSE A'];
  const cseBId  = classIds['CSE B'];
  const aimlAId = classIds['AIML A'];
  const aimlBId = classIds['AIML B'];
  const mechAId = classIds['MECH A'];
  const mechBId = classIds['MECH B'];

  // ─── Users (With Class IDs for students) ───────────────────
  const users = [
    // Admin
    { name: 'Admin User',        email: 'admin@school.com',  password: 'Admin@123',  role: 'admin',   dept: null, classId: null },

    // CSE Faculty
    { name: 'Dr. Priya Sharma',  email: 'priya@school.com',  password: 'Faculty@123', role: 'faculty', dept: cseId, classId: null },
    { name: 'Prof. Ravi Verma',  email: 'ravi@school.com',   password: 'Faculty@123', role: 'faculty', dept: cseId, classId: null },

    // AIML Faculty
    { name: 'Dr. Neha Gupta',    email: 'neha@school.com',   password: 'Faculty@123', role: 'faculty', dept: aimlId, classId: null },
    { name: 'Prof. Arjun Singh', email: 'arjun@school.com',  password: 'Faculty@123', role: 'faculty', dept: aimlId, classId: null },

    // MECH Faculty
    { name: 'Dr. Vikram Patel',  email: 'vikram@school.com', password: 'Faculty@123', role: 'faculty', dept: mechId, classId: null },
    { name: 'Prof. Sunita Joshi',email: 'sunita@school.com', password: 'Faculty@123', role: 'faculty', dept: mechId, classId: null },

    // CSE Students (divided A and B)
    { name: 'Alice Johnson',     email: 'alice@student.com',  password: 'Student@123', role: 'student', dept: cseId, classId: cseAId },
    { name: 'Bob Mehta',         email: 'bob@student.com',    password: 'Student@123', role: 'student', dept: cseId, classId: cseAId },
    { name: 'Eva Sharma',        email: 'eva@student.com',    password: 'Student@123', role: 'student', dept: cseId, classId: cseAId },
    { name: 'Rohan Das',         email: 'rohan@student.com',  password: 'Student@123', role: 'student', dept: cseId, classId: cseBId },
    { name: 'Sneha Kapoor',      email: 'sneha@student.com',  password: 'Student@123', role: 'student', dept: cseId, classId: cseBId },

    // AIML Students (divided A and B)
    { name: 'Carol Das',         email: 'carol@student.com',  password: 'Student@123', role: 'student', dept: aimlId, classId: aimlAId },
    { name: 'Farhan Khan',       email: 'farhan@student.com', password: 'Student@123', role: 'student', dept: aimlId, classId: aimlAId },
    { name: 'Gauri Nair',        email: 'gauri@student.com',  password: 'Student@123', role: 'student', dept: aimlId, classId: aimlAId },
    { name: 'Harsh Mehta',       email: 'harsh@student.com',  password: 'Student@123', role: 'student', dept: aimlId, classId: aimlBId },
    { name: 'Isha Patel',        email: 'isha@student.com',   password: 'Student@123', role: 'student', dept: aimlId, classId: aimlBId },

    // MECH Students (divided A and B)
    { name: 'David Thomas',      email: 'david@student.com',  password: 'Student@123', role: 'student', dept: mechId, classId: mechAId },
    { name: 'Jatin Singh',       email: 'jatin@student.com',  password: 'Student@123', role: 'student', dept: mechId, classId: mechAId },
    { name: 'Kavya Reddy',       email: 'kavya@student.com',  password: 'Student@123', role: 'student', dept: mechId, classId: mechAId },
    { name: 'Lakshmi Iyer',      email: 'lakshmi@student.com',password: 'Student@123', role: 'student', dept: mechId, classId: mechBId },
    { name: 'Manav Joshi',       email: 'manav@student.com',  password: 'Student@123', role: 'student', dept: mechId, classId: mechBId },
  ];

  console.log('\nUsers');
  const userIds = {};
  for (const u of users) {
    const [res] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, department_id, class_id) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE department_id = VALUES(department_id), class_id = VALUES(class_id)',
      [u.name, u.email, await hash(u.password), u.role, u.dept, u.classId]
    );
    if (res.insertId) {
      userIds[u.email] = res.insertId;
      console.log(`   created  ${u.role.padEnd(8)} ${u.name} (${u.email}) — Class: ${u.classId || 'None'}`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM users WHERE email = ?', [u.email]);
      userIds[u.email] = row.id;
      console.log(`   updated  ${u.name} (class)`);
    }
  }

  // ─── Courses (5 per dept = 15; Labs marked with is_lab=true) ───
  const courses = [
    // CSE (2 labs, 3 lectures)
    { code: 'CSE101', name: 'Introduction to Programming',           dept: cseId, is_lab: false },
    { code: 'CSE201', name: 'Data Structures & Algorithms Lab',       dept: cseId, is_lab: true },
    { code: 'CSE301', name: 'Database Management Systems',           dept: cseId, is_lab: false },
    { code: 'CSE401', name: 'Computer Networks',                     dept: cseId, is_lab: false },
    { code: 'CSE501', name: 'Operating Systems Lab',                 dept: cseId, is_lab: true },
    // AIML (2 labs, 3 lectures)
    { code: 'AIML101', name: 'Introduction to Artificial Intelligence', dept: aimlId, is_lab: false },
    { code: 'AIML201', name: 'Machine Learning',                     dept: aimlId, is_lab: false },
    { code: 'AIML301', name: 'Deep Learning Lab',                    dept: aimlId, is_lab: true },
    { code: 'AIML401', name: 'Natural Language Processing',          dept: aimlId, is_lab: false },
    { code: 'AIML501', name: 'Computer Vision Lab',                  dept: aimlId, is_lab: true },
    // MECH (2 labs, 3 lectures)
    { code: 'MECH101', name: 'Engineering Mechanics',                dept: mechId, is_lab: false },
    { code: 'MECH201', name: 'Thermodynamics',                       dept: mechId, is_lab: false },
    { code: 'MECH301', name: 'Fluid Mechanics Lab',                  dept: mechId, is_lab: true },
    { code: 'MECH401', name: 'CAD / CAM',                            dept: mechId, is_lab: false },
    { code: 'MECH501', name: 'Robotics Lab',                         dept: mechId, is_lab: true },
  ];

  console.log('\nCourses');
  const courseIds = {};
  for (const c of courses) {
    const [res] = await pool.query(
      'INSERT INTO courses (name, code, department_id, semester_id, is_lab) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE department_id = VALUES(department_id), semester_id = VALUES(semester_id), is_lab = VALUES(is_lab)',
      [c.name, c.code, c.dept, semesterId, c.is_lab]
    );
    if (res.insertId) {
      courseIds[c.code] = res.insertId;
      console.log(`   created  ${c.code} — ${c.name} (Lab: ${c.is_lab})`);
    } else {
      const [[row]] = await pool.query('SELECT id FROM courses WHERE code = ?', [c.code]);
      courseIds[c.code] = row.id;
      console.log(`   updated  ${c.code}`);
    }
  }

  // ─── Course-Faculty Assignments ────────────────────────────
  const courseFacultyMap = [
    // CSE
    { course: 'CSE101', faculty: 'priya@school.com' },
    { course: 'CSE201', faculty: 'ravi@school.com' },
    { course: 'CSE301', faculty: 'priya@school.com' },
    { course: 'CSE401', faculty: 'ravi@school.com' },
    { course: 'CSE501', faculty: 'priya@school.com' },
    // AIML
    { course: 'AIML101', faculty: 'neha@school.com' },
    { course: 'AIML201', faculty: 'arjun@school.com' },
    { course: 'AIML301', faculty: 'neha@school.com' },
    { course: 'AIML401', faculty: 'arjun@school.com' },
    { course: 'AIML501', faculty: 'neha@school.com' },
    // MECH
    { course: 'MECH101', faculty: 'vikram@school.com' },
    { course: 'MECH201', faculty: 'sunita@school.com' },
    { course: 'MECH301', faculty: 'vikram@school.com' },
    { course: 'MECH401', faculty: 'sunita@school.com' },
    { course: 'MECH501', faculty: 'vikram@school.com' },
  ];

  console.log('\nFaculty assignments');
  for (const cf of courseFacultyMap) {
    const cId = courseIds[cf.course];
    const fId = userIds[cf.faculty];
    if (!cId || !fId) continue;
    await pool.query(
      'INSERT IGNORE INTO course_faculty (course_id, faculty_id) VALUES (?, ?)',
      [cId, fId]
    );
    console.log(`   created  ${cf.course} → ${cf.faculty.split('@')[0]}`);
  }

  // ─── Faculty Availability ─────────────────────────────────
  const facultyEmails = [
    'priya@school.com', 'ravi@school.com',
    'neha@school.com', 'arjun@school.com',
    'vikram@school.com', 'sunita@school.com',
  ];

  console.log('\nFaculty availability');
  for (const email of facultyEmails) {
    const fId = userIds[email];
    if (!fId) continue;
    for (const day of DAYS) {
      await pool.query(
        `INSERT INTO faculty_availability (faculty_id, day, start_time, end_time, semester_id)
         VALUES (?, ?, '08:00', '17:00', ?) ON DUPLICATE KEY UPDATE semester_id = VALUES(semester_id)`,
        [fId, day, semesterId]
      );
    }
    console.log(`   created  ${email.split('@')[0]} — MON-FRI 08:00-17:00`);
  }

  // ─── Enrollments ─────────────────────────────────────────
  const studentDeptGroups = {
    [cseId]:  ['alice@student.com', 'bob@student.com', 'eva@student.com', 'rohan@student.com', 'sneha@student.com'],
    [aimlId]: ['carol@student.com', 'farhan@student.com', 'gauri@student.com', 'harsh@student.com', 'isha@student.com'],
    [mechId]: ['david@student.com', 'jatin@student.com', 'kavya@student.com', 'lakshmi@student.com', 'manav@student.com'],
  };

  const deptCourseCodes = {
    [cseId]:  ['CSE101', 'CSE201', 'CSE301', 'CSE401', 'CSE501'],
    [aimlId]: ['AIML101', 'AIML201', 'AIML301', 'AIML401', 'AIML501'],
    [mechId]: ['MECH101', 'MECH201', 'MECH301', 'MECH401', 'MECH501'],
  };

  console.log('\nEnrollments');
  for (const [deptId, emails] of Object.entries(studentDeptGroups)) {
    const codes = deptCourseCodes[deptId];
    for (const email of emails) {
      for (const code of codes) {
        await pool.query(
          'INSERT INTO enrollments (student_id, course_id, semester_id) VALUES (?,?,?) ON DUPLICATE KEY UPDATE semester_id = VALUES(semester_id)',
          [userIds[email], courseIds[code], semesterId]
        );
      }
    }
    console.log(`   created  Enrollments seeded for ${emails.length} students in Department ID ${deptId}`);
  }

  // ─── Timetable Slots (Now with class_id and home rooms vs labs) ──
  const priya  = userIds['priya@school.com'];
  const ravi   = userIds['ravi@school.com'];
  const neha   = userIds['neha@school.com'];
  const arjun  = userIds['arjun@school.com'];
  const vikram = userIds['vikram@school.com'];
  const sunita = userIds['sunita@school.com'];

  const slots = [
    // CSE A Slots (Lectures in CSE A Room, Labs in Lab venues)
    { course: 'CSE101', classId: cseAId, faculty: priya,  room: 'CSE A Room', day: 'MON', start: '09:00', end: '10:30' },
    { course: 'CSE201', classId: cseAId, faculty: ravi,   room: 'Lab-101',    day: 'MON', start: '11:00', end: '12:30' }, // DS Lab
    { course: 'CSE301', classId: cseAId, faculty: priya,  room: 'CSE A Room', day: 'TUE', start: '09:00', end: '10:30' },

    // CSE B Slots (Lectures in CSE B Room, Labs in Lab venues)
    { course: 'CSE101', classId: cseBId, faculty: priya,  room: 'CSE B Room', day: 'MON', start: '11:00', end: '12:30' },
    { course: 'CSE501', classId: cseBId, faculty: priya,  room: 'Lab-101',    day: 'TUE', start: '11:00', end: '12:30' }, // OS Lab

    // AIML A Slots (Lectures in AIML A Room, Labs in Lab venues)
    { course: 'AIML101', classId: aimlAId, faculty: neha,  room: 'AIML A Room',day: 'TUE', start: '14:00', end: '15:30' },
    { course: 'AIML301', classId: aimlAId, faculty: neha,  room: 'Lab-102',    day: 'THU', start: '09:00', end: '10:30' }, // DL Lab

    // MECH A Slots (Lectures in MECH A Room, Labs in Lab venues)
    { course: 'MECH101', classId: mechAId, faculty: vikram,room: 'MECH A Room',day: 'WED', start: '10:00', end: '11:30' },
    { course: 'MECH301', classId: mechAId, faculty: vikram,room: 'Lab-202',    day: 'THU', start: '14:00', end: '15:30' }, // Fluid Lab
  ];

  console.log('\nClearing existing timetable slots…');
  await pool.query('DELETE FROM timetable_slots');

  console.log('\nTimetable slots');
  for (const s of slots) {
    const cId = courseIds[s.course];
    if (!cId) continue;
    await pool.query(
      'INSERT INTO timetable_slots (course_id, faculty_id, class_id, room, day, start_time, end_time, semester_id) VALUES (?,?,?,?,?,?,?,?)',
      [cId, s.faculty, s.classId, s.room, s.day, s.start, s.end, semesterId]
    );
    console.log(`   created  Class ${s.classId}: ${s.day} ${s.start}-${s.end} | ${s.course} @ ${s.room}`);
  }

  console.log('\nSeed complete.\n');
  console.log('Login credentials:');
  console.log('  Admin:   admin@school.com   / Admin@123');
  console.log('  Faculty: priya@school.com   / Faculty@123');
  console.log('  Faculty: ravi@school.com    / Faculty@123');
  console.log('  Student: alice@student.com  / Student@123\n');

  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
