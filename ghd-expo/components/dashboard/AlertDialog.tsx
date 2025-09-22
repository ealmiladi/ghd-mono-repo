import { Button, ButtonText } from '@/components/ui/button';
import {
    AlertDialog as GlueAlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Text } from '@/components/ui/text';
import { Heading } from '@/components/ui/heading';
import React from 'react';
import i18n from 'i18next';

function AlertDialog({
    heading,
    description,
    isOpen,
    setOpen,
    buttonTitle = i18n.t('common.continue'),
    cancelButtonTitle = i18n.t('common.cancel'),
    onButtonClick = () => {},
    children = null,
}) {
    return (
        <GlueAlertDialog
            useRNModal={true}
            isOpen={isOpen}
            onClose={setOpen}
            size="md"
            className="border-0 outline-0"
            style={{ borderWidth: 0 }}
        >
            {!children ? (
                <>
                    <AlertDialogBackdrop />
                    <AlertDialogContent className="bg-secondary-50">
                        <AlertDialogHeader>
                            <Heading
                                className="text-typography-950 font-bold"
                                size="lg"
                            >
                                {heading}
                            </Heading>
                        </AlertDialogHeader>
                        <AlertDialogBody className="mt-3 mb-4">
                            <Text
                                size="lg"
                                className="font-semibold text-typography-800"
                            >
                                {description}
                            </Text>
                        </AlertDialogBody>
                        <AlertDialogFooter>
                            <Button
                                variant="outline"
                                action="secondary"
                                onPress={() => setOpen(false)}
                                size="sm"
                            >
                                <ButtonText>{cancelButtonTitle}</ButtonText>
                            </Button>
                            <Button
                                size="sm"
                                onPress={() => {
                                    onButtonClick();
                                    setOpen(false);
                                }}
                            >
                                <ButtonText>{buttonTitle}</ButtonText>
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </>
            ) : (
                children
            )}
        </GlueAlertDialog>
    );
}

export default AlertDialog;
