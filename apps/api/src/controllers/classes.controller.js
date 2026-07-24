import prisma from '../config/prisma.js';

export async function listClasses(req, res) {
  try {
    const { department_id } = req.query;
    const where = {};
    if (department_id) where.department_id = Number(department_id);

    const rows = await prisma.class.findMany({
      where,
      include: {
        department: { select: { name: true } },
        home_room: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(rows);
  } catch (error) {
    console.error('Error in listClasses:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createClass(req, res) {
  try {
    const { name, department_id, home_room_id } = req.body;

    const result = await prisma.class.create({
      data: { name, department_id, home_room_id }
    });

    res.status(201).json({
      message: 'Class created successfully',
      classId: result.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Class already exists' });
    }
    console.error('Error in createClass:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteClass(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.class.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await prisma.class.delete({ where: { id } });
    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error in deleteClass:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
