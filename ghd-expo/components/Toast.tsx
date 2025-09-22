import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';
import {
    Toast as GlueToast,
    ToastDescription,
    ToastTitle,
} from '@/components/ui/toast';

export const toastConfig = {
    success: (props: any) => {
        return (
            <>
                <GlueToast variant="solid">
                    <ToastTitle className="font-bold text-lg">
                        {props.text1 || 'Success'}
                    </ToastTitle>
                    <ToastDescription className="font-semibold">
                        {props.text2}
                    </ToastDescription>
                </GlueToast>
            </>
        );
    },

    error: (props: any) => (
        <ErrorToast
            {...props}
            text1Style={{
                fontSize: 17,
            }}
            text2Style={{
                fontSize: 15,
            }}
        />
    ),
};
