import pool from '../config/db.js';

export async function getOverview(req, res) {
  try {
    const [[{ totalSlots }]]    = await pool.query('SELECT COUNT(*) AS totalSlots FROM timetable_slots');
    const [[{ totalCourses }]]  = await pool.query('SELECT COUNT(*) AS totalCourses FROM courses');
    const [[{ totalFaculty }]]  = await pool.query(`SELECT COUNT(*) AS totalFaculty FROM users WHERE role='faculty'`);
    const [[{ totalRooms }]]    = await pool.query('SELECT COUNT(*) AS totalRooms FROM rooms');

    // Room utilization: total booked hours / (total rooms * available hours per week)
    const availableHoursPerWeek = 12 * 5; // 08:00-20:00, Mon-Fri
    const [bookedHoursRaw] = await pool.query(
      "SELECT COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(end_time, start_time)) / 3600), 0) AS total FROM timetable_slots"
    );
    const totalBookedHours = Number(bookedHoursRaw[0].total);
    const totalCapacity = totalRooms * availableHoursPerWeek;
    const utilization = totalCapacity > 0 ? Math.round((totalBookedHours / totalCapacity) * 100) : 0;

    res.json({
      totalSlots: Number(totalSlots),
      totalCourses: Number(totalCourses),
      totalFaculty: Number(totalFaculty),
      totalRooms: Number(totalRooms),
      utilization,
    });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getFacultyWorkload(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id, u.name, u.email,
        COUNT(ts.id) AS slotCount,
        COALESCE(SUM(TIME_TO_SEC(TIMEDIFF(ts.end_time, ts.start_time)) / 3600), 0) AS totalHours
      FROM users u
      LEFT JOIN timetable_slots ts ON ts.faculty_id = u.id
      WHERE u.role = 'faculty'
      GROUP BY u.id, u.name, u.email
      ORDER BY totalHours DESC
    `);
    res.json(rows.map(r => ({ ...r, slotCount: Number(r.slotCount), totalHours: Math.round(Number(r.totalHours) * 100) / 100 })));
  } catch (error) {
    console.error('Error in getFacultyWorkload:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getRoomUtilization(req, res) {
  try {
    const [rooms] = await pool.query('SELECT id, name, capacity FROM rooms');
    const [bookings] = await pool.query(`
      SELECT room, SUM(TIME_TO_SEC(TIMEDIFF(end_time, start_time)) / 3600) AS bookedHours
      FROM timetable_slots GROUP BY room
    `);
    const bookedMap = {};
    for (const b of bookings) bookedMap[b.room] = Number(b.bookedHours);

    const availableHoursPerWeek = 12 * 5;
    const result = rooms.map(r => {
      const booked = bookedMap[r.name] || 0;
      const utilization = availableHoursPerWeek > 0 ? Math.round((booked / availableHoursPerWeek) * 100) : 0;
      return { id: r.id, name: r.name, capacity: r.capacity, bookedHours: Math.round(booked * 100) / 100, utilization };
    });
    res.json(result);
  } catch (error) {
    console.error('Error in getRoomUtilization:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getDailyDistribution(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT day, COUNT(*) AS count
      FROM timetable_slots
      GROUP BY day
      ORDER BY FIELD(day, 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT')
    `);
    const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const counted = {};
    for (const r of rows) counted[r.day] = Number(r.count);
    const result = allDays.map(day => ({ day, count: counted[day] || 0 }));
    res.json(result);
  } catch (error) {
    console.error('Error in getDailyDistribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getTimeDistribution(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        CASE
          WHEN HOUR(start_time) < 12 THEN 'Morning (8-12)'
          WHEN HOUR(start_time) < 16 THEN 'Afternoon (12-16)'
          ELSE 'Evening (16-20)'
        END AS period,
        COUNT(*) AS count
      FROM timetable_slots
      GROUP BY period
      ORDER BY FIELD(period, 'Morning (8-12)', 'Afternoon (12-16)', 'Evening (16-20)')
    `);
    const periods = ['Morning (8-12)', 'Afternoon (12-16)', 'Evening (16-20)'];
    const counted = {};
    for (const r of rows) counted[r.period] = Number(r.count);
    const result = periods.map(p => ({ period: p, count: counted[p] || 0 }));
    res.json(result);
  } catch (error) {
    console.error('Error in getTimeDistribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
