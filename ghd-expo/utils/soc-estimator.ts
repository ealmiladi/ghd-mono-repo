export class SoCEstimator {
    private ratedVoltage: number;
    private voltageSoCMap: { voltage: number; soc: number }[];

    constructor(ratedVoltage: number) {
        this.ratedVoltage = ratedVoltage;
        this.voltageSoCMap = this.getVoltageSoCMap(ratedVoltage);
    }

    /**
     * Retrieves the voltage-to-SoC mapping for the specified rated voltage.
     * Assumes a lithium-ion battery with standard configurations.
     */
    private getVoltageSoCMap(
        ratedVoltage: number
    ): { voltage: number; soc: number }[] {
        // Predefined mappings for common rated voltages
        const voltageSoCMaps: {
            [key: number]: { voltage: number; soc: number }[];
        } = {
            // 36V Battery (10S configuration) - Typical Li-ion pack
            36: [
                { voltage: 42.0, soc: 100 }, // Fully charged (4.2V per cell)
                { voltage: 41.2, soc: 95 },
                { voltage: 40.5, soc: 90 },
                { voltage: 40.0, soc: 80 },
                { voltage: 39.6, soc: 70 },
                { voltage: 39.0, soc: 60 },
                { voltage: 38.4, soc: 50 },
                { voltage: 37.8, soc: 40 },
                { voltage: 37.2, soc: 30 },
                { voltage: 36.6, soc: 20 },
                { voltage: 36.0, soc: 10 },
                { voltage: 33.0, soc: 0 }, // Cutoff voltage
            ],

            48: [
                { voltage: 54.6, soc: 100 }, // 13S (4.2V per cell)
                { voltage: 53.7, soc: 95 },
                { voltage: 52.5, soc: 90 },
                { voltage: 51.8, soc: 80 },
                { voltage: 51.0, soc: 70 },
                { voltage: 50.2, soc: 60 },
                { voltage: 49.5, soc: 50 },
                { voltage: 48.7, soc: 40 },
                { voltage: 48.0, soc: 30 },
                { voltage: 47.2, soc: 20 },
                { voltage: 46.5, soc: 10 },
                { voltage: 42.9, soc: 0 }, // Cutoff voltage
            ],

            52: [
                { voltage: 58.8, soc: 100 }, // 14S (4.2V per cell)
                { voltage: 57.8, soc: 95 },
                { voltage: 56.7, soc: 90 },
                { voltage: 55.9, soc: 80 },
                { voltage: 55.2, soc: 70 },
                { voltage: 54.4, soc: 60 },
                { voltage: 53.6, soc: 50 },
                { voltage: 52.8, soc: 40 },
                { voltage: 52.0, soc: 30 },
                { voltage: 51.2, soc: 20 },
                { voltage: 50.4, soc: 10 },
                { voltage: 46.2, soc: 0 }, // Cutoff voltage
            ],

            60: [
                { voltage: 67.2, soc: 100 }, // 16S (4.2V per cell)
                { voltage: 66.0, soc: 95 },
                { voltage: 64.8, soc: 90 },
                { voltage: 63.6, soc: 80 },
                { voltage: 62.4, soc: 70 },
                { voltage: 61.2, soc: 60 },
                { voltage: 60.0, soc: 50 },
                { voltage: 58.8, soc: 40 },
                { voltage: 57.6, soc: 30 },
                { voltage: 56.4, soc: 20 },
                { voltage: 55.2, soc: 10 },
                { voltage: 50.4, soc: 0 }, // Cutoff voltage
            ],

            76: [
                { voltage: 92.4, soc: 100 }, // Fully charged
                { voltage: 90.2, soc: 95 },
                { voltage: 88.0, soc: 90 },
                { voltage: 86.2, soc: 80 },
                { voltage: 84.5, soc: 70 },
                { voltage: 82.8, soc: 60 },
                { voltage: 81.0, soc: 50 },
                { voltage: 79.3, soc: 40 },
                { voltage: 77.5, soc: 30 },
                { voltage: 75.8, soc: 20 },
                { voltage: 74.0, soc: 10 },
                { voltage: 66.0, soc: 0 }, // Cutoff voltage
            ],
            72: [
                { voltage: 84.0, soc: 100 }, // Fully charged (4.2V per cell)
                { voltage: 82.5, soc: 95 }, // Small drop early on
                { voltage: 81.0, soc: 90 }, // Typical early range
                { voltage: 79.0, soc: 80 }, // Gradual mid-range drop
                { voltage: 77.0, soc: 70 }, // Mid-range
                { voltage: 75.5, soc: 60 }, // Slightly quicker drop
                { voltage: 74.0, soc: 50 }, // Middle of the discharge
                { voltage: 72.0, soc: 40 }, // Beginning of a steeper drop
                { voltage: 70.5, soc: 30 }, // Entering lower range
                { voltage: 69.0, soc: 20 }, // More voltage sag
                { voltage: 67.5, soc: 10 }, // Near empty, voltage drops faster
                { voltage: 63.0, soc: 0 }, // Cut-off voltage
            ],

            // 84V Battery (24S configuration)
            84: [
                { voltage: 100.8, soc: 100 }, // 4.2V per cell
                { voltage: 96.0, soc: 90 },
                { voltage: 93.6, soc: 70 },
                { voltage: 90.0, soc: 50 },
                { voltage: 86.4, soc: 30 },
                { voltage: 82.8, soc: 10 },
                { voltage: 75.6, soc: 0 },
            ],

            // 96V Battery (27S configuration)
            96: [
                { voltage: 108.0, soc: 100 },
                { voltage: 105.3, soc: 90 },
                { voltage: 102.0, soc: 70 },
                { voltage: 98.7, soc: 50 },
                { voltage: 95.4, soc: 30 },
                { voltage: 92.1, soc: 10 },
                { voltage: 84.6, soc: 0 },
            ],

            // 144V Battery (40S configuration)
            144: [
                { voltage: 168.0, soc: 100 }, // 4.2V per cell
                { voltage: 160.8, soc: 90 },
                { voltage: 156.0, soc: 70 },
                { voltage: 150.0, soc: 50 },
                { voltage: 144.0, soc: 30 },
                { voltage: 137.4, soc: 10 },
                { voltage: 126.0, soc: 0 },
            ],
        };

        const mapping = voltageSoCMaps[ratedVoltage];
        if (!mapping) {
            return voltageSoCMaps[72]; // Default to 36V mapping
        }

        return mapping;
    }

    /**
     * Calculates the State of Charge (SoC) based on the measured voltage.
     * @param voltage The measured battery voltage.
     * @returns The estimated SoC as a percentage (0 to 100).
     */
    public calculateSoC(voltage: number): number {
        const maxVoltage = this.voltageSoCMap[0].voltage;
        const minVoltage =
            this.voltageSoCMap[this.voltageSoCMap.length - 1].voltage;

        if (voltage >= maxVoltage) {
            return 100;
        } else if (voltage <= minVoltage) {
            return 0;
        }

        // Find the two points between which the voltage lies
        for (let i = 0; i < this.voltageSoCMap.length - 1; i++) {
            const highPoint = this.voltageSoCMap[i];
            const lowPoint = this.voltageSoCMap[i + 1];

            if (voltage <= highPoint.voltage && voltage >= lowPoint.voltage) {
                // Linear interpolation between the two points
                return Number(
                    (
                        highPoint.soc +
                        ((voltage - highPoint.voltage) /
                            (lowPoint.voltage - highPoint.voltage)) *
                            (lowPoint.soc - highPoint.soc)
                    ).toFixed(2)
                );
            }
        }

        // If voltage is not within the map range, return the closest SoC
        return voltage > maxVoltage ? 100 : 0;
    }

    getPercentUsed(startVoltage: number, endVoltage: number) {
        const startSoC = this.calculateSoC(startVoltage);
        const endSoC = this.calculateSoC(endVoltage);

        return startSoC - endSoC;
    }
}
