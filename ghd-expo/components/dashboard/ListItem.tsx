import { TouchableOpacity, View } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Spinner } from '@/components/ui/spinner';
import { Input, InputField } from '@/components/ui/input';
import React from 'react';
import { Switch } from '@/components/ui/switch';

const ListItem = ({
    title,
    description,
    icon,
    onPress,
    rightIcon = null,
    loading = false,
    type = 'text',
    props,
    iconStart = false,
    children,
}: {
    title: string;
    iconStart?: boolean;
    description?: string | number;
    icon?: any;
    onPress?: () => void;
    rightIcon?: any;
    loading?: boolean;
    type?: 'text' | 'input' | 'switch';
    props?: any;
    children?: any;
}) => {
    const Component = onPress ? TouchableOpacity : View;
    return (
        <Component
            {...(onPress && {
                onPress,
            })}
        >
            <View
                className={`flex-row gap-4 py-4 ${iconStart ? 'items-start' : 'items-center'}`}
            >
                {icon && (
                    <Icon as={icon} size={30} className="text-secondary-500" />
                )}
                <View className="flex-1">
                    <Text className="text-primary-400 text-xl font-bold">
                        {title}
                    </Text>
                    {!!description && (
                        <Text className="text-secondary-500 font-semibold">
                            {description}
                        </Text>
                    )}
                    {type === 'input' && (
                        <Input className="mt-2">
                            <InputField type="text" {...props} />
                        </Input>
                    )}
                </View>
                {type === 'switch' && <Switch {...props} className="mt-2" />}
                {!loading && rightIcon && (
                    <Icon
                        as={rightIcon}
                        size={30}
                        className="text-secondary-500"
                    />
                )}
                {loading && <Spinner size="small" />}
            </View>
            {children}
        </Component>
    );
};

export default ListItem;
