 /**
 * Define la barra de navegacion inferior (tab bar) de app
 * expo router usa este archivo como contenedor de todas las pantallas que viven de la carpeta (tabs)
 */

// tabs componente de expo-router que genera la barra de pestañas inferior
import { Tabs } from 'expo-router';
import React from 'react';
// hapticTab version personalizada del boton de la pestaña que agrega vibracion tactil (haptic feedback) al presionar el tab
import { hapticTab } from '@/componentes/haptic-tab';
// IconSymbol componente que muestra el icono SF Symbols iOS y material de android
import { IconSymbol } from '@/componentes/icon-symbol';
// Colors objeto de colores del tema de app modo claro y oscuro
import { Colors } from '@/componentes/theme';
// useColorSheme hook que detecta si el dispositivo esta en modo claro o oscuro
import { useColorSheme } from '@/hooks/use-color-scheme';

// TabLayout componente principal que configura toda la barra de navegacion
// expo Router lo exporta como default y lo monta automaticamente
export default function TabLayout() {
  const colorSheme = useColorSheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorSheme ?? 'light'],
        headerShown: false,
        tabBarButton: hapticTab,
      }}
    >
      {/** PESTAÑA 1 TIENDA
       * name=index -> apunta el archivo/index.tsx (pantalla principal)
       */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio — GAVAT',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/** PESTAÑA 2 CARRITO
       * name=carrito -> apunta el archivo/carrito.tsx
       */}
      <Tabs.Screen
        name="carrito"
        options={{
          title: 'Carrito — GAVAT',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />

      {/** PESTAÑA 3 CUENTA
       * name=cuenta -> apunta el archivo/cuenta.tsx
       */}
      <Tabs.Screen
        name="cuenta"
        options={{
          title: 'Cuenta — GAVAT',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

 