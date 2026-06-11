import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTema } from '../../context/TemaContext';

export default function TabsLayout() {
  const { paleta } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: paleta.bgNavBar,
          borderTopColor: paleta.navBorder,
          borderTopWidth: 1,
          paddingBottom: 20,
          paddingTop: 10,
          height: 70,
        },
        tabBarActiveTintColor: paleta.primary,
        tabBarInactiveTintColor: paleta.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '600',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Calendario',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📅</Text>,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alumnos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>👥</Text>,
        }}
      />
      <Tabs.Screen
        name="finanzas"
        options={{
          title: 'Finanzas',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ href: null }}
      />
    </Tabs>
  );
}
