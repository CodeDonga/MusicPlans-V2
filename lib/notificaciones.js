import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseFecha } from './fechas';
import { logWarn } from './log';

export function configurarNotificaciones() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function solicitarPermisos() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('clases', {
        name: 'Clases MusicPlans',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

function parsearFechaHora(fecha, hora) {
  const fechaBase = parseFecha(fecha);
  if (!fechaBase || !hora) return null;
  const [hh, mm] = hora.split(':').map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;
  fechaBase.setHours(hh, mm, 0, 0);
  return fechaBase;
}

export async function programarNotificacion(claseId, entidadNombre, fecha, hora) {
  try {
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
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fechaNotif,
        ...(Platform.OS === 'android' && { channelId: 'clases' }),
      },
    });
  } catch (e) {
    // ARQ-16: no romper el flujo si falla la programación, pero dejar rastro
    logWarn('notif', 'no se pudo programar la notificación', { error: e?.message, claseId });
  }
}

export async function cancelarNotificacion(claseId) {
  try {
    await Notifications.cancelScheduledNotificationAsync(claseId);
  } catch (e) {
    // ARQ-16: cancelar una notificación inexistente es benigno; solo se registra
    logWarn('notif', 'no se pudo cancelar la notificación', { error: e?.message, claseId });
  }
}
