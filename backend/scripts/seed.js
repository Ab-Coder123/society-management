import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from '../src/models/User.js';
import Society from '../src/models/Society.js';
import Flat from '../src/models/Flat.js';
import ParkingSlot from '../src/models/ParkingSlot.js';
import Notice from '../src/models/Notice.js';
import Complaint from '../src/models/Complaint.js';
import Payment from '../src/models/Payment.js';
import Visitor from '../src/models/Visitor.js';
import FacilityBooking from '../src/models/FacilityBooking.js';
import Event from '../src/models/Event.js';
import Staff from '../src/models/Staff.js';

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000,
    family: 4,
  });
  console.log('✅ Connected to MongoDB Atlas\n');

  const passwordHash = await bcrypt.hash('Admin@1234', 10);
  const ownerHash    = await bcrypt.hash('Owner@1234', 10);
  const residentHash = await bcrypt.hash('Resident@1234', 10);
  const guardHash    = await bcrypt.hash('Guard@1234', 10);

  // 1. Super Admin
  let superAdmin = await User.findOne({ email: 'superadmin@societyms.com' });
  if (!superAdmin) {
    superAdmin = await User.create({
      name: 'Super Admin',
      email: 'superadmin@societyms.com',
      phone: '01000000000',
      password: passwordHash,
      role: 'super_admin',
    });
  }

  // 2. Society
  let society = await Society.findOne({ name: 'Green Valley Society' });
  if (!society) {
    society = await Society.create({
      name: 'Green Valley Society',
      address: '123 Palm Street, Cairo',
      totalFlats: 50,
    });
  }

  // 3. Flats
  let flat101 = await Flat.findOne({ societyId: society._id, building: 'Tower A', flatNumber: '101' });
  if (!flat101) {
    flat101 = await Flat.create({ societyId: society._id, building: 'Tower A', flatNumber: '101', wing: 'East', floor: 1, type: '3BHK', status: 'occupied' });
  }

  let flat102 = await Flat.findOne({ societyId: society._id, building: 'Tower A', flatNumber: '102' });
  if (!flat102) {
    flat102 = await Flat.create({ societyId: society._id, building: 'Tower A', flatNumber: '102', wing: 'West', floor: 1, type: '2BHK', status: 'rented' });
  }

  let flat201 = await Flat.findOne({ societyId: society._id, building: 'Tower B', flatNumber: '201' });
  if (!flat201) {
    flat201 = await Flat.create({ societyId: society._id, building: 'Tower B', flatNumber: '201', wing: 'North', floor: 2, type: '3BHK', status: 'vacant' });
  }

  // 4. Users (All 5 roles)
  let admin = await User.findOne({ email: 'admin@greenvalley.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Ahmed Mohamed',
      email: 'admin@greenvalley.com',
      phone: '01111111111',
      password: passwordHash,
      role: 'society_admin',
      societyId: society._id,
    });
  }

  let owner = await User.findOne({ email: 'owner@greenvalley.com' });
  if (!owner) {
    owner = await User.create({
      name: 'Mohamed Ali',
      email: 'owner@greenvalley.com',
      phone: '01222222222',
      password: ownerHash,
      role: 'owner',
      societyId: society._id,
      flatId: flat101._id,
    });
  } else if (!owner.flatId) {
    owner.flatId = flat101._id;
    await owner.save();
  }

  let resident = await User.findOne({ email: 'resident@greenvalley.com' });
  if (!resident) {
    resident = await User.create({
      name: 'Sara Hassan',
      email: 'resident@greenvalley.com',
      phone: '01333333333',
      password: residentHash,
      role: 'resident',
      societyId: society._id,
      flatId: flat102._id,
    });
  } else if (!resident.flatId) {
    resident.flatId = flat102._id;
    await resident.save();
  }

  let guard = await User.findOne({ email: 'guard@greenvalley.com' });
  if (!guard) {
    guard = await User.create({
      name: 'Karim Youssef',
      email: 'guard@greenvalley.com',
      phone: '01444444444',
      password: guardHash,
      role: 'security_guard',
      societyId: society._id,
    });
  }

  // Link owners to flats
  flat101.ownerId = owner._id;
  await flat101.save();
  flat102.residentId = resident._id;
  await flat102.save();

  // 5. Parking Slots
  const parkingCount = await ParkingSlot.countDocuments({ societyId: society._id });
  if (parkingCount === 0) {
    await ParkingSlot.create([
      { societyId: society._id, slotNumber: 'P-101', isAllocated: true, allocatedToFlatId: flat101._id, vehicleNumber: 'CAI-9876' },
      { societyId: society._id, slotNumber: 'P-102', isAllocated: true, allocatedToFlatId: flat102._id, vehicleNumber: 'ALX-1234' },
      { societyId: society._id, slotNumber: 'P-103', isAllocated: false },
      { societyId: society._id, slotNumber: 'P-104', isAllocated: false },
    ]);
  }

  // 6. Staff Records
  const staffCount = await Staff.countDocuments({ societyId: society._id });
  if (staffCount === 0) {
    await Staff.create([
      { societyId: society._id, name: 'Karim Youssef', role: 'security', phone: '01444444444', shift: 'morning', isActive: true, notes: 'Main Gate Specialist' },
      { societyId: society._id, name: 'Hassan Mahmoud', role: 'electrician', phone: '01555555555', shift: 'rotating', isActive: true, notes: 'Lead Technician' },
      { societyId: society._id, name: 'Tarek Ibrahim', role: 'plumber', phone: '01666666666', shift: 'morning', isActive: true },
      { societyId: society._id, name: 'Noha Samir', role: 'housekeeping', phone: '01777777777', shift: 'afternoon', isActive: true },
    ]);
  }

  // 7. Notices
  const noticeCount = await Notice.countDocuments({ societyId: society._id });
  if (noticeCount === 0) {
    await Notice.create([
      {
        societyId: society._id,
        title: '📢 Annual General Meeting 2026',
        body: 'All homeowners and residents are cordially invited to the AGM on September 15th at the Community Clubhouse.',
        category: 'meeting',
        createdBy: admin._id,
      },
      {
        societyId: society._id,
        title: '🔧 Swimming Pool Maintenance',
        body: 'The main swimming pool will be closed for routine filter cleaning this Thursday from 8:00 AM to 4:00 PM.',
        category: 'maintenance',
        createdBy: admin._id,
      },
      {
        societyId: society._id,
        title: '⚡ Scheduled Power Grid Inspection',
        body: 'State electricity board will inspect sub-stations on Saturday. Backup generator will remain active.',
        category: 'utility',
        createdBy: admin._id,
      },
    ]);
  }

  // 8. Complaints
  const complaintCount = await Complaint.countDocuments({ societyId: society._id });
  if (complaintCount === 0) {
    await Complaint.create([
      {
        societyId: society._id,
        flatId: flat101._id,
        raisedBy: owner._id,
        title: 'Water Leakage in Bathroom Ceiling',
        description: 'Seepage noticed near the master shower area from upper pipe fitting.',
        category: 'plumbing',
        priority: 'high',
        status: 'in_progress',
        assignedToStaff: 'Tarek Ibrahim (Plumber)',
        comments: [
          { author: owner._id, text: 'Please inspect as soon as possible.' },
          { author: admin._id, text: 'Assigned to Tarek. Inspection scheduled for today 3 PM.' },
        ],
      },
      {
        societyId: society._id,
        flatId: flat102._id,
        raisedBy: resident._id,
        title: 'Corridor Light Bulb Replacement',
        description: 'The LED tube light outside Flat 102 Tower A is flickering.',
        category: 'electrical',
        priority: 'low',
        status: 'resolved',
        assignedToStaff: 'Hassan Mahmoud (Electrician)',
        comments: [
          { author: resident._id, text: 'Light is completely off now.' },
          { author: admin._id, text: 'Replaced with 18W Philips LED.' },
        ],
      },
    ]);
  }

  // 9. Payments & Maintenance Dues
  const paymentCount = await Payment.countDocuments({ societyId: society._id });
  if (paymentCount === 0) {
    await Payment.create([
      {
        societyId: society._id,
        flatId: flat101._id,
        ownerId: owner._id,
        month: '2026-08',
        amount: 2500,
        status: 'paid',
        paidAt: new Date(),
      },
      {
        societyId: society._id,
        flatId: flat101._id,
        ownerId: owner._id,
        month: '2026-09',
        amount: 2500,
        status: 'pending',
      },
      {
        societyId: society._id,
        flatId: flat102._id,
        ownerId: resident._id,
        month: '2026-08',
        amount: 2000,
        status: 'paid',
        paidAt: new Date(),
      },
    ]);
  }

  // 10. Visitor Logs
  const visitorCount = await Visitor.countDocuments({ societyId: society._id });
  if (visitorCount === 0) {
    await Visitor.create([
      {
        societyId: society._id,
        flatId: flat101._id,
        name: 'Ahmed Zaki (Delivery)',
        phone: '01011112222',
        purpose: 'delivery',
        vehicleNumber: 'CAI-5544',
        status: 'checked_in',
        approvedBy: owner._id,
        checkInTime: new Date(),
        loggedBySecurity: guard._id,
      },
      {
        societyId: society._id,
        flatId: flat102._id,
        name: 'Mona El-Sayed (Guest)',
        phone: '01033334444',
        purpose: 'guest',
        vehicleNumber: 'GZA-9988',
        status: 'approved',
        approvedBy: resident._id,
      },
    ]);
  }

  // 11. Facility Bookings
  const bookingCount = await FacilityBooking.countDocuments({ societyId: society._id });
  if (bookingCount === 0) {
    await FacilityBooking.create([
      {
        societyId: society._id,
        flatId: flat101._id,
        bookedBy: owner._id,
        facilityName: 'gym',
        date: new Date('2026-08-25'),
        slot: '08:00-09:00',
        purpose: 'Morning Fitness Session',
        status: 'approved',
      },
      {
        societyId: society._id,
        flatId: flat102._id,
        bookedBy: resident._id,
        facilityName: 'clubhouse',
        date: new Date('2026-09-02'),
        slot: '18:00-19:00',
        purpose: 'Birthday Celebration',
        status: 'pending',
      },
    ]);
  }

  // 12. Community Events
  const eventCount = await Event.countDocuments({ societyId: society._id });
  if (eventCount === 0) {
    await Event.create([
      {
        societyId: society._id,
        title: '🎉 Autumn Cultural Festival 2026',
        description: 'Music, food stalls, games for children, and evening fireworks in the central lawn.',
        date: new Date('2026-09-10'),
        time: '17:00',
        location: 'Central Lawn & Amphitheatre',
        organizer: 'Green Valley Resident Association',
        createdBy: admin._id,
        maxAttendees: 150,
        rsvpList: [
          { userId: owner._id, name: owner.name, phone: owner.phone, rsvpAt: new Date() },
          { userId: resident._id, name: resident.name, phone: resident.phone, rsvpAt: new Date() },
        ],
      },
      {
        societyId: society._id,
        title: '🧘 Morning Yoga & Wellness Workshop',
        description: 'Guided breathing exercises and Hatha yoga with certified instructor.',
        date: new Date('2026-08-28'),
        time: '07:00 AM',
        location: 'Clubhouse Yoga Room',
        organizer: 'Wellness Committee',
        createdBy: admin._id,
        maxAttendees: 30,
        rsvpList: [
          { userId: resident._id, name: resident.name, phone: resident.phone, rsvpAt: new Date() },
        ],
      },
    ]);
  }

  console.log('🎉 Seed complete! All 5 roles now have rich, realistic activity data across all modules:');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('Role             Email                         Password     Initial Dashboard');
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('super_admin      superadmin@societyms.com      Admin@1234   /super-admin');
  console.log('society_admin    admin@greenvalley.com         Admin@1234   /society-admin');
  console.log('owner            owner@greenvalley.com         Owner@1234   /owner');
  console.log('resident         resident@greenvalley.com      Resident@1234 /resident');
  console.log('security_guard   guard@greenvalley.com         Guard@1234   /security');
  console.log('─────────────────────────────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
