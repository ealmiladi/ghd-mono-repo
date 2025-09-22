import React, { memo, useMemo } from 'react';
import {
    CircleSlash2Icon,
    LucideChevronsDown,
    LucideChevronsUp,
    LucideGauge,
    LucideParkingCircle,
    LucideRocket,
} from 'lucide-react-native';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { useTranslation } from 'react-i18next';
import Animated, {
    SharedValue,
    useAnimatedProps,
    useAnimatedStyle,
    withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const GearIndicatorIcon = memo(
    ({
        motorCutoffApplied,
        gear,
        gearPower,
        textClass = 'text-lg',
    }: {
        motorCutoffApplied: SharedValue<boolean>;
        gear: string;
        gearPower: string;
        textClass?: string;
    }) => {
        const { t } = useTranslation();
        const icon = useMemo(() => {
            switch (gear) {
                case 'Cruise':
                    return LucideGauge;
                case 'Parked':
                    return LucideParkingCircle;
                case 'Neutral':
                    return CircleSlash2Icon;
                case 'Drive':
                    return LucideChevronsUp;
                case 'Reverse':
                    return LucideChevronsDown;
                case 'Boost':
                    return LucideRocket;
                default:
                    return LucideParkingCircle;
            }
        }, [gear]);

        const animatedMotorCutoffOpacity = useAnimatedStyle(() => {
            return {
                opacity: withTiming(motorCutoffApplied.value ? 1 : 0, {
                    duration: 300,
                }),
                width: 36,
                height: 36,
                top: -6,
                left: -6,
                position: 'absolute',
            };
        }, [motorCutoffApplied]);

        const animatedMotorCutOffProps = useAnimatedProps(() => {
            return {
                speed: motorCutoffApplied.value ? 2 : 0,
            };
        }, [motorCutoffApplied]);

        return (
            <View className="flex-row items-center justify-center gap-2">
                <Text
                    className={`text-secondary-400 font-bold uppercase tracking-widest ${textClass}`}
                >
                    {t(`gears.${gear.toLowerCase()}`)}
                </Text>
                <View className="relative">
                    <Icon size={24} as={icon} className="text-secondary-600" />
                    <AnimatedLottieView
                        source={require('./motor-cut-off.json')}
                        style={animatedMotorCutoffOpacity}
                        loop={false}
                        speed={2}
                        autoPlay={true}
                        animatedProps={animatedMotorCutOffProps}
                    />
                </View>
                {!isNaN(parseInt(gearPower!)) && (
                    <Text
                        className={`font-bold text-secondary-500 ${textClass}`}
                    >
                        {gearPower}
                    </Text>
                )}
            </View>
        );
    }
);

GearIndicatorIcon.displayName = 'GearIndicatorIcon';

export default GearIndicatorIcon;
