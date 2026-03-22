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
    const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver' }).format(new Date());

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial assistant. Analyze the provided image (receipt, invoice, or screenshot). 
          Extract the following information:
          - Total amount (number)
          - Date (ISO 8601 format YYYY-MM-DD. You MUST use today's date ${todayDateStr} if you CANNOT find a valid date on the receipt)
          - Description (short summary. Use 'Despesa sem nome' if no readable text is found)
          - Category (STRICTLY one of: "Housing", "Transportation", "Food", "Health", "Shopping", "Entertainment", "Financial", "Education", "Other", "IA STUFF")
          - Type (INCOME or EXPENSE)
          
          Return ONLY a valid JSON object with keys: amount, date, description, category, type.
          If you cannot determine the values, estimate or use sensible defaults based on the current context.
          Today's date is ${todayDateStr}. If the year is not explicitly printed on the receipt but has a month/day, infer it logically: if the receipt's month is greater than the current month in ${todayDateStr}, it is from the PREVIOUS year. The generated date should NEVER be in the future.`
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
    const parsed = JSON.parse(jsonString) as ParsedTransaction;
    
    if (!parsed.description) parsed.description = 'Despesa sem nome';
    if (!parsed.date) parsed.date = todayDateStr;
    
    return parsed;
  } catch (error) {
    console.error("Error parsing receipt:", error);
    return null;
  }
}
