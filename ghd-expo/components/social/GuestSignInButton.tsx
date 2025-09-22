import {Alert, StyleSheet, TouchableOpacity, View} from 'react-native';
import auth, {getAuth, signInAnonymously} from '@react-native-firebase/auth';
import BFButton from "@/components/BFButton";
import {useState} from "react";

const AnonymousSignInButton = ({title, ...rest}: {
    title: string;
}) => {
    const [signingIn, setSigningIn] = useState(false);
    return (
        <View {...rest}>
            <BFButton
                disabled={signingIn}
                color={'warning'}
                onPress={() => {
                    setSigningIn(true);
                    signInAnonymously(getAuth())
                        .catch(error => {
                            Alert.alert("Error", error.message);
                        })
                        .finally(() => setSigningIn(false));
                }}
                title={title}
            />
        </View>
    );
};

export default AnonymousSignInButton;
