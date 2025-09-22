export const toFixed = (value: number, precision: number = 2) => {
    const power = Math.pow(10, precision);
    return Math.round(value * power) / power;
};
