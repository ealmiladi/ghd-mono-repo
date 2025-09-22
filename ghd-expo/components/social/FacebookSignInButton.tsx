import { Alert, TouchableOpacity } from 'react-native';
import auth from '@react-native-firebase/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BFText } from '@/components/BFText';
import colors from 'tailwindcss/colors';

const FacebookSignInButton = ({ title, ...rest }: { title: string }) => {
    return (
        <TouchableOpacity
            {...rest}
            onPress={() => {}}
            style={{
                backgroundColor: '#4267B2',
            }}
            className="py-3 px-3 rounded-md w-full items-center justify-center flex-row gap-x-2"
        >
            <FontAwesome name={'facebook'} color={colors.white} size={12} />
            <BFText className={'font-bold text-center text-white'}>
                {title}
            </BFText>
        </TouchableOpacity>
    );
};

export default FacebookSignInButton;
