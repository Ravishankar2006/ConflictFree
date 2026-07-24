import prisma from '../config/prisma.js';
import { toTimeStr } from './time.js';

const timeToMin = (t) => {
  const [h, m] = (typeof t === 'string' ? t : toTimeStr(t)).split(':').map(Number);
  return h * 60 + m;
};

export async function detectConflicts({ day, start_time, end_time, room, faculty_id, excludeId }) {
  const targetRoom = await prisma.room.findUnique({
    where: { name: room },
    select: { is_lab: true }
  });
  const isLabRoom = targetRoom?.is_lab || false;

  const slots = await prisma.timetableSlot.findMany({
    where: {
      day,
      OR: [
        { faculty_id },
        isLabRoom ? { room } : null
      ].filter(Boolean)
    }
  });

  const startMin = timeToMin(start_time);
  const endMin = timeToMin(end_time);

  return slots.filter(s => {
    if (excludeId && s.id === Number(excludeId)) return false;
    const sStart = timeToMin(s.start_time);
    const sEnd = timeToMin(s.end_time);
    return startMin < sEnd && endMin > sStart;
  });
}

export async function detectStudentConflicts({ day, start_time, end_time, course_id, excludeSlotId, class_id }) {
  if (class_id) {
    const slots = await prisma.timetableSlot.findMany({
      where: {
        day,
        class_id
      },
      include: { course: { select: { name: true, code: true } } }
    });

    const startMin = timeToMin(start_time);
    const endMin = timeToMin(end_time);

    return slots
      .filter(s => {
        if (excludeSlotId && s.id === Number(excludeSlotId)) return false;
        const sStart = timeToMin(s.start_time);
        const sEnd = timeToMin(s.end_time);
        return startMin < sEnd && endMin > sStart;
      })
      .map(r => ({
        ...r,
        course_name: r.course.name,
        course_code: r.course.code
      }));
  }

  const enrolled = await prisma.enrollment.findMany({
    where: { course_id },
    select: { student_id: true }
  });

  if (enrolled.length === 0) return [];

  const studentIds = enrolled.map(e => e.student_id);

  const slots = await prisma.timetableSlot.findMany({
    where: {
      day,
      course: {
        enrollments: { some: { student_id: { in: studentIds } } }
      }
    },
    include: { course: { select: { name: true, code: true } } }
  });

  const startMin = timeToMin(start_time);
  const endMin = timeToMin(end_time);

  return slots
    .filter(s => {
      if (excludeSlotId && s.id === Number(excludeSlotId)) return false;
      const sStart = timeToMin(s.start_time);
      const sEnd = timeToMin(s.end_time);
      return startMin < sEnd && endMin > sStart;
    })
    .map(r => ({
      ...r,
      course_name: r.course.name,
      course_code: r.course.code
    }));
}
