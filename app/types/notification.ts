import type { NotificationTemplate } from '~/types/notification-template';

export interface Notification {
  id: number;
  notification_date: string;
  notification_time: string;
  notification_template_id: number;
  notification_template?: NotificationTemplate;
  created_at?: string;
  updated_at?: string;
}
