import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy_key_for_build",
});

export interface ParsedTransaction {
  amount: number;
  date: string;
  description: string;
  category: string;
  type: 'INCOME' | 'EXPENSE';
}

export async function parseReceipt(imageUrl: string): Promise<ParsedTransaction | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial assistant. Analyze the provided image (receipt, invoice, or screenshot). 
          Extract the following information:
          - Total amount (number)
          - Date (ISO 8601 format YYYY-MM-DD, use today's date ${new Date().toISOString().split('T')[0]} if not found or if incomplete)
          - Description (short summary)
          - Category (e.g., Food, Transport, Utilities, Salary, Investment, etc.)
          - Type (INCOME or EXPENSE)
          
          Return ONLY a valid JSON object with keys: amount, date, description, category, type.
          If you cannot determine the values, estimate or use sensible defaults based on the current context.
          The current date is ${new Date().toISOString().split('T')[0]}. Ensure the year is correct (e.g. 2026).
          `
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image." },
            {
              type: "image_url",
              image_url: {
                "url": imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) return null;

    // Clean up markdown code blocks if present
    const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as ParsedTransaction;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
}
