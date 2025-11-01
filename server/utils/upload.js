import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadsRoot = path.join(process.cwd(), 'uploads');

export const ensureDir = (p) => {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
};

ensureDir(uploadsRoot);

export const createPlannerStorage = () => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.userId || 'anonymous';
      const subjectId = req.query.subjectId || req.body?.subjectId;
      let dir = path.join(uploadsRoot, 'planner');
      if (req.path.includes('/notes') && subjectId) {
        dir = path.join(uploadsRoot, 'planner', String(userId), String(subjectId));
      } else if (req.path.includes('/datesheet')) {
        dir = path.join(uploadsRoot, 'planner', String(userId), 'datesheets');
      } else if (req.path.includes('/materials')) {
        dir = path.join(uploadsRoot, 'planner', String(userId), 'materials');
      } else {
        dir = path.join(uploadsRoot, 'planner', String(userId), 'general');
      }
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    },
  });
};

export const createPlannerUpload = () => {
  return multer({ 
    storage: createPlannerStorage(), 
    limits: { fileSize: 50 * 1024 * 1024 } 
  });
};

export { uploadsRoot };

