import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { resolve } from 'path';
import { User, Hostel, Block, Room, Allocation, Complaint, Message, Notification, ClearanceItem } from './models';
import { seedDatabase } from './seed';

dotenv.config({ path: '.env' });

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL;
const JWT_SECRET = process.env.JWT_SECRET || 'lodgingly-pro-super-secret-key-12345';

if (!MONGODB_URL) {
  console.error("Error: MONGODB_URL environment variable is missing!");
  process.exit(1);
}

app.use(cors());
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Authentication middleware
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Map URL table names to Mongoose models
const getModel = (tableName: string) => {
  switch (tableName) {
    case 'hostels': return Hostel;
    case 'blocks': return Block;
    case 'rooms': return Room;
    case 'allocations': return Allocation;
    case 'complaints': return Complaint;
    case 'messages': return Message;
    case 'notifications': return Notification;
    case 'clearance_items': return ClearanceItem;
    default: return null;
  }
};

// 1. Auth: Signup
app.post('/api/auth/signup', async (req: Response | any, res: Response) => {
  try {
    const { email, password, fullName, matricNumber } = req.body;

    if (matricNumber) {
      const existingUser = await User.findOne({ matric_number: matricNumber.trim().toUpperCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Registration number is already registered' });
      }
    }

    if (email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Automatically make admin@abu.edu.ng an admin
    const role = (email && email.toLowerCase() === 'admin@abu.edu.ng') ? 'admin' : 'student';

    const user = await User.create({
      email: email ? email.toLowerCase() : undefined,
      matric_number: matricNumber ? matricNumber.trim().toUpperCase() : undefined,
      password: hashedPassword,
      full_name: fullName || (email ? email.split('@')[0] : matricNumber),
      role
    });

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, matric_number: user.matric_number }, JWT_SECRET, { expiresIn: '7d' });

    const sessionPayload = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 604800,
      user: {
        id: user.id,
        email: user.email || null,
        user_metadata: {
          full_name: user.full_name,
          matric_number: user.matric_number || null
        }
      }
    };

    res.status(201).json({
      user: sessionPayload.user,
      session: sessionPayload
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    res.status(500).json({ message: error.message || 'Error registering user' });
  }
});

// 2. Auth: Login
app.post('/api/auth/login', async (req: Response | any, res: Response) => {
  try {
    const { email, password } = req.body;
    const searchVal = (email || '').trim();

    // Look up by email or matric_number (case insensitive)
    const user = await User.findOne({
      $or: [
        { email: searchVal.toLowerCase() },
        { matric_number: searchVal.toUpperCase() }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid registration number/email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid registration number/email or password' });
    }

    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, matric_number: user.matric_number }, JWT_SECRET, { expiresIn: '7d' });

    const sessionPayload = {
      access_token: token,
      token_type: 'bearer',
      expires_in: 604800,
      user: {
        id: user.id,
        email: user.email || null,
        user_metadata: {
          full_name: user.full_name,
          matric_number: user.matric_number || null
        }
      }
    };

    res.status(200).json({
      user: sessionPayload.user,
      session: sessionPayload
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message || 'Error authenticating user' });
  }
});

// 3. Database: GET collections
app.get('/api/db/:table', authenticateToken, async (req: AuthRequest | any, res: Response) => {
  try {
    const { table } = req.params;
    
    // Custom logic for profiles table (queries User model)
    if (table === 'profiles') {
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : [];
      let queryId = req.user?.id;
      
      const idFilter = filters.find((f: any) => f.field === 'id' && f.op === 'eq');
      if (idFilter) queryId = idFilter.value;

      const profile = await User.findById(queryId);
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      return res.json([profile]);
    }

    // Custom logic for user_roles table (queries User model)
    if (table === 'user_roles') {
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : [];
      let queryId = req.user?.id;
      
      const userIdFilter = filters.find((f: any) => f.field === 'user_id' && f.op === 'eq');
      if (userIdFilter) queryId = userIdFilter.value;

      const profile = await User.findById(queryId);
      if (!profile) return res.json([]);
      return res.json([{ role: profile.role, user_id: profile.id }]);
    }

    const Model = getModel(table);
    if (!Model) {
      return res.status(404).json({ message: `Table ${table} not supported` });
    }

    // Build MongoDB filters query
    const mongoQuery: any = {};
    if (req.query.filters) {
      const filters = JSON.parse(req.query.filters as string);
      for (const filter of filters) {
        let fieldName = filter.field;
        // Map common fields
        if (fieldName === 'id') fieldName = '_id';
        
        if (filter.op === 'eq') {
          mongoQuery[fieldName] = filter.value;
        } else if (filter.op === 'in') {
          mongoQuery[fieldName] = { $in: filter.value };
        }
      }
    }

    let query: any = Model.find(mongoQuery);

    // Apply sorting
    if (req.query.sortField) {
      const field = req.query.sortField === 'id' ? '_id' : req.query.sortField as string;
      const asc = req.query.sortAscending === 'true' ? 1 : -1;
      query = query.sort({ [field]: asc });
    }

    // Apply limit
    if (req.query.limit) {
      query = query.limit(parseInt(req.query.limit as string));
    }

    // Populate relations for allocations
    if (table === 'allocations') {
      query = query.populate({
        path: 'room_id',
        model: 'Room',
        populate: {
          path: 'block_id',
          model: 'Block',
          populate: {
            path: 'hostel_id',
            model: 'Hostel'
          }
        }
      });
    }

    const docs = await query.exec();

    // Map relations format to match Supabase schema (singular table joins mapped to properties)
    if (table === 'allocations') {
      const formattedDocs = docs.map((doc: any) => {
        const docJson = doc.toJSON();
        if (docJson.room_id) {
          const room = docJson.room_id;
          docJson.rooms = {
            id: room.id,
            room_number: room.room_number,
            room_type: room.room_type,
            price_per_term: room.price_per_term,
            capacity: room.capacity,
            blocks: room.block_id ? {
              id: room.block_id.id,
              name: room.block_id.name,
              floors: room.block_id.floors,
              hostels: room.block_id.hostel_id ? {
                id: room.block_id.hostel_id.id,
                name: room.block_id.hostel_id.name,
                description: room.block_id.hostel_id.description,
                campus: room.block_id.hostel_id.campus,
                gender: room.block_id.hostel_id.gender,
                image_url: room.block_id.hostel_id.image_url
              } : null
            } : null
          };
          delete docJson.room_id;
        }
        return docJson;
      });
      return res.json(formattedDocs);
    }

    res.json(docs);
  } catch (error: any) {
    console.error(`Error querying ${req.params.table}:`, error);
    res.status(500).json({ message: error.message || 'Query execution error' });
  }
});

// 4. Database: POST (Insert)
app.post('/api/db/:table', authenticateToken, async (req: AuthRequest | any, res: Response) => {
  try {
    const { table } = req.params;
    const data = req.body;

    const Model = getModel(table);
    if (!Model) {
      return res.status(404).json({ message: `Table ${table} not supported` });
    }

    // Set student_id if missing and user is logged in
    if (!data.student_id && req.user?.id) {
      data.student_id = req.user.id;
    }

    // Special validation logic for active allocations
    if (table === 'allocations') {
      const activeCount = await Allocation.countDocuments({ student_id: data.student_id, status: 'active' });
      if (activeCount > 0) {
        return res.status(400).json({ message: 'Cancel your current allocation first.' });
      }

      const room = await Room.findById(data.room_id);
      if (!room) {
        return res.status(404).json({ message: 'Selected room not found' });
      }

      const takenCount = await Allocation.countDocuments({ room_id: data.room_id, status: 'active' });
      if (takenCount >= room.capacity) {
        return res.status(400).json({ message: 'This room has no free beds.' });
      }
    }

    const doc = await Model.create(data);
    res.status(201).json(doc);
  } catch (error: any) {
    console.error(`Error inserting into ${req.params.table}:`, error);
    res.status(500).json({ message: error.message || 'Error inserting document' });
  }
});

// 5. Database: PATCH (Update)
app.patch('/api/db/:table', authenticateToken, async (req: AuthRequest | any, res: Response) => {
  try {
    const { table } = req.params;
    const data = req.body;

    // Custom profile update logic
    if (table === 'profiles') {
      const filters = req.query.filters ? JSON.parse(req.query.filters as string) : [];
      let queryId = req.user?.id;
      
      const idFilter = filters.find((f: any) => f.field === 'id' && f.op === 'eq');
      if (idFilter) queryId = idFilter.value;

      const profile = await User.findByIdAndUpdate(queryId, data, { new: true });
      if (!profile) return res.status(404).json({ message: 'Profile not found' });
      return res.json(profile);
    }

    const Model = getModel(table);
    if (!Model) {
      return res.status(404).json({ message: `Table ${table} not supported` });
    }

    // Build filter
    const mongoQuery: any = {};
    if (req.query.filters) {
      const filters = JSON.parse(req.query.filters as string);
      for (const filter of filters) {
        let fieldName = filter.field;
        if (fieldName === 'id') fieldName = '_id';
        if (filter.op === 'eq') mongoQuery[fieldName] = filter.value;
      }
    }

    // Find and update
    const doc = await Model.findOneAndUpdate(mongoQuery, data, { new: true });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json(doc);
  } catch (error: any) {
    console.error(`Error updating table ${req.params.table}:`, error);
    res.status(500).json({ message: error.message || 'Error updating document' });
  }
});

// 6. Database: DELETE
app.delete('/api/db/:table', authenticateToken, async (req: AuthRequest | any, res: Response) => {
  try {
    const { table } = req.params;

    const Model = getModel(table);
    if (!Model) {
      return res.status(404).json({ message: `Table ${table} not supported` });
    }

    // Build filter
    const mongoQuery: any = {};
    if (req.query.filters) {
      const filters = JSON.parse(req.query.filters as string);
      for (const filter of filters) {
        let fieldName = filter.field;
        if (fieldName === 'id') fieldName = '_id';
        if (filter.op === 'eq') mongoQuery[fieldName] = filter.value;
      }
    }

    const doc = await Model.findOneAndDelete(mongoQuery);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found to delete' });
    }

    res.json({ message: 'Deleted successfully', doc });
  } catch (error: any) {
    console.error(`Error deleting from ${req.params.table}:`, error);
    res.status(500).json({ message: error.message || 'Error deleting document' });
  }
});

// Connect to MongoDB & Seed Database
mongoose.connect(MONGODB_URL)
  .then(async () => {
    console.log("Successfully connected to MongoDB Atlas!");
    await seedDatabase();
    
    app.listen(PORT, () => {
      console.log(`Backend Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB Atlas connection error:", err);
    process.exit(1);
  });
