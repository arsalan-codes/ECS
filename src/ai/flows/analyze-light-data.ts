'use server';
/**
 * @fileOverview Analyzes light data and recommends light adjustments for optimal plant health.
 *
 * - analyzeLightData - A function that analyzes light data and returns light recommendations.
 * - AnalyzeLightDataInput - The input type for the analyzeLightData function.
 * - AnalyzeLightDataOutput - The return type for the analyzeLightData function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import {getLightStatus, setLightStatus} from '@/services/lights';

const AnalyzeLightDataInputSchema = z.object({
  lux: z.number().describe('The light intensity in Lux.'),
}).describe('Input containing light intensity.');
export type AnalyzeLightDataInput = z.infer<typeof AnalyzeLightDataInputSchema>;

const AnalyzeLightDataOutputSchema = z.object({
  recommendedLightStatus: z.boolean().describe('The recommended light status (on/off).'),
  explanation: z.string().describe('Explanation of why the light status is recommended.'),
});
export type AnalyzeLightDataOutput = z.infer<typeof AnalyzeLightDataOutputSchema>;

export async function analyzeLightData(input: AnalyzeLightDataInput): Promise<AnalyzeLightDataOutput> {
  return analyzeLightDataFlow(input);
}

const analyzeLightDataPrompt = ai.definePrompt({
  name: 'analyzeLightDataPrompt',
  input: {
    schema: z.object({
      lux: z.number().describe('The light intensity in Lux.'),
    }),
  },
  output: {
    schema: AnalyzeLightDataOutputSchema,
  },
  prompt: `You are an AI assistant that helps farm managers optimize lighting conditions for plant health.

  Analyze the light data provided below and recommend whether the lights should be on or off. Include a brief explanation of your recommendation.

  Light Data:
  - Light Intensity: {{lux}} Lux

  Consider ideal ranges for plant growth:
  - Generally, plants need between 2,000 and 10,000 Lux, depending on the plant type and growth stage. Seedlings often need less light.

  Respond with the following JSON format:
  {
    "recommendedLightStatus": boolean,
    "explanation": string
  }`,
});

const analyzeLightDataFlow = ai.defineFlow<
  typeof AnalyzeLightDataInputSchema,
  typeof AnalyzeLightDataOutputSchema
>({
  name: 'analyzeLightDataFlow',
  inputSchema: AnalyzeLightDataInputSchema,
  outputSchema: AnalyzeLightDataOutputSchema,
},
async (input) => {
  const {output} = await analyzeLightDataPrompt({
    lux: input.lux,
  });
  // The schema guarantees that the output is valid JSON.
  return output!;
});
