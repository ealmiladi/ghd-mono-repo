import React, { useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    SafeAreaView,
    ScrollView,
    View,
} from 'react-native';
import { Button, ButtonText } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import {
    createUserWithEmailAndPassword,
    getAuth,
} from '@react-native-firebase/auth';
import GoogleSignInButton from '@/components/social/GoogleSignInButton';
import FacebookSignInButton from '@/components/social/FacebookSignInButton';
import AppleSignInButton from '@/components/social/AppleSignInButton';
import { authMethods } from '@/utils/auth-methods';
import { AppleAuthenticationButtonType } from 'expo-apple-authentication';
import ListItem from '@/components/dashboard/ListItem';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const showEmailAuth = false;
    const googleSignIn = authMethods.includes('Google');
    const facebookSignIn = false;
    const appleSignIn = Platform.OS === 'ios' && authMethods.includes('Apple');

    const showOrButton = googleSignIn || facebookSignIn || appleSignIn;

    const handleRegister = () => {
        if (!email.match(/^\S+@\S+\.\S+$/)) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }
        if (password.length < 6) {
            Alert.alert(
                'Weak Password',
                'Password must be at least 6 characters long.'
            );
            return;
        }
        setLoggingIn(true);
        createUserWithEmailAndPassword(getAuth(), email, password)
            .catch((error) => {
                Alert.alert('Error', error.message);
            })
            .finally(() => {
                setLoggingIn(false);
            });
    };

    const textColor = 'text-secondary-500';

    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        if (!email) {
            setIsValid(true);
            return;
        }
        const timeout = setTimeout(() => {
            setIsValid(/^\S+@\S+\.\S+$/.test(email));
        }, 350); // Debounce for 300ms

        return () => clearTimeout(timeout);
    }, [email]);

    return (
        <SafeAreaView className="flex-1">
            <ScrollView className="p-4">
                <Heading className="text-2xl font-bold">
                    {t('common.signUp')}
                </Heading>
                {showEmailAuth && (
                    <View>
                        <ListItem
                            title={t('common.email')}
                            type="input"
                            props={{
                                defaultValue: email,
                                placeholder: t('common.emailDescription'),
                                onChangeText: setEmail,
                                className: !isValid
                                    ? 'text-red-500 leading-1'
                                    : 'text-typography-600 leading-1',
                            }}
                        />
                        <ListItem
                            title={t('common.password')}
                            type="input"
                            props={{
                                value: password,
                                type: 'password',
                                placeholder: t('common.passwordDescription'),
                                onChangeText: setPassword,
                                className: !email.match(/^\S+@\S+\.\S+$/)
                                    ? 'text-red-500 leading-1'
                                    : 'text-typography-600 leading-1',
                            }}
                        />
                        <Button disabled={loggingIn} onPress={handleRegister}>
                            <ButtonText>
                                {loggingIn
                                    ? t('getStarted.creatingAccount')
                                    : t('common.continue')}
                            </ButtonText>
                        </Button>
                        {showOrButton && (
                            <View className="flex-row items-center justify-center py-8">
                                <View className="h-px flex-1 bg-secondary-200" />
                                <Text className="uppercase px-4 text-lg text-secondary-500 font-semibold">
                                    {t('common.or')}
                                </Text>
                                <View className="h-px flex-1 bg-secondary-200" />
                            </View>
                        )}
                    </View>
                )}
                {showOrButton && (
                    <View className="mt-4 gap-y-4">
                        {googleSignIn && (
                            <GoogleSignInButton
                                title={t('getStarted.googleSignIn')}
                            />
                        )}
                        {facebookSignIn && (
                            <FacebookSignInButton
                                title={t('getStarted.facebookSignIn')}
                            />
                        )}
                        {appleSignIn && (
                            <AppleSignInButton
                                buttonType={
                                    AppleAuthenticationButtonType.SIGN_UP
                                }
                            />
                        )}
                    </View>
                )}
                <Text className={`text-center ${textColor} mt-8`}>
                    By continuing, you agree to our{' '}
                    <Text
                        className="text-blue-500"
                        onPress={() =>
                            Linking.openURL('http://www.example.com')
                        }
                    >
                        Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text
                        className="text-blue-500"
                        onPress={() =>
                            Linking.openURL('http://www.example.com')
                        }
                    >
                        Privacy Policy
                    </Text>
                    .
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

export default RegisterPage;
