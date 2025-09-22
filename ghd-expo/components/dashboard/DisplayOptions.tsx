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

const DisplayOptions = memo(({ route }: { route: any }) => {
    const { t } = useTranslation();
    const { updateController: updateUserController } = useUser();
    const { controllerStates } = useDevices();
    const { controller, localName } = route.params;
    const [preferGpsSpeed, setGpsSpeedEnabled] = useState(
        controller.preferGpsSpeed
    );
    const [showSpeedOnRight, setShowSpeedOnRight] = useState(
        controller.showSpeedOnRight
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
            className="flex-1"
            keyboardShouldPersistTaps="never"
            automaticallyAdjustKeyboardInsets={true}
        >
            <View className="p-4">
                <Heading className="text-3xl">
                    {t('controller.controllerName')}
                </Heading>

                <ListItem
                    iconStart={true}
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

                <Heading className="text-3xl">
                    {t('controller.options')}
                </Heading>

                <ListItem
                    iconStart={true}
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

                <ListItem
                    iconStart={true}
                    icon={LucideGauge}
                    title={t('controller.speedOnRightInHorizontalMode')}
                    description={t(
                        'controller.speedOnRightInHorizontalModeDescription'
                    )}
                    type="switch"
                    props={{
                        value: showSpeedOnRight,
                        onValueChange: (enabled: boolean) => {
                            setShowSpeedOnRight(enabled);
                            updateController({
                                serialNumber: controller.serialNumber,
                                showSpeedOnRight: enabled,
                            });
                        },
                    }}
                />

                <Heading className="mt-4 text-3xl">
                    {t('tire.tireDescription')}
                </Heading>

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
                            setTireAspectRatio(text ? parseInt(text) : null);
                            updateController({
                                serialNumber: controller.serialNumber,
                                tireAspectRatio: text ? parseInt(text) : null,
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
                            // Allow only numbers and a single decimal point
                            const formattedText = text.replace(/[^0-9.]/g, '');

                            // Prevent leading zeros and multiple decimals
                            if ((formattedText.match(/\./g) || []).length > 1) {
                                return;
                            }

                            setGearRatio(formattedText); // Keep as string to preserve formatting

                            // Pass the string value directly without parsing
                            updateController({
                                serialNumber: controller.serialNumber,
                                gearRatio: formattedText, // Keep as string until needed for computation
                            });
                        },
                        className: 'text-typography-600 leading-1',
                    }}
                />
            </View>
        </ScrollView>
    );
});

DisplayOptions.displayName = 'DisplayOptions';

export default DisplayOptions;
