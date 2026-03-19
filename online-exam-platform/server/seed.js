const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
const Admin = require('./models/Admin');
const Group = require('./models/Group');
const Student = require('./models/Student');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

// Clear all data
const clearDatabase = async () => {
  try {
    await Admin.deleteMany({});
    await Group.deleteMany({});
    await Student.deleteMany({});
    console.log('✓ Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

// Create default admin
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('✓ Admin already exists');
      return existingAdmin;
    }

    const admin = await Admin.create({
      name: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
    });

    console.log('✓ Default admin created:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${adminPassword}`);
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    throw error;
  }
};

// Create sample groups
const createSampleGroups = async () => {
  try {
    const groups = [
      {
        groupName: 'B.Tech Computer Science',
        year: '2025',
        batch: 'Batch A',
        section: 'Section C',
        description: 'Computer Science Engineering students - Batch of 2025'
      },
      {
        groupName: 'B.Tech Information Technology',
        year: '2025',
        batch: 'Batch B',
        section: 'Section A',
        description: 'Information Technology students - Batch of 2025'
      },
      {
        groupName: 'B.Tech Electronics',
        year: '2024',
        batch: 'Batch A',
        section: 'Section B',
        description: 'Electronics Engineering students - Batch of 2024'
      },
      {
        groupName: 'M.Tech Data Science',
        year: '2024',
        batch: 'Batch A',
        section: 'Section B',
        description: 'Data Science post-graduate students'
      },
      {
        groupName: 'B.Sc Computer Science',
        year: '2026',
        batch: 'Batch C',
        section: 'Section A',
        description: 'Computer Science undergraduate students'
      }
    ];

    const createdGroups = await Group.insertMany(groups);
    console.log(`✓ ${createdGroups.length} sample groups created`);
    return createdGroups;
  } catch (error) {
    console.error('Error creating groups:', error);
    throw error;
  }
};

// Create sample students
const createSampleStudents = async (groups, adminId) => {
  try {
    const students = [];

    // Create 5 students for each group
    for (const [groupIndex, group] of groups.entries()) {
      const groupCode = group.groupName
        .replace(/[^a-zA-Z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .toUpperCase();

      for (let i = 1; i <= 5; i++) {
        const rollNumber = `${groupCode}${group.year}${String(groupIndex + 1).padStart(2, '0')}${String(i).padStart(3, '0')}`;
        students.push({
          name: `Student ${i} ${group.groupName}`,
          rollNumber: rollNumber.toUpperCase(),
          email: `student${i}.${group.groupName.toLowerCase().replace(/\s+/g, '')}@example.com`,
          password: 'Student@123',
          group: group._id,
          isActive: Math.random() > 0.2, // 80% active
          lastLogin: Math.random() > 0.5 ? new Date() : null
        });
      }
    }

    // Add a few more random students
    const extraStudents = [
      {
        name: 'John Doe',
        rollNumber: 'CS2025001',
        email: 'john.doe@example.com',
        password: 'Student@123',
        group: groups[0]._id,
        isActive: true
      },
      {
        name: 'Jane Smith',
        rollNumber: 'IT2025002',
        email: 'jane.smith@example.com',
        password: 'Student@123',
        group: groups[1]._id,
        isActive: true
      },
      {
        name: 'Alice Johnson',
        rollNumber: 'EC2024003',
        email: 'alice.j@example.com',
        password: 'Student@123',
        group: groups[2]._id,
        isActive: false
      }
    ];

    students.push(...extraStudents);

    // insertMany does not run pre-save middleware, so hash manually here.
    const studentsWithHashedPasswords = await Promise.all(
      students.map(async (student) => ({
        ...student,
        password: await bcrypt.hash(student.password, 10)
      }))
    );

    const createdStudents = await Student.insertMany(studentsWithHashedPasswords);
    console.log(`✓ ${createdStudents.length} sample students created`);

    // Update group student counts
    for (const group of groups) {
      const count = await Student.countDocuments({ group: group._id });
      await Group.findByIdAndUpdate(group._id, { studentCount: count });
    }

    return createdStudents;
  } catch (error) {
    console.error('Error creating students:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('\n🌱 Starting database seeding...\n');

    // Connect to database
    await connectDB();

    // Clear existing data
    await clearDatabase();

    // Create default admin
    const admin = await createDefaultAdmin();

    // Create sample groups
    const groups = await createSampleGroups();

    // Create sample students
    const students = await createSampleStudents(groups, admin._id);

    // Log summary
    console.log('\n📊 Seeding Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Admin: 1 created`);
    console.log(`👥 Groups: ${groups.length} created`);
    console.log(`👨‍🎓 Students: ${students.length} created`);
    console.log('\n✅ Database seeded successfully!\n');

    // Display login credentials
    console.log('🔐 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
    console.log('\nSample Student:');
    console.log(`   Email: student1.btcomputerscience@example.com`);
    console.log(`   Password: Student@123`);
    console.log('\n');

    // Disconnect from database
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed function
seedDatabase();