import { HStack } from '@/components/ui/hstack';
import { LucideAlertCircle } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

const ControllerFault = ({ fault }) => {
    return (
        <View className="bg-error-100 rounded-2xl p-4 mb-4 mx-4">
            <HStack className="gap-2 items-center">
                <Icon as={LucideAlertCircle} className="text-error-700" />
                <Text className="text-error-700 font-bold">{fault.title}</Text>
            </HStack>
            <Text className="text-sm text-error-800">{fault.description}</Text>
        </View>
    );
};

export default ControllerFault;
