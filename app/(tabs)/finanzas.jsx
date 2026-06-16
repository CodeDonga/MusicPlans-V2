import { useState, useRef, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../../context/AlumnosContext';
import { useTema } from '../../context/TemaContext';
import { parseFecha } from '../../lib/fechas';
import { valorPorDefecto, montoDeClase } from '../../lib/montos';

export default function Finanzas() {
  const router = useRouter();
  const { alumnos, talleres, clases, pagosHistoricos } = useAlumnos();
  const { tema, paleta } = useTema();
  const [mes, setMes] = useState(new Date());

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, { dx, dy }) => Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 5,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderRelease: (_, { dx, dy }) => {
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
          if (dx > 0) setMes(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
          else setMes(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
        }
      },
    })
  ).current;

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const s = useMemo(() => makeStyles(paleta), [paleta]);

  if (!fontsLoaded) return null;

  const mesLabel = mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const irMesAnterior = () => setMes(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  const irMesSiguiente = () => setMes(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));

  function esDelMes(clase) {
    const fecha = parseFecha(clase.fecha);
    if (!fecha) return false;
    return fecha.getMonth() === mes.getMonth() && fecha.getFullYear() === mes.getFullYear();
  }

  function formatCLP(n) {
    return '$' + Math.round(n).toLocaleString('es-CL');
  }

  const resumen = [...alumnos, ...talleres].map(entidad => {
    const clasesEntidad = (clases[entidad.id] || []).filter(esDelMes);
    const valor = valorPorDefecto(entidad);
    const clasesRealizadas = clasesEntidad.filter(c => c.estado === 'realizada');
    const pendientes = clasesEntidad.filter(c => c.estado === 'pendiente').length;
    const realizadas = clasesRealizadas.length;
    const pagadas = clasesRealizadas.filter(c => c.pagada).length;
    // BUG-43: mismo cálculo de monto que el cobro (lib/montos), para que Finanzas y
    // el mensaje de WhatsApp nunca difieran. Usa el valor_unitario histórico por clase.
    const ingresoGenerado = clasesRealizadas.reduce((acc, c) => acc + montoDeClase(c, entidad), 0);
    const ingresoCobrado = clasesRealizadas.filter(c => c.pagada).reduce((acc, c) => acc + montoDeClase(c, entidad), 0);
    const ingresoPorCobrar = ingresoGenerado - ingresoCobrado;
    return { entidad, realizadas, pendientes, pagadas, ingresoGenerado, ingresoCobrado, ingresoPorCobrar, valor, eliminado: false };
  }).filter(r => r.realizadas > 0 || r.pendientes > 0);

  const historico = pagosHistoricos.map(h => {
    const clasesPagadas = h.clases.filter(esDelMes).filter(c => c.pagada);
    const pagadas = clasesPagadas.length;
    const ingresoCobrado = pagadas * h.valorUnitario;
    return { nombre: h.nombre, valorUnitario: h.valorUnitario, pagadas, ingresoCobrado, eliminado: true, clases: clasesPagadas };
  }).filter(h => h.pagadas > 0);

  const ingresoHistorico = historico.reduce((acc, h) => acc + h.ingresoCobrado, 0);
  const totalGenerado = resumen.reduce((acc, r) => acc + r.ingresoGenerado, 0) + ingresoHistorico;
  const totalCobrado = resumen.reduce((acc, r) => acc + r.ingresoCobrado, 0) + ingresoHistorico;
  const totalPorCobrar = resumen.reduce((acc, r) => acc + r.ingresoPorCobrar, 0);

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <View style={s.headerBrand}>
          <Text style={s.headerIcon}>🎵</Text>
          <Text style={s.headerLogo}>MusicPlans</Text>
        </View>
      </View>

      {/* Zona swipeable: título + selector de mes + resumen — fuera del FlatList para evitar conflicto de responder */}
      <View style={s.swipeZone} {...panResponder.panHandlers}>
        <View style={s.seccionTituloContainer}>
          <Text style={s.seccionLabel}>Resumen mensual</Text>
          <Text style={s.seccionTitulo}>Finanzas</Text>
        </View>

        <View style={s.mesSelector}>
          <TouchableOpacity onPress={irMesAnterior} style={s.mesBtnArrow} hitSlop={{ top: 10, bottom: 10 }}>
            <Text style={s.mesBtnArrowTexto}>‹</Text>
          </TouchableOpacity>
          <Text style={s.mesLabel}>{mesLabel}</Text>
          <TouchableOpacity onPress={irMesSiguiente} style={s.mesBtnArrow} hitSlop={{ top: 10, bottom: 10 }}>
            <Text style={s.mesBtnArrowTexto}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.resumenCard}>
          <Text style={s.resumenLabel}>Total generado</Text>
          <Text style={s.resumenTotal}>{formatCLP(totalGenerado)}</Text>
          {totalCobrado > 0 ? (
            <View style={s.resumenRow}>
              <View style={s.resumenItem}>
                <Text style={s.resumenItemLabel}>Cobrado</Text>
                <Text style={[s.resumenItemValor, { color: paleta.success }]}>{formatCLP(totalCobrado)}</Text>
              </View>
              {totalPorCobrar > 0 && (
                <>
                  <View style={s.resumenDivisor} />
                  <View style={s.resumenItem}>
                    <Text style={s.resumenItemLabel}>Por cobrar</Text>
                    <Text style={[s.resumenItemValor, { color: paleta.alert }]}>{formatCLP(totalPorCobrar)}</Text>
                  </View>
                </>
              )}
            </View>
          ) : totalPorCobrar > 0 ? (
            <View style={s.resumenRow}>
              <View style={s.resumenItem}>
                <Text style={s.resumenItemLabel}>Por cobrar</Text>
                <Text style={[s.resumenItemValor, { color: paleta.alert }]}>{formatCLP(totalPorCobrar)}</Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      {/* Lista scrollable: sólo los items */}
      <FlatList
        data={resumen}
        keyExtractor={item => item.entidad.id}
        contentContainerStyle={s.lista}
        ListHeaderComponent={resumen.length > 0 ? (
          <Text style={s.seccionLabel2}>Detalle por alumno / taller</Text>
        ) : null}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>💰</Text>
            <Text style={s.emptyTitulo}>Sin actividad este mes</Text>
            <Text style={s.emptySubtitulo}>No hay clases registradas en {mesLabel}</Text>
          </View>
        }
        ListFooterComponent={historico.length > 0 ? (
          <View>
            <Text style={[s.seccionLabel2, { marginTop: 8 }]}>Pagos históricos</Text>
            {historico.map((h, i) => (
              <View key={i} style={[s.tarjeta, s.tarjetaEliminada]}>
                <View style={s.tarjetaTop}>
                  <Text style={s.tarjetaEmoji}>🗑️</Text>
                  <View style={s.tarjetaInfo}>
                    <Text style={s.tarjetaNombre}>{h.nombre}</Text>
                    <Text style={s.tarjetaSubtitulo}>{formatCLP(h.valorUnitario)} / clase · eliminado</Text>
                  </View>
                  <Text style={[s.tarjetaTotal, { color: paleta.success }]}>{formatCLP(h.ingresoCobrado)}</Text>
                </View>
                <View style={s.tarjetaStats}>
                  <View style={s.statItem}>
                    <Text style={[s.statValor, { color: paleta.success }]}>{h.pagadas}</Text>
                    <Text style={s.statLabel}>Pagadas</Text>
                  </View>
                </View>
                {h.clases.length > 0 && (
                  <View style={s.historicoDetalle}>
                    {h.clases.map(c => (
                      <Text key={c.id} style={s.historicoClaseTexto}>
                        {c.fecha} · {c.hora}hs
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : null}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.tarjeta}
            onPress={() => router.push({ pathname: '/perfil', params: { id: item.entidad.id, tipo: item.entidad.tipo } })}
            activeOpacity={0.75}
          >
            <View style={s.tarjetaTop}>
              <Text style={s.tarjetaEmoji}>{item.entidad.avatar || '🎵'}</Text>
              <View style={s.tarjetaInfo}>
                <Text style={s.tarjetaNombre}>{item.entidad.nombre}</Text>
                <Text style={s.tarjetaSubtitulo}>{formatCLP(item.valor)} / clase</Text>
              </View>
              <View style={s.tarjetaTotalWrap}>
                {item.ingresoCobrado > 0 && (
                  <Text style={[s.tarjetaTotal, { color: paleta.success }]}>{formatCLP(item.ingresoCobrado)}</Text>
                )}
                {item.ingresoPorCobrar > 0 && (
                  <Text style={[s.tarjetaTotal, { color: paleta.alert }]}>{formatCLP(item.ingresoPorCobrar)}</Text>
                )}
                {item.ingresoCobrado === 0 && item.ingresoPorCobrar === 0 && (
                  <Text style={[s.tarjetaTotal, { color: paleta.onSurfaceVariant }]}>{formatCLP(item.ingresoGenerado)}</Text>
                )}
              </View>
            </View>
            <View style={s.tarjetaStats}>
              <View style={s.statItem}>
                <Text style={s.statValor}>{item.realizadas}</Text>
                <Text style={s.statLabel}>Realizadas</Text>
              </View>
              <View style={s.statItem}>
                <Text style={[s.statValor, { color: paleta.warning }]}>{item.pendientes}</Text>
                <Text style={s.statLabel}>Pendientes</Text>
              </View>
              <View style={s.statItem}>
                <Text style={[s.statValor, { color: item.pagadas > 0 ? paleta.success : paleta.onSurfaceVariant }]}>{item.pagadas}</Text>
                <Text style={s.statLabel}>Pagadas</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: p.headerBg, borderBottomWidth: 1, borderBottomColor: p.outlineVariant },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { fontSize: 22 },
    headerLogo: { color: p.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },
    swipeZone: { paddingHorizontal: 16 },
    seccionTituloContainer: { paddingTop: 20, paddingBottom: 8 },
    seccionLabel: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    seccionTitulo: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },
    lista: { paddingHorizontal: 16, paddingBottom: 120 },

    mesSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, backgroundColor: p.bgCard, borderRadius: 14, borderWidth: 1, borderColor: p.outlineVariant, paddingVertical: 4 },
    mesBtnArrow: { paddingHorizontal: 20, paddingVertical: 10 },
    mesBtnArrowTexto: { color: p.primary, fontSize: 24, fontFamily: 'Inter_700Bold' },
    mesLabel: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_700Bold', textTransform: 'capitalize' },

    resumenCard: {
      backgroundColor: p.primaryMid, borderRadius: 20, padding: 20,
      marginBottom: 24, borderWidth: 1, borderColor: p.primaryBorder,
      shadowColor: p.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6,
    },
    resumenLabel: { color: p.onSurface, fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase', letterSpacing: 1, opacity: 0.8, marginBottom: 8 },
    resumenTotal: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1, marginBottom: 16 },
    resumenRow: { flexDirection: 'row' },
    resumenItem: { flex: 1, alignItems: 'center' },
    resumenItemLabel: { color: p.onSurface, fontSize: 11, fontFamily: 'Inter_400Regular', opacity: 0.7, marginBottom: 4 },
    resumenItemValor: { fontSize: 18, fontFamily: 'Inter_700Bold' },
    resumenDivisor: { width: 1, backgroundColor: p.primaryBorder, marginHorizontal: 16 },

    seccionLabel2: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 4 },

    tarjeta: { backgroundColor: p.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: p.outlineVariant },
    tarjetaEliminada: { opacity: 0.7, borderStyle: 'dashed' },
    tarjetaTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    tarjetaEmoji: { fontSize: 28 },
    tarjetaInfo: { flex: 1 },
    tarjetaNombre: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
    tarjetaSubtitulo: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular' },
    tarjetaTotalWrap: { alignItems: 'flex-end' },
    tarjetaTotal: { fontSize: 17, fontFamily: 'Inter_800ExtraBold' },
    tarjetaPorCobrar: { color: p.alert, fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },

    tarjetaStats: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: p.outlineVariant },
    statItem: { flex: 1, alignItems: 'center' },
    statValor: { color: p.onSurface, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
    statLabel: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_500Medium' },

    historicoDetalle: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: p.outlineVariant, gap: 4 },
    historicoClaseTexto: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular' },

    emptyContainer: { alignItems: 'center', marginTop: 40 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitulo: { color: p.onSurface, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6 },
    emptySubtitulo: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  });
}
