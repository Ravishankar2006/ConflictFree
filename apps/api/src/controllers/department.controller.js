import prisma from '../config/prisma.js';

export async function listDepartments(req, res) {
  try {
    const rows = await prisma.department.findMany({
      include: { head: { select: { id: true, name: true, email: true } } },
      orderBy: { name: 'asc' }
    });
    res.json(rows);
  } catch (error) {
    console.error('Error in listDepartments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createDepartment(req, res) {
  try {
    const { name, code, head_id } = req.body;
    const result = await prisma.department.create({
      data: { name, code, head_id: head_id ?? null }
    });
    res.status(201).json({ message: 'Department created successfully', departmentId: result.id });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Department name or code already exists' });
    console.error('Error in createDepartment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateDepartment(req, res) {
  try {
    const id = Number(req.params.id);
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.code !== undefined) data.code = req.body.code;
    if (req.body.head_id !== undefined) data.head_id = req.body.head_id ? Number(req.body.head_id) : null;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Department not found' });

    await prisma.department.update({ where: { id }, data });
    res.json({ message: 'Department updated successfully' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Department name or code already exists' });
    console.error('Error in updateDepartment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteDepartment(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Department not found' });
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
