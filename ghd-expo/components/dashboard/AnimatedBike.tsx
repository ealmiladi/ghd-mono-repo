import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import React, { memo, useMemo } from 'react';
import LottieView from 'lottie-react-native';
import {
    Platform,
    useColorScheme,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    Canvas,
    Group,
    interpolateColors,
    Text,
    useFont,
} from '@shopify/react-native-skia';

const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const WIDTH = 160;
const STARTING_HEIGHT = 200;
const TEXT_HEIGHT_FROM_ANIMATED_BIKE = 150;
const WIDTH_OF_LETTER = 48;

const ANDROID_OFFSET = Platform.OS === 'android' ? 4 : 0;

const AnimatedBike = memo(
    ({
        rpmSharedValue,
        animatedBikeOpacity,
        wattsSharedValue,
        calculatedSpeedSharedValue,
        polePairsSharedValue,
        maxSpeedInRPM,
        gearMode,
        shouldShiftBike = true,
        preferredWidth,
    }: {
        rpmSharedValue: any;
        animatedBikeOpacity: any;
        wattsSharedValue: any;
        calculatedSpeedSharedValue: any;
        polePairsSharedValue: any;
        maxSpeedInRPM: any;
        gearMode: any;
        shouldShiftBike?: boolean;
        preferredWidth?: number;
    }) => {
        const colorScheme = useColorScheme(); // Hook for theme detection

        // Create a SharedValue for the animation speed
        const animationSpeed = useSharedValue(0);

        useDerivedValue(() => {
            const isReverse = gearMode === 'Reverse';
            const baseAnimationRpm =
                polePairsSharedValue.value >= 16 ? 100 : 400;
            const rpm = rpmSharedValue.value;
            animationSpeed.value = withTiming(
                rpm === 0
                    ? 0
                    : (rpm / baseAnimationRpm) * (!isReverse ? 1 : -1),
                {
                    duration: 100, // Adjust duration for smoothness
                }
            );
        });

        // Bind the SharedValue to Lottie `speed` prop using `useAnimatedProps`
        const animatedProps = useAnimatedProps(() => {
            return {
                speed: animationSpeed.value,
            };
        });

        const windowWidth = useWindowDimensions().width - 32;
        const width = preferredWidth ?? windowWidth;

        const animatedStyle = useAnimatedStyle(() => {
            return {
                width: withTiming(rpmSharedValue.value > 0 ? WIDTH : width, {
                    duration: 300,
                }),
                height: withTiming(STARTING_HEIGHT, {
                    duration: 300,
                }),
                opacity: animatedBikeOpacity.value,
                ...(shouldShiftBike && {
                    transform: [
                        {
                            translateX: withTiming(
                                rpmSharedValue.value > 0
                                    ? WIDTH_OF_LETTER *
                                          `${calculatedSpeedSharedValue.value}`
                                              .length +
                                          40
                                    : width / 2 - width / 2,
                                {
                                    duration: 300,
                                }
                            ),
                        },
                    ],
                }),
            };
        }, [rpmSharedValue, width, animatedBikeOpacity, shouldShiftBike]);

        // Define color filters dynamically based on the theme
        const colorFilters = useMemo(
            () => [
                {
                    keypath: 'l',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for layer
                },
                {
                    keypath: 'c',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for another layer
                },
                {
                    keypath: 'w',
                    color: colorScheme === 'dark' ? '#FFFFFF' : '#000000', // Dynamic color for additional layer
                },
            ],
            [colorScheme]
        );

        const font = useFont(
            require('../../assets/fonts/SpaceMono-Regular.ttf'),
            24
        );
        const font2 = useFont(
            require('../../assets/fonts/SpaceMono-Regular.ttf'),
            14
        );

        const rpmSharedValueAsString = useDerivedValue(() => {
            return `${rpmSharedValue.value.toFixed(0)}`;
        }, [rpmSharedValue]);

        const wattsSharedValueAsString = useDerivedValue(() => {
            return `${wattsSharedValue.value.toFixed(0)}`;
        }, [wattsSharedValue]);

        const translateX = useDerivedValue(() => {
            if (!shouldShiftBike) return 0;
            return withTiming(
                rpmSharedValue.value > 0
                    ? WIDTH_OF_LETTER *
                          `${calculatedSpeedSharedValue.value}`.length +
                          60
                    : width / 2 - WIDTH / 2,
                {
                    duration: 300,
                }
            );
        }, [rpmSharedValue, width, shouldShiftBike]);

        const groupTransform = useDerivedValue(() => {
            if (!shouldShiftBike) return [];
            return [
                {
                    translateX: translateX.value - 20,
                },
            ];
        }, [translateX, shouldShiftBike]);

        const distanceFromRpmNumber = useDerivedValue(() => {
            if (!font) return 0;
            const numbersInRPM = `${rpmSharedValue.value}`.split('');
            const measurements = numbersInRPM.map((number) => {
                return font.measureText(number);
            });
            return (
                measurements.reduce((acc, measurement) => {
                    return acc + measurement.width;
                }, 0) +
                ANDROID_OFFSET * 2
            );
        }, [calculatedSpeedSharedValue, rpmSharedValue, font]);

        const distanceFromRpmNumberForWatts = useDerivedValue(() => {
            return distanceFromRpmNumber.value + 40;
        }, [distanceFromRpmNumber]);

        const distanceFromRpmNumberForWattsLabel = useDerivedValue(() => {
            if (!font) return 0;
            const numbersInRPM = `${wattsSharedValue.value}`;
            const containsDash = numbersInRPM.includes('-');
            const measurements = font.measureText(numbersInRPM);
            return (
                distanceFromRpmNumberForWatts.value +
                ANDROID_OFFSET +
                measurements.width +
                (containsDash ? 2 : 0)
            );
        }, [distanceFromRpmNumberForWatts, font, wattsSharedValue]);

        const opacity = useDerivedValue(() => {
            if (rpmSharedValue.value === 0) {
                return withTiming(0, { duration: 150 });
            }
            return withTiming(1, { duration: 750 });
        }, [rpmSharedValue]);

        const rpmTextColor = useDerivedValue(() => {
            const black = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
            return interpolateColors(
                rpmSharedValue.value / maxSpeedInRPM.value,
                [0, 0.5, 1],
                [black, '#FFA500', '#FF0000']
            );
        }, [rpmSharedValue]);

        return (
            <View className="relative">
                <AnimatedLottieView
                    source={require('./color-bike.json')}
                    colorFilters={colorFilters}
                    animatedProps={animatedProps}
                    style={animatedStyle}
                />
                <Canvas
                    style={{
                        width: width,
                        height: TEXT_HEIGHT_FROM_ANIMATED_BIKE + 20,
                        position: 'absolute',
                        zIndex: 5,
                    }}
                >
                    {font && font2 && (
                        <Group opacity={opacity} transform={groupTransform}>
                            <Text
                                font={font}
                                x={0}
                                color={rpmTextColor}
                                y={TEXT_HEIGHT_FROM_ANIMATED_BIKE}
                                text={rpmSharedValueAsString}
                            />
                            <Text
                                font={font2}
                                x={distanceFromRpmNumber}
                                color={
                                    colorScheme === 'dark'
                                        ? '#8e8c8c'
                                        : '#000000'
                                }
                                y={TEXT_HEIGHT_FROM_ANIMATED_BIKE}
                                text="RPM"
                            />
                            <Text
                                font={font}
                                x={distanceFromRpmNumberForWatts}
                                color={
                                    colorScheme === 'dark'
                                        ? '#FFFFFF'
                                        : '#000000'
                                }
                                y={TEXT_HEIGHT_FROM_ANIMATED_BIKE}
                                text={wattsSharedValueAsString}
                            />
                            <Text
                                font={font2}
                                x={distanceFromRpmNumberForWattsLabel}
                                color={
                                    colorScheme === 'dark'
                                        ? '#8e8c8c'
                                        : '#000000'
                                }
                                y={TEXT_HEIGHT_FROM_ANIMATED_BIKE}
                                text="W"
                            />
                        </Group>
                    )}
                </Canvas>
            </View>
        );
    }
);

AnimatedBike.displayName = 'AnimatedBike';

export default AnimatedBike;
