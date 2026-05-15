import { User, Role } from '../models/index.js';
import { createError } from '../middleware/error.js';

class UserService {
  async getAll(filters: { department?: string; role?: Role; search?: string; page?: number; limit?: number }) {
    const { department, role, search, page = 1, limit = 20 } = filters;
    const query: Record<string, unknown> = {};
    if (department) query.department = department;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getById(userId: string) {
    const user = await User.findById(userId);
    if (!user) throw createError(404, 'User not found');
    return user;
  }

  async update(userId: string, data: Record<string, unknown>) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw createError(404, 'User not found');
    return user;
  }

  async delete(userId: string) {
    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });
    if (!user) throw createError(404, 'User not found');
    return user;
  }
}

export const userService = new UserService();
