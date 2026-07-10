import mongoose, { Schema } from 'mongoose';
import { randomUUID } from 'crypto';

// Reusable schema options to convert _id to id in JSON output
const schemaOptions = {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
};

// 1. User Model (Covers auth.users, profiles, and user_roles)
const UserSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  email: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  full_name: { type: String },
  matric_number: { type: String, unique: true, sparse: true },
  phone: { type: String },
  program: { type: String },
  avatar_url: { type: String },
  role: { type: String, enum: ['student', 'admin'], default: 'student' }
}, {
  ...schemaOptions,
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    virtuals: true,
    transform: (doc: any, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Do not leak password
    }
  }
});
export const User = mongoose.model('User', UserSchema);

// 2. Hostel Model
const HostelSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  name: { type: String, required: true },
  description: { type: String },
  campus: { type: String },
  gender: { type: String, enum: ['male', 'female', 'mixed'], default: 'mixed' },
  image_url: { type: String }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Hostel = mongoose.model('Hostel', HostelSchema);

// 3. Block Model
const BlockSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  hostel_id: { type: String, ref: 'Hostel', required: true },
  name: { type: String, required: true },
  floors: { type: Number, default: 1 }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Block = mongoose.model('Block', BlockSchema);

// 4. Room Model
const RoomSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  block_id: { type: String, ref: 'Block', required: true },
  room_number: { type: String, required: true },
  capacity: { type: Number, default: 2 },
  room_type: { type: String, default: 'Shared' },
  price_per_term: { type: Number, default: 0 }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Room = mongoose.model('Room', RoomSchema);

// 5. Allocation Model
const AllocationSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  student_id: { type: String, ref: 'User', required: true },
  room_id: { type: String, ref: 'Room', required: true },
  bed_label: { type: String, required: true },
  term: { type: String, required: true },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  allocated_at: { type: Date, default: Date.now }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Allocation = mongoose.model('Allocation', AllocationSchema);

// 6. Complaint Model
const ComplaintSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  student_id: { type: String, ref: 'User', required: true },
  category: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  image_url: { type: String },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' }
}, schemaOptions);
export const Complaint = mongoose.model('Complaint', ComplaintSchema);

// 7. Message Model
const MessageSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  room_id: { type: String, ref: 'Room', required: true },
  sender_id: { type: String, ref: 'User', required: true },
  body: { type: String, required: true }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Message = mongoose.model('Message', MessageSchema);

// 8. Notification Model
const NotificationSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  user_id: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String },
  read: { type: Boolean, default: false }
}, { ...schemaOptions, timestamps: { createdAt: 'created_at', updatedAt: false } });
export const Notification = mongoose.model('Notification', NotificationSchema);

// 9. ClearanceItem Model
const ClearanceItemSchema = new Schema({
  _id: { type: String, default: () => randomUUID() },
  student_id: { type: String, ref: 'User', required: true },
  item: { type: String, required: true },
  status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  verified_by: { type: String, ref: 'User' }
}, schemaOptions);
export const ClearanceItem = mongoose.model('ClearanceItem', ClearanceItemSchema);
