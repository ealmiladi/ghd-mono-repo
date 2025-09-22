
/**
 * Abstract class representing a Bluetooth Provider.
 * This class cannot be instantiated directly and must be subclassed.
 */
abstract class BluetoothProvider {
    /**
     * Prevents direct instantiation of the BluetoothProvider class.
     * Subclasses should call `super()` in their constructors.
     */
    protected constructor() {
        if (new.target === BluetoothProvider) {
            throw new TypeError("Cannot construct BluetoothProvider instances directly");
        }
    }

    /**
     * Connects to a Bluetooth device with the given name.
     * @param deviceName - The name of the Bluetooth device to connect to.
     * @throws Will throw an error if the method is not implemented by a subclass.
     */
    abstract connect(deviceName: string): Promise<void>;

    /**
     * Disconnects from the currently connected Bluetooth device.
     * @throws Will throw an error if the method is not implemented by a subclass.
     */
    abstract disconnect(): Promise<void>;

    /**
     * Writes data to a specific characteristic of the connected device.
     * @param serviceUUID - The UUID of the service containing the characteristic.
     * @param characteristicUUID - The UUID of the characteristic to write to.
     * @param data - The data buffer to write.
     * @throws Will throw an error if the method is not implemented by a subclass.
     */
    abstract writeCharacteristic(
        serviceUUID: string,
        characteristicUUID: string,
        data: Buffer
    ): Promise<void>;

    /**
     * Reads data from a specific characteristic of the connected device.
     * @param serviceUUID - The UUID of the service containing the characteristic.
     * @param characteristicUUID - The UUID of the characteristic to read from.
     * @returns A promise that resolves with the data buffer read from the characteristic.
     * @throws Will throw an error if the method is not implemented by a subclass.
     */
    abstract readCharacteristic(
        serviceUUID: string,
        characteristicUUID: string
    ): Promise<Buffer>;

    onCharacteristicNotify(serviceUUID: string, readCharacteristicsUUID: string, param3: (data: Buffer) => void) {
        throw new Error("Method not implemented.");
    }

    async discoverServices() {
        throw new Error("Method not implemented.");
    }
}

export default BluetoothProvider;
