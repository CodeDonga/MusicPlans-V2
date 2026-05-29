import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../context/AlumnosContext';
import { useTema } from '../context/TemaContext';

export default function Finanzas() {
  const router = useRouter();
  const { alumnos, talleres, clases } = useAlumnos();
  const { tema, paleta } = useTema();

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  if (!fontsLoaded) return null;

  const s = makeStyles(paleta);

  const resumen = [...alumnos, ...talleres].map(entidad => {
    const clasesEntidad = clases[entidad.id] || [];
    const valor = entidad.tipo === 'taller'
      ? (entidad.valorPorAlumno || 0) * (entidad.participantes?.length || 1)
      : (entidad.valorClase || 0);
    const realizadas = clasesEntidad.filter(c => c.estado === 'realizada').length;
    const pendientes = clasesEntidad.filter(c => c.estado === 'pendiente').length;
    const pagadas = clasesEntidad.filter(c => c.pagada).length;
    const ingresoTotal = realizadas * valor;
    const ingresoPagado = pagadas * valor;
    const ingresoPendiente = ingresoTotal - ingresoPagado;
    return { entidad, realizadas, pendientes, pagadas, ingresoTotal, ingresoPendiente, valor };
  });

  const totalMes = resumen.reduce((acc, r) => acc + r.ingresoTotal, 0);
  const totalPendiente = resumen.reduce((acc, r) => acc + r.ingresoPendiente, 0);

  function formatCLP(n) {
    return '$' + n.toLocaleString('es-CL');
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn}>
          <Text style={s.headerBtnTexto}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Finanzas</Text>
        <View style={s.headerBtn} />
      </View>

      <FlatList
        data={resumen}
        keyExtractor={item => item.entidad.id}
        contentContainerStyle={s.lista}
        ListHeaderComponent={
          <View>
            {/* Resumen del mes */}
            <View style={s.resumenCard}>
              <Text style={s.resumenLabel}>Ingresos del mes</Text>
              <Text style={s.resumenTotal}>{formatCLP(totalMes)}</Text>
              <View style={s.resumenRow}>
                <View style={s.resumenItem}>
                  <Text style={s.resumenItemLabel}>Cobrado</Text>
                  <Text style={[s.resumenItemValor, { color: paleta.success }]}>{formatCLP(totalMes - totalPendiente)}</Text>
                </View>
                <View style={s.resumenDivisor} />
                <View style={s.resumenItem}>
                  <Text style={s.resumenItemLabel}>Por cobrar</Text>
                  <Text style={[s.resumenItemValor, { color: paleta.alert }]}>{formatCLP(totalPendiente)}</Text>
                </View>
              </View>
            </View>

            <Text style={s.seccionLabel}>Por alumno</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>💰</Text>
            <Text style={s.emptyTitulo}>Sin datos aún</Text>
            <Text style={s.emptySubtitulo}>Agrega alumnos y registra clases para ver el resumen</Text>
          </View>
        }
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
                <Text style={s.tarjetaInstrumento}>{formatCLP(item.valor)} / clase</Text>
              </View>
              <Text style={[s.tarjetaTotal, { color: item.ingresoTotal > 0 ? paleta.success : paleta.onSurfaceVariant }]}>
                {formatCLP(item.ingresoTotal)}
              </Text>
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
                <Text style={[s.statValor, { color: paleta.alert }]}>{formatCLP(item.ingresoPendiente)}</Text>
                <Text style={s.statLabel}>Por cobrar</Text>
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.outlineVariant, backgroundColor: p.headerBg },
    headerBtn: { width: 40, justifyContent: 'center' },
    headerBtnTexto: { color: p.onSurface, fontSize: 22 },
    headerTitulo: { color: p.onSurface, fontSize: 17, fontFamily: 'Inter_700Bold' },
    lista: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
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
    seccionLabel: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingHorizontal: 4 },
    tarjeta: { backgroundColor: p.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: p.outlineVariant },
    tarjetaTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    tarjetaEmoji: { fontSize: 28 },
    tarjetaInfo: { flex: 1 },
    tarjetaNombre: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 2 },
    tarjetaInstrumento: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_400Regular' },
    tarjetaTotal: { fontSize: 18, fontFamily: 'Inter_800ExtraBold' },
    tarjetaStats: { flexDirection: 'row', paddingTop: 12, borderTopWidth: 1, borderTopColor: p.outlineVariant },
    statItem: { flex: 1, alignItems: 'center' },
    statValor: { color: p.onSurface, fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 2 },
    statLabel: { color: p.onSurfaceVariant, fontSize: 10, fontFamily: 'Inter_500Medium' },
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyIcon: { fontSize: 40, marginBottom: 12 },
    emptyTitulo: { color: p.onSurface, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6 },
    emptySubtitulo: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  });
}
