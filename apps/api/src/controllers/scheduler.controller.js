import prisma from '../config/prisma.js';
import { generateTimetable } from '../services/scheduler.service.js';
import { detectConflicts, detectStudentConflicts } from '../utils/conflict-detector.js';
import { toTimeStr, timeToDate } from '../utils/time.js';

export async function generate(req, res) {
  try {
    const { semester_id, department_id, class_id } = req.body;

    const courseWhere = {};
    const enrollWhere = {};
    const availWhere = {};
    if (semester_id) {
      courseWhere.semester_id = semester_id;
      enrollWhere.semester_id = semester_id;
      availWhere.semester_id = semester_id;
    }
    if (department_id) {
      const deptId = Number(department_id);
      courseWhere.department_id = deptId;
      enrollWhere.course = { department_id: deptId };
      availWhere.faculty = { department_id: deptId };
    }

    let classData = null;
    if (class_id) {
      classData = await prisma.class.findUnique({
        where: { id: Number(class_id) },
        select: { id: true, name: true, home_room_id: true, department_id: true }
      });
    }

    const [courses, faculty, rooms, enrollments, availability, courseFaculty, existingSlots] = await Promise.all([
      prisma.course.findMany({ where: courseWhere, select: { id: true, name: true, code: true, is_lab: true } }),
      prisma.user.findMany({ where: { role: 'faculty' }, select: { id: true, name: true, email: true } }),
      prisma.room.findMany({ select: { id: true, name: true, capacity: true, is_lab: true } }),
      prisma.enrollment.findMany({ where: enrollWhere, select: { student_id: true, course_id: true } }),
      prisma.facultyAvailability.findMany({ where: availWhere }),
      prisma.courseFaculty.findMany({ select: { course_id: true, faculty_id: true } }),
      prisma.timetableSlot.findMany({
        where: department_id ? { course: { department_id: { not: Number(department_id) } } } : {},
        select: {
          course_id: true, faculty_id: true, room: true, day: true,
          start_time: true, end_time: true,
          course: { select: { code: true, name: true } }
        }
      })
    ]);

    if (rooms.length === 0) {
      return res.status(400).json({ message: 'No rooms defined. Add rooms before generating.' });
    }

    if (courses.length === 0) {
      return res.status(400).json({ message: 'No courses defined for this semester. Add courses before generating.' });
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
      existingSlots,
      params: req.body,
      classData
    });

    res.json(result);
  } catch (error) {
    console.error('Error in generate:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function apply(req, res) {
  try {
    const { slots, clearExisting, semester_id, department_id, class_id } = req.body;

    if (clearExisting) {
      const deleteWhere = {};
      if (semester_id) deleteWhere.semester_id = semester_id;
      if (department_id) deleteWhere.course = { department_id: Number(department_id) };
      await prisma.timetableSlot.deleteMany({ where: deleteWhere });
    }

    // Pre-fetch room and course data for validation
    const courseIds = [...new Set(slots.map(s => s.course_id))];
    const roomNames = [...new Set(slots.map(s => s.room))];
    const [allCourses, allRooms] = await Promise.all([
      prisma.course.findMany({ where: { id: { in: courseIds } }, select: { id: true, is_lab: true } }),
      prisma.room.findMany({ where: { name: { in: roomNames } }, select: { name: true, is_lab: true } }),
    ]);
    const courseMap = Object.fromEntries(allCourses.map(c => [c.id, c]));
    const roomMap = Object.fromEntries(allRooms.map(r => [r.name, r]));

    const errors = [];
    const inserted = [];

    for (let i = 0; i < slots.length; i++) {
      const s = slots[i];

      const course = courseMap[s.course_id];
      const room = roomMap[s.room];

      if (!course) {
        errors.push({ index: i, message: `Course #${s.course_id} not found`, slot: s });
        continue;
      }

      if (!room) {
        errors.push({ index: i, message: `Room "${s.room}" not found`, slot: s });
        continue;
      }

      if (course.is_lab && !room.is_lab) {
        errors.push({ index: i, message: `Lab course must be in a lab room`, slot: s });
        continue;
      }

      if (!course.is_lab && room.is_lab) {
        errors.push({ index: i, message: `Regular course cannot be in a lab room`, slot: s });
        continue;
      }

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
        course_id: s.course_id,
        class_id: s.class_id
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
          class_id: s.class_id ?? null,
          room: s.room,
          day: s.day,
          start_time: timeToDate(s.start_time),
          end_time: timeToDate(s.end_time),
          semester_id: semester_id ?? null
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
