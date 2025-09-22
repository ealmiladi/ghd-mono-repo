import { ControllerState } from '@/fardriver/interfaces/ControllerState';
import { Device } from 'react-native-ble-plx';

export interface Controller {
    serialNumber: string;
    boundUserIds: string[];
    ownerIds: string[];
    name: string;
    fardriverOdometer: number;
    odometer: number;
    localName: string;
    allowAnonymousBinding: boolean;
    state?: ControllerState;
    device?: Device;
    preferGpsSpeed: boolean;
    tireWidth: number;
    tireAspectRatio: number;
    rimDiameter: number;
    gearRatio: number;
}
