import { registerRootComponent } from 'expo';
import '@/global.css';
import React, { useEffect, useState } from 'react';
import auth, { getAuth } from '@react-native-firebase/auth';
import { Platform, useColorScheme } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import MainApplicationContainer from '@/screens/MainApplicationContainer';
import { UserContextProvider } from '@/providers/UserContextProvider';
import { BluetoothConnectionsProvider } from '@/providers/BluetoothProvider';
import { NavigationContainer } from '@react-navigation/native';
import { BFDarkTheme, BFDefaultTheme } from '@/utils/theme';
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/Toast';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import '../languages/i18n';

// Polyfill for Intl.DateTimeFormat
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-datetimeformat/polyfill';
import '@formatjs/intl-datetimeformat/add-all-tz';
// Load locale data for all supported locales
import '@formatjs/intl-datetimeformat/locale-data/en';
import '@formatjs/intl-datetimeformat/locale-data/pl';
import '@formatjs/intl-datetimeformat/locale-data/fr';
import '@formatjs/intl-datetimeformat/locale-data/de';
import '@formatjs/intl-datetimeformat/locale-data/es';
import '@formatjs/intl-datetimeformat/locale-data/it';
import '@formatjs/intl-datetimeformat/locale-data/nl';

import { Settings } from 'luxon';

Settings.defaultLocale = 'en';
Settings.defaultZone = 'America/New_York';

const App = () => {
    const colorScheme = useColorScheme();
    //
    // useEffect(() => {
    //     auth().signOut();
    // }, []);

    return (
        <GluestackUIProvider mode={colorScheme!}>
            <NavigationContainer
                theme={colorScheme === 'dark' ? BFDarkTheme : BFDefaultTheme}
            >
                <UserContextProvider>
                    <BluetoothConnectionsProvider>
                        <MainApplicationContainer />
                    </BluetoothConnectionsProvider>
                </UserContextProvider>
            </NavigationContainer>
            <Toast position="top" topOffset={60} config={toastConfig} />
        </GluestackUIProvider>
    );
};

GoogleSignin.configure(
    Platform.OS === 'android'
        ? {
              webClientId:
                  '883188168454-8cq87gnaoanjg4299j6qhuqifv1hf48p.apps.googleusercontent.com',
          }
        : undefined
);
registerRootComponent(App);
