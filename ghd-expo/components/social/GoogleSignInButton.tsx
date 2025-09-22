import { Alert, TouchableOpacity } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, signInWithCredential, GoogleAuthProvider } from '@react-native-firebase/auth';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { BFText } from '@/components/BFText';
import colors from 'tailwindcss/colors';

const GoogleSignInButton = ({ title, ...rest }: { title: string }) => {
    return (
        <TouchableOpacity
            {...rest}
            onPress={() => {
                (async () => {
                    try {
                        await GoogleSignin.hasPlayServices({
                            showPlayServicesUpdateDialog: true,
                        });
                        const data = await GoogleSignin.signIn();
                        const googleCredential =
                            GoogleAuthProvider.credential(data.idToken);

                        await signInWithCredential(getAuth(), googleCredential);
                    } catch (e) {
                        console.log(e);
                        Alert.alert(
                            'Error',
                            'There was an error signing in with Google.'
                        );
                    }
                })();
            }}
            style={{
                backgroundColor: '#EA4335',
            }}
            className="py-3 px-3 rounded-md w-full items-center justify-center flex-row gap-x-2"
        >
            <FontAwesome name={'google'} color={colors.white} size={12} />
            <BFText className={'font-bold text-center text-white'}>
                {title}
            </BFText>
        </TouchableOpacity>
    );
};

export default GoogleSignInButton;
