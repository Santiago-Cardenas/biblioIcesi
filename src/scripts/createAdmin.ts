import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { UserModel, UserRole } from '../models';

async function createInitialAdmin() {
    try {
        process.loadEnvFile();
        const connectionString = process.env.MONGO_URL || "";
        await mongoose.connect(connectionString);
        
        const adminExists = await UserModel.findOne({ email: 'admin@biblioicesi.com' });
        
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await UserModel.create({
                name: 'Admin',
                email: 'admin@biblioicesi.com',
                password: hashedPassword,
                role: UserRole.ADMIN
            });
            
            console.log('Admin user created successfully');
            console.log('Email: admin@biblioicesi.com');
            console.log('Password: admin123');
        } else {
            console.log('Admin user already exists');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createInitialAdmin();