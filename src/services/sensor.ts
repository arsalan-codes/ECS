/**
 * Represents sensor data for temperature, humidity and oxygen.
 */
export interface SensorData {
  /**
   * The temperature in Celsius.
   */
  temperatureCelsius: number;
  /**
   * The humidity percentage.
   */
  humidity: number;
  /**
   * The oxygen level.
   */
  oxygen: number;
}

/**
 * Asynchronously retrieves sensor data.
 *
 * @returns A promise that resolves to a SensorData object containing temperature, humidity, and oxygen levels.
 */
export async function getSensorData(): Promise<SensorData> {
  // TODO: Implement this by calling an API.
  return {
    temperatureCelsius: 25,
    humidity: 60,
    oxygen: 95,
  };
}
