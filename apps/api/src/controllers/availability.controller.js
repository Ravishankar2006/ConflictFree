import prisma from '../config/prisma.js';
import { toTimeStr, timeToDate } from '../utils/time.js';

const DAY_ORDER = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

export async function listAvailability(req, res) {
  try {
    const facultyId = req.params.facultyId ? Number(req.params.facultyId) : undefined;
    const { semester_id } = req.query;

    const baseWhere = {};
    if (semester_id) baseWhere.semester_id = Number(semester_id);

    let rows;
    if (facultyId) {
      rows = await prisma.facultyAvailability.findMany({
        where: { faculty_id: facultyId, ...baseWhere }
      });
    } else {
      rows = await prisma.facultyAvailability.findMany({
        where: baseWhere,
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
    const { faculty_id, day, start_time, end_time, semester_id } = req.body;

    await prisma.facultyAvailability.upsert({
      where: { faculty_id_day: { faculty_id: Number(faculty_id), day } },
      update: { start_time: timeToDate(start_time), end_time: timeToDate(end_time), semester_id: semester_id ? Number(semester_id) : null },
      create: { faculty_id: Number(faculty_id), day, start_time: timeToDate(start_time), end_time: timeToDate(end_time), semester_id: semester_id ? Number(semester_id) : null }
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
      where: { faculty_id: Number(req.user.id) }
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
    const facultyId = Number(req.user.id);

    await prisma.facultyAvailability.deleteMany({ where: { faculty_id: facultyId } });

    if (availability.length === 0) {
      return res.json({ message: 'All availability cleared' });
    }

    const entries = availability.map(({ day, start_time, end_time }) => ({
      faculty_id: facultyId, day, start_time: timeToDate(start_time), end_time: timeToDate(end_time), semester_id: null
    }));

    await prisma.facultyAvailability.createMany({ data: entries });

    res.json({ message: 'Availability updated successfully', count: entries.length });
  } catch (error) {
    console.error('Error in updateMyAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteAvailability(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.facultyAvailability.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Availability record not found' });
    }

    await prisma.facultyAvailability.delete({ where: { id } });
    res.json({ message: 'Availability deleted successfully' });
  } catch (error) {
    console.error('Error in deleteAvailability:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
