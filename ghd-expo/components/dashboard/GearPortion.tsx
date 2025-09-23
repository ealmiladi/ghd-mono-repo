import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import GearIndicatorIcon from '@/components/dashboard/GearIndicatorIcon';
import React from 'react';

const GearPortion = ({
    motorCutoffApplied,
    currentGear,
    currentGearPower,
    hasReceivedBatteryInformation,
    textClass = 'text-lg',
    emphasize = false,
}) => {
    return (
        <View className="h-8">
            {hasReceivedBatteryInformation && currentGear !== null ? (
                <Animated.View
                    entering={FadeIn}
                    exiting={FadeOut}
                    className="flex-row items-center mt-1"
                >
                    <GearIndicatorIcon
                        textClass={emphasize ? 'text-xl font-semibold' : textClass}
                        motorCutoffApplied={motorCutoffApplied}
                        gear={currentGear}
                        gearPower={currentGearPower!}
                    />
                </Animated.View>
            ) : (
                <View style={{ height: 24.7 }} />
            )}
        </View>
    );
};

export default GearPortion;
