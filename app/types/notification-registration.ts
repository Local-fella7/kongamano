import type { Notification } from '~/types/notification';
import type { Registration } from '~/types/registration';

export interface NotificationRegistration {
  id: number;
  notification_id: number;
  registration_id: number;
  notification?: Notification;
  registration?: Registration;
  created_at?: string;
  updated_at?: string;
}
