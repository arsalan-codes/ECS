'use server';
/**
 * @fileOverview An AI assistant flow using the Gemini API.
 *
 * - aiAssistant - A function that handles user questions and returns AI responses.
 * - AiAssistantInput - The input type for the aiAssistant function.
 * - AiAssistantOutput - The return type for the aiAssistant function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AiAssistantInputSchema = z.object({
  question: z.string().describe('The user\'s question.'),
});
export type AiAssistantInput = z.infer<typeof AiAssistantInputSchema>;

const AiAssistantOutputSchema = z.object({
  answer: z.string().describe('The AI\'s answer to the question.'),
});
export type AiAssistantOutput = z.infer<typeof AiAssistantOutputSchema>;

export async function aiAssistant(input: AiAssistantInput): Promise<AiAssistantOutput> {
  return aiAssistantFlow(input);
}

const aiAssistantPrompt = ai.definePrompt({
  name: 'aiAssistantPrompt',
  input: {
    schema: z.object({
      question: z.string().describe('The user\'s question.'),
    }),
  },
  output: {
    schema: AiAssistantOutputSchema,
  },
  prompt: `You are a helpful AI assistant designed to answer questions about a poultry farm.

  Question: {{{question}}}

  Answer:`,
});

const aiAssistantFlow = ai.defineFlow<
  typeof AiAssistantInputSchema,
  typeof AiAssistantOutputSchema
>({
  name: 'aiAssistantFlow',
  inputSchema: AiAssistantInputSchema,
  outputSchema: AiAssistantOutputSchema,
},
async (input) => {
  const {output} = await aiAssistantPrompt({
    question: input.question,
  });
  // The schema guarantees that the output is valid JSON.
  return output!;
});

