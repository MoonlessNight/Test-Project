/**
 * Define la barra de navegacion inferior (tabs Bar) de app
 * expo router usa este archivo como el contenedor de todas las
 * pantallas que viven de la carpeta (tabs)
 */

//tabs componente de expo router que genera la barra de pestañas inferior
import { Tabs } from 'expo-router';
//react es nevesario para que JSX funcione correctamente
import React from 'react';
import { Platform } from 'react-native';
//hapticTab version personalizada del boton de la pestaña que agrega vibracion tactil (haptic feedback) al precionar el tab
import { HapticTab } from '../../components/haptic-tab';
//IconSymbols componente que muestra iconos SF symbols IOS y material de android
import { IconSymbol } from '../../components/ui/icon-symbol';
//colors objeto de colores del tema de app modo claro y oscuro
import { Colors } from '../../constants/theme';
//useColorScheme hook que detecta si el dispositivo esta en modo claro u obscuro
import { useColorScheme } from '../../hooks/use-color-scheme';

//TabLayout comoponente principal que configura toda la barra de navegacion
//exp router lo exporta como default y no lo monta automaticamente 
export default function TabLayout() {
    //ColorScheme valor 'light' o 'dark' segun la preferencia del sistema 
    const colorScheme = useColorScheme();

    return (
        //Tabs renderiza la barra de pestañas inferior y gestiona que la pantalla este activa en cada momento
        <Tabs
            screenOptions = {{
                tabBarActiveTintColor: '#192847',
                tabBarInactiveTintColor: '#9ca3af',
                headerShown: false,
                tabBarButton: HapticTab,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: Platform.OS === 'ios' ? 24 : 16,
                    left: 20,
                    right: 20,
                    borderRadius: 20,
                    backgroundColor: '#ffffff',
                    borderTopWidth: 0,
                    height: 64,
                    paddingBottom: Platform.OS === 'ios' ? 6 : 8,
                    paddingTop: 8,
                    shadowColor: '#192847',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 5,
                    borderWidth: 1,
                    borderColor: 'rgba(25, 40, 71, 0.04)',
                }
            }}>

            {
            /** pestaña 1 tienda
             * name = index -> apunta al archivo /index.tsx (pantalla principal)
             */
            }
            <Tabs.Screen
            name = "index"
            options = {{
                title: 'Catálogo',
                tabBarIcon: ({ color }) => <IconSymbol size = {22} name = "house.fill" color = {color} />,
            }}
            />

            {
            /** pestaña 2 carrito
             * name = carrito -> apunta al archivo /carrito.tsx
             */
            }
            <Tabs.Screen
            name = "carrito"
            options = {{
                title: 'Mi Carrito',
                tabBarIcon: ({ color }) => <IconSymbol size = {22} name = "cart.fill" color = {color} />,
            }}
            />

            {
            /** pestaña 3 Cuenta
             * name = explore -> apunta al archivo /explore.tsx
             */
            }
            <Tabs.Screen
            name = "explore"
            options = {{
                title: 'Mi Cuenta',
                tabBarIcon: ({ color }) => <IconSymbol size = {22} name = "person.fill" color = {color} />,
            }}
            />

            </Tabs>
    );
}