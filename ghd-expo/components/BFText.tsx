import { Text, type TextProps, useColorScheme } from 'react-native'

export function BFText({ ...rest }: TextProps) {
    return (
        <Text
            {...rest}
            className={`text-gray-700  text-primary-500 dark:text-white ${rest.className}`}
        />
    )
}
