import { ScrollView, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useUser } from '@/providers/UserContextProvider';
import {
    Avatar,
    AvatarBadge,
    AvatarFallbackText,
    AvatarImage,
} from '@/components/ui/avatar';
import { HStack } from '@/components/ui/hstack';
import { Heading } from '@/components/ui/heading';
import ListItem from '@/components/dashboard/ListItem';
import { Controller } from '@/interfaces/Controller';
import {
    LucideCog,
    LucideCpu,
    LucideLanguages,
    LucidePanelBottomClose,
    LucidePlus,
    LucideThermometer,
} from 'lucide-react-native';
import React from 'react';
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetItem,
    ActionsheetItemText,
    ActionsheetScrollView,
} from '@/components/ui/actionsheet';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Button, ButtonText } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import auth from '@react-native-firebase/auth';
import AlertDialog from '@/components/dashboard/AlertDialog';

const LANGUAGE_OPTIONS = [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'ru',
    'zh',
    'ja',
    'uk',
    'hi',
    'ar',
].sort();

const MyProfile = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { user, controllers, setPreferences, signOut, temperatureUnit } =
        useUser();

    const [showSpeedActions, setShowSpeedActions] = React.useState(false);
    const [showLanguageActions, setShowLanguageActions] = React.useState(false);
    const [confirmModalOpen, setConfirmModalOpen] = React.useState(false);
    const [showTemperatureActions, setShowTemperatureActions] =
        React.useState(false);

    const deleteAccount = async () => {
        try {
            await auth().currentUser!.delete();
        } catch (e: any) {
            Toast.show({
                type: 'success',
                text1: t('common.error'),
                text2: e.message,
            });
        }
    };

    const hideControllers = route.params?.hideControllers;

    return (
        <ScrollView className="p-8">
            <HStack className={'items-center gap-4 w-full'}>
                <Avatar size="lg">
                    <AvatarFallbackText>{user.displayName}</AvatarFallbackText>
                    <AvatarImage
                        source={{
                            uri: user.photoURL,
                        }}
                    />
                    <AvatarBadge />
                </Avatar>
                <HStack className="justify-between flex-1">
                    <View className="flex-1">
                        <Heading>{user.displayName}</Heading>
                        <Text className="text-secondary-600 font-bold">
                            {user.email}
                        </Text>
                    </View>
                    <View>
                        <Button
                            onPress={() => {
                                signOut();
                            }}
                        >
                            <ButtonText>{t('common.logout')}</ButtonText>
                        </Button>
                    </View>
                </HStack>
            </HStack>

            {!hideControllers && (
                <>
                    <HStack className="mt-8 justify-between items-center">
                        <Heading>{t('user.myControllers')}</Heading>
                        <Button
                            variant="solid"
                            action="primary"
                            size="sm"
                            onPress={() => {
                                navigation.navigate('DevicesScreen');
                            }}
                        >
                            <Icon
                                as={LucidePlus}
                                className="text-secondary-500"
                            />
                            <ButtonText>{t('common.new')}</ButtonText>
                        </Button>
                    </HStack>
                    {controllers.map((controller: Controller) => (
                        <ListItem
                            icon={LucideCpu}
                            key={controller.serialNumber}
                            title={controller.name}
                            description={controller.serialNumber}
                        />
                    ))}
                </>
            )}

            <View className="mt-4">
                <Heading>Preferences</Heading>
                <ListItem
                    icon={LucideLanguages}
                    rightIcon={LucidePanelBottomClose}
                    title={t('common.language')}
                    description={user.doc.preferences?.language || 'EN'}
                    onPress={() => setShowLanguageActions(true)}
                />
                <ListItem
                    icon={LucideCog}
                    rightIcon={LucidePanelBottomClose}
                    title={t('common.speedUnit')}
                    description={user.doc.preferences?.speedUnit || 'MPH'}
                    onPress={() => setShowSpeedActions(true)}
                />
                <ListItem
                    icon={LucideThermometer}
                    rightIcon={LucidePanelBottomClose}
                    title={t('common.temperatureUnit')}
                    description={temperatureUnit === 'F' ? '°F' : '°C'}
                    onPress={() => setShowTemperatureActions(true)}
                />
            </View>

            <DeleteAccountButton
                onPress={() => {
                    setConfirmModalOpen(true);
                }}
            />
            <AlertDialog
                heading={t('common.deleteAccount')}
                description={t('common.deleteAccountDescription')}
                buttonTitle={t('common.continue')}
                cancelButtonTitle={t('common.cancel')}
                isOpen={confirmModalOpen}
                onButtonClick={deleteAccount}
                setOpen={() => setConfirmModalOpen(false)}
            />

            <LanguageActionSheet
                show={showLanguageActions}
                handleClose={(value) => {
                    setShowLanguageActions(false);
                    if (value) {
                        setPreferences({ language: value });
                        Toast.show({
                            type: 'success',
                            text1: t('common.updated'),
                            text2: t('user.languageUpdated'),
                        });
                    }
                }}
            />
            <SpeedActionSheet
                show={showSpeedActions}
                handleClose={(value) => {
                    setShowSpeedActions(false);
                    if (value) {
                        setPreferences({ speedUnit: value });
                        Toast.show({
                            type: 'success',
                            text1: t('common.updated'),
                            text2: t('user.unitsUpdated'),
                        });
                    }
                }}
            />
            <TemperatureActionSheet
                show={showTemperatureActions}
                handleClose={(value) => {
                    setShowTemperatureActions(false);
                    if (value) {
                        setPreferences({ temperatureUnit: value });
                        Toast.show({
                            type: 'success',
                            text1: t('common.updated'),
                            text2: t('user.temperatureUpdated'),
                        });
                    }
                }}
            />
        </ScrollView>
    );
};

const SpeedActionSheet = ({
    show,
    handleClose,
}: {
    show: boolean;
    handleClose: (val) => void;
}) => {
    const { t } = useTranslation();

    return (
        <Actionsheet
            isOpen={show}
            snapPoints={[50]}
            onClose={() => handleClose(null)}
        >
            <ActionsheetBackdrop />
            <ActionsheetContent>
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>
                <ActionsheetItem onPress={() => handleClose('MPH')}>
                    <ActionsheetItemText className="text-lg font-bold">
                        {t('common.milesPerHour')}
                    </ActionsheetItemText>
                </ActionsheetItem>
                <ActionsheetItem onPress={() => handleClose('KPH')}>
                    <ActionsheetItemText className="text-lg font-bold">
                        {t('common.kilometersPerHour')}
                    </ActionsheetItemText>
                </ActionsheetItem>
            </ActionsheetContent>
        </Actionsheet>
    );
};

const TemperatureActionSheet = ({
    show,
    handleClose,
}: {
    show: boolean;
    handleClose: (val) => void;
}) => {
    const { t } = useTranslation();

    return (
        <Actionsheet
            isOpen={show}
            snapPoints={[50]}
            onClose={() => handleClose(null)}
        >
            <ActionsheetBackdrop />
            <ActionsheetContent>
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>
                <ActionsheetItem onPress={() => handleClose('C')}>
                    <ActionsheetItemText className="text-lg font-bold">
                        {t('common.celsius')}
                    </ActionsheetItemText>
                </ActionsheetItem>
                <ActionsheetItem onPress={() => handleClose('F')}>
                    <ActionsheetItemText className="text-lg font-bold">
                        {t('common.fahrenheit')}
                    </ActionsheetItemText>
                </ActionsheetItem>
            </ActionsheetContent>
        </Actionsheet>
    );
};

const LanguageActionSheet = ({
    show,
    handleClose,
}: {
    show: boolean;
    handleClose: (val) => void;
}) => {
    const { t } = useTranslation();
    return (
        <Actionsheet
            isOpen={show}
            onClose={() => handleClose(null)}
            useRNModal={true}
            snapPoints={[50]}
        >
            <ActionsheetBackdrop />
            <ActionsheetContent>
                <ActionsheetDragIndicatorWrapper>
                    <ActionsheetDragIndicator />
                </ActionsheetDragIndicatorWrapper>
                <ActionsheetScrollView>
                    {LANGUAGE_OPTIONS.map((lang) => (
                        <ActionsheetItem
                            key={lang}
                            onPress={() => handleClose(lang)}
                        >
                            <ActionsheetItemText className="text-lg font-bold">
                                {t(`languages.${lang}`)}
                            </ActionsheetItemText>
                        </ActionsheetItem>
                    ))}
                </ActionsheetScrollView>
            </ActionsheetContent>
        </Actionsheet>
    );
};

const DeleteAccountButton = ({ onPress }) => {
    const { t } = useTranslation();

    return (
        <Button
            variant="solid"
            size="lg"
            action="primary"
            className="bg-error-500 mt-8"
            onPress={onPress}
        >
            <ButtonText>{t('common.deleteAccount')}</ButtonText>
        </Button>
    );
};

export default MyProfile;
