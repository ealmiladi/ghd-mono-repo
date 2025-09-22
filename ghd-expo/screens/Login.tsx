import {BFText} from "@/components/BFText";
import {KeyboardAwareScrollView} from "react-native-keyboard-controller";
import {Alert, Linking, Platform, View} from "react-native";
import {useState} from "react";
import BFButton from "@/components/BFButton";
import {getAuth, signInWithEmailAndPassword} from "@react-native-firebase/auth";
import BFTextInput from "@/components/BFTextInput";
import GoogleSignInButton from "@/components/social/GoogleSignInButton";
import {authMethods} from "@/utils/auth-methods";
import {AppleAuthenticationButtonType} from "expo-apple-authentication";
import FacebookSignInButton from "@/components/social/FacebookSignInButton";
import AppleSignInButton from "@/components/social/AppleSignInButton";
import GuestSignInButton from "@/components/social/GuestSignInButton";


const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const showEmailAuth = true;
    const googleSignIn = authMethods.includes('Google');
    const facebookSignIn = authMethods.includes('Facebook');
    const appleSignIn = Platform.OS === 'ios' && authMethods.includes('Apple');
    const anonymousSignIn = authMethods.includes('Anonymous');

    const showOrButton = showEmailAuth && (
        googleSignIn || facebookSignIn || appleSignIn || anonymousSignIn
    );

    return (
        <KeyboardAwareScrollView keyboardShouldPersistTaps={'handled'}>
            <View className={'p-4 space-y-3'}>
                {showEmailAuth && <View className={'space-y-3'}>
                    <View className={'space-y-1.5'}>
                        <BFText className={'font-semibold text-sm'}>
                            Email Address
                        </BFText>
                        <View>
                            <BFTextInput
                                autoFocus={true}
                                autoCapitalize={'none'}
                                onChangeText={setEmail}
                                value={email}
                                keyboardType={'email-address'}/>
                        </View>
                    </View>
                    <View className={'space-y-1.5 mb-1'}>
                        <BFText className={'font-semibold text-sm'}>
                            Password
                        </BFText>

                        <BFTextInput
                            onChangeText={setPassword}
                            value={password}
                            secureTextEntry={true}
                        />
                    </View>
                    <BFButton
                        disabled={loggingIn}
                        onPress={() => {
                            setLoggingIn(true);
                            signInWithEmailAndPassword(getAuth(), email, password)
                                .catch(error => {
                                    Alert.alert("Error", error.message);
                                })
                                .finally(() => {
                                    setLoggingIn(false);
                                });
                        }}
                        title={'Login'}/>
                    {showOrButton && <View className={'flex flex-row items-center py-1'}>
                        <View className={'h-[1px] bg-slate-300 dark:bg-slate-600 flex-1'}/>
                        <BFText className={'text-gray-500 dark:text-slate-500 px-2 uppercase'}>
                            or
                        </BFText>
                        <View className={'h-[1px] bg-slate-300 dark:bg-slate-600 flex-1'}/>
                    </View>}
                </View>}
                {showOrButton && <View className={'space-y-2'}>
                    {googleSignIn && <GoogleSignInButton title={'Sign in with Google'}/>}
                    {facebookSignIn && <View><FacebookSignInButton title={'Sign in with Facebook'}/></View>}
                    {appleSignIn &&
                        <View><AppleSignInButton buttonType={AppleAuthenticationButtonType.SIGN_IN}/></View>}
                    {anonymousSignIn && (<GuestSignInButton title={'Sign in as guest'}/>)}
                </View>}
                <BFText>
                    {'By continuing, you are agreeing to our '}
                    <BFText
                        onPress={() => Linking.openURL('http://www.example.com')}
                        className={'text-blue-500'}>
                        terms of service
                    </BFText>{' and '}
                    <BFText
                        onPress={() => Linking.openURL('http://www.example.com')}
                        className={'text-blue-500'}>
                        privacy policy
                    </BFText>.
                </BFText>
            </View>
        </KeyboardAwareScrollView>
    );
};

export default LoginPage;
