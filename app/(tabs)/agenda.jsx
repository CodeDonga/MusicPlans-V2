import { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../../context/AlumnosContext';
import { useTema } from '../../context/TemaContext';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
const DIAS_LABEL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const COLOR_HOY = '#E5E7EB';

// Parsea DD/MM/YYYY o D/M/YYYY o con guiones
function parseFecha(str) {
  if (!str || typeof str !== 'string') return null;
  const parts = str.split(/[\/\-]/);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts.map(Number);
  if (isNaN(a) || isNaN(b) || isNaN(c)) return null;
  // Si el tercer valor es el año (4 dígitos): D/M/YYYY
  if (c > 999) return new Date(c, b - 1, a);
  // Si el primero es el año: YYYY/MM/DD (ISO-like)
  if (a > 999) return new Date(a, b - 1, c);
  return null;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

export default function Agenda() {
  const router = useRouter();
  const { alumnos, talleres, clases } = useAlumnos();
  const { tema, paleta } = useTema();

  const hoy = useMemo(() => new Date(), []);
  const [mes, setMes] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [diaSeleccionado, setDiaSeleccionado] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()));

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });

  const todasLasClases = useMemo(() => {
    const result = [];
    [...alumnos, ...talleres].forEach(entidad => {
      (clases[entidad.id] || []).forEach(clase => result.push({ ...clase, entidad }));
    });
    return result;
  }, [alumnos, talleres, clases]);

  const diasConClases = useMemo(() => {
    const set = new Set();
    todasLasClases.forEach(c => {
      const f = parseFecha(c.fecha);
      if (f && f.getMonth() === mes.getMonth() && f.getFullYear() === mes.getFullYear()) {
        set.add(f.getDate());
      }
    });
    return set;
  }, [todasLasClases, mes]);

  const clasesDelDia = useMemo(() => {
    return todasLasClases
      .filter(c => {
        const f = parseFecha(c.fecha);
        return f && isSameDay(f, diaSeleccionado);
      })
      .sort((a, b) => (a.hora || '').localeCompare(b.hora || ''));
  }, [todasLasClases, diaSeleccionado]);

  const progresoSemanal = useMemo(() => {
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
    lunes.setHours(0, 0, 0, 0);
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);
    const semana = todasLasClases.filter(c => {
      const f = parseFecha(c.fecha);
      return f && f >= lunes && f <= domingo;
    });
    if (!semana.length) return 0;
    return Math.round((semana.filter(c => c.estado === 'realizada').length / semana.length) * 100);
  }, [todasLasClases, hoy]);

  // Siempre 6 filas completas (42 celdas) para no dejar espacio vacío
  const calendarDays = useMemo(() => {
    const firstDay = new Date(mes.getFullYear(), mes.getMonth(), 1);
    const lastDay = new Date(mes.getFullYear(), mes.getMonth() + 1, 0);
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;
    const days = [];
    for (let i = startDow; i > 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i);
      days.push({ date: d, currentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(mes.getFullYear(), mes.getMonth(), i), currentMonth: true });
    }
    // Rellenar hasta 42 celdas (6 semanas)
    const total = 42;
    let next = 1;
    while (days.length < total) {
      days.push({ date: new Date(mes.getFullYear(), mes.getMonth() + 1, next++), currentMonth: false });
    }
    return days;
  }, [mes]);

  function getEstadoInfo(estado, clase) {
    const f = parseFecha(clase.fecha);
    const esHoy = f && isSameDay(f, hoy);
    if (esHoy && estado === 'pendiente') {
      const [h] = (clase.hora || '00:00').split(':').map(Number);
      if (hoy.getHours() === h) return { label: 'En Curso', color: paleta.secondary || '#d3bbff', tipo: 'en_curso' };
    }
    if (estado === 'realizada') return { label: 'Completada', color: paleta.primary, tipo: 'realizada' };
    if (estado === 'cancelada') return { label: 'Cancelada', color: paleta.alert || '#F87171', tipo: 'cancelada' };
    return { label: 'Pendiente', color: paleta.onSurfaceVariant, tipo: 'pendiente' };
  }

  if (!fontsLoaded) return null;
  const s = makeStyles(paleta);

  const diaLabel = `${DIAS_LABEL[diaSeleccionado.getDay()]} ${diaSeleccionado.getDate()}`;

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <View style={s.headerBrand}>
          <Text style={s.headerIcon}>🎵</Text>
          <Text style={s.headerLogo}>MusicPlans</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Calendario ── */}
        <View style={s.seccion}>
          <View style={s.mesHeader}>
            <View>
              <Text style={s.mesTitulo}>{MESES[mes.getMonth()]} {mes.getFullYear()}</Text>
              <Text style={s.mesSubtitulo}>{clasesDelDia.length} clase{clasesDelDia.length !== 1 ? 's' : ''} programadas para hoy</Text>
            </View>
            <View style={s.mesNav}>
              <TouchableOpacity style={s.navBtn} onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} activeOpacity={0.7}>
                <Text style={s.navBtnTexto}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.navBtn} onPress={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} activeOpacity={0.7}>
                <Text style={s.navBtnTexto}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.calPanel}>
            {/* Cabecera días semana */}
            <View style={s.calHeaderRow}>
              {DIAS_SEMANA.map(d => (
                <View key={d} style={s.calCell}>
                  <Text style={s.calDiaLabel}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Grid 6 filas × 7 columnas */}
            <View style={s.calGrid}>
              {calendarDays.map((item, idx) => {
                const esHoy = isSameDay(item.date, hoy);
                const esSeleccionado = isSameDay(item.date, diaSeleccionado);
                const tieneClases = item.currentMonth && diasConClases.has(item.date.getDate());

                return (
                  <TouchableOpacity
                    key={idx}
                    style={s.calCell}
                    onPress={() => item.currentMonth && setDiaSeleccionado(new Date(item.date.getFullYear(), item.date.getMonth(), item.date.getDate()))}
                    activeOpacity={item.currentMonth ? 0.7 : 1}
                  >
                    <View style={[
                      s.calDia,
                      tieneClases && !esSeleccionado && s.calDiaConClases,
                      esHoy && !esSeleccionado && s.calDiaHoy,
                      esSeleccionado && s.calDiaSeleccionado,
                    ]}>
                      <Text style={[
                        s.calDiaTexto,
                        !item.currentMonth && s.calDiaTextoOtroMes,
                        esHoy && !esSeleccionado && { color: COLOR_HOY, fontFamily: 'Inter_700Bold' },
                        esSeleccionado && s.calDiaTextoSeleccionado,
                      ]}>
                        {item.date.getDate()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Agenda del día ── */}
        <View style={s.seccion}>
          <View style={s.agendaHeaderRow}>
            <Text style={s.agendaTitulo}>Agenda: {diaLabel}</Text>
            {isSameDay(diaSeleccionado, hoy) && (
              <View style={s.tiempoRealBadge}>
                <Text style={s.tiempoRealTexto}>Tiempo Real</Text>
              </View>
            )}
          </View>

          {clasesDelDia.length === 0 ? (
            <View style={s.emptyAgenda}>
              <Text style={s.emptyAgendaTexto}>Sin clases este día</Text>
            </View>
          ) : (
            <View style={s.timeline}>
              <View style={s.timelineLinea} />
              {clasesDelDia.map((clase) => {
                const estadoInfo = getEstadoInfo(clase.estado || 'pendiente', clase);
                const esEnCurso = estadoInfo.tipo === 'en_curso';
                const esRealizada = estadoInfo.tipo === 'realizada';
                const emoji = clase.entidad?.avatar || '🎵';

                return (
                  <TouchableOpacity
                    key={clase.id}
                    style={s.timelineItem}
                    onPress={() => router.push({ pathname: '/perfil', params: { id: clase.entidad.id, tipo: clase.entidad.tipo } })}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      s.timelineIcono,
                      esEnCurso && { backgroundColor: paleta.secondary || '#592da2', borderColor: paleta.secondary || '#592da2' },
                      esRealizada && { backgroundColor: paleta.primary, borderColor: paleta.primary },
                    ]}>
                      <Text style={s.timelineEmoji}>{emoji}</Text>
                    </View>

                    <View style={[
                      s.timelineTarjeta,
                      esRealizada && { borderLeftColor: paleta.primary, opacity: 0.85 },
                      esEnCurso && {
                        borderLeftColor: paleta.primary,
                        borderColor: paleta.primary + '30',
                        shadowColor: paleta.primary,
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 4,
                      },
                    ]}>
                      {esEnCurso && <View style={s.pulseDot} />}
                      <View style={s.timelineRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.timelineNombre, esEnCurso && { color: paleta.primary }]}>
                            {clase.entidad?.nombre}
                          </Text>
                          <View style={s.timelineInfoRow}>
                            <Text style={s.timelineHora}>🕐 {clase.hora}hs</Text>
                            <View style={[s.estadoBadge, { borderColor: estadoInfo.color + '50' }]}>
                              <Text style={[s.estadoBadgeTexto, { color: estadoInfo.color }]}>
                                {estadoInfo.label}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={s.timelineFlecha}>›</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Stats ── */}
        <View style={s.seccion}>
          <View style={s.statsGrid}>
            <View style={s.statProgreso}>
              <Text style={s.statLabel}>Progreso Semanal</Text>
              <Text style={s.statNumero}>{progresoSemanal}%</Text>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${progresoSemanal}%` }]} />
              </View>
            </View>
            <View style={s.statsAcciones}>
              <TouchableOpacity style={s.accionBtn} onPress={() => router.push('/(tabs)')} activeOpacity={0.8}>
                <Text style={s.accionEmoji}>＋</Text>
                <Text style={s.accionTexto}>Nueva Clase</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.accionBtn, { borderColor: (paleta.secondary || '#592da2') + '50' }]} onPress={() => router.push('/finanzas')} activeOpacity={0.8}>
                <Text style={s.accionEmoji}>📊</Text>
                <Text style={[s.accionTexto, { color: paleta.secondary || '#d3bbff' }]}>Reporte</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  const CYAN_GLOW = p.primary;

  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 16, paddingTop: 8 },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: p.headerBg,
      borderBottomWidth: 1, borderBottomColor: p.outlineVariant,
    },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { fontSize: 22 },
    headerLogo: { color: p.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },

    seccion: { marginTop: 24 },

    mesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    mesTitulo: { color: p.onSurface, fontSize: 26, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    mesSubtitulo: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
    mesNav: { flexDirection: 'row', gap: 8 },
    navBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: p.bgCard, borderWidth: 1, borderColor: p.outlineVariant,
      alignItems: 'center', justifyContent: 'center',
    },
    navBtnTexto: { color: p.onSurface, fontSize: 22, lineHeight: 26 },

    calPanel: {
      backgroundColor: p.bgCard, borderRadius: 16,
      paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12,
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    calHeaderRow: { flexDirection: 'row', marginBottom: 8 },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    calCell: { width: '14.2857%', alignItems: 'center', marginBottom: 4 },
    calDiaLabel: {
      color: p.onSurfaceVariant, fontSize: 9,
      fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5,
    },

    calDia: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    // Día con clases: borde cyan brillante
    calDiaConClases: {
      borderWidth: 1,
      borderColor: CYAN_GLOW + '55',
      shadowColor: CYAN_GLOW,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
      elevation: 3,
    },
    // Hoy: sin relleno, texto #E5E7EB y borde más visible
    calDiaHoy: {
      borderWidth: 1.5,
      borderColor: COLOR_HOY + '80',
    },
    // Seleccionado: relleno primario
    calDiaSeleccionado: {
      backgroundColor: p.primary,
      shadowColor: p.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },

    calDiaTexto: { color: p.onSurface, fontSize: 13, fontFamily: 'Inter_500Medium' },
    calDiaTextoOtroMes: { color: p.onSurfaceVariant, opacity: 0.3 },
    calDiaTextoSeleccionado: { color: p.bg, fontFamily: 'Inter_800ExtraBold' },

    // Agenda
    agendaHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    agendaTitulo: { color: p.onSurface, fontSize: 20, fontFamily: 'Inter_700Bold' },
    tiempoRealBadge: {
      backgroundColor: p.primary + '20', borderRadius: 99,
      paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: p.primary + '40',
    },
    tiempoRealTexto: { color: p.primary, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1 },

    emptyAgenda: { alignItems: 'center', paddingVertical: 32 },
    emptyAgendaTexto: { color: p.onSurfaceVariant, fontSize: 14, fontFamily: 'Inter_400Regular' },

    // Timeline
    timeline: { paddingLeft: 52 },
    timelineLinea: {
      position: 'absolute', left: 19, top: 20, bottom: 20,
      width: 2, backgroundColor: p.outlineVariant,
    },
    timelineItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
    timelineIcono: {
      position: 'absolute', left: -52,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: p.bgCard, borderWidth: 1.5, borderColor: p.outlineVariant,
      alignItems: 'center', justifyContent: 'center',
      zIndex: 1,
    },
    timelineEmoji: { fontSize: 18 },

    timelineTarjeta: {
      flex: 1, backgroundColor: p.bgCard,
      borderRadius: 12, padding: 14,
      borderLeftWidth: 3, borderLeftColor: p.outlineVariant,
      borderWidth: 1, borderColor: p.outlineVariant,
    },
    pulseDot: {
      position: 'absolute', top: 10, right: 10,
      width: 8, height: 8, borderRadius: 4, backgroundColor: p.primary,
    },
    timelineRow: { flexDirection: 'row', alignItems: 'center' },
    timelineNombre: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
    timelineInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    timelineHora: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular' },
    estadoBadge: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
    estadoBadgeTexto: { fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 },
    timelineFlecha: { color: p.onSurfaceVariant, fontSize: 18, marginLeft: 8 },

    // Stats
    statsGrid: { flexDirection: 'row', gap: 12 },
    statProgreso: {
      flex: 2, backgroundColor: p.bgCard,
      borderRadius: 16, padding: 20,
      borderWidth: 1, borderColor: p.primaryBorder || p.outlineVariant,
    },
    statLabel: { color: p.primary, fontSize: 9, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 },
    statNumero: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },
    progressBar: { height: 6, backgroundColor: p.outlineVariant, borderRadius: 99, marginTop: 8, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: p.primary, borderRadius: 99 },

    statsAcciones: { flex: 1, gap: 12 },
    accionBtn: {
      flex: 1, backgroundColor: p.bgCard,
      borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant,
      alignItems: 'center', justifyContent: 'center', padding: 12,
    },
    accionEmoji: { fontSize: 22, marginBottom: 4 },
    accionTexto: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  });
}
