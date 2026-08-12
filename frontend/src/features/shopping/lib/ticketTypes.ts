export type Confidence = number; // 0..1

export interface RawWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence: Confidence;
}

export interface TicketLine {
  words: RawWord[];
  rawText: string;
  y: number; // average y center
  height: number;
}

export interface TicketItem {
  rawName: string;
  normalizedName: string;
  quantity: number | null;
  unitPrice: number | null;
  totalPrice: number | null;
  category: string;
  confidence: Confidence;
  nameConfidence: Confidence;
  priceConfidence: Confidence;
  mathematicalConsistency: boolean | null; // null = not enough data to verify
  needsReview: boolean;
}

export interface ParsedTicket {
  merchant: { raw: string; normalized: string; confidence: Confidence } | null;
  date: { value: string; confidence: Confidence } | null;
  time: { value: string; confidence: Confidence } | null;
  items: TicketItem[];
  total: { value: number; confidence: Confidence } | null;
  parserVersion: string;
  parserName: string;
}
