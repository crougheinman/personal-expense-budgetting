import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { ReceiptData, ReceiptItem } from '@models';

// Dynamic import for Tesseract.js to avoid SSR issues
let createWorker: any;

export interface OcrProgress {
  status: string;
  progress: number;
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private worker: any = null;
  private progressSubject = new BehaviorSubject<OcrProgress>({ status: 'idle', progress: 0 });
  public progress$ = this.progressSubject.asObservable();
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async initializeWorker(): Promise<void> {
    if (!this.isBrowser) {
      throw new Error('OCR is only available in browser environment');
    }

    if (this.worker) return;

    try {
      // Dynamic import to avoid SSR issues
      const tesseract = await import('tesseract.js');
      createWorker = tesseract.createWorker;

      this.progressSubject.next({ status: 'initializing', progress: 0 });
      this.worker = await createWorker('eng');
      this.progressSubject.next({ status: 'ready', progress: 100 });
    } catch (error) {
      this.progressSubject.next({ status: 'error', progress: 0 });
      throw new Error('Failed to initialize OCR engine');
    }
  }

  processReceipt(file: File): Observable<ReceiptData> {
    if (!this.isBrowser) {
      return throwError(() => new Error('OCR is only available in browser environment'));
    }
    
    return from(this.processReceiptInternal(file));
  }

  private async processReceiptInternal(file: File): Promise<ReceiptData> {
    try {
      await this.initializeWorker();
      
      this.progressSubject.next({ status: 'processing', progress: 0 });
      
      const { data } = await this.worker!.recognize(file);

      const receiptData: ReceiptData = {
        originalText: data.text,
        extractedData: this.parseReceiptText(data.text),
        confidence: data.confidence,
        processedAt: new Date()
      };

      this.progressSubject.next({ status: 'completed', progress: 100 });
      return receiptData;
    } catch (error) {
      this.progressSubject.next({ status: 'error', progress: 0 });
      throw error;
    }
  }

  private parseReceiptText(text: string): ReceiptData['extractedData'] {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract merchant name (usually first line or line with common business words)
    const merchantName = this.extractMerchantName(lines);
    
    // Extract total amount
    const total = this.extractTotal(text);
    
    // Extract date
    const date = this.extractDate(text);
    
    // Extract items
    const items = this.extractItems(lines);

    return {
      merchantName,
      total,
      date,
      items
    };
  }

  private extractMerchantName(lines: string[]): string | undefined {
    // Look for the first line that's not a date, number, or common receipt words
    const skipWords = ['receipt', 'invoice', 'bill', 'total', 'subtotal', 'tax', 'payment'];
    
    for (const line of lines.slice(0, 5)) { // Check first 5 lines
      const cleanLine = line.toLowerCase();
      if (cleanLine.length > 2 && 
          !this.isDate(line) && 
          !this.isPrice(line) && 
          !skipWords.some(word => cleanLine.includes(word))) {
        return line;
      }
    }
    return undefined;
  }

  private extractTotal(text: string): number | undefined {
    // Look for patterns like "Total: $XX.XX", "TOTAL $XX.XX", etc.
    const totalPatterns = [
      /total[:\s]*\$?(\d+\.?\d*)/i,
      /amount[:\s]*\$?(\d+\.?\d*)/i,
      /sum[:\s]*\$?(\d+\.?\d*)/i
    ];

    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1]);
      }
    }

    // Fallback: find the largest monetary amount
    const priceMatches = text.match(/\$?(\d+\.\d{2})/g);
    if (priceMatches) {
      const amounts = priceMatches.map(price => parseFloat(price.replace('$', '')));
      return Math.max(...amounts);
    }

    return undefined;
  }

  private extractDate(text: string): Date | undefined {
    // Common date patterns
    const datePatterns = [
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
      /(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
      /(\w{3,9}\s+\d{1,2},?\s+\d{2,4})/i, // March 15, 2023
      /(\d{1,2}\s+\w{3,9}\s+\d{2,4})/i    // 15 March 2023
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    return undefined;
  }

  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    
    for (const line of lines) {
      // Look for lines that contain both text and a price
      const priceMatch = line.match(/(.+?)\s+\$?(\d+\.\d{2})$/);
      if (priceMatch) {
        const name = priceMatch[1].trim();
        const price = parseFloat(priceMatch[2]);
        
        // Skip lines that are likely totals or taxes
        if (!this.isLikelyTotal(name.toLowerCase())) {
          items.push({ name, price });
        }
      }
    }
    
    return items;
  }

  private isLikelyTotal(text: string): boolean {
    const totalWords = ['total', 'subtotal', 'tax', 'tip', 'gratuity', 'discount', 'change'];
    return totalWords.some(word => text.includes(word));
  }

  private isDate(text: string): boolean {
    return /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text);
  }

  private isPrice(text: string): boolean {
    return /\$?\d+\.\d{2}/.test(text);
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    this.progressSubject.next({ status: 'idle', progress: 0 });
  }
}
