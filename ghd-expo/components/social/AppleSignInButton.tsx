import { Alert, StyleSheet, useColorScheme } from 'react-native';
import { getAuth, signInWithCredential, OAuthProvider } from '@react-native-firebase/auth';
import {
    AppleAuthenticationButton,
    AppleAuthenticationButtonStyle,
    AppleAuthenticationButtonType,
    AppleAuthenticationScope,
    signInAsync,
} from 'expo-apple-authentication';

const AppleSignInButton = ({
    buttonType,
}: {
    buttonType: AppleAuthenticationButtonType;
}) => {
    const colorScheme = useColorScheme();
    const onPress = async () => {
        try {
            const { state, identityToken } = await signInAsync({
                requestedScopes: [AppleAuthenticationScope.EMAIL],
            });

            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({
                idToken: identityToken,
                rawNonce: state || undefined
            });

            const data = await signInWithCredential(getAuth(), credential);
            return data;
        } catch (e) {
            console.log(e);
            Alert.alert('Error', 'There was an error signing in with Apple.');
        }
    };
    return (
        <AppleAuthenticationButton
            cornerRadius={5}
            style={styles.button}
            onPress={onPress}
            buttonType={buttonType}
            buttonStyle={
                colorScheme === 'dark'
                    ? AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthenticationButtonStyle.BLACK
            }
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        width: '100%',
        height: 40,
    },
});

export default AppleSignInButton;
