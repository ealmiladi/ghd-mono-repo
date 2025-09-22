import {TextInput, TextInputProps, TextProps, useColorScheme} from "react-native";
import colors from "tailwindcss/colors";

const BFTextInput = ({...rest}: TextInputProps) => {
    const colorScheme = useColorScheme();
    return <TextInput placeholderTextColor={
        colorScheme === 'dark' ? colors.gray[400] : colors.gray[600]
    } className={'border border-gray-300 dark:border-gray-400 rounded-md py-2.5 px-2 bg-white dark:bg-gray-700 dark:text-white'} {...rest} />
};

export default BFTextInput;
