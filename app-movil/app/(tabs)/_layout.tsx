/**
 * Define la barra de navegacion inferior (tabs Bar) de app
 * expo router usa este archivo como el contenedor de todas las
 * pantallas que viven de la carpeta (tabs)
 */

//tabs componente de expo router que genera la barra de pestañas inferior
import { Tabs } from 'expo-router';
//react es nevesario para que JSX funcione correctamente
import React from 'react';
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
                //tabBarActiveTintColor color del icono y texto de la pestaña activa 
                //si colorScheme es null (no detectado) usa light por defecto
                tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
                //headerShown false oculta el encabezado superior en todas las pantallas 
                headerShown: false,
                //tabBarButton remplaza el boton estandar por hapticTab con vibracion 
                tabBarButton: HapticTab,
            }}>

            {
            /** pestaña 1 tienda
             * name = index -> apunta al archivo /index.tsx (pantalla principal)
             */
            }
            <Tabs.Screen
            name = "index"
            options = {{
                //texto que aparece debajo del icono de la barra
                title: 'Tienda Adso',
                //tabBarIcon funcion que recibe el color activo o inactivo y devuelve el icono
                //house.fill = icono de casa rellena (representa el icono de la tienda)
                tabBarIcon: ({ color }) => <IconSymbol size = {28} name = "house.fill" color = {color} />,
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
                //texto que aparece debajo del icono de la barra
                title: 'Carrito',
                //tabBarIcon funcion que recibe el color activo o inactivo y devuelve el icono
                //house.fill = icono de casa rellena (representa el icono de la tienda)
                tabBarIcon: ({ color }) => <IconSymbol size = {28} name = "house.fill" color = {color} />,
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
                //texto que aparece debajo del icono de la barra
                title: 'Cuenta',
                //tabBarIcon funcion que recibe el color activo o inactivo y devuelve el icono
                //house.fill = icono de casa rellena (representa el icono de la tienda)
                tabBarIcon: ({ color }) => <IconSymbol size = {28} name = "person.circle" color = {color} />,
            }}
            />

            </Tabs>
    );
}