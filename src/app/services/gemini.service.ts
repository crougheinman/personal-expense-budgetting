import { Injectable } from "@angular/core";
import { environment } from "@app/environments/environment";

/**
 * Result returned by Gemini after looking at a captured photo of a product.
 * The required outputs are the product name and its price.
 */
export interface GeminiScanResult {
  /** Human-readable product name. */
  name: string;
  /** Price if a price tag/label is visible in the photo, otherwise null. */
  price: number | null;
}

const GENERATIVE_LANGUAGE_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

// Ask Gemini to return strict JSON matching GeminiScanResult so we never have to
// parse free-form prose.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    name: { type: "STRING" },
    price: { type: "NUMBER", nullable: true },
  },
  required: ["name"],
};

const SCAN_PROMPT =
  "You are a retail product identification assistant. Look at the photo and " +
  "identify the single main product it shows. Respond with the product name " +
  "and its price if a price tag or label is visible (otherwise null). " +
  "Do not guess a price that is not shown.";

// Pebby — the friendly in-app spending reporter.
const PEBBY_PROMPT =
  "You are Pebby, a friendly and concise personal-finance assistant inside a " +
  "budgeting app. All amounts are in Philippine Pesos (PHP). Based on the " +
  "spending summary below, write 2-3 short sentences: a quick, encouraging " +
  "read of what the numbers show plus ONE practical tip. Plain text only — no " +
  "markdown, no headings, no bullet points, under 60 words. Address the user " +
  "directly as \"you\".";

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  /** True when an API key has been configured in the environment. */
  get isConfigured(): boolean {
    return !!environment.geminiApiKey;
  }

  /**
   * Sends a captured image to Gemini and returns the identified item details.
   *
   * @param base64Image Raw base64 image data (WITHOUT the `data:` URL prefix).
   * @param mimeType    The image mime type, e.g. `image/jpeg`.
   */
  async identifyItem(
    base64Image: string,
    mimeType = "image/jpeg"
  ): Promise<GeminiScanResult> {
    const text = await this.generate(
      [
        { text: SCAN_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Image } },
      ],
      {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
      }
    );

    return this.normalize(JSON.parse(text));
  }

  /**
   * Pebby's spending report. Takes a plain-text summary of the dashboard
   * metrics and returns a short, friendly piece of advice.
   */
  async getSpendingReport(summary: string): Promise<string> {
    const text = await this.generate(
      [{ text: `${PEBBY_PROMPT}\n\nSpending summary:\n${summary}` }],
      { temperature: 0.6, maxOutputTokens: 200 }
    );
    return text.trim();
  }

  /**
   * Classifies a batch of expenses into categories based on their names, in a
   * single request. Returns an array of `{ id, category }` where category is one
   * of the supplied allowed categories (lowercased).
   */
  async categorizeExpenses(
    items: { id: string; name: string }[],
    allowedCategories: string[]
  ): Promise<{ id: string; category: string }[]> {
    if (items.length === 0) {
      return [];
    }

    const schema = {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          category: { type: "STRING" },
        },
        required: ["id", "category"],
      },
    };

    const prompt =
      "You are an expense categorization assistant. For each expense below, " +
      "choose the single best-fitting category from THIS EXACT LIST: " +
      `${allowedCategories.join(", ")}. Use only a value from that list — if ` +
      'nothing fits, use "default". Respond as a JSON array of {id, category}, ' +
      "one entry per expense, keeping the same id.\n\nExpenses:\n" +
      JSON.stringify(items);

    const text = await this.generate([{ text: prompt }], {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: 0,
    });

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  /** Shared call to the Gemini generateContent endpoint; returns the text part. */
  private async generate(parts: any[], generationConfig: any): Promise<string> {
    if (!this.isConfigured) {
      throw new Error(
        "Gemini API key is not set. Add it to src/app/environments/environment.ts (geminiApiKey)."
      );
    }

    const url =
      `${GENERATIVE_LANGUAGE_ENDPOINT}/${environment.geminiModel}:generateContent` +
      `?key=${environment.geminiApiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig }),
      });
    } catch {
      throw new Error("Could not reach the Gemini API. Check your connection.");
    }

    if (!response.ok) {
      const detail = await this.readError(response);
      throw new Error(`Gemini request failed (${response.status}). ${detail}`);
    }

    const data = await response.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error("Gemini returned an empty response.");
    }

    return text;
  }

  private normalize(raw: any): GeminiScanResult {
    const priceValue = Number(raw?.price);
    return {
      name: (raw?.name ?? "").toString().trim(),
      price: Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null,
    };
  }

  private async readError(response: Response): Promise<string> {
    try {
      const err = await response.json();
      return err?.error?.message ?? "";
    } catch {
      return "";
    }
  }
}
