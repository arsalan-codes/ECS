// The use of the `JSON.stringify` and `JSON.parse` functions helps to maintain type safety when interacting with the language model.
'use server';
/**
 * @fileOverview Analyzes sensor data and recommends fan speed adjustments for optimal poultry health.
 *
 * - analyzeSensorData - A function that analyzes sensor data and returns fan speed recommendations.
 * - AnalyzeSensorDataInput - The input type for the analyzeSensorData function.
 * - AnalyzeSensorDataOutput - The return type for the analyzeSensorData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getSensorData} from '@/services/sensor';
import {FanSettings} from '@/services/fan';

const AnalyzeSensorDataInputSchema = z.object({}).describe('Empty input.');
export type AnalyzeSensorDataInput = z.infer<typeof AnalyzeSensorDataInputSchema>;

const AnalyzeSensorDataOutputSchema = z.object({
  recommendedFanSpeed: z.number().describe('The recommended fan speed as a percentage.'),
  explanation: z.string().describe('Explanation of why the fan speed is recommended.'),
});
export type AnalyzeSensorDataOutput = z.infer<typeof AnalyzeSensorDataOutputSchema>;

export async function analyzeSensorData(input: AnalyzeSensorDataInput): Promise<AnalyzeSensorDataOutput> {
  return analyzeSensorDataFlow(input);
}

const analyzeSensorDataPrompt = ai.definePrompt({
  name: 'analyzeSensorDataPrompt',
  input: {
    schema: z.object({
      temperatureCelsius: z.number().describe('The temperature in Celsius.'),
      humidity: z.number().describe('The humidity percentage.'),
      oxygen: z.number().describe('The oxygen level.'),
    }),
  },
  output: {
    schema: AnalyzeSensorDataOutputSchema,
  },
  prompt: `You are an AI assistant that helps farm managers optimize environmental conditions for poultry health.

  Analyze the sensor data provided below and recommend a fan speed (as a percentage) to ensure optimal conditions for the poultry. Include a brief explanation of your recommendation.

  Sensor Data:
  - Temperature: {{temperatureCelsius}} Celsius
  - Humidity: {{humidity}}%
  - Oxygen: {{oxygen}}%

  Consider ideal ranges for poultry:
  - Temperature: 18-24 Celsius
  - Humidity: 50-70%
  - Oxygen: > 90%

  Respond with the following JSON format:
  {
    "recommendedFanSpeed": number,
    "explanation": string
  }`,
});

const analyzeSensorDataFlow = ai.defineFlow<
  typeof AnalyzeSensorDataInputSchema,
  typeof AnalyzeSensorDataOutputSchema
>({
  name: 'analyzeSensorDataFlow',
  inputSchema: AnalyzeSensorDataInputSchema,
  outputSchema: AnalyzeSensorDataOutputSchema,
},
async () => {
  const sensorData = await getSensorData();
  const {output} = await analyzeSensorDataPrompt({
    temperatureCelsius: sensorData.temperatureCelsius,
    humidity: sensorData.humidity,
    oxygen: sensorData.oxygen,
  });
  // The schema guarantees that the output is valid JSON.
  return output!;
});

