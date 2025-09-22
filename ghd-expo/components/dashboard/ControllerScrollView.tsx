import ControllerFault from '@/components/dashboard/ControllerFault';
import Animated, {
    FadeInUp,
    FadeOutUp,
    useAnimatedScrollHandler,
} from 'react-native-reanimated';
import CurrentTripDisplay from '@/components/dashboard/CurrentTripDisplay';
import { Linking, TouchableOpacity, View } from 'react-native';
import ListItem from '@/components/dashboard/ListItem';
import {
    LucideChevronRight,
    LucideCog,
    LucideCpu,
    LucideX,
    LucideZap,
} from 'lucide-react-native';
import React, { memo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/providers/UserContextProvider';
import AlertDialog from '@/components/dashboard/AlertDialog';
import { Device } from 'react-native-ble-plx';

const BUSINESS_EMAIL = 'ealmiladi@gmail.com';

const AnimatedScrollView = Animated.ScrollView;

const ControllerScrollView = memo(
    ({
        device,
        paddingTop,
        scrollPosition,
        controllerFaults,
        currentTrip,
        controller,
        onEndTrip,
        isEndingTrip,
        onOpenHud,
    }: {
        device: Device;
        controller: any;
        paddingTop: number;
        scrollPosition: any;
        controllerFaults: any;
        currentTrip: any;
        onEndTrip: () => Promise<void>;
        isEndingTrip: boolean;
        onOpenHud: () => void;
    }) => {
        const [isUnbindModalOpen, setUnbindModalOpen] = useState(false);
        const { prefersMph, unbindController } = useUser();
        const { t } = useTranslation();
        const navigation: any = useNavigation();
        const onScroll = useAnimatedScrollHandler((event) => {
            const y = event.contentOffset.y;
            if (y > 0) {
                scrollPosition.value = event.contentOffset.y;
            }
        }, []);

        const onUnboundConfirmed = async () => {
            try {
                if (device) {
                    await device.cancelConnection();
                }
                await unbindController(controller.serialNumber);
                setUnbindModalOpen(false);
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <AnimatedScrollView
                contentContainerStyle={{
                    paddingTop,
                }}
                showsVerticalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >
                {controllerFaults.map((fault: any, index: number) => (
                    <ControllerFault key={index} fault={fault} />
                ))}
                {currentTrip && (
                    <Animated.View
                        entering={FadeInUp}
                        exiting={FadeOutUp}
                        className="p-4"
                    >
                        <CurrentTripDisplay
                            currentTrip={currentTrip}
                            onEndTrip={onEndTrip}
                            isEndingTrip={isEndingTrip}
                            onOpenHud={onOpenHud}
                        />
                    </Animated.View>
                )}
                <View className="px-8 mt-2">
                    <ListItem
                        title={t('controller.tripsAndConsumption')}
                        icon={LucideZap}
                        description={t('controller.viewTripsAndConsumption')}
                        onPress={() => {
                            navigation.navigate('Trips', {
                                serialNumber: controller.serialNumber,
                            });
                        }}
                        rightIcon={LucideChevronRight}
                    />
                    <ListItem
                        title={t('controller.options')}
                        icon={LucideCog}
                        description={t('controller.viewOptions')}
                        onPress={() => {
                            navigation.navigate('DisplayOptions' as never, {
                                controller,
                                localName: controller.localName,
                            });
                        }}
                        rightIcon={LucideChevronRight}
                    />

                    <ListItem
                        title={t('controller.removeAccess')}
                        icon={LucideCpu}
                        rightIcon={LucideX}
                        description={t('controller.removeAccessDescription')}
                        onPress={() => {
                            setUnbindModalOpen(true);
                        }}
                    />

                    <View className="mt-8">
                        <Heading className="font-bold text-secondary-600">
                            {controller.name}
                        </Heading>
                        <View>
                            <Text className="text-secondary-500 font-semibold text-sm">
                                {controller.serialNumber}
                            </Text>
                            <Text className="text-secondary-500 font-semibold text-sm">
                                {(controller.odometerInMeters || 0) *
                                    (prefersMph ? 0.000621371 : 0.001)}
                                {prefersMph ? 'mi' : 'km'}
                            </Text>
                        </View>
                    </View>

                    <View className="mt-8 mb-16">
                        <Heading className="font-bold text-secondary-600 text-sm">
                            GDriver v{require('../../app.json').expo.version}
                        </Heading>
                        <View>
                            <Text className="text-secondary-500 text-sm">
                                {t('common.businessInquiry')}:
                            </Text>
                            <TouchableOpacity
                                className="self-start py-0"
                                onPress={() => {
                                    Linking.openURL(`mailto:${BUSINESS_EMAIL}`);
                                }}
                            >
                                <Text className="text-secondary-600 text-sm">
                                    {BUSINESS_EMAIL}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <AlertDialog
                    heading={t('devices.unbindModalTitle')}
                    description={t('devices.unbindModalDescription')}
                    buttonTitle={t('common.continue')}
                    cancelButtonTitle={t('common.cancel')}
                    isOpen={isUnbindModalOpen}
                    onButtonClick={onUnboundConfirmed}
                    setOpen={() => setUnbindModalOpen(false)}
                />
            </AnimatedScrollView>
        );
    }
);

ControllerScrollView.displayName = 'ControllerScrollView';

export default ControllerScrollView;
