import { Injectable } from "@angular/core";

/**
 * Wraps the browser's on-device language model (Chrome's built-in AI / Gemini
 * Nano, exposed as `LanguageModel` or `window.ai.languageModel`). Used as a
 * no-quota backup when the cloud Gemini API hits a usage limit.
 *
 * Text-only: on-device multimodal (image) support is still experimental, so the
 * image scanner does not fall back here.
 */
@Injectable({
  providedIn: "root",
})
export class LocalAiService {
  /** Returns the on-device LanguageModel API if the browser exposes one. */
  private getApi(): any {
    if (typeof window === "undefined") {
      return null;
    }
    const w = window as any;
    return w.LanguageModel || w.ai?.languageModel || w.ai || null;
  }

  /** True if an on-device model is present and usable (possibly after download). */
  async isAvailable(): Promise<boolean> {
    const api = this.getApi();
    if (!api) {
      return false;
    }
    try {
      if (typeof api.availability === "function") {
        const status = await api.availability();
        return status === "available" || status === "downloadable" || status === "downloading";
      }
      if (typeof api.capabilities === "function") {
        const caps = await api.capabilities();
        return caps?.available === "readily" || caps?.available === "after-download";
      }
      // Some builds expose create() without an availability probe.
      return typeof api.create === "function";
    } catch {
      return false;
    }
  }

  /** Runs a text prompt on the on-device model and returns its response. */
  async generateText(prompt: string): Promise<string> {
    const api = this.getApi();
    if (!api || typeof api.create !== "function") {
      throw new Error("On-device AI is not available in this browser.");
    }

    const session = await api.create();
    try {
      const result = await session.prompt(prompt);
      return (result ?? "").toString();
    } finally {
      try {
        session.destroy?.();
      } catch {
        // ignore
      }
    }
  }
}
