import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export function configurarNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function solicitarPermisos() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('clases', {
      name: 'Clases MusicPlans',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

function parsearFechaHora(fecha, hora) {
  if (!fecha || !hora) return null;
  const partes = fecha.split(/[\/\-]/);
  if (partes.length !== 3) return null;
  const [a, b, c] = partes.map(Number);
  const [dia, mes, anio] = a > 31 ? [c, b, a] : [a, b, c];
  const [hh, mm] = hora.split(':').map(Number);
  return new Date(anio, mes - 1, dia, hh, mm, 0);
}

export async function programarNotificacion(claseId, entidadNombre, fecha, hora) {
  const fechaClase = parsearFechaHora(fecha, hora);
  if (!fechaClase) return;

  const fechaNotif = new Date(fechaClase.getTime() - 60 * 60 * 1000);
  if (fechaNotif <= new Date()) return;

  await cancelarNotificacion(claseId);

  await Notifications.scheduleNotificationAsync({
    identifier: claseId,
    content: {
      title: '🎵 Clase en 1 hora',
      body: `Tienes clase con ${entidadNombre} a las ${hora}hs`,
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'clases' }),
    },
    trigger: { date: fechaNotif },
  });
}

export async function cancelarNotificacion(claseId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(claseId);
  } catch (_) {}
}
