import { useCallback, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

export type AppNotification = {
  id: string;
  message: string;
  type: 'confirmed' | 'cancelled' | 'waitlist_filled';
  read: boolean;
  created_at: string;
};

export async function registerPushToken(staffId: string) {
  // Best effort: push registration must never crash the app. app.json currently
  // ships a placeholder `extra.eas.projectId` until `eas build:configure` runs,
  // which can make getExpoPushTokenAsync() throw. Permissions can also be
  // denied by the user. Either case should just leave push notifications off.
  try {
    if (!Device.isDevice) return;
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    await supabase.from('staff').update({ expo_push_token: token }).eq('id', staffId);
  } catch (error) {
    console.warn('registerPushToken failed, continuing without push notifications:', error);
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, message, type, read, created_at')
      .order('created_at', { ascending: false });
    if (!error && data) setNotifications(data as AppNotification[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return { notifications, loading, markRead };
}
