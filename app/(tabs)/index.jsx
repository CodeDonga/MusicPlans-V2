import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import { useAlumnos } from '../../context/AlumnosContext';
import { useTema } from '../../context/TemaContext';

export default function PantallaAlumnos() {
  const router = useRouter();
  const { alumnos, talleres } = useAlumnos();
  const { tema, paleta } = useTema();
  const [modalFAB, setModalFAB] = useState(false);

  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  if (!fontsLoaded) return null;

  const s = makeStyles(paleta);
  const items = [...alumnos, ...talleres];

  function irAPerfil(item) {
    router.push({ pathname: '/perfil', params: { id: item.id, tipo: item.tipo } });
  }

  function irAgregarAlumno() {
    setModalFAB(false);
    router.push('/nuevo-alumno');
  }

  function irAgregarTaller() {
    setModalFAB(false);
    router.push('/nuevo-taller');
  }

  return (
    <SafeAreaView style={s.contenedor}>
      <StatusBar barStyle={tema === 'oscuro' ? 'light-content' : 'dark-content'} backgroundColor={paleta.bg} />

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerBrand}>
          <Text style={s.headerIcon}>🎵</Text>
          <Text style={s.headerLogo}>MusicPlans</Text>
        </View>
      </View>

      {/* Título sección */}
      <View style={s.seccionTituloContainer}>
        <Text style={s.seccionLabel}>Gestión de Talento</Text>
        <Text style={s.seccionTitulo}>Alumnos</Text>
      </View>

      {/* Lista */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={s.lista}
        ListEmptyComponent={
          <TouchableOpacity style={s.emptyContainer} onPress={irAgregarAlumno} activeOpacity={0.8}>
            <View style={s.emptyIconBox}>
              <Text style={s.emptyIcon}>🎵</Text>
            </View>
            <Text style={s.emptyTitulo}>Sin alumnos aún</Text>
            <Text style={s.emptySubtitulo}>Toca aquí para agregar tu primer alumno</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.tarjeta} onPress={() => irAPerfil(item)} activeOpacity={0.75}>
            <View style={s.tarjetaTop}>
              <View style={s.avatarWrap}>
                <Text style={s.avatarEmoji}>{item.avatar || (item.tipo === 'taller' ? '🎼' : '🎸')}</Text>
              </View>
              <View style={s.tarjetaInfo}>
                <View style={s.tarjetaNameRow}>
                  <Text style={s.tarjetaNombre}>{item.nombre}</Text>
                  {item.tipo === 'taller' && <View style={s.badgeTaller}><Text style={s.badgeTallerTexto}>TALLER</Text></View>}
                </View>
                <Text style={s.tarjetaInstrumento}>{item.instrumento}</Text>
              </View>
            </View>
            <View style={s.tarjetaBottom}>
              <View style={s.tarjetaHorario}>
                <Text style={s.tarjetaHorarioTexto}>📅  {item.diaSemana} · {item.hora}hs</Text>
              </View>
              <Text style={s.tarjetaVerPerfil}>Ver Perfil →</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={s.fab} onPress={() => setModalFAB(true)} activeOpacity={0.85}>
        <Text style={s.fabTexto}>+</Text>
      </TouchableOpacity>

      {/* Modal FAB opciones */}
      <Modal visible={modalFAB} transparent animationType="fade" onRequestClose={() => setModalFAB(false)}>
        <TouchableOpacity style={s.modalFondo} onPress={() => setModalFAB(false)} activeOpacity={1}>
          <View style={s.fabMenu}>
            <TouchableOpacity style={s.fabMenuItem} onPress={irAgregarAlumno} activeOpacity={0.8}>
              <Text style={s.fabMenuIcon}>👤</Text>
              <Text style={s.fabMenuTexto}>Agregar Alumno</Text>
            </TouchableOpacity>
            <View style={s.fabMenuDivisor} />
            <TouchableOpacity style={s.fabMenuItem} onPress={irAgregarTaller} activeOpacity={0.8}>
              <Text style={s.fabMenuIcon}>👥</Text>
              <Text style={s.fabMenuTexto}>Agregar Taller</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(p) {
  return StyleSheet.create({
    contenedor: { flex: 1, backgroundColor: p.bg },

    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 20, paddingVertical: 14,
      backgroundColor: p.headerBg,
      borderBottomWidth: 1, borderBottomColor: p.outlineVariant,
    },
    headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { fontSize: 22 },
    headerLogo: { color: p.primary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', letterSpacing: -0.5 },

    seccionTituloContainer: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
    seccionLabel: { color: p.primary, fontSize: 10, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 },
    seccionTitulo: { color: p.onSurface, fontSize: 36, fontFamily: 'Inter_800ExtraBold', letterSpacing: -1 },

    lista: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 },

    tarjeta: {
      backgroundColor: p.bgCard, borderRadius: 20, padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: p.outlineVariant,
      shadowColor: p.primary, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    tarjetaTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    avatarWrap: {
      width: 56, height: 56, borderRadius: 14,
      backgroundColor: p.primaryMid, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: p.primaryBorder,
    },
    avatarEmoji: { fontSize: 28 },
    tarjetaInfo: { flex: 1 },
    tarjetaNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
    tarjetaNombre: { color: p.onSurface, fontSize: 17, fontFamily: 'Inter_700Bold' },
    badgeTaller: { backgroundColor: p.primaryLight, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: p.primaryBorder },
    badgeTallerTexto: { color: p.primary, fontSize: 8, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
    tarjetaInstrumento: { color: p.secondary, fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    tarjetaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: p.outlineVariant },
    tarjetaHorario: { backgroundColor: p.primaryFaint, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: p.primaryBorder },
    tarjetaHorarioTexto: { color: p.onSurfaceVariant, fontSize: 12, fontFamily: 'Inter_500Medium' },
    tarjetaVerPerfil: { color: p.primary, fontSize: 13, fontFamily: 'Inter_700Bold' },

    emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
    emptyIconBox: {
      width: 72, height: 72, borderRadius: 20,
      backgroundColor: p.primaryFaint, borderWidth: 1, borderColor: p.primaryBorder,
      alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    },
    emptyIcon: { fontSize: 32 },
    emptyTitulo: { color: p.onSurface, fontSize: 18, fontFamily: 'Inter_700Bold', marginBottom: 6 },
    emptySubtitulo: { color: p.onSurfaceVariant, fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },

    fab: {
      position: 'absolute', bottom: 88, right: 20,
      width: 56, height: 56, borderRadius: 99,
      backgroundColor: p.primary, alignItems: 'center', justifyContent: 'center',
      shadowColor: p.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.5, shadowRadius: 14, elevation: 10,
    },
    fabTexto: { color: '#fff', fontSize: 28, lineHeight: 32 },

    modalFondo: { flex: 1, justifyContent: 'flex-end', paddingBottom: 160, paddingRight: 20, alignItems: 'flex-end' },
    fabMenu: { backgroundColor: p.bgCard, borderRadius: 16, borderWidth: 1, borderColor: p.outlineVariant, overflow: 'hidden', minWidth: 200 },
    fabMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16, paddingHorizontal: 20 },
    fabMenuIcon: { fontSize: 20 },
    fabMenuTexto: { color: p.onSurface, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    fabMenuDivisor: { height: 1, backgroundColor: p.outlineVariant },
  });
}
