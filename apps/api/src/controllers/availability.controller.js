import prisma from '../config/prisma.js';
import { toTimeStr, timeToDate } from '../utils/time.js';

const DAY_ORDER = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

export async function listAvailability(req, res) {
  try {
    const { facultyId } = req.params;

    let rows;
    if (facultyId) {
      rows = await prisma.facultyAvailability.findMany({
        where: { faculty_id: Number(facultyId) }
      });
    } else {
      rows = await prisma.facultyAvailability.findMany({
        include: { faculty: { select: { name: true } } }
      });
      rows = rows.map(r => ({
        ...r,
        faculty_name: r.faculty.name
      }));
    }

    rows.sort((a, b) => a.faculty_id - b.faculty_id || DAY_ORDER[a.day] - DAY_ORDER[b.day]);
    const result = rows.map(r => ({ ...r, start_time: toTimeStr(r.start_time), end_time: toTimeStr(r.end_time) }));
    res.json(result);
  } catch (error) {
    console.error('Error in listAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function setAvailability(req, res) {
  try {
    const { faculty_id, day, start_time, end_time } = req.body;

    if (!faculty_id || !day || !start_time || !end_time) {
      return res.status(400).json({ message: 'faculty_id, day, start_time, and end_time are required' });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ message: 'end_time must be after start_time' });
    }

    await prisma.facultyAvailability.upsert({
      where: { faculty_id_day: { faculty_id, day } },
      update: { start_time: timeToDate(start_time), end_time: timeToDate(end_time) },
      create: { faculty_id, day, start_time: timeToDate(start_time), end_time: timeToDate(end_time) }
    });

    res.json({ message: 'Availability set successfully' });
  } catch (error) {
    console.error('Error in setAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function myAvailability(req, res) {
  try {
    const rows = await prisma.facultyAvailability.findMany({
      where: { faculty_id: req.user.id }
    });
    rows.sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day]);
    const result = rows.map(r => ({ ...r, start_time: toTimeStr(r.start_time), end_time: toTimeStr(r.end_time) }));
    res.json(result);
  } catch (error) {
    console.error('Error in myAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateMyAvailability(req, res) {
  try {
    const { availability } = req.body;
    const facultyId = req.user.id;

    if (!Array.isArray(availability)) {
      return res.status(400).json({ message: 'availability must be an array of { day, start_time, end_time }' });
    }

    await prisma.facultyAvailability.deleteMany({ where: { faculty_id: facultyId } });

    if (availability.length === 0) {
      return res.json({ message: 'All availability cleared' });
    }

    const entries = availability.map(({ day, start_time, end_time }) => {
      if (!day || !start_time || !end_time) throw new Error('Each entry needs day, start_time, end_time');
      if (start_time >= end_time) throw new Error(`end_time must be after start_time for ${day}`);
      return { faculty_id: facultyId, day, start_time: timeToDate(start_time), end_time: timeToDate(end_time) };
    });

    await prisma.facultyAvailability.createMany({ data: entries });

    res.json({ message: 'Availability updated successfully', count: entries.length });
  } catch (error) {
    console.error('Error in updateMyAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteAvailability(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.facultyAvailability.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ message: 'Availability record not found' });
    }

    await prisma.facultyAvailability.delete({ where: { id: Number(id) } });
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
