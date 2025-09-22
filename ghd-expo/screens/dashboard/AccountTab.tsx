import { ScrollView, View } from 'react-native';
import BFButton from '@/components/BFButton';
import { BFText } from '@/components/BFText';
import { getAuth } from '@react-native-firebase/auth';

const AccountTab = () => {
    return (
        <ScrollView>
            <View className="p-4">
                <BFText className="text-2xl font-bold mb-4">Account</BFText>
                <BFText className="text-lg">
                    You are currently logged in as{' '}
                    <BFText className={'font-bold'}>
                        {getAuth().currentUser?.email
                            ? getAuth().currentUser?.email
                            : 'a guest'}
                    </BFText>{' '}
                    and your Firebase UID is{' '}
                    <BFText className={'font-bold'}>
                        {getAuth().currentUser?.uid}.
                    </BFText>
                </BFText>
            </View>

            <View className={'space-y-2 px-4'}>
                <BFButton
                    title={'Sign Out'}
                    color={'danger'}
                    onPress={() => getAuth().signOut()}
                />
            </View>
        </ScrollView>
    );
};

export default AccountTab;
