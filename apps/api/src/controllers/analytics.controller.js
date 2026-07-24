import prisma from '../config/prisma.js';

const toTimeStr = (d) => typeof d === 'string' ? d : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
const toTimeShort = (d) => toTimeStr(d).slice(0, 5);

function diffHours(start, end) {
  const getM = (d) => {
    if (typeof d === 'string') {
      const [h, m] = d.split(':').map(Number);
      return h * 60 + m;
    }
    return d.getHours() * 60 + d.getMinutes();
  };
  return (getM(end) - getM(start)) / 60;
}

export async function getOverview(req, res) {
  try {
    const { semester_id } = req.query;
    const slotWhere = semester_id ? { semester_id: Number(semester_id) } : {};

    const [totalSlots, totalCourses, totalFaculty, totalRooms, allSlots] = await Promise.all([
      prisma.timetableSlot.count({ where: slotWhere }),
      prisma.course.count(),
      prisma.user.count({ where: { role: 'faculty' } }),
      prisma.room.count(),
      prisma.timetableSlot.findMany({ where: slotWhere, select: { start_time: true, end_time: true } })
    ]);

    const availableHoursPerWeek = 12 * 5;
    const totalBookedHours = allSlots.reduce((sum, s) => sum + diffHours(s.start_time, s.end_time), 0);
    const totalCapacity = totalRooms * availableHoursPerWeek;
    const utilization = totalCapacity > 0 ? Math.round((totalBookedHours / totalCapacity) * 100) : 0;

    res.json({
      totalSlots,
      totalCourses,
      totalFaculty,
      totalRooms,
      utilization,
    });
  } catch (error) {
    console.error('Error in getOverview:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getFacultyWorkload(req, res) {
  try {
    const { semester_id } = req.query;
    const slotWhere = semester_id ? { semester_id: Number(semester_id) } : {};

    const faculty = await prisma.user.findMany({
      where: { role: 'faculty' },
      include: { timetable_slots: { where: slotWhere, select: { start_time: true, end_time: true } } }
    });

    const result = faculty.map(f => {
      const totalHours = f.timetable_slots.reduce((sum, ts) => sum + diffHours(ts.start_time, ts.end_time), 0);
      return {
        id: f.id,
        name: f.name,
        email: f.email,
        slotCount: f.timetable_slots.length,
        totalHours: Math.round(totalHours * 100) / 100
      };
    });

    result.sort((a, b) => b.totalHours - a.totalHours);
    res.json(result);
  } catch (error) {
    console.error('Error in getFacultyWorkload:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getRoomUtilization(req, res) {
  try {
    const { semester_id } = req.query;
    const slotWhere = semester_id ? { semester_id: Number(semester_id) } : {};

    const [rooms, slots] = await Promise.all([
      prisma.room.findMany({ select: { id: true, name: true, capacity: true } }),
      prisma.timetableSlot.findMany({ where: slotWhere, select: { room: true, start_time: true, end_time: true } })
    ]);

    const bookedMap = {};
    for (const s of slots) {
      bookedMap[s.room] = (bookedMap[s.room] || 0) + diffHours(s.start_time, s.end_time);
    }

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
    const { semester_id } = req.query;
    const slotWhere = semester_id ? { semester_id: Number(semester_id) } : {};

    const slots = await prisma.timetableSlot.findMany({ where: slotWhere, select: { day: true } });

    const counted = {};
    for (const s of slots) counted[s.day] = (counted[s.day] || 0) + 1;

    const allDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const result = allDays.map(day => ({ day, count: counted[day] || 0 }));

    res.json(result);
  } catch (error) {
    console.error('Error in getDailyDistribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getTimeDistribution(req, res) {
  try {
    const { semester_id } = req.query;
    const slotWhere = semester_id ? { semester_id: Number(semester_id) } : {};

    const slots = await prisma.timetableSlot.findMany({ where: slotWhere, select: { start_time: true } });

    const periods = ['Morning (8-12)', 'Afternoon (12-16)', 'Evening (16-20)'];
    const counted = {};

    for (const s of slots) {
      const hour = typeof s.start_time === 'string'
        ? parseInt(s.start_time.split(':')[0])
        : s.start_time.getHours();
      let period;
      if (hour < 12) period = periods[0];
      else if (hour < 16) period = periods[1];
      else period = periods[2];
      counted[period] = (counted[period] || 0) + 1;
    }

    const result = periods.map(p => ({ period: p, count: counted[p] || 0 }));
    res.json(result);
  } catch (error) {
    console.error('Error in getTimeDistribution:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
