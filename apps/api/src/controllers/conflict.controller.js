import prisma from '../config/prisma.js';

const toTimeStr = (d) => typeof d === 'string' ? d : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
const toTimeShort = (d) => toTimeStr(d).slice(0, 5);

export async function listConflicts(req, res) {
  try {
    const { semester_id } = req.query;
    const where = {};
    if (semester_id) where.semester_id = Number(semester_id);

    const slots = await prisma.timetableSlot.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        faculty: { select: { name: true } }
      }
    });

    const doubleBookingConflicts = [];

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];
        if (a.day !== b.day) continue;
        if (!(a.start_time < b.end_time && a.end_time > b.start_time)) continue;
        if (a.room !== b.room && a.faculty_id !== b.faculty_id) continue;

        doubleBookingConflicts.push({
          slotAId: a.id,
          slotBId: b.id,
          day: a.day,
          conflictType: a.room === b.room ? 'ROOM' : 'FACULTY',
          room: a.room,
          facultyName: a.faculty.name,
          courseA: `${a.course.code} — ${a.course.name}`,
          courseB: `${b.course.code} — ${b.course.name}`,
          timeA: `${toTimeShort(a.start_time)} – ${toTimeShort(a.end_time)}`,
          timeB: `${toTimeShort(b.start_time)} – ${toTimeShort(b.end_time)}`
        });
      }
    }

    const availability = await prisma.facultyAvailability.findMany();

    const availMap = {};
    for (const a of availability) {
      if (!availMap[a.faculty_id]) availMap[a.faculty_id] = {};
      availMap[a.faculty_id][a.day] = { start_time: a.start_time, end_time: a.end_time };
    }

    const availabilityConflicts = [];

    for (const s of slots) {
      const avail = availMap[s.faculty_id]?.[s.day];
      if (!avail || s.start_time < avail.start_time || s.end_time > avail.end_time) {
        availabilityConflicts.push({
          slotAId: s.id,
          slotBId: null,
          day: s.day,
          conflictType: 'AVAILABILITY',
          room: s.room,
          facultyName: s.faculty.name,
          courseA: `${s.course.code} — ${s.course.name}`,
          courseB: avail ? `Availability hours: ${toTimeShort(avail.start_time)} – ${toTimeShort(avail.end_time)}` : 'No availability set for this day',
          timeA: `${toTimeShort(s.start_time)} – ${toTimeShort(s.end_time)}`,
          timeB: avail ? `${toTimeShort(avail.start_time)} – ${toTimeShort(avail.end_time)}` : 'Unavailable'
        });
      }
    }

    const conflicts = [...doubleBookingConflicts, ...availabilityConflicts];
    res.json({ count: conflicts.length, conflicts });
  } catch (error) {
    console.error('Error in listConflicts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function resolveConflict(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await prisma.timetableSlot.delete({ where: { id } });
    res.json({ message: `Conflict resolved — slot #${id} deleted successfully` });
  } catch (error) {
    console.error('Error in resolveConflict:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
