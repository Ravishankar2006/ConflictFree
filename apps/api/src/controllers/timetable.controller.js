import prisma from '../config/prisma.js';
import { toTimeStr, toTimeShort, timeToDate } from '../utils/time.js';
import { detectConflicts, detectStudentConflicts } from '../utils/conflict-detector.js';

const DAY_ORDER = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

function sortByDay(rows) {
  return rows.sort((a, b) => DAY_ORDER[a.day] - DAY_ORDER[b.day] || toTimeStr(a.start_time).localeCompare(toTimeStr(b.start_time)));
}

function formatSlots(rows) {
  return rows.map(r => ({
    ...r,
    start_time: toTimeStr(r.start_time),
    end_time: toTimeStr(r.end_time),
    course_name: r.course?.name,
    course_code: r.course?.code,
    faculty_name: r.faculty?.name,
    class_name: r.class?.name
  }));
}

export async function createSlot(req, res) {
  try {
    const { course_id, class_id, room, faculty_id, day, start_time, end_time, semester_id } = req.body;

    const [course, roomRec, classRec] = await Promise.all([
      prisma.course.findUnique({ where: { id: course_id }, select: { is_lab: true } }),
      prisma.room.findUnique({ where: { name: room }, select: { is_lab: true } }),
      class_id ? prisma.class.findUnique({ where: { id: class_id }, select: { home_room_id: true } }) : null
    ]);

    if (!course || !roomRec) {
      return res.status(400).json({ message: 'Invalid course or room' });
    }

    if (course.is_lab && !roomRec.is_lab) {
      return res.status(400).json({ message: 'Lab courses must be scheduled in a lab room' });
    }

    if (!course.is_lab && roomRec.is_lab) {
      return res.status(400).json({ message: 'Regular courses cannot be scheduled in a lab room' });
    }

    if (!course.is_lab && class_id && classRec) {
      const homeRoom = await prisma.room.findUnique({ where: { id: classRec.home_room_id } });
      if (homeRoom && room !== homeRoom.name) {
        return res.status(400).json({ message: `Lecture courses must use the class's home room (${homeRoom.name})` });
      }
    }

    const conflicts = await detectConflicts({
      day, start_time, end_time, room, faculty_id
    });

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot create slot: Conflict detected',
        conflicts: conflicts.map(c => ({
          id: c.id,
          room: c.room,
          day: c.day,
          time: `${toTimeShort(c.start_time)} - ${toTimeShort(c.end_time)}`,
          course_id: c.course_id
        }))
      });
    }

    const studentConflicts = await detectStudentConflicts({
      day, start_time, end_time, course_id, class_id
    });

    if (studentConflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot create slot: Student/Class conflict detected',
        conflicts: studentConflicts.map(c => ({
          id: c.id,
          time: `${toTimeShort(c.start_time)} - ${toTimeShort(c.end_time)}`,
          course_code: c.course_code
        }))
      });
    }

    const result = await prisma.timetableSlot.create({
      data: {
        course_id, class_id: class_id ?? null, room, faculty_id, day,
        start_time: timeToDate(start_time),
        end_time: timeToDate(end_time),
        semester_id: semester_id ?? null
      }
    });

    res.status(201).json({
      message: 'Slot created successfully',
      slotId: result.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'A slot already exists with this course, faculty, day and start time' });
    }
    console.error('Error in createSlot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getMyTimetable(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { semester_id, department_id } = req.query;

    let rows;

    const slotWhere = {};
    if (semester_id) slotWhere.semester_id = Number(semester_id);
    if (department_id) slotWhere.course = { department_id: Number(department_id) };

    if (role === 'student') {
      rows = await prisma.timetableSlot.findMany({
        where: {
          ...slotWhere,
          course: { enrollments: { some: { student_id: userId } } }
        },
        include: {
          course: { select: { name: true, code: true } },
          faculty: { select: { name: true } },
          class: { select: { name: true } }
        }
      });
    } else if (role === 'faculty') {
      rows = await prisma.timetableSlot.findMany({
        where: { faculty_id: userId, ...slotWhere },
        include: {
          course: { select: { name: true, code: true } },
          class: { select: { name: true } }
        }
      });
    } else {
      rows = await prisma.timetableSlot.findMany({
        where: slotWhere,
        include: {
          course: { select: { name: true, code: true } },
          faculty: { select: { name: true } },
          class: { select: { name: true } }
        }
      });
    }

    res.json(sortByDay(formatSlots(rows)));
  } catch (error) {
    console.error('Error in getMyTimetable:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getAllSlots(req, res) {
  try {
    const { semester_id, department_id } = req.query;
    const where = {};
    if (semester_id) where.semester_id = Number(semester_id);
    if (department_id) where.course = { department_id: Number(department_id) };

    const rows = await prisma.timetableSlot.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        faculty: { select: { name: true } },
        class: { select: { name: true } }
      }
    });

    res.json(sortByDay(formatSlots(rows)));
  } catch (error) {
    console.error('Error in getAllSlots:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteSlot(req, res) {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.user.id);
    const userRole = req.user.role;

    const slot = await prisma.timetableSlot.findUnique({ where: { id } });

    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (userRole === 'faculty' && slot.faculty_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own slots' });
    }

    await prisma.timetableSlot.delete({ where: { id } });
    res.json({ message: 'Slot deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSlot:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateSlot(req, res) {
  try {
    const id = Number(req.params.id);
    const { course_id, class_id, room, faculty_id, day, start_time, end_time, semester_id } = req.body;

    const existing = await prisma.timetableSlot.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    const [course, roomRec, classRec] = await Promise.all([
      prisma.course.findUnique({ where: { id: Number(course_id) }, select: { is_lab: true } }),
      prisma.room.findUnique({ where: { name: room }, select: { is_lab: true } }),
      class_id ? prisma.class.findUnique({ where: { id: Number(class_id) }, select: { home_room_id: true } }) : null
    ]);

    if (!course || !roomRec) {
      return res.status(400).json({ message: 'Invalid course or room' });
    }

    if (course.is_lab && !roomRec.is_lab) {
      return res.status(400).json({ message: 'Lab courses must be scheduled in a lab room' });
    }

    if (!course.is_lab && roomRec.is_lab) {
      return res.status(400).json({ message: 'Regular courses cannot be scheduled in a lab room' });
    }

    if (!course.is_lab && class_id && classRec) {
      const homeRoom = await prisma.room.findUnique({ where: { id: classRec.home_room_id } });
      if (homeRoom && room !== homeRoom.name) {
        return res.status(400).json({ message: `Lecture courses must use the class's home room (${homeRoom.name})` });
      }
    }

    const [conflicts, existingSlots] = await Promise.all([
      detectConflicts({
        day, start_time, end_time, room, faculty_id: Number(faculty_id),
        excludeId: id
      }),
      prisma.timetableSlot.findMany({
        where: {
          id: { not: id },
          course_id: Number(course_id), faculty_id: Number(faculty_id), day
        },
        select: { id: true, start_time: true }
      })
    ]);

    const duplicateKey = existingSlots.find(s => toTimeStr(s.start_time) === start_time);

    if (conflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot update slot: Conflict detected',
        conflicts: conflicts.map(c => ({
          id: c.id,
          room: c.room,
          day: c.day,
          time: `${toTimeShort(c.start_time)} - ${toTimeShort(c.end_time)}`,
          course_id: c.course_id
        }))
      });
    }

    if (duplicateKey) {
      return res.status(409).json({
        message: 'Another slot already has this course, faculty, day and start time'
      });
    }

    const studentConflicts = await detectStudentConflicts({
      day, start_time, end_time, course_id: Number(course_id), class_id: class_id ? Number(class_id) : undefined, excludeSlotId: id
    });

    if (studentConflicts.length > 0) {
      return res.status(409).json({
        message: 'Cannot update slot: Student/Class conflict detected',
        conflicts: studentConflicts.map(c => ({
          id: c.id,
          time: `${toTimeShort(c.start_time)} - ${toTimeShort(c.end_time)}`,
          course_code: c.course_code
        }))
      });
    }

    await prisma.timetableSlot.update({
      where: { id },
      data: {
        course_id: Number(course_id), class_id: class_id ? Number(class_id) : null, room, faculty_id: Number(faculty_id), day,
        start_time: timeToDate(start_time),
        end_time: timeToDate(end_time),
        semester_id: semester_id ? Number(semester_id) : null
      }
    });

    res.json({ message: 'Slot updated successfully' });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Another slot already has this course, faculty, day and start time' });
    }
    console.error('Error in updateSlot:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

const DAY_OFFSET = { MON: 0, TUE: 1, WED: 2, THU: 3, FRI: 4, SAT: 5 };

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatIcalDate(date, time) {
  const d = new Date(date);
  const [h, m] = typeof time === 'string' ? time.split(':') : [time.getHours(), time.getMinutes()];
  d.setHours(parseInt(h), parseInt(m), 0, 0);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function exportIcal(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { semester_id, department_id } = req.query;

    let rows;

    const slotWhere = {};
    if (semester_id) slotWhere.semester_id = Number(semester_id);
    if (department_id) slotWhere.course = { department_id: Number(department_id) };

    if (role === 'student') {
      rows = await prisma.timetableSlot.findMany({
        where: {
          ...slotWhere,
          course: { enrollments: { some: { student_id: userId } } }
        },
        include: {
          course: { select: { name: true, code: true } },
          faculty: { select: { name: true } }
        }
      });
    } else if (role === 'faculty') {
      rows = await prisma.timetableSlot.findMany({
        where: { faculty_id: userId, ...slotWhere },
        include: {
          course: { select: { name: true, code: true } }
        }
      });
    } else {
      rows = await prisma.timetableSlot.findMany({
        where: slotWhere,
        include: {
          course: { select: { name: true, code: true } },
          faculty: { select: { name: true } }
        }
      });
    }

    const monday = getMonday(new Date());
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Smart Timetable//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    for (const slot of rows) {
      const eventDate = new Date(monday);
      eventDate.setDate(monday.getDate() + DAY_OFFSET[slot.day]);
      const dtStart = formatIcalDate(eventDate, slot.start_time);
      const dtEnd   = formatIcalDate(eventDate, slot.end_time);
      const summary = `${slot.course.code} – ${slot.course.name}`;
      const desc = `Room: ${slot.room}${slot.faculty?.name ? `\\nFaculty: ${slot.faculty.name}` : ''}`;

      lines.push('BEGIN:VEVENT');
      lines.push(`DTSTART:${dtStart}`);
      lines.push(`DTEND:${dtEnd}`);
      lines.push('RRULE:FREQ=WEEKLY;COUNT=16');
      lines.push(`SUMMARY:${summary}`);
      lines.push(`DESCRIPTION:${desc}`);
      lines.push(`LOCATION:${slot.room}`);
      lines.push('END:VEVENT');
    }

    lines.push('END:VCALENDAR');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=timetable.ics');
    res.send(lines.join('\r\n'));
  } catch (error) {
    console.error('Error in exportIcal:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
