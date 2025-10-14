import Journal from '../models/Journal.js';

export const getJournals = async (req, res) => {
  try {
    // Only return journals belonging to the authenticated user
    const userFilter = req.userId ? { userId: req.userId } : { _id: null }; // fallback to empty result if no user
    const journals = await Journal.find(userFilter).sort({ createdAt: -1 }).lean();
    res.json(journals);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch journals' });
  }
};

export const createJournal = async (req, res) => {
  try {
    const { title, date, time, summary } = req.body || {};
    if (!title || !summary) {
      return res.status(400).json({ message: 'title and summary are required' });
    }
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const now = new Date();
    const fallbackDate = date && String(date).trim().length > 0 ? date : now.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const fallbackTime = time && String(time).trim().length > 0 ? time : now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const created = await Journal.create({ title, date: fallbackDate, time: fallbackTime, summary, userId: req.userId });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create journal' });
  }
};

export const deleteJournal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const journal = await Journal.findById(id);
    if (!journal) return res.status(404).json({ message: 'Not found' });
    if (String(journal.userId) !== String(req.userId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    await Journal.deleteOne({ _id: id });
    return res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete journal' });
  }
};


