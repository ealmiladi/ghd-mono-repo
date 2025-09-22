import React, { useEffect, useMemo } from 'react';
import {
    Canvas,
    Glyph,
    Glyphs,
    Text,
    useFont,
    vec,
} from '@shopify/react-native-skia';
import {
    SharedValue,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useColorScheme } from 'react-native';

const NUMBER_OF_GLYPHS = 4;
const ARRAY_OF_GLYPHS = Array.from(
    { length: NUMBER_OF_GLYPHS },
    (_, i) => i
).reverse();

const ROTATABLE_ITEMS = '0123456789.,';

type NumberTickerProps = {
    sharedValue: SharedValue<number>;
    duration?: number;
    fontSize?: number;
    hideWhenZero?: boolean;
    width?: number;
};

export const NumberTicker = ({
    sharedValue,
    duration = 250,
    fontSize = 84,
    hideWhenZero = true,
    width,
}: NumberTickerProps) => {
    const number = sharedValue;
    const negativeSymbolWidth = useSharedValue(0);
    const isNegative = useSharedValue(false);
    const minimumOffset = useSharedValue(0);
    const widths = useSharedValue<number[]>([]);
    const font = useFont(
        require('../../assets/fonts/SpaceMono-Regular.ttf'),
        fontSize
    );

    const positions = useDerivedValue(() => {
        function currencyFormat(num: number) {
            return num.toFixed(0).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
        }

        const chars = currencyFormat(Math.abs(number.value))
            .split('')
            .reverse();
        const totalWidth = chars.reduce(
            (acc, char) => acc + widths.value[ROTATABLE_ITEMS.indexOf(char)],
            0
        );
        let offsetX = (number.value < 0 ? negativeSymbolWidth.value : 0) * -1;
        isNegative.value = number.value < 0;
        minimumOffset.value = offsetX * -1;
        return chars.map((char) => {
            const charIndex = ROTATABLE_ITEMS.indexOf(char);
            const textWidth = widths.value[charIndex];
            const newPosition = {
                translateY: (charIndex || 0) * fontSize * -1 + fontSize,
                translateX: totalWidth - offsetX - textWidth,
                isNumeric: !isNaN(Number(char)),
            };
            offsetX += textWidth || 0;
            return newPosition;
        });
    }, [font, number]);

    const negativePositionX: any = useDerivedValue(
        () =>
            withTiming(isNegative.value ? 0 : -negativeSymbolWidth.value, {
                duration,
            }),
        [isNegative, negativeSymbolWidth]
    );

    const negativeOpacityShared: any = useDerivedValue(
        () =>
            withTiming(isNegative.value ? 1 : 0, {
                duration,
            }),
        [isNegative]
    );

    const glyphs = useMemo(
        () =>
            font?.getGlyphIDs(ROTATABLE_ITEMS).map(
                (id: number, i: number): Glyph => ({
                    id,
                    pos: vec(0, i * fontSize),
                })
            ),
        [font]
    );

    useEffect(() => {
        if (font && glyphs) {
            widths.value = font.getGlyphWidths(glyphs.map((g) => g.id));
            negativeSymbolWidth.value = font.measureText('-').width;
        }
    }, [glyphs, font]);

    if (!font) {
        return null;
    }

    const offsetY = fontSize - 6;

    const canvasWidth = width ?? fontSize * 3;

    return (
        <Canvas style={{ height: fontSize, width: canvasWidth }}>
            <Text
                font={font}
                opacity={negativeOpacityShared}
                x={negativePositionX}
                y={offsetY}
                text="-"
            />
            {ARRAY_OF_GLYPHS.map((i) => (
                <IndividualGlyph
                    duration={duration}
                    glyphs={glyphs}
                    positions={positions}
                    index={i}
                    key={i}
                    offsetX={minimumOffset}
                    offsetY={offsetY}
                    font={font}
                    fontSize={fontSize}
                />
            ))}
        </Canvas>
    );
};

const IndividualGlyph = ({
    offsetX,
    glyphs,
    positions,
    index,
    font,
    duration,
}: any) => {
    const colorScheme = useColorScheme();
    const color = colorScheme === 'dark' ? 'white' : 'black';
    const x: any = useDerivedValue(() => {
        const position = positions.value[index];
        if (!position) {
            return withTiming(offsetX.value, { duration: duration / 2 });
        }
        return withTiming(position.translateX, { duration: duration / 2 });
    }, [positions]);

    const y: any = useDerivedValue(() => {
        const position = positions.value[index];
        if (!position) {
            return withTiming(0, { duration });
        }
        if (!position.isNumeric) {
            return position.translateY;
        }
        return withTiming(position.translateY, { duration });
    });

    const opacity: any = useDerivedValue(() => {
        const position = positions.value[index];
        if (!position) {
            return withTiming(0, { duration: duration / 2 });
        }
        return withTiming(1, { duration: duration / 2 });
    }, [positions]);

    const style = useDerivedValue(() => {
        return [{ translateX: x.value }, { translateY: y.value }];
    }, [x, y]);

    return (
        <Glyphs
            y={-6}
            font={font}
            color={color}
            glyphs={glyphs}
            transform={style}
            opacity={opacity}
        />
    );
};

export default NumberTicker;
