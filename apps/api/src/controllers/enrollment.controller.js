import prisma from '../config/prisma.js';

export async function listEnrollments(req, res) {
  try {
    const rows = await prisma.enrollment.findMany({
      include: {
        student: { select: { name: true, email: true } },
        course: { select: { code: true, name: true } }
      },
      orderBy: { id: 'asc' }
    });

    const result = rows.map(e => ({
      id: e.id,
      student_id: e.student_id,
      course_id: e.course_id,
      student_name: e.student.name,
      student_email: e.student.email,
      course_code: e.course.code,
      course_name: e.course.name
    }));

    result.sort((a, b) => a.student_name.localeCompare(b.student_name) || a.course_code.localeCompare(b.course_code));

    res.json(result);
  } catch (error) {
    console.error('Error in listEnrollments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createEnrollment(req, res) {
  try {
    const { student_id, course_id } = req.body;

    const student = await prisma.user.findUnique({ where: { id: student_id } });
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = await prisma.course.findUnique({ where: { id: course_id } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const result = await prisma.enrollment.create({
      data: { student_id, course_id }
    });

    res.status(201).json({
      message: 'Student enrolled successfully',
      enrollmentId: result.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Student is already enrolled in this course' });
    }
    console.error('Error in createEnrollment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteEnrollment(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }

    await prisma.enrollment.delete({ where: { id } });
    res.json({ message: 'Enrollment removed successfully' });
  } catch (error) {
    console.error('Error in deleteEnrollment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
