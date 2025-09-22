import BluetoothProvider from "./BT";

type NotifyCallback = (data: Buffer) => void;

class ScooterClient {
    private bluetoothProvider: BluetoothProvider;
    private serviceUUID: string;
    private readCharacteristicsUUID: string;

    constructor(
        bluetoothProvider: BluetoothProvider,
        serviceUUID: string,
        readCharacteristicsUUID: string
    ) {
        this.bluetoothProvider = bluetoothProvider;
        this.serviceUUID = serviceUUID;
        this.readCharacteristicsUUID = readCharacteristicsUUID;
    }

    /**
     * Connects to a Bluetooth device with the given name.
     * @param deviceName - The name of the Bluetooth device to connect to.
     */
    public async connect(deviceName: string): Promise<void> {
        try {
            await this.bluetoothProvider.connect(deviceName);
            console.log(`Connected to ${deviceName}`);
        } catch (error) {
            console.error(`Failed to connect to ${deviceName}:`, error);
            throw error;
        }
    }

    /**
     * Writes data to a specific characteristic of the connected device.
     * @param buffer - The data buffer to write.
     */
    public async write(buffer: Buffer): Promise<void> {
        try {
            await this.bluetoothProvider.writeCharacteristic(
                this.serviceUUID,
                this.readCharacteristicsUUID,
                buffer
            );
        } catch (error) {
            console.error('Failed to write to characteristic:', error);
            throw error;
        }
    }

    /**
     * Disconnects from the currently connected Bluetooth device.
     */
    public async disconnect(): Promise<void> {
        try {
            await this.bluetoothProvider.disconnect();
            console.log('Disconnected from the scooter.');
        } catch (error) {
            console.error('Failed to disconnect:', error);
            throw error;
        }
    }

    /**
     * Subscribes to notifications from a specific characteristic.
     * @param callback - The function to call when data is received.
     */
    public subscribeToEvents(callback: NotifyCallback): void {
        try {
            this.bluetoothProvider.onCharacteristicNotify(
                this.serviceUUID,
                this.readCharacteristicsUUID,
                (data: Buffer) => {
                    callback(data);
                }
            );
        } catch (error) {
            console.error('Failed to subscribe to characteristic notifications:', error);
            throw error;
        }
    }

    /**
     * Discovers services on the connected Bluetooth device.
     */
    public async discoverServices(): Promise<void> {
        try {
            await this.bluetoothProvider.discoverServices();
            console.log('Services discovered');
        } catch (error) {
            console.error('Failed to discover services:', error);
            throw error;
        }
    }
}

export default ScooterClient;
