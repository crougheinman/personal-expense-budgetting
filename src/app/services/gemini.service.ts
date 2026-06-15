import { Injectable } from "@angular/core";
import { environment } from "@app/environments/environment";
import { LocalAiService } from "./local-ai.service";

/** Thrown when the cloud Gemini API rejects a request for exceeding its quota. */
export class GeminiLimitError extends Error {
  constructor(detail = "") {
    super(
      `Gemini usage limit reached.${detail ? " " + detail : ""}`.trim()
    );
    this.name = "GeminiLimitError";
  }
}

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

/** A single purchased line item extracted from a receipt. */
export interface ReceiptLineItem {
  description: string;
  amount: number;
  /** YYYY-MM-DD, or null (the UI falls back to the receipt date). */
  date: string | null;
  /** One of the app's expense categories (lowercased). */
  category: string;
  /** Field names the parser was unsure about: "description"|"amount"|"date"|"category". */
  uncertainFields: string[];
}

export interface ReceiptScanResult {
  /** The receipt's overall date (YYYY-MM-DD) if found, else null. */
  date: string | null;
  items: ReceiptLineItem[];
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
  "System Role & Core Persona:\n" +
  "You are Pebby, an intelligent, supportive, and pragmatic financial co-pilot " +
  "integrated into a personal and business expense tracking application. Your " +
  "tone is warm, collaborative, and insightful — acting like an expert peer or " +
  "a brilliant business partner. Avoid sounding like a rigid, judgmental " +
  "accountant or a formal textbook.\n\n" +
  "Operational Context & Domain Knowledge:\n" +
  "1. Dynamic Cash Flow Architecture: the user manages a mix of professional " +
  "web development infrastructure costs, early-stage startup operations, and " +
  "daily personal living expenses.\n" +
  "2. Irregular Income Patterns: income arrives in volatile spikes (freelance " +
  "milestones, contract clearances, startup capital injections) rather than " +
  "predictable bi-weekly salaries. Do not panic during quiet development " +
  "periods; focus on managing variable burn rates and protecting the financial " +
  "runway. When a fixed monthly salary figure is provided, treat it as the " +
  "baseline income: gauge how committed bills and discretionary spending consume " +
  "it (income minus committed bills = breathing room), call out when obligations " +
  "leave little headroom, and still allow for irregular top-ups. If income is " +
  "'not set', simply skip income commentary.\n" +
  "3. Productivity Investments: certain recurring personal expenses — such as " +
  "specialized coffee/milk tea configurations or on-demand logistics/" +
  "transportation services — are calculated operational investments to maintain " +
  "high velocity and deep focus. Never offer generic, tone-deaf advice like " +
  "\"cut back on coffee to save money.\" Instead, focus on optimization and " +
  "finding hidden systemic leaks (like excessive delivery or convenience fees).\n" +
  "4. Recurring Commitments & Bills: the user tracks bills in three flavours — " +
  "RECURRING installment plans (a fixed number of terms, e.g. a loan paid 3/12), " +
  "open-ended SUBSCRIPTIONS (ongoing monthly charges with no end date), and " +
  "ONE-TIME bills (a single payment, then they're gone). Treat the total monthly " +
  "subscription load as a prime candidate for systemic leaks — flag stacking " +
  "auto-renewals and anything rarely used. Respect committed obligations: " +
  "installment balances and pending one-time bills are money already spoken for, " +
  "so weigh them against the runway. Celebrate an installment plan nearing payoff.\n\n" +
  "Analysis Guardrails & Reporting Structure:\n" +
  "Organize your response using clean, scannable Markdown (bold labels and " +
  "\"- \" bullet lines — NO large headings):\n" +
  "1. The Direct Pulse: lead with a single-sentence summary of the current " +
  "financial state or trajectory.\n" +
  "2. Key Nuance / Anomalies: highlight specific data points that stand out " +
  "(e.g. a subscription auto-renewal that just hit, an unusual spike in " +
  "transaction fees, or an incredibly optimized zero-expense day).\n" +
  "3. Actionable Next Steps: provide 1 to 2 concrete, highly realistic " +
  "behavioral recommendations that align with maintaining their development " +
  "runway.\n\n" +
  "Within those sections, also weave in: a one-line year-to-date read; how the " +
  "current week is tracking (call out the heaviest day if one stands out); and, " +
  "from the by-weekday figures, the weekday that tends to SURGE in spending.\n\n" +
  "All amounts are in Philippine Pesos (PHP). Wrap key numbers/items in " +
  "**bold**. Keep it tight — under ~120 words. Address the user directly as " +
  "\"you\".";

@Injectable({
  providedIn: "root",
})
export class GeminiService {
  /** Rotating cursor so successive requests start on different keys. */
  private keyCursor = 0;

  constructor(private localAi: LocalAiService) {}

  /** True when any provider (Gemini, OpenRouter, Groq, or NVIDIA) has a key. */
  get isConfigured(): boolean {
    return (
      this.apiKeys.length > 0 ||
      this.openRouterConfigured ||
      this.groqConfigured ||
      this.nvidiaConfigured
    );
  }

  /** OpenRouter fallback key, trimmed. */
  private get openRouterKey(): string {
    return ((environment as any).openRouterApiKey ?? "").toString().trim();
  }

  get openRouterConfigured(): boolean {
    return this.openRouterKey.length > 0;
  }

  /** Groq fallback key, trimmed. */
  private get groqKey(): string {
    return ((environment as any).groqApiKey ?? "").toString().trim();
  }

  get groqConfigured(): boolean {
    return this.groqKey.length > 0;
  }

  /** NVIDIA NIM fallback keys (single + array), trimmed and de-duplicated. */
  private get nvidiaKeys(): string[] {
    const env = environment as any;
    const extra: string[] = Array.isArray(env.nvidiaApiKeys)
      ? env.nvidiaApiKeys
      : [];
    const all = [env.nvidiaApiKey, ...extra]
      .map((k) => (k ?? "").toString().trim())
      .filter((k) => k.length > 0);
    return Array.from(new Set(all));
  }

  get nvidiaConfigured(): boolean {
    return this.nvidiaKeys.length > 0;
  }

  /**
   * All configured keys (the single `geminiApiKey` plus any `geminiApiKeys`),
   * trimmed, de-duplicated, and emptied of blanks. Used for quota failover.
   */
  private get apiKeys(): string[] {
    const extra: string[] = Array.isArray((environment as any).geminiApiKeys)
      ? (environment as any).geminiApiKeys
      : [];
    const all = [environment.geminiApiKey, ...extra]
      .map((k) => (k ?? "").toString().trim())
      .filter((k) => k.length > 0);
    return Array.from(new Set(all));
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
    const prompt = `${PEBBY_PROMPT}\n\nSpending summary:\n${summary}`;
    try {
      const text = await this.generate([{ text: prompt }], {
        temperature: 0.6,
        maxOutputTokens: 400,
        // gemini-2.5-flash "thinking" tokens count against the output cap and
        // were eating the whole budget, truncating Pebby mid-sentence. Disable.
        thinkingConfig: { thinkingBudget: 0 },
      });
      return text.trim();
    } catch (err) {
      const local = await this.tryLocal(err, prompt);
      if (local !== null) {
        return local.trim();
      }
      throw err;
    }
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
      "one entry per expense, keeping the same id. Output only the JSON array, " +
      "with no extra text.\n\nExpenses:\n" +
      JSON.stringify(items);

    let text: string;
    try {
      text = await this.generate([{ text: prompt }], {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
      });
    } catch (err) {
      const local = await this.tryLocal(err, prompt);
      if (local === null) {
        throw err;
      }
      text = local;
    }

    try {
      const parsed = JSON.parse(this.extractJson(text));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Extracts purchased line items from a receipt image or PDF. `mimeType` is the
   * file's type (e.g. image/jpeg, image/png, application/pdf). Each item is
   * categorized into one of `categories`, and fields the parser is unsure about
   * are flagged in `uncertainFields`.
   */
  async scanReceipt(
    base64: string,
    mimeType: string,
    categories: string[],
    onProvider?: (name: string) => void
  ): Promise<ReceiptScanResult> {
    const schema = {
      type: "OBJECT",
      properties: {
        date: { type: "STRING", nullable: true },
        items: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              description: { type: "STRING" },
              amount: { type: "NUMBER" },
              date: { type: "STRING", nullable: true },
              category: { type: "STRING" },
              uncertainFields: { type: "ARRAY", items: { type: "STRING" } },
            },
            required: ["description", "amount", "category"],
          },
        },
      },
      required: ["items"],
    };

    const prompt =
      `You are a precise receipt parser. From the attached receipt ` +
      `${mimeType.includes("pdf") ? "PDF" : "image"}, extract every PURCHASED ` +
      `line item. EXCLUDE non-purchase lines: subtotal, total, tax/VAT, tip, ` +
      `service charge, change, cash/card/payment lines, discounts, loyalty ` +
      `points, and store/header/footer text. For each item return: description ` +
      `(clean product name), amount (the line's price as a number), date ` +
      `(YYYY-MM-DD; use the receipt's overall date when the line has none), and ` +
      `category chosen from THIS EXACT LIST: ${categories.join(", ")} — use only ` +
      `a value from that list, or "default" if none fits. Also return the ` +
      `receipt's overall date as "date" (YYYY-MM-DD or null). For ANY field you ` +
      `are not confident about (blurry/ambiguous text), add that field's name ` +
      `("description" | "amount" | "date" | "category") to that item's ` +
      `uncertainFields array; otherwise leave uncertainFields empty.`;

    const text = await this.generate(
      [
        { text: prompt },
        { inline_data: { mime_type: mimeType, data: base64 } },
      ],
      {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
      },
      onProvider
    );

    return this.normalizeReceipt(JSON.parse(this.extractJson(text)));
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private normalizeReceipt(raw: any): ReceiptScanResult {
    const rawItems: any[] = Array.isArray(raw?.items) ? raw.items : [];
    const items: ReceiptLineItem[] = rawItems
      .map((it) => {
        const amount = Number(it?.amount);
        return {
          description: (it?.description ?? "").toString().trim(),
          amount: Number.isFinite(amount) ? amount : 0,
          date: this.normalizeDate(it?.date),
          category: (it?.category ?? "default").toString().trim().toLowerCase(),
          uncertainFields: Array.isArray(it?.uncertainFields)
            ? it.uncertainFields.map((f: any) => f.toString())
            : [],
        };
      })
      .filter((it) => it.description.length > 0);

    return { date: this.normalizeDate(raw?.date), items };
  }

  private normalizeDate(value: any): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  /**
   * If the given error is a cloud usage-limit error and an on-device model is
   * available, runs the prompt locally and returns the text. Returns null when
   * no local fallback should be used (caller then rethrows the original error).
   */
  private async tryLocal(err: unknown, prompt: string): Promise<string | null> {
    if (!(err instanceof GeminiLimitError)) {
      return null;
    }
    if (!(await this.localAi.isAvailable())) {
      return null;
    }
    try {
      return await this.localAi.generateText(prompt);
    } catch {
      return null;
    }
  }

  /** Pulls a JSON payload out of model text that may be wrapped in code fences. */
  private extractJson(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    return (fenced ? fenced[1] : text).trim();
  }

  /**
   * Provider-level entry point. Tries Gemini first (with its own multi-key
   * failover), then each configured cloud fallback in order (OpenRouter, then
   * Groq). A Gemini *quota* failure is re-raised when every fallback also fails,
   * so text callers can still drop to the on-device model via tryLocal().
   */
  private async generate(
    parts: any[],
    generationConfig: any,
    onProvider?: (name: string) => void
  ): Promise<string> {
    try {
      onProvider?.("Gemini");
      return await this.generateGemini(parts, generationConfig);
    } catch (err) {
      let lastErr: unknown = err;
      for (const fallback of this.fallbackProviders()) {
        try {
          onProvider?.(fallback.name);
          return await fallback.run(parts, generationConfig);
        } catch (fbErr) {
          console.warn(`AI fallback (${fallback.name}) failed:`, fbErr);
          lastErr = fbErr;
        }
      }
      // Preserve the Gemini limit signal so text methods can try on-device AI.
      if (err instanceof GeminiLimitError) {
        throw err;
      }
      throw lastErr;
    }
  }

  /** Configured cloud fallbacks, in priority order (named for UI progress). */
  private fallbackProviders(): Array<{
    name: string;
    run: (parts: any[], cfg: any) => Promise<string>;
  }> {
    const providers: Array<{
      name: string;
      run: (parts: any[], cfg: any) => Promise<string>;
    }> = [];
    if (this.openRouterConfigured) {
      providers.push({ name: "OpenRouter", run: (p, c) => this.generateOpenRouter(p, c) });
    }
    if (this.groqConfigured) {
      providers.push({ name: "Groq", run: (p, c) => this.generateGroq(p, c) });
    }
    if (this.nvidiaConfigured) {
      providers.push({ name: "NVIDIA", run: (p, c) => this.generateNvidia(p, c) });
    }
    return providers;
  }

  /**
   * Calls the Gemini generateContent endpoint with quota failover.
   *
   * Keys are tried in round-robin order (so load spreads across them). If a key
   * returns a 429 we move on to the next key immediately; any other key error
   * (invalid key, bad request, network) is also skipped so one dead key never
   * blocks a working one. If EVERY key is rate-limited we honour the shortest
   * suggested `retryDelay` (free-tier per-minute caps clear in seconds) and
   * retry one key once before giving up.
   */
  private async generateGemini(
    parts: any[],
    generationConfig: any
  ): Promise<string> {
    const keys = this.apiKeys;
    if (keys.length === 0) {
      throw new Error(
        "Gemini API key is not set. Add it to src/app/environments/environment.ts (geminiApiKey)."
      );
    }

    // Round-robin: start at the cursor, then advance it for the next request.
    const ordered = keys.map((_, i) => keys[(this.keyCursor + i) % keys.length]);
    this.keyCursor = (this.keyCursor + 1) % keys.length;

    let lastLimit: GeminiLimitError | null = null;
    let lastOther: Error | null = null;
    let lastDelay: number | null = null;

    for (const key of ordered) {
      const r = await this.callOnce(key, parts, generationConfig);
      if (r.ok) {
        return r.text;
      }
      if (r.limit) {
        lastLimit = r.error as GeminiLimitError;
        lastDelay = r.retryDelaySeconds;
      } else {
        lastOther = r.error;
      }
      // Try the next key (if any) before giving up.
    }

    // Every key failed. If the failures were quota limits with a short suggested
    // delay, wait it out and retry the last key once.
    if (lastLimit && lastDelay !== null && lastDelay <= 60) {
      await this.delay(lastDelay * 1000 + 500);
      const retry = await this.callOnce(
        ordered[ordered.length - 1],
        parts,
        generationConfig
      );
      if (retry.ok) {
        return retry.text;
      }
    }

    // Prefer surfacing a quota error (at least one key authenticated) over an
    // invalid-key/network error.
    throw lastLimit ?? lastOther ?? new GeminiLimitError();
  }

  /** A single endpoint call with one key. Never throws; returns a result tag. */
  private async callOnce(
    key: string,
    parts: any[],
    generationConfig: any
  ): Promise<
    | { ok: true; text: string }
    | {
        ok: false;
        limit: boolean;
        error: Error;
        retryDelaySeconds: number | null;
      }
  > {
    const url =
      `${GENERATIVE_LANGUAGE_ENDPOINT}/${environment.geminiModel}:generateContent` +
      `?key=${key}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts }], generationConfig }),
      });
    } catch {
      return {
        ok: false,
        limit: false,
        error: new Error("Could not reach the Gemini API. Check your connection."),
        retryDelaySeconds: null,
      };
    }

    if (!response.ok) {
      const { message, retryDelaySeconds } = await this.readError(response);
      if (response.status === 429) {
        return {
          ok: false,
          limit: true,
          error: new GeminiLimitError(message),
          retryDelaySeconds,
        };
      }
      return {
        ok: false,
        limit: false,
        error: new Error(`Gemini request failed (${response.status}). ${message}`),
        retryDelaySeconds: null,
      };
    }

    const data = await response.json();
    const text: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        ok: false,
        limit: false,
        error: new Error("Gemini returned an empty response."),
        retryDelaySeconds: null,
      };
    }

    return { ok: true, text };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateOpenRouter(parts: any[], cfg: any): Promise<string> {
    const env = environment as any;
    const hasImage = parts.some((p) => p?.inline_data);
    return this.generateOpenAiCompatible(
      {
        provider: "OpenRouter",
        endpoint: "https://openrouter.ai/api/v1/chat/completions",
        key: this.openRouterKey,
        model: hasImage
          ? env.openRouterVisionModel ||
            "meta-llama/llama-3.2-11b-vision-instruct:free"
          : env.openRouterModel || "meta-llama/llama-3.3-70b-instruct:free",
        headers: {
          "HTTP-Referer": this.siteUrl(),
          "X-Title": "Personal Expense Budgeting",
        },
      },
      parts,
      cfg
    );
  }

  private generateGroq(parts: any[], cfg: any): Promise<string> {
    const env = environment as any;
    const hasImage = parts.some((p) => p?.inline_data);
    return this.generateOpenAiCompatible(
      {
        provider: "Groq",
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        key: this.groqKey,
        model: hasImage
          ? env.groqVisionModel || "meta-llama/llama-4-scout-17b-16e-instruct"
          : env.groqModel || "llama-3.3-70b-versatile",
      },
      parts,
      cfg
    );
  }

  private async generateNvidia(parts: any[], cfg: any): Promise<string> {
    const env = environment as any;
    const hasImage = parts.some((p) => p?.inline_data);
    const base = (env.nvidiaBaseUrl || "https://integrate.api.nvidia.com/v1")
      .toString()
      .replace(/\/+$/, "");
    const model = hasImage
      ? env.nvidiaVisionModel || "meta/llama-3.2-90b-vision-instruct"
      : env.nvidiaModel || "nvidia/llama-3.1-nemotron-70b-instruct";

    // Try each NVIDIA key in turn so a rate-limited key falls over to the next.
    let lastErr: unknown = null;
    for (const key of this.nvidiaKeys) {
      try {
        return await this.generateOpenAiCompatible(
          {
            provider: "NVIDIA",
            endpoint: `${base}/chat/completions`,
            key,
            model,
          },
          parts,
          cfg
        );
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr ?? new Error("NVIDIA request failed.");
  }

  /**
   * Shared adapter for OpenAI-compatible chat APIs (OpenRouter, Groq, NVIDIA).
   * Translates our Gemini-style `parts` (text + inline_data) into chat messages,
   * picking the supplied vision/text model already resolved by the caller. JSON
   * requests are asked for via `response_format`.
   *
   * Note: image parts are sent as data URLs, so PNG/JPEG receipts work; PDFs are
   * not reliably parsed by these vision models, so PDF scanning still relies on
   * Gemini.
   */
  private async generateOpenAiCompatible(
    opts: {
      provider: string;
      endpoint: string;
      key: string;
      model: string;
      headers?: Record<string, string>;
    },
    parts: any[],
    generationConfig: any
  ): Promise<string> {
    const content = parts.map((p) => {
      if (p?.inline_data) {
        return {
          type: "image_url",
          image_url: {
            url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}`,
          },
        };
      }
      return { type: "text", text: p?.text ?? "" };
    });

    const body: any = {
      model: opts.model,
      messages: [{ role: "user", content }],
    };
    if (generationConfig?.temperature !== undefined) {
      body.temperature = generationConfig.temperature;
    }
    if (generationConfig?.maxOutputTokens !== undefined) {
      body.max_tokens = generationConfig.maxOutputTokens;
    }
    if (generationConfig?.responseMimeType === "application/json") {
      body.response_format = { type: "json_object" };
    }

    let response: Response;
    try {
      response = await fetch(opts.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.key}`,
          ...(opts.headers ?? {}),
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error(`Could not reach ${opts.provider}. Check your connection.`);
    }

    if (!response.ok) {
      const { message } = await this.readError(response);
      if (response.status === 429) {
        throw new GeminiLimitError(
          message || `${opts.provider} rate limit reached.`
        );
      }
      throw new Error(
        `${opts.provider} request failed (${response.status}). ${message}`
      );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`${opts.provider} returned an empty response.`);
    }
    return typeof text === "string" ? text : JSON.stringify(text);
  }

  /** Origin used for OpenRouter's optional referer header (SSR-safe). */
  private siteUrl(): string {
    try {
      return typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://ang-fire-b15d9.web.app";
    } catch {
      return "https://ang-fire-b15d9.web.app";
    }
  }

  private normalize(raw: any): GeminiScanResult {
    const priceValue = Number(raw?.price);
    return {
      name: (raw?.name ?? "").toString().trim(),
      price: Number.isFinite(priceValue) && priceValue > 0 ? priceValue : null,
    };
  }

  /**
   * Reads the API error body, returning the human message plus any retry delay
   * Google suggests (from the RetryInfo detail, e.g. "21s") in seconds.
   */
  private async readError(
    response: Response
  ): Promise<{ message: string; retryDelaySeconds: number | null }> {
    try {
      const err = await response.json();
      const message = err?.error?.message ?? "";
      let retryDelaySeconds: number | null = null;
      const details = err?.error?.details;
      if (Array.isArray(details)) {
        const retryInfo = details.find(
          (d: any) =>
            typeof d?.["@type"] === "string" && d["@type"].includes("RetryInfo")
        );
        const delay = retryInfo?.retryDelay;
        const match =
          typeof delay === "string" ? delay.match(/([\d.]+)s/) : null;
        if (match) {
          retryDelaySeconds = Math.ceil(parseFloat(match[1]));
        }
      }
      return { message, retryDelaySeconds };
    } catch {
      return { message: "", retryDelaySeconds: null };
    }
  }
}
