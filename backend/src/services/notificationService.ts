import { Notification, NotificationType, type INotification } from '../models/index.js';

class NotificationService {
  /**
   * Create a notification
   */
  async create(data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    data?: Record<string, unknown>;
  }): Promise<INotification> {
    const notification = await Notification.create({
      user: data.userId,
      title: data.title,
      body: data.body,
      type: data.type,
      data: data.data,
    });

    // TODO: Send push notification via Firebase FCM
    // await this.sendPush(data.userId, data.title, data.body);

    return notification;
  }

  /**
   * Get user notifications (paginated)
   */
  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const total = await Notification.countDocuments({ user: userId });
    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await Notification.findByIdAndUpdate(notificationId, { isRead: true });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }
}

export const notificationService = new NotificationService();
