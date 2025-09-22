import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { Box } from '@/components/ui/box';
import { Spinner } from '@/components/ui/spinner';
import { ControllerState } from '@/fardriver/interfaces/ControllerState';
import { Icon } from '@/components/ui/icon';
import {
    CircleCheck,
    LogOut,
    LucideCpu,
    LucideGauge,
    LucidePercent,
    LucideLoaderPinwheel,
    LucideRuler,
    LucideSettings,
    ShieldBan,
} from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Device } from 'react-native-ble-plx';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useUser } from '@/providers/UserContextProvider';
import { Controller } from '@/interfaces/Controller';
import firestore from '@react-native-firebase/firestore';
import { useRoute } from '@react-navigation/core';
import { useNavigation } from '@react-navigation/native';
import ListItem from '@/components/dashboard/ListItem';
import Row from '@/components/InfoRow';
import { useTranslation } from 'react-i18next';

interface NewController {
    localName: string;
    name?: string;
    serialNumber?: string;
    motorPolePairs?: number;
    ratedVoltage?: number;
    batteryRatedCapacity?: number;
    allowAnonymousBinding?: boolean;
    preferGpsSpeed?: boolean;
    tireWidth?: number;
    tireAspectRatio?: number;
    rimDiameter?: number;
    gearRatio?: number | string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

const AddDevice = () => {
    const { user, saveController } = useUser();
    const route = useRoute() as any;
    const navigation = useNavigation();
    const [isUnauthorized, setIsUnauthorized] = useState(false);
    const device = route.params.controller.device as Device;
    const controllerState = route.params.controller.state as ControllerState;
    const [controller, setController] = useState<NewController>({
        localName: device.name!,
        name: device.name!,
        allowAnonymousBinding: true,
        preferGpsSpeed: false,
        tireWidth: undefined,
        tireAspectRatio: undefined,
        rimDiameter: undefined,
        gearRatio: undefined,
    });

    const { t } = useTranslation();

    useEffect(() => {
        controllerState.onReceive(
            'serialNumber',
            async (serialNumber: string) => {
                try {
                    const subscriber = await firestore()
                        .collection('controllers')
                        .doc(serialNumber)
                        .get();

                    if (subscriber.exists) {
                        const controller = subscriber.data() as Controller;

                        // Validate if the user is authorized to access this controller
                        const isAuthorized =
                            controller.allowAnonymousBinding ||
                            controller.boundUserIds.includes(user.uid) ||
                            controller.ownerIds.includes(user.uid);

                        if (!isAuthorized) {
                            setIsUnauthorized(true);
                            return;
                        }

                        if (
                            controller.boundUserIds.includes(user.uid) ||
                            controller.ownerIds.includes(user.uid)
                        ) {
                            controllerState.off('serialNumber');
                            navigation.goBack();
                            return;
                        }
                        navigation.goBack();
                        await firestore()
                            .doc(`controllers/${serialNumber}`)
                            .update({
                                boundUserIds: firestore.FieldValue.arrayUnion(
                                    user.uid
                                ),
                            })
                            .catch((error) => {
                                console.log('Error adding document: ', error);
                            })
                            .finally(() => {
                                controllerState.off('serialNumber');
                            });
                    } else {
                        // If controller does not exist, set default state
                        setController((prev) => ({
                            ...prev,
                            serialNumber,
                        }));
                    }
                    controllerState.off('serialNumber');
                } catch (error) {
                    console.error('Error fetching controller data:', error);
                    // Optionally handle error state
                    setIsUnauthorized(true);
                    controllerState.off('serialNumber');
                }
            }
        );
        controllerState.onReceive(
            'motorPolePairs',
            (motorPolePairs: number) => {
                setController((prev) => ({ ...prev, motorPolePairs }));
            }
        );
        controllerState.onReceive('motorGearRatio', (gearRatio: number) => {
            setController((prev) => ({ ...prev, gearRatio }));
            controllerState.off('motorGearRatio');
        });

        controllerState.onReceive('wheelWidth', (tireWidth: number) => {
            setController((prev) => ({ ...prev, tireWidth }));
            controllerState.off('wheelWidth');
        });

        controllerState.onReceive('wheelRatio', (tireAspectRatio: number) => {
            setController((prev) => ({ ...prev, tireAspectRatio }));
            controllerState.off('wheelRatio');
        });

        controllerState.onReceive('wheelRadius', (rimDiameter: number) => {
            setController((prev) => ({
                ...prev,
                rimDiameter: rimDiameter * 2,
            }));
            controllerState.off('wheelRadius');
        });

        controllerState.onReceive('ratedVoltage', (ratedVoltage: number) => {
            setController((prev) => ({ ...prev, ratedVoltage }));
        });
        controllerState.onReceive(
            'batteryRatedCapacityInAh',
            (batteryRatedCapacity: number) => {
                setController((prev) => ({ ...prev, batteryRatedCapacity }));
            }
        );
    }, [controllerState, navigation, route.params.controller.state, user.uid]);

    const isBmsConnected = controllerState.isBatteryManagementSystemEnabled;

    const hasAllDetailedReferences = useRef<boolean>(false);

    const hasAllDetails = useMemo(() => {
        if (hasAllDetailedReferences.current) {
            return true;
        }
        const hasAllDetails =
            !!controller.serialNumber &&
            !!controller.motorPolePairs &&
            !!controller.ratedVoltage &&
            controller.tireWidth !== undefined &&
            controller.tireAspectRatio !== undefined &&
            controller.rimDiameter !== undefined &&
            controller.gearRatio !== undefined &&
            controller.batteryRatedCapacity !== undefined;
        if (hasAllDetails) {
            hasAllDetailedReferences.current = true;
        }
        return hasAllDetails;
    }, [controller]);

    const onDismiss = () => {
        device.cancelConnection();
        navigation.goBack();
    };

    const onSave = useCallback(() => {
        saveController(controller as Controller);
        if (controllerState) {
            controllerState.setGearRatio(Number(controller.gearRatio));
            controllerState.setWheelWidth(controller.tireWidth!);
            controllerState.setWheelRatio(controller.tireAspectRatio!);
            controllerState.setWheelRadius(controller.rimDiameter! / 2);
        }
        navigation.goBack();
    }, [saveController, controller, controllerState, navigation]);

    useEffect(() => {
        if (hasAllDetails) {
            navigation.setOptions({
                headerRight: () => (
                    <Button
                        disabled={!controller.name || !hasAllDetails}
                        size="md"
                        variant="link"
                        action="primary"
                        onPress={onSave}
                    >
                        <Text className="font-bold">{t('common.save')}</Text>
                    </Button>
                ),
            });
        }
        navigation.setOptions({
            headerLeft: () => (
                <Button variant="link" onPress={onDismiss}>
                    <Text className="font-bold">{t('common.cancel')}</Text>
                </Button>
            ),
        });
    }, [onSave, controller, hasAllDetails, navigation, onDismiss, t]);

    if (isBmsConnected) {
        return (
            <View className="p-4">
                <View className="gap-1 flex-col items-center justify-center">
                    <Icon as={ShieldBan} size={62} />
                    <Text className={'text-2xl text-center text-primary-500'}>
                        {t('devices.bmsDetected')}
                    </Text>
                    <Text className={'text-center text-primary-50'}>
                        {t('devices.bmsDetectedDescription')}
                    </Text>
                    <Button
                        size="md"
                        variant="outline"
                        action="primary"
                        onPress={onDismiss}
                    >
                        <Icon as={LogOut} />
                        <Text className="font-bold">{t('common.exit')}</Text>
                    </Button>
                </View>
            </View>
        );
    }

    if (isUnauthorized) {
        return (
            <View className="p-4">
                <View className="gap-1 flex-col items-center justify-center">
                    <Icon as={ShieldBan} size={62} />
                    <Text className={'text-2xl text-center text-primary-500'}>
                        {t('devices.unauthorized')}
                    </Text>
                    <Text className={'text-center text-primary-50'}>
                        {t('devices.unauthorizedDescription')}
                    </Text>
                    <Button
                        size="md"
                        variant="outline"
                        action="primary"
                        onPress={onDismiss}
                    >
                        <Icon as={LogOut} />
                        <Text className="font-bold">{t('common.exit')}</Text>
                    </Button>
                </View>
            </View>
        );
    }

    const rows = [
        {
            label: t('controller.serialNumber'),
            value: controller.serialNumber,
        },

        {
            label: t('controller.ratedVoltage'),
            value: `${controller.ratedVoltage}V`,
        },
        {
            label: t('controller.capacity'),
            value: `${controller.batteryRatedCapacity}AH`,
        },
        {
            label: t('controller.polePairs'),
            value: controller.motorPolePairs,
        },
    ];

    return (
        <ScrollView
            keyboardShouldPersistTaps="never"
            automaticallyAdjustKeyboardInsets={true}
        >
            <View className="p-4">
                <View className="p-4 rounded-lg items-center justify-center">
                    {!hasAllDetails ? (
                        <Spinner size="large" />
                    ) : (
                        <Icon
                            as={CircleCheck}
                            className="text-green-500"
                            size={42}
                        />
                    )}

                    <Box className="">
                        <View className="gap-2 flex-col items-center justify-center">
                            <Heading className="mt-2 text-center">
                                {hasAllDetails
                                    ? t('common.success')
                                    : t('common.discovery')}
                            </Heading>
                            <Text className={'text-center text-gray-500'}>
                                {hasAllDetails
                                    ? t('devices.detailsGathered')
                                    : t('devices.detailsGathering')}
                            </Text>
                        </View>
                    </Box>
                </View>

                {hasAllDetails && (
                    <>
                        <Heading className="mt-4">
                            {t('controller.information')}
                        </Heading>
                        <AnimatedView
                            entering={FadeInUp.duration(500)}
                            className="mt-4 bg-secondary-100 rounded-lg px-4 focus:border-green-500"
                        >
                            <View className="my-4 flex-row flex-wrap gap-y-3">
                                {rows.map((row, index) => (
                                    <Row
                                        columns={index === 0 ? 1 : 3}
                                        key={row.label}
                                        index={index - 1}
                                        label={row.label}
                                        value={row.value}
                                    />
                                ))}
                            </View>
                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.duration(500)}
                            className="mt-4 bg-secondary-100 rounded-lg px-4"
                        >
                            <ListItem
                                icon={LucideCpu}
                                iconStart
                                title={t('devices.name')}
                                description={t('devices.nameDescription')}
                                type="input"
                                props={{
                                    value: controller.name,
                                    onChangeText: (text: string) =>
                                        setController((prev) => ({
                                            ...prev,
                                            name: text,
                                        })),
                                    className: !controller.name
                                        ? 'text-red-500 leading-1'
                                        : 'text-typography-600 leading-1',
                                }}
                            />
                        </AnimatedView>

                        <Animated.View entering={FadeInUp.duration(500)}>
                            <Heading className="mt-4">
                                {t('controller.speedometerOptions')}
                            </Heading>
                            <Text className="text-secondary-500 font-semibold mt-2">
                                {t('controller.tireSectionDescription')}
                            </Text>
                        </Animated.View>

                        <AnimatedView
                            entering={FadeInUp.duration(500)}
                            className="mt-4 bg-secondary-100 rounded-lg px-4 focus:border-green-500"
                        >
                            <ListItem
                                iconStart
                                icon={LucideGauge}
                                title={t('controller.preferGpsSpeed')}
                                description={t(
                                    'controller.preferGpsSpeedDescription'
                                )}
                                type="switch"
                                props={{
                                    value: controller.preferGpsSpeed,
                                    onValueChange: (enabled: boolean) =>
                                        setController((prev) => ({
                                            ...prev,
                                            preferGpsSpeed: enabled,
                                        })),
                                }}
                            />
                        </AnimatedView>

                        <AnimatedView
                            entering={FadeInUp.duration(500)}
                            className="mt-4 mb-12 bg-secondary-100 rounded-lg px-4"
                        >
                            <ListItem
                                icon={LucideRuler}
                                iconStart
                                title={t('tire.width')}
                                description={t('tire.widthDescription')}
                                type="input"
                                props={{
                                    value:
                                        controller.tireWidth?.toString() || '',
                                    placeholder: 'Tire Width (mm)',
                                    keyboardType: 'numeric',
                                    onChangeText: (text: string) => {
                                        console.log(text);
                                        setController((prev) => ({
                                            ...prev,
                                            tireWidth: text
                                                ? parseInt(text)
                                                : undefined,
                                        }));
                                    },
                                    className: 'text-typography-600 leading-1',
                                }}
                            />
                            <ListItem
                                icon={LucidePercent}
                                iconStart
                                title={t('tire.aspectRatio')}
                                description={t('tire.aspectRatioDescription')}
                                type="input"
                                props={{
                                    value:
                                        controller.tireAspectRatio?.toString() ||
                                        '',
                                    placeholder: 'Aspect Ratio (%)',
                                    keyboardType: 'numeric',
                                    onChangeText: (text: string) =>
                                        setController((prev) => ({
                                            ...prev,
                                            tireAspectRatio: text
                                                ? parseInt(text)
                                                : undefined,
                                        })),
                                    className: 'text-typography-600 leading-1',
                                }}
                            />
                            <ListItem
                                icon={LucideLoaderPinwheel}
                                iconStart
                                title={t('tire.rimDiameter')}
                                description={t('tire.rimDiameterDescription')}
                                type="input"
                                props={{
                                    value:
                                        controller.rimDiameter?.toString() ||
                                        '',
                                    placeholder: 'Rim Diameter (inches)',
                                    keyboardType: 'numeric',
                                    onChangeText: (text: string) =>
                                        setController((prev) => ({
                                            ...prev,
                                            rimDiameter: text
                                                ? parseInt(text)
                                                : undefined,
                                        })),
                                    className: 'text-typography-600 leading-1',
                                }}
                            />

                            <ListItem
                                icon={LucideSettings}
                                iconStart
                                title={t('tire.gearRatio')}
                                description={t('tire.gearRatioDescription')}
                                type="input"
                                props={{
                                    value:
                                        controller.gearRatio?.toString() || '',
                                    placeholder: 'Gear Ratio',
                                    keyboardType: 'numeric',
                                    onChangeText: (text: string) => {
                                        // Allow only numbers and a single decimal point
                                        const formattedText = text.replace(
                                            /[^0-9.]/g,
                                            ''
                                        );

                                        // Prevent leading zeros and multiple decimals
                                        if (
                                            (formattedText.match(/\./g) || [])
                                                .length > 1
                                        ) {
                                            return;
                                        }

                                        setController((prev) => ({
                                            ...prev,
                                            gearRatio: formattedText, // Keep as string until needed for computation
                                        }));
                                    },
                                    className: 'text-typography-600 leading-1',
                                }}
                            />
                        </AnimatedView>
                    </>
                )}

                {/*{hasAllDetails && (*/}
                {/*    <AnimatedView*/}
                {/*        entering={FadeInUp.duration(500)}*/}
                {/*        className="mt-4 bg-secondary-100 rounded-lg px-4 focus:border-green-500"*/}
                {/*    >*/}
                {/*        <ListItem*/}
                {/*            icon={LucideLink}*/}
                {/*            title={t('devices.binding')}*/}
                {/*            description={t('devices.bindingDescription')}*/}
                {/*            type="switch"*/}
                {/*            props={{*/}
                {/*                value: controller.allowAnonymousBinding,*/}
                {/*                onValueChange: (allowAnonymousBinding: boolean) =>*/}
                {/*                    setController((prev) => ({*/}
                {/*                        ...prev,*/}
                {/*                        allowAnonymousBinding,*/}
                {/*                    })),*/}
                {/*                className: !controller.name*/}
                {/*                    ? 'text-red-500 leading-1'*/}
                {/*                    : 'text-typography-600 leading-1',*/}
                {/*            }}*/}
                {/*        />*/}
                {/*    </AnimatedView>*/}
                {/*)}*/}
            </View>
        </ScrollView>
    );
};

export default AddDevice;
