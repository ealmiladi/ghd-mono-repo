import React from 'react';
import {
    Canvas,
    RoundedRect,
    Group,
    useFont,
    Text,
} from '@shopify/react-native-skia';
import Animated, {
    Easing,
    FadeIn,
    useDerivedValue,
    withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';

const AnimatedHorizontalBars = ({
    lineCurrent,
    phaseA,
    phaseC,
    maxLine,
    maxPhase,
    width = 150,
}) => {
    const barHeight = 42;
    const spacing = 8;
    const canvasWidth = width;
    const totalHeight = (barHeight + spacing) * 3;
    const fontSize = 16;
    const cornerRadius = 12;
    const colorScheme = useColorScheme(); // Hook for theme detection

    // useEffect(() => {
    //     if (!lineCurrent || !phaseA || !phaseC) return;
    //     if (!(maxPhase > 0 && maxLine > 0)) {
    //         return;
    //     }
    //     setInterval(() => {
    //         lineCurrent.value = Math.floor(Math.random() * maxLine);
    //         phaseA.value = Math.floor(Math.random() * maxPhase);
    //         phaseC.value = Math.floor(Math.random() * maxPhase);
    //     }, 1000);
    // }, [lineCurrent, maxLine, maxPhase, phaseA, phaseC]);

    // Normalize the shared values with timing
    const normalizedLineCurrent = useDerivedValue(() => {
        if (!lineCurrent || !maxLine) return 0;
        return withTiming((lineCurrent.value / maxLine) * canvasWidth, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [lineCurrent, maxLine, canvasWidth]);

    const normalizedPhaseA = useDerivedValue(() => {
        if (!phaseA || !maxPhase) return 0;
        return withTiming((phaseA.value / maxPhase) * canvasWidth, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [phaseA, maxPhase, canvasWidth]);

    const normalizedPhaseC = useDerivedValue(() => {
        if (!phaseC || !maxPhase) return 0;
        return withTiming((phaseC.value / maxPhase) * canvasWidth, {
            duration: 500,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
    }, [phaseC, maxPhase, canvasWidth]);

    const lineCurrentAsString = useDerivedValue(() => {
        return `${lineCurrent.value}A`;
    }, [lineCurrent]);

    const phaseAAsString = useDerivedValue(() => {
        return `${phaseA.value}A`;
    }, [phaseA]);

    const phaseCAsString = useDerivedValue(() => {
        return `${phaseC.value}A`;
    }, [phaseC]);

    const font = useFont(
        require('../../assets/fonts/SpaceMono-Bold.ttf'),
        fontSize
    );

    const font2 = useFont(
        require('../../assets/fonts/SpaceMono-Regular.ttf'),
        fontSize - 4
    );

    const rect1 = useDerivedValue(() => {
        return {
            rect: {
                x: 0,
                y: 0,
                width: isNaN(normalizedLineCurrent.value)
                    ? 0
                    : normalizedLineCurrent.value,
                height: barHeight,
            },
            topLeft: { x: 0, y: 0 },
            topRight: { x: cornerRadius, y: cornerRadius },
            bottomRight: { x: cornerRadius, y: cornerRadius },
            bottomLeft: { x: 0, y: 0 },
        };
    }, [normalizedLineCurrent, barHeight, spacing, cornerRadius]);

    const rect2 = useDerivedValue(() => {
        return {
            rect: {
                x: 0,
                y: barHeight + spacing - 1,
                width: isNaN(normalizedPhaseA.value)
                    ? 0
                    : normalizedPhaseA.value,
                height: barHeight,
            },
            topLeft: { x: 0, y: 0 },
            topRight: { x: cornerRadius, y: cornerRadius },
            bottomRight: { x: cornerRadius, y: cornerRadius },
            bottomLeft: { x: 0, y: 0 },
        };
    }, [normalizedPhaseA, barHeight, spacing, cornerRadius]);

    const rect4 = useDerivedValue(() => {
        return {
            rect: {
                x: 0,
                y: (barHeight + spacing) * 2 - 1,
                width: isNaN(normalizedPhaseC.value)
                    ? 0
                    : normalizedPhaseC.value,
                height: barHeight,
            },
            topLeft: { x: 0, y: 0 },
            topRight: { x: cornerRadius, y: cornerRadius },
            bottomRight: { x: cornerRadius, y: cornerRadius },
            bottomLeft: { x: 0, y: 0 },
        };
    }, [normalizedPhaseC, barHeight, spacing, cornerRadius]);

    const createRRectF = (width, yPosition) => ({
        rect: { x: 0, y: yPosition, width, height: barHeight },
        topLeft: { x: cornerRadius, y: cornerRadius },
        topRight: { x: cornerRadius, y: cornerRadius },
        bottomRight: { x: cornerRadius, y: cornerRadius },
        bottomLeft: { x: cornerRadius, y: cornerRadius },
    });

    const fontColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';
    const bgColor = '#D1D5DB';

    if (!font || !font2) return null;

    return (
        maxPhase &&
        maxLine && (
            <Animated.View entering={FadeIn}>
                <Canvas style={{ width: canvasWidth, height: totalHeight }}>
                    <Group>
                        {/* Line Current Bar */}
                        <RoundedRect
                            rect={createRRectF(canvasWidth, 0)}
                            color={bgColor}
                            opacity={0.2}
                        />
                        <RoundedRect rect={rect1} color="#EF4444" />
                        <Text
                            x={8}
                            y={barHeight / 2 + fontSize / 2 - 1}
                            text={lineCurrentAsString}
                            font={font}
                            color={fontColor}
                        />
                        <Text
                            x={
                                canvasWidth / 2 -
                                font2.measureText('Line').width / 2
                            }
                            y={barHeight / 2 + fontSize / 2 - 2}
                            text="Line"
                            font={font2}
                            color={fontColor}
                        />
                        <Text
                            x={
                                canvasWidth -
                                font.measureText(`${maxLine}A`).width -
                                8
                            }
                            y={barHeight / 2 + fontSize / 2 - 1}
                            text={`${maxLine}A`}
                            font={font}
                            color={fontColor}
                        />

                        {/* Phase A Bar */}
                        <RoundedRect
                            rect={createRRectF(
                                canvasWidth,
                                barHeight + spacing
                            )}
                            color={bgColor}
                            opacity={0.2}
                        />
                        <RoundedRect rect={rect2} color="#3B82F6" />
                        <Text
                            x={8}
                            y={
                                barHeight +
                                spacing +
                                barHeight / 2 +
                                fontSize / 2 -
                                1
                            }
                            text={phaseAAsString}
                            font={font}
                            color={fontColor}
                        />
                        <Text
                            x={
                                canvasWidth / 2 -
                                font2.measureText('Phase A').width / 2
                            }
                            y={
                                barHeight +
                                spacing +
                                barHeight / 2 +
                                fontSize / 2 -
                                2
                            }
                            text="Phase A"
                            font={font2}
                            color={fontColor}
                        />

                        <Text
                            x={
                                canvasWidth -
                                font.measureText(`${maxPhase}A`).width -
                                8
                            }
                            y={
                                barHeight +
                                spacing +
                                barHeight / 2 +
                                fontSize / 2 -
                                1
                            }
                            text={`${maxPhase}A`}
                            font={font}
                            color={fontColor}
                        />

                        {/* Phase C Bar */}
                        <RoundedRect
                            rect={createRRectF(
                                canvasWidth,
                                (barHeight + spacing) * 2
                            )}
                            color={bgColor}
                            opacity={0.2}
                        />
                        <RoundedRect rect={rect4} color="#EAB308" />
                        <Text
                            x={8}
                            y={
                                (barHeight + spacing) * 2 +
                                barHeight / 2 +
                                fontSize / 2 -
                                1
                            }
                            text={phaseCAsString}
                            font={font}
                            color={fontColor}
                        />
                        <Text
                            x={
                                canvasWidth / 2 -
                                font2.measureText('Phase C').width / 2
                            }
                            y={
                                (barHeight + spacing) * 2 +
                                barHeight / 2 +
                                fontSize / 2 -
                                2
                            }
                            text="Phase C"
                            font={font2}
                            color={fontColor}
                        />
                        <Text
                            x={
                                canvasWidth -
                                font.measureText(`${maxPhase}A`).width -
                                8
                            }
                            y={
                                (barHeight + spacing) * 2 +
                                barHeight / 2 +
                                fontSize / 2 -
                                1
                            }
                            text={`${maxPhase}A`}
                            font={font}
                            color={fontColor}
                        />
                    </Group>
                </Canvas>
            </Animated.View>
        )
    );
};

export default AnimatedHorizontalBars;
