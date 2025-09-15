import 'dotenv/config';
import bcrypt from 'bcrypt';
import { connectDB } from '../src/config/database';
import { UserModel, UserRole } from '../src/models/user.model';
import { CategoryModel } from '../src/models/category.model';

// Define permissions
const PERMISSIONS = [
  { code: 'users.create', name: 'Create Users', description: 'Create new users' },
  { code: 'users.read', name: 'Read Users', description: 'View user information' },
  { code: 'users.update', name: 'Update Users', description: 'Update user information' },
  { code: 'users.delete', name: 'Delete Users', description: 'Delete users' },
  { code: 'books.create', name: 'Create Books', description: 'Add new books to catalog' },
  { code: 'books.read', name: 'Read Books', description: 'View book information' },
  { code: 'books.update', name: 'Update Books', description: 'Update book information' },
  { code: 'books.delete', name: 'Delete Books', description: 'Remove books from catalog' },
  { code: 'loans.create', name: 'Create Loans', description: 'Create new loans' },
  { code: 'loans.read', name: 'Read Loans', description: 'View loan information' },
  { code: 'loans.update', name: 'Update Loans', description: 'Update loan status' },
  { code: 'loans.delete', name: 'Delete Loans', description: 'Delete loan records' },
  { code: 'reports.read', name: 'Read Reports', description: 'Access reports and analytics' },
  { code: 'admin.access', name: 'Admin Access', description: 'Full administrative access' }
];

// Define roles
const ROLES = [
  {
    code: 'admin',
    name: 'Administrator',
    description: 'Full system access',
    permissions: PERMISSIONS.map(p => p.code)
  },
  {
    code: 'user',
    name: 'Regular User',
    description: 'Basic user access',
    permissions: ['books.read', 'loans.create', 'loans.read']
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Create permissions collection and seed
    const permissionsCollection = UserModel.db.collection('permissions');
    console.log('📝 Seeding permissions...');
    
    for (const permission of PERMISSIONS) {
      await permissionsCollection.updateOne(
        { code: permission.code },
        { 
          $set: { 
            ...permission, 
            createdAt: new Date(), 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
    }
    console.log(`✅ ${PERMISSIONS.length} permissions seeded`);

    // Create roles collection and seed
    const rolesCollection = UserModel.db.collection('roles');
    console.log('👥 Seeding roles...');
    
    for (const role of ROLES) {
      await rolesCollection.updateOne(
        { code: role.code },
        { 
          $set: { 
            ...role, 
            createdAt: new Date(), 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
    }
    console.log(`✅ ${ROLES.length} roles seeded`);

    // Create user roles collection
    const userRolesCollection = UserModel.db.collection('userroles');
    console.log('🔗 Setting up user roles...');

    // Create categories
    console.log('📚 Seeding categories...');
    const categories = [
      { name: 'Fiction', description: 'Fiction books' },
      { name: 'Non-Fiction', description: 'Non-fiction books' },
      { name: 'Science', description: 'Science and technology' },
      { name: 'History', description: 'Historical books' },
      { name: 'Literature', description: 'Classic literature' }
    ];

    for (const category of categories) {
      await CategoryModel.updateOne(
        { name: category.name },
        { 
          $set: { 
            ...category, 
            createdAt: new Date(), 
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
    }
    console.log(`✅ ${categories.length} categories seeded`);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminEmail = 'admin@biblioicesi.edu';
    const adminPassword = 'admin123';
    
    // Check if admin user exists
    let adminUser = await UserModel.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Hash password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      // Create admin user
      adminUser = await UserModel.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.ADMIN
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Assign admin role to admin user
    const adminRole = await rolesCollection.findOne({ code: 'admin' });
    if (adminRole) {
      await userRolesCollection.updateOne(
        { userId: adminUser._id, roleId: adminRole._id },
        { 
          $set: { 
            userId: adminUser._id, 
            roleId: adminRole._id,
            assignedAt: new Date()
          } 
        },
        { upsert: true }
      );
      console.log('✅ Admin role assigned to admin user');
    }

    // Create role permissions
    console.log('🔐 Setting up role permissions...');
    const rolePermissionsCollection = UserModel.db.collection('rolepermissions');
    
    for (const role of ROLES) {
      const roleDoc = await rolesCollection.findOne({ code: role.code });
      if (roleDoc) {
        for (const permissionCode of role.permissions) {
          const permissionDoc = await permissionsCollection.findOne({ code: permissionCode });
          if (permissionDoc) {
            await rolePermissionsCollection.updateOne(
              { roleId: roleDoc._id, permissionId: permissionDoc._id },
              { 
                $set: { 
                  roleId: roleDoc._id, 
                  permissionId: permissionDoc._id,
                  assignedAt: new Date()
                } 
              },
              { upsert: true }
            );
          }
        }
      }
    }
    console.log('✅ Role permissions configured');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📧 Admin credentials: ${adminEmail} / ${adminPassword}`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };