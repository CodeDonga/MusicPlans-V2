// ARQ-14: logging estructurado. Único punto que decide dev vs producción.
// En dev: a consola. En producción: persiste en la tabla error_logs (Supabase)
// para diagnóstico remoto. El logging nunca debe romper el flujo que lo invoca.
import { Platform } from 'react-native';
import { supabase } from './supabase';

async function emitir(nivel, scope, mensaje, extra) {
  const texto = mensaje?.message ?? String(mensaje ?? '');

  if (__DEV__) {
    const fn = nivel === 'error' ? console.error : console.warn;
    fn(`[${scope}] ${texto}`, extra ?? '');
    return;
  }

  try {
    await supabase.from('error_logs').insert({
      nivel,
      scope,
      mensaje: texto,
      extra: extra ? JSON.stringify(extra) : null,
      plataforma: Platform.OS,
    });
  } catch {
    // Si el propio logging falla, no hay nada más que hacer: no propagar.
  }
}

// Fire-and-forget por diseño: los call sites no necesitan await.
export function logWarn(scope, mensaje, extra) {
  emitir('warn', scope, mensaje, extra);
}

export function logError(scope, mensaje, extra) {
  emitir('error', scope, mensaje, extra);
}
