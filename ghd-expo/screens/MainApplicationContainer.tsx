import { KeyboardProvider } from 'react-native-keyboard-controller';
import GetStartedPage from '@/screens/GetStarted';
import LoginPage from '@/screens/Login';
import RegisterPage from '@/screens/Register';
import { TouchableOpacity, View } from 'react-native';
import { useUser } from '@/providers/UserContextProvider';
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BFSpinner from '@/components/BFSpinner';
import AddDevice from '@/screens/AddDevice';
import LandingDashboardScreen from '@/screens/dashboard/LandingDashboardScreen';
import DevicesScreen from '@/screens/dashboard/DevicesScreen';
import { Spinner } from '@/components/ui/spinner';
import Trips, { Trip } from '@/components/dashboard/Trips';
import MyProfile from '@/components/profile/MyProfile';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { LucideCircleUser } from 'lucide-react-native';
import DisplayOptions from '@/components/dashboard/DisplayOptions';

const Stack = createNativeStackNavigator();

const MainApplicationContainer = () => {
    const { t } = useTranslation();
    const { user, controllers, loadingControllers, loadingUserState } =
        useUser();

    console.log('MainApplicationContainer - loadingUserState:', loadingUserState);
    console.log('MainApplicationContainer - user:', user?.uid, user?.email);

    if (loadingUserState) {
        return (
            <View
                className={'flex flex-col flex-1 items-center justify-center'}
            >
                <Spinner size="large" />
            </View>
        );
    }

    return (
        <KeyboardProvider>
            {!user ? (
                <Stack.Navigator
                    screenOptions={{
                        headerBackTitleVisible: false,
                    }}
                >
                    <Stack.Screen
                        name={'Get Started'}
                        component={GetStartedPage}
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen name={'Login'} component={LoginPage} />
                    <Stack.Screen name={'Register'} component={RegisterPage} />
                </Stack.Navigator>
            ) : (
                <>
                    {!loadingControllers && !controllers.length && (
                        <Stack.Navigator
                            screenOptions={{
                                headerBackTitleVisible: false,
                            }}
                        >
                            <Stack.Screen
                                name={'FirstDeviceScreen'}
                                component={DevicesScreen}
                                options={({ navigation }) => ({
                                    title: t('devices.title'),
                                    headerRight: () => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                navigation.navigate(
                                                    'MyProfile' as never,
                                                    {
                                                        hideControllers: true,
                                                    }
                                                );
                                            }}
                                        >
                                            <Icon
                                                as={LucideCircleUser}
                                                size={26}
                                            />
                                        </TouchableOpacity>
                                    ),
                                })}
                            />
                            <Stack.Screen
                                name={'MyProfile'}
                                component={MyProfile}
                                options={{
                                    headerTitle: t('pages.myProfile'),
                                }}
                            />
                            <Stack.Screen
                                name={'AddDeviceModal'}
                                component={AddDevice}
                                options={{
                                    presentation: 'modal',
                                    headerShown: true,
                                    headerTitle: t('controller.new'),
                                    gestureEnabled: false,
                                }}
                            />
                        </Stack.Navigator>
                    )}

                    {loadingControllers && (
                        <View
                            className={
                                'flex flex-col flex-1 items-center justify-center'
                            }
                        >
                            <BFSpinner />
                        </View>
                    )}
                    {!loadingControllers && !!controllers.length && (
                        <Stack.Navigator
                            screenOptions={{
                                headerBackTitleVisible: false,
                            }}
                        >
                            <Stack.Screen
                                name={'LandingDashboardScreen'}
                                component={LandingDashboardScreen}
                                options={{
                                    headerShown: false,
                                    title: t('pages.dashboard'),
                                }}
                            />
                            <Stack.Screen
                                name={'DevicesScreen'}
                                component={DevicesScreen}
                                options={{
                                    title: t('devices.title'),
                                }}
                            />
                            <Stack.Screen
                                name={'AddDeviceModal'}
                                component={AddDevice}
                                options={{
                                    presentation: 'modal',
                                    headerShown: true,
                                    headerTitle: t('controller.new'),
                                    gestureEnabled: false,
                                }}
                            />
                            <Stack.Screen
                                name={'Trips'}
                                component={Trips}
                                options={{
                                    headerTitle: t('pages.trips'),
                                }}
                            />
                            <Stack.Screen
                                name={'DisplayOptions'}
                                component={DisplayOptions}
                                options={{
                                    headerTitle: t('pages.displayOptions'),
                                }}
                            />
                            <Stack.Screen
                                name={'TripDetail'}
                                component={Trip}
                                options={{
                                    headerTitle: t('pages.tripDetail'),
                                    presentation: 'modal',
                                }}
                            />
                            <Stack.Screen
                                name={'MyProfile'}
                                component={MyProfile}
                                options={{
                                    headerTitle: t('pages.myProfile'),
                                }}
                            />
                        </Stack.Navigator>
                    )}
                </>
            )}
        </KeyboardProvider>
    );
};

export default MainApplicationContainer;
