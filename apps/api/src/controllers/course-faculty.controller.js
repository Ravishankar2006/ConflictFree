import prisma from '../config/prisma.js';

export async function getCourseFaculty(req, res) {
  try {
    const { courseId } = req.params;

    const rows = await prisma.courseFaculty.findMany({
      where: { course_id: courseId },
      include: { faculty: { select: { id: true, name: true, email: true } } }
    });

    const result = rows.map(r => r.faculty);
    result.sort((a, b) => a.name.localeCompare(b.name));

    res.json(result);
  } catch (error) {
    console.error('Error in getCourseFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function getAllAssignments(req, res) {
  try {
    const rows = await prisma.courseFaculty.findMany({
      include: {
        course: { select: { code: true, name: true } },
        faculty: { select: { name: true } }
      }
    });

    const result = rows.map(r => ({
      course_id: r.course_id,
      faculty_id: r.faculty_id,
      course_code: r.course.code,
      course_name: r.course.name,
      faculty_name: r.faculty.name
    }));

    result.sort((a, b) => a.course_code.localeCompare(b.course_code) || a.faculty_name.localeCompare(b.faculty_name));

    res.json(result);
  } catch (error) {
    console.error('Error in getAllAssignments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function assignFaculty(req, res) {
  try {
    const { courseId } = req.params;
    const { faculty_id } = req.body;

    const faculty = await prisma.user.findUnique({ where: { id: faculty_id } });
    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    try {
      await prisma.courseFaculty.create({
        data: { course_id: courseId, faculty_id }
      });
    } catch (e) {
      if (e.code !== 'P2002') throw e;
    }

    res.json({ message: 'Faculty assigned to course successfully' });
  } catch (error) {
    console.error('Error in assignFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function removeFaculty(req, res) {
  try {
    const { courseId, facultyId } = req.params;

    await prisma.courseFaculty.deleteMany({
      where: { course_id: courseId, faculty_id: facultyId }
    });

    res.json({ message: 'Faculty removed from course' });
  } catch (error) {
    console.error('Error in removeFaculty:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
