import { memo, ReactElement, useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import Clock from '@/components/dashboard/Clock';

const Row = memo(
    ({
        label,
        value,
        index,
        isClock = false,
        columns = 3,
    }: {
        label: string | ReactElement;
        value: string | number | undefined;
        index: number;
        isClock?: boolean;
        columns?: 1 | 3;
    }) => {
        // three columns in every row, so we need to determine if this is the middle column

        const { isMiddle, isLeft } = useMemo(() => {
            if (columns === 3) {
                return {
                    isMiddle: index % 3 === 1,
                    isLeft: index % 3 === 0,
                };
            }
            return {
                isMiddle: false,
                isLeft: true,
            };
        }, [columns, index]);

        return (
            <View className={columns === 3 ? 'w-1/3' : 'w-full'}>
                <Text
                    className={`${isMiddle ? 'text-center' : !isLeft ? 'text-right' : ''} text-secondary-600 text-sm font-bold uppercase`}
                >
                    {label}
                </Text>
                {isClock ? (
                    <Clock
                        startTime={value}
                        className={`text-secondary-500 text-lg font-bold ${isMiddle ? 'text-center' : !isLeft ? 'text-right' : ''}`}
                    />
                ) : (
                    <Text
                        className={`${isMiddle ? 'text-center' : !isLeft ? 'text-right' : ''} text-secondary-500 text-lg font-bold`}
                    >
                        {value}
                    </Text>
                )}
            </View>
        );
    }
);

Row.displayName = 'Row';

export default Row;
