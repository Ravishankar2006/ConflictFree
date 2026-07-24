import prisma from '../config/prisma.js';

export async function listRooms(req, res) {
  try {
    const rows = await prisma.room.findMany({ orderBy: { name: 'asc' } });
    res.json(rows);
  } catch (error) {
    console.error('Error in listRooms:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function createRoom(req, res) {
  try {
    const { name, capacity, is_lab } = req.body;

    const result = await prisma.room.create({
      data: { name, capacity: capacity ?? 30, is_lab: is_lab ?? false }
    });

    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.id
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Room already exists' });
    }
    console.error('Error in createRoom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

export async function deleteRoom(req, res) {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: 'Room not found' });
    }

    await prisma.room.delete({ where: { id } });
    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error in deleteRoom:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}
