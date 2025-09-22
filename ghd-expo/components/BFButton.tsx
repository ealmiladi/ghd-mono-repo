import {BFText} from "@/components/BFText";
import {TouchableOpacity, type ButtonProps} from "react-native";
import classNames from "classnames";

const BFButton = ({title, color, ...rest}: any) => {
    return <TouchableOpacity
        className={
            classNames('rounded-md p-2 flex-col justify-center shadow-sm', {
                'bg-blue-600 active:bg-blue-800': color === 'primary' || !color,
                'bg-gray-200 active:bg-gray-300': color === 'light',
                'bg-red-600 active:bg-red-800': color === 'danger',
                'bg-green-600 active:bg-green-800': color === 'success',
                'bg-yellow-600 active:bg-yellow-800': color === 'warning',
                'bg-indigo-600 active:bg-indigo-800': color === 'info',
                'bg-purple-600 active:bg-purple-800': color === 'purple',
                'bg-pink-600 active:bg-pink-800': color === 'pink',
                'bg-gray-600 active:bg-gray-800': color === 'dark',
            })
        }
        {...rest}>
        <BFText
            className={classNames('font-bold text-white text-center text-sm', {
                'text-white': color === 'primary' || !color,
                'text-gray-800': color === 'light',
            })}>
            {title}
        </BFText>
    </TouchableOpacity>
};

export default BFButton;
