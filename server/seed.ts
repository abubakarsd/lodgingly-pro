import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Hostel, Block, Room } from './models';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: '.env' });

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  console.error("Error: MONGODB_URL environment variable is missing!");
  process.exit(1);
}

export async function seedDatabase() {
  console.log("Checking database seed status...");
  
  // 1. Seed Hostels, Blocks, and Rooms if empty
  const hostelCount = await Hostel.countDocuments();
  if (hostelCount === 0) {
    console.log("No hostels found. Seeding hostels, blocks, and rooms...");

    const hostelsData = [
      { name: 'Umar Sulaim Hostel', description: 'Modern residence with study lounges and gym access.', campus: 'North Campus', gender: 'male' },
      { name: 'Amina Hostel', description: 'Quiet residence close to the library.', campus: 'South Campus', gender: 'female' },
      { name: 'Ribadu Hostel', description: 'Community-focused living with shared kitchens.', campus: 'Central Campus', gender: 'female' },
      { name: 'Sakawa Hostel', description: 'Premium en-suite rooms with courtyard views.', campus: 'East Campus', gender: 'female' },
      { name: 'Danfodio Hostel', description: 'Traditional courtyard-style hall of residence.', campus: 'West Campus', gender: 'male' },
      { name: 'Dangote Hostel', description: 'Ultra-modern hostel with laundry and retail options.', campus: 'North Campus', gender: 'male' }
    ] as const;

    for (const hData of hostelsData) {
      const hostel = await Hostel.create(hData);
      console.log(`Created Hostel: ${hostel.name} (${hostel._id})`);

      const block = await Block.create({
        hostel_id: hostel._id,
        name: 'Block A',
        floors: 4
      });
      console.log(`  Created Block: ${block.name} (${block._id})`);

      for (let i = 1; i <= 8; i++) {
        const room = await Room.create({
          block_id: block._id,
          room_number: (100 + i).toString(),
          capacity: 2,
          room_type: 'Shared Ensuite',
          price_per_term: 1200
        });
        console.log(`    Created Room: ${room.room_number} (${room._id})`);
      }
    }
  } else {
    console.log("Hostels database already seeded.");
  }

  // 2. Seed Admin User if not exists
  const adminEmail = 'admin@abu.edu.ng';
  const adminExists = await User.findOne({ email: adminEmail });
  if (!adminExists) {
    console.log(`Admin user not found. Creating default admin: ${adminEmail}`);
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    await User.create({
      email: adminEmail,
      password: hashedPassword,
      full_name: 'System Administrator',
      role: 'admin'
    });
    console.log("Default admin created successfully! (Password: adminpassword)");
  } else {
    console.log("Admin user already exists.");
  }

  // 3. Seed Default Student User if not exists
  const studentEmail = 'student@abu.edu.ng';
  const studentExists = await User.findOne({ email: studentEmail });
  if (!studentExists) {
    console.log(`Default student user not found. Creating student: ${studentEmail}`);
    const hashedPassword = await bcrypt.hash('studentpassword', 10);
    await User.create({
      email: studentEmail,
      password: hashedPassword,
      full_name: 'John Student',
      matric_number: 'U16CSC206',
      role: 'student'
    });
    console.log("Default student created successfully! (Password: studentpassword, Matric: U16CSC206)");
  } else {
    console.log("Default student user already exists.");
  }

  console.log("Database seed check complete.");
}

const isMain = process.argv[1] && process.argv[1].endsWith('seed.ts');
if (isMain) {
  mongoose.connect(MONGODB_URL)
    .then(async () => {
      console.log("Connected to MongoDB for seeding...");
      await seedDatabase();
      await mongoose.disconnect();
      console.log("Disconnected from MongoDB.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}
