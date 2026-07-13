import mongoose from 'mongoose';
import { ClearanceRequirement } from './server/models.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URL as string);
  console.log("Connected");
  const count = await ClearanceRequirement.countDocuments();
  if (count === 0) {
    await ClearanceRequirement.create([
      { name: "Room Key Return", description: "Return the physical room keys to the porter.", requires_file: false },
      { name: "No Damage Attestation", description: "Upload a picture of your side of the room to prove no damages.", requires_file: true, file_type: "image" },
      { name: "Final Fee Receipt", description: "Upload the PDF receipt of your final term payment.", requires_file: true, file_type: "pdf" }
    ]);
    console.log("Seeded 3 clearance requirements.");
  } else {
    console.log(`Already has ${count} requirements.`);
  }
  process.exit(0);
}
run();
