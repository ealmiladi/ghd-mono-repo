import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';
import { Heading } from '@/components/ui/heading';
import {
    LucideGauge,
    LucidePercent,
    LucideLoaderPinwheel,
    LucideRuler,
    LucideSettings,
    LucideCpu,
} from 'lucide-react-native';
import ListItem from '@/components/dashboard/ListItem';
import { useUser } from '@/providers/UserContextProvider';
import { useDevices } from '@/providers/BluetoothProvider';
import { Text } from '@/components/ui/text';

const DisplayOptions = memo(({ route }: { route: any }) => {
    const { t } = useTranslation();
    const { updateController: updateUserController } = useUser();
    const { controllerStates } = useDevices();
    const { controller, localName } = route.params;
    const [preferGpsSpeed, setGpsSpeedEnabled] = useState(
        controller.preferGpsSpeed
    );
    const [controllerName, setControllerName] = useState(controller.name);
    const [gearRatio, setGearRatio] = useState(controller.gearRatio);
    const [tireWidth, setTireWidth] = useState(controller.tireWidth);
    const [tireAspectRatio, setTireAspectRatio] = useState(
        controller.tireAspectRatio
    );
    const [rimDiameter, setRimDiameter] = useState(controller.rimDiameter);

    const onGpsSpeedEnabledChange = (enabled: boolean) => {
        updateUserController({
            serialNumber: controller.serialNumber,
            preferGpsSpeed: enabled,
        });
    };

    const updateController = (controller: any) => {
        const controllerState = controllerStates.current[localName];
        if (controllerState) {
            controllerState.setGearRatio(controller.gearRatio);
            controllerState.setWheelWidth(controller.tireWidth);
            controllerState.setWheelRatio(controller.tireAspectRatio);
            controllerState.setWheelRadius(controller.rimDiameter / 2);
        }
        updateUserController(controller);
    };

    return (
        <ScrollView
            className="flex-1 bg-background-0"
            keyboardShouldPersistTaps="never"
            automaticallyAdjustKeyboardInsets={true}
        >
            <View className="px-5 pt-6 pb-10 gap-6">
                <View className="rounded-3xl bg-secondary-100 px-6 py-8">
                    <Heading className="text-3xl font-semibold">
                        {t('controller.displayHeading', 'Display Preferences')}
                    </Heading>
                    <Text className="text-secondary-500 mt-3 text-base">
                        {t(
                            'controller.displaySubheading',
                            'Tune how telemetry and wheel geometry are rendered in your HUD.'
                        )}
                    </Text>
                </View>

                <View className="rounded-3xl bg-secondary-100 px-5 py-6 gap-4">
                    <Heading className="text-2xl font-semibold">
                        {t(
                            'controller.controllerIdentity',
                            'Controller Identity'
                        )}
                    </Heading>
                    <ListItem
                        iconStart
                        icon={LucideCpu}
                        title={t('controller.name')}
                        description={t('controller.controllerNameDescription')}
                        type="input"
                        props={{
                            value: controllerName,
                            onChangeText: (name: string) => {
                                setControllerName(name);
                                if (name) {
                                    updateUserController({
                                        serialNumber: controller.serialNumber,
                                        name,
                                    });
                                }
                            },
                        }}
                    />
                </View>

                <View className="rounded-3xl bg-secondary-100 px-5 py-6 gap-4">
                    <Heading className="text-2xl font-semibold">
                        {t('controller.displayOptionsTitle', 'Telemetry')}
                    </Heading>
                    <Text className="text-secondary-500 text-sm">
                        {t(
                            'controller.displayOptionsDescription',
                            'Choose how your speed is derived inside both portrait and landscape layouts.'
                        )}
                    </Text>
                    <ListItem
                        iconStart
                        icon={LucideGauge}
                        title={t('controller.preferGpsSpeed')}
                        description={t('controller.preferGpsSpeedDescription')}
                        type="switch"
                        props={{
                            value: preferGpsSpeed,
                            onValueChange: (enabled: boolean) => {
                                setGpsSpeedEnabled(enabled);
                                onGpsSpeedEnabledChange(enabled);
                            },
                        }}
                    />
                </View>

                <View className="rounded-3xl bg-secondary-100 px-5 py-6 gap-4">
                    <Heading className="text-2xl font-semibold">
                        {t('tire.tireDescription')}
                    </Heading>
                    <Text className="text-secondary-500 text-sm">
                        {t(
                            'tire.tireHelper',
                            'Correct tire dimensions keep distance, wh-per-mile, and speed estimates accurate.'
                        )}
                    </Text>
                    <ListItem
                        icon={LucideRuler}
                        iconStart
                        title={t('tire.width')}
                        description={t('tire.widthDescription')}
                        type="input"
                        props={{
                            value: tireWidth?.toString() || '',
                            placeholder: 'Tire Width (mm)',
                            keyboardType: 'numeric',
                            onChangeText: (text: string) => {
                                setTireWidth(text ? parseInt(text) : null);
                                updateController({
                                    serialNumber: controller.serialNumber,
                                    tireWidth: text ? parseInt(text) : null,
                                });
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
                            value: tireAspectRatio?.toString() || '',
                            placeholder: 'Aspect Ratio (%)',
                            keyboardType: 'numeric',
                            onChangeText: (text: string) => {
                                setTireAspectRatio(
                                    text ? parseInt(text) : null
                                );
                                updateController({
                                    serialNumber: controller.serialNumber,
                                    tireAspectRatio: text
                                        ? parseInt(text)
                                        : null,
                                });
                            },
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
                            value: rimDiameter?.toString() || '',
                            placeholder: 'Rim Diameter (inches)',
                            keyboardType: 'numeric',
                            onChangeText: (text: string) => {
                                setRimDiameter(text ? parseInt(text) : null);
                                updateController({
                                    serialNumber: controller.serialNumber,
                                    rimDiameter: text ? parseInt(text) : null,
                                });
                            },
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
                            value: gearRatio?.toString() || '',
                            placeholder: 'Gear Ratio',
                            keyboardType: 'numeric',
                            onChangeText: (text: string) => {
                                const formattedText = text.replace(
                                    /[^0-9.]/g,
                                    ''
                                );

                                if (
                                    (formattedText.match(/\./g) || []).length >
                                    1
                                ) {
                                    return;
                                }

                                setGearRatio(formattedText);

                                updateController({
                                    serialNumber: controller.serialNumber,
                                    gearRatio: formattedText,
                                });
                            },
                            className: 'text-typography-600 leading-1',
                        }}
                    />
                </View>
            </View>
        </ScrollView>
    );
});

DisplayOptions.displayName = 'DisplayOptions';

export default DisplayOptions;
