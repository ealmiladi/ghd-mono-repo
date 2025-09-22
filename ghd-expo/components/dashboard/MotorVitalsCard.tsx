import React, { useCallback, useMemo, useState } from 'react';
import {
    Canvas,
    Group,
    RoundedRect,
    Text,
    useFont,
} from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import { useDerivedValue } from 'react-native-reanimated';
import { useColorScheme, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

type MotorVitalsCardProps = {
    rpmSharedValue: SharedValue<number>;
    wattsSharedValue: SharedValue<number>;
    motorTemperatureCelcius: number | undefined;
    controllerTemperatureCelcius: number | undefined;
    prefersFahrenheit: boolean;
    rpmLabel: string;
    wattsLabel: string;
    motorTempLabel: string;
    controllerTempLabel: string;
    style?: StyleProp<ViewStyle>;
};

const CARD_HEIGHT = 200;
const PADDING = 24;

const formatMetric = (value: number): string => {
    'worklet';
    if (!Number.isFinite(value)) {
        return '--';
    }
    if (Math.abs(value) >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return `${Math.round(value)}`;
};

const MotorVitalsCard = (props: MotorVitalsCardProps) => {
    const {
        rpmSharedValue,
        wattsSharedValue,
        motorTemperatureCelcius,
        controllerTemperatureCelcius,
        prefersFahrenheit,
        rpmLabel,
        wattsLabel,
        motorTempLabel,
        controllerTempLabel,
        style,
    } = props;

    const [canvasWidth, setCanvasWidth] = useState(0);
    const colorScheme = useColorScheme();
    const titleFont = useFont(
        require('../../assets/fonts/SpaceMono-Regular.ttf'),
        12
    );
    const valueFont = useFont(
        require('../../assets/fonts/SpaceMono-Bold.ttf'),
        34
    );

    const secondaryFont = useFont(
        require('../../assets/fonts/SpaceMono-Regular.ttf'),
        10
    );

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const width = event?.nativeEvent?.layout?.width ?? 0;
        if (width && width !== canvasWidth) {
            setCanvasWidth(width);
        }
    }, [canvasWidth]);

    const canvasBackground = useMemo(
        () => (colorScheme === 'dark' ? '#111827' : '#F9FAFB'),
        [colorScheme]
    );

    const accentColor = useMemo(
        () => (colorScheme === 'dark' ? '#2563EB' : '#1D4ED8'),
        [colorScheme]
    );

    const strokeColor = useMemo(
        () => (colorScheme === 'dark' ? '#1F2937' : '#E5E7EB'),
        [colorScheme]
    );

    const textColor = useMemo(
        () => (colorScheme === 'dark' ? '#E5E7EB' : '#1F2937'),
        [colorScheme]
    );

    const rpmText = useDerivedValue(() => {
        return formatMetric(rpmSharedValue?.value ?? 0);
    }, [rpmSharedValue]);

    const wattsText = useDerivedValue(() => {
        return formatMetric(wattsSharedValue?.value ?? 0);
    }, [wattsSharedValue]);

    const motorTempDisplay = useMemo(() => {
        if (motorTemperatureCelcius === undefined) {
            return '--';
        }
        const converted = prefersFahrenheit
            ? motorTemperatureCelcius * 1.8 + 32
            : motorTemperatureCelcius;
        const unit = prefersFahrenheit ? '°F' : '°C';
        return `${Math.round(converted)}${unit}`;
    }, [motorTemperatureCelcius, prefersFahrenheit]);

    const controllerTempDisplay = useMemo(() => {
        if (controllerTemperatureCelcius === undefined) {
            return '--';
        }
        const converted = prefersFahrenheit
            ? controllerTemperatureCelcius * 1.8 + 32
            : controllerTemperatureCelcius;
        const unit = prefersFahrenheit ? '°F' : '°C';
        return `${Math.round(converted)}${unit}`;
    }, [controllerTemperatureCelcius, prefersFahrenheit]);

    const resolveTemperatureColor = useCallback((value?: number) => {
        if (value === undefined) {
            return textColor;
        }
        if (value < 60) {
            return '#10B981';
        }
        if (value < 80) {
            return '#F59E0B';
        }
        return '#DC2626';
    }, [textColor]);

    const controllerTempColor = useMemo(
        () => resolveTemperatureColor(controllerTemperatureCelcius),
        [controllerTemperatureCelcius, resolveTemperatureColor]
    );

    const motorTempColor = useMemo(
        () => resolveTemperatureColor(motorTemperatureCelcius),
        [motorTemperatureCelcius, resolveTemperatureColor]
    );

    if (!titleFont || !valueFont || !secondaryFont) {
        return null;
    }

    return (
        <View
            className="w-full"
            style={[{ flexGrow: 1, alignSelf: 'stretch', minHeight: CARD_HEIGHT }, style]}
            onLayout={onLayout}
        >
            {canvasWidth > 0 && (
                <Canvas style={{ width: canvasWidth, height: CARD_HEIGHT }}>
                    <Group>
                        <RoundedRect
                            x={0}
                            y={0}
                            width={canvasWidth}
                            height={CARD_HEIGHT}
                            r={24}
                            color={canvasBackground}
                        />
                        <RoundedRect
                            x={PADDING}
                            y={PADDING + (CARD_HEIGHT - PADDING * 2) / 2}
                            width={canvasWidth - PADDING * 2}
                            height={1}
                            r={0.5}
                            color={strokeColor}
                        />
                        <RoundedRect
                            x={canvasWidth / 2}
                            y={PADDING}
                            width={1}
                            height={CARD_HEIGHT - PADDING * 2}
                            r={0.5}
                            color={strokeColor}
                        />

                        {/* RPM */}
                        <Text
                            x={PADDING}
                            y={PADDING + titleFont.getSize()}
                            text={rpmLabel.toUpperCase()}
                            font={titleFont}
                            color={textColor}
                        />
                        <Text
                            x={PADDING}
                            y={PADDING + titleFont.getSize() + valueFont.getSize() + 6}
                            text={rpmText}
                            font={valueFont}
                            color={accentColor}
                        />
                        <Text
                            x={PADDING}
                            y={
                                PADDING +
                                titleFont.getSize() +
                                valueFont.getSize() +
                                10 +
                                secondaryFont.getSize()
                            }
                            text="RPM"
                            font={secondaryFont}
                            color={textColor}
                        />

                        {/* Watts */}
                        <Text
                            x={canvasWidth / 2 + PADDING / 2}
                            y={PADDING + titleFont.getSize()}
                            text={wattsLabel.toUpperCase()}
                            font={titleFont}
                            color={textColor}
                        />
                        <Text
                            x={canvasWidth / 2 + PADDING / 2}
                            y={
                                PADDING +
                                titleFont.getSize() +
                                valueFont.getSize() +
                                6
                            }
                            text={wattsText}
                            font={valueFont}
                            color={accentColor}
                        />
                        <Text
                            x={canvasWidth / 2 + PADDING / 2}
                            y={
                                PADDING +
                                titleFont.getSize() +
                                valueFont.getSize() +
                                10 +
                                secondaryFont.getSize()
                            }
                            text="W"
                            font={secondaryFont}
                            color={textColor}
                        />

                        {/* Controller Temperature */}
                        <Text
                            x={PADDING}
                            y={
                                CARD_HEIGHT / 2 +
                                PADDING +
                                titleFont.getSize()
                            }
                            text={controllerTempLabel.toUpperCase()}
                            font={titleFont}
                            color={textColor}
                        />
                        <Text
                            x={PADDING}
                            y={
                                CARD_HEIGHT / 2 +
                                PADDING +
                                titleFont.getSize() +
                                valueFont.getSize() +
                                6
                            }
                            text={controllerTempDisplay}
                            font={valueFont}
                            color={controllerTempColor}
                        />

                        {/* Motor Temperature */}
                        <Text
                            x={canvasWidth / 2 + PADDING / 2}
                            y={
                                CARD_HEIGHT / 2 +
                                PADDING +
                                titleFont.getSize()
                            }
                            text={motorTempLabel.toUpperCase()}
                            font={titleFont}
                            color={textColor}
                        />
                        <Text
                            x={canvasWidth / 2 + PADDING / 2}
                            y={
                                CARD_HEIGHT / 2 +
                                PADDING +
                                titleFont.getSize() +
                                valueFont.getSize() +
                                6
                            }
                            text={motorTempDisplay}
                            font={valueFont}
                            color={motorTempColor}
                        />
                    </Group>
                </Canvas>
            )}
        </View>
    );
};

export default MotorVitalsCard;
