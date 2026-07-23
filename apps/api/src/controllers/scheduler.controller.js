import prisma from '../config/prisma.js';
import { generateTimetable } from '../services/scheduler.service.js';
import { detectConflicts, detectStudentConflicts } from '../utils/conflict-detector.js';
import { toTimeStr, timeToDate } from '../utils/time.js';

export async function generate(req, res) {
  try {
    const [courses, faculty, rooms, enrollments, availability, courseFaculty] = await Promise.all([
      prisma.course.findMany({ select: { id: true, name: true, code: true } }),
      prisma.user.findMany({ where: { role: 'faculty' }, select: { id: true, name: true, email: true } }),
      prisma.room.findMany({ select: { id: true, name: true, capacity: true } }),
      prisma.enrollment.findMany({ select: { student_id: true, course_id: true } }),
      prisma.facultyAvailability.findMany(),
      prisma.courseFaculty.findMany({ select: { course_id: true, faculty_id: true } })
    ]);

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms defined. Add rooms before generating.' });
    }

    if (courses.length === 0) {
      return res.status(400).json({ message: 'No courses defined. Add courses before generating.' });
    }

    const normalizedAvailability = availability.map(a => ({
      ...a,
      start_time: toTimeStr(a.start_time),
      end_time: toTimeStr(a.end_time)
    }));

    const result = generateTimetable({
      courses,
      faculty,
      rooms,
      enrollments,
      availability: normalizedAvailability,
      courseFaculty,
      params: req.body
    });

    res.json(result);
  } catch (error) {
    console.error('Error in generate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function apply(req, res) {
  try {
    const { slots, clearExisting } = req.body;

    if (clearExisting) {
      await prisma.timetableSlot.deleteMany();
    }

    const errors = [];
    const inserted = [];

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];

      const roomConflicts = await detectConflicts({
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        room: s.room,
        faculty_id: s.faculty_id
      });

      if (roomConflicts.length > 0) {
        errors.push({
          index: i,
          message: `Conflicts with slot #${roomConflicts[0].id}`,
          slot: s
        });
        continue;
      }

      const studentConflicts = await detectStudentConflicts({
        day: s.day,
        start_time: s.start_time,
        end_time: s.end_time,
        course_id: s.course_id
      });

      if (studentConflicts.length > 0) {
        errors.push({
          index: i,
          message: `Student conflict with ${studentConflicts[0].course_code}`,
          slot: s
        });
        continue;
      }

      await prisma.timetableSlot.create({
        data: {
          course_id: s.course_id,
          faculty_id: s.faculty_id,
          room: s.room,
          day: s.day,
          start_time: timeToDate(s.start_time),
          end_time: timeToDate(s.end_time)
        }
      });

      inserted.push(s);
    }

    res.json({
      message: `Applied ${inserted.length} of ${slots.length} slots`,
      inserted: inserted.length,
      total: slots.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in apply:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
