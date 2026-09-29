import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';
import { Incident } from '../src/models/Incident.js';
import { Action } from '../src/models/Action.js';
import 'dotenv/config';

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing
    await User.deleteMany({});
    await Organization.deleteMany({});
    await Incident.deleteMany({});
    await Action.deleteMany({});
    console.log('Cleared existing data');

    // Create Demo Org
    const org = await Organization.create({
      name: 'Demo Corp',
      sites: [{ name: 'HQ' }, { name: 'Warehouse A' }, { name: 'Construction Site B' }]
    });

    // Create Users for each role
    const roles = ['reporter', 'safety_officer', 'manager', 'admin'];
    const users = {};
    
    for (const role of roles) {
      const passwordHash = await User.hashPassword('password123');
      const user = await User.create({
        name: `Demo ${role}`,
        email: `${role}@demo.com`,
        passwordHash,
        role,
        orgId: org._id
      });
      users[role] = user;
      console.log(`Created user: ${role}@demo.com (pw: password123)`);
    }

    // Generate Incidents
    const types = ['injury', 'near_miss', 'hazard'];
    const severities = ['low', 'medium', 'high', 'critical'];
    const statuses = ['reported', 'investigating', 'action_pending', 'closed'];
    const titles = ['Slipped on wet floor', 'Exposed wiring', 'Forklift near miss', 'Missing safety guard', 'Chemical spill', 'Fallen debris', 'Fire alarm failure', 'Minor cut', 'Blocked exit', 'Tripped on carpet'];
    
    console.log('Generating 30 mock incidents and actions...');
    for (let i = 0; i < 30; i++) {
      const randomSite = org.sites[Math.floor(Math.random() * org.sites.length)].name;
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const title = titles[Math.floor(Math.random() * titles.length)];
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));

      const incident = await Incident.create({
        title: `${title} - ${i + 1}`,
        description: `Detailed description for ${title}. This happened at ${randomSite}.`,
        type,
        severity,
        siteId: randomSite,
        reportedBy: users.reporter._id,
        orgId: org._id,
        status,
        createdAt: pastDate,
        updatedAt: pastDate
      });

      // If action_pending, create an overdue action to populate that card
      if (status === 'action_pending') {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - (Math.floor(Math.random() * 5) + 1)); // Past due!
        
        await Action.create({
          incidentId: incident._id,
          orgId: org._id,
          description: `Fix ${title} immediately`,
          assignedTo: users.safety_officer._id,
          dueDate,
          status: 'overdue',
          createdBy: users.admin._id
        });
      }
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
