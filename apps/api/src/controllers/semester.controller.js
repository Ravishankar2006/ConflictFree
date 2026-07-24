import prisma from '../config/prisma.js';

export async function listSemesters(req, res) {
  try {
    const rows = await prisma.semester.findMany({ orderBy: [{ academic_year: 'desc' }, { term: 'asc' }] });
    res.json(rows);
  } catch (error) {
    console.error('Error in listSemesters:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createSemester(req, res) {
  try {
    const { name, academic_year, term, start_date, end_date, is_active } = req.body;
    const result = await prisma.semester.create({
      data: { name, academic_year, term, start_date: new Date(start_date), end_date: new Date(end_date), is_active: is_active ?? true }
    });
    res.status(201).json({ message: 'Semester created successfully', semesterId: result.id });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Semester with this term and academic year already exists' });
    console.error('Error in createSemester:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function updateSemester(req, res) {
  try {
    const id = Number(req.params.id);
    const data = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.academic_year !== undefined) data.academic_year = req.body.academic_year;
    if (req.body.term !== undefined) data.term = req.body.term;
    if (req.body.start_date !== undefined) data.start_date = new Date(req.body.start_date);
    if (req.body.end_date !== undefined) data.end_date = new Date(req.body.end_date);
    if (req.body.is_active !== undefined) data.is_active = req.body.is_active;

    const existing = await prisma.semester.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Semester not found' });

    await prisma.semester.update({ where: { id }, data });
    res.json({ message: 'Semester updated successfully' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(400).json({ message: 'Semester with this term and academic year already exists' });
    console.error('Error in updateSemester:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteSemester(req, res) {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.semester.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Semester not found' });
    await prisma.semester.delete({ where: { id } });
    res.json({ message: 'Semester deleted successfully' });
  } catch (error) {
    console.error('Error in deleteSemester:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
