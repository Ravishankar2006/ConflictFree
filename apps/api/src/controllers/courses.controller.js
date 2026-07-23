import prisma from '../config/prisma.js';

export async function listCourses(req, res) {
  try {
    const rows = await prisma.course.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { code: 'asc' }
    });
    res.json(rows);
  } catch (error) {
    console.error('Error in listCourses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createCourse(req, res) {
  try {
    const { name, code } = req.body;

    const result = await prisma.course.create({
      data: { name, code: code.toUpperCase() }
    });

    res.status(201).json({
      message: 'Course created successfully',
      courseId: result.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Course code already exists' });
    }
    console.error('Error in createCourse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteCourse(req, res) {
  try {
    const { id } = req.params;

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await prisma.course.delete({ where: { id } });
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error in deleteCourse:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
