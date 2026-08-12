import { createWorker } from 'tesseract.js';
import type { RawWord, TicketLine } from './ticketTypes';
import { groupWordsIntoLines, detectColumns, textLinesToTicketLines } from './ticketLayout';
import { preprocessImage } from './ticketPreprocessing';
import { selectParser, SUPERMARKET_PATTERNS } from './ticketParsers';

export interface ParsedTicketItem {
  name: string;
  rawName: string;
  quantity: number;
  price: number;
  unitPrice: number | null;
  category: string;
  confidence: 'high' | 'medium' | 'low';
  needsReview: boolean;
  mathematicalConsistency: boolean | null;
}

export interface ParsedTicket {
  supermarket: string | null;
  date: string | null;
  total: number | null;
  items: ParsedTicketItem[];
  time: string | null;
  parserUsed: string;
  totalConfidence: number;
}

export interface OCRProgressEvent {
  status: string;
  progress: number;
}

// Singleton worker — loads once, reused on subsequent scans
let cachedWorker: Awaited<ReturnType<typeof createWorker>> | null = null;

async function getWorker(onProgress: (event: OCRProgressEvent) => void) {
  if (cachedWorker) return cachedWorker;

  cachedWorker = await createWorker('spa+cat', 1, {
    logger: m => {
      if (m.status && m.progress !== undefined) {
        onProgress({ status: m.status, progress: m.progress });
      }
    }
  });

  return cachedWorker;
}

function buildResult(
  fullText: string,
  lines: TicketLine[],
  _parser: ReturnType<typeof selectParser>
): ParsedTicket {
  const first8Text = lines.slice(0, 8).map(l => l.rawText).join('\n');
  // Also search full text for supermarket in case header is split
  const searchText = first8Text + '\n' + fullText.slice(0, 300);

  let merchant: string | null = null;
  for (const p of SUPERMARKET_PATTERNS) {
    if (p.pattern.test(searchText)) {
      merchant = p.name;
      break;
    }
  }

  // Date: DD/MM/YY or DD-MM-YYYY
  const dateMatch = fullText.match(/(\d{2})[\/\-](\d{2})[\/\-](\d{2,4})/);
  let date: string | null = null;
  if (dateMatch) {
    const d = dateMatch[1], mo = dateMatch[2];
    const yr = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
    date = `${yr}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Time — but avoid matching date fragments
  const timeMatch = fullText.match(/\b(\d{2}):(\d{2})\b/);
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : null;

  // Total — look for TOTAL keyword then the number, search bottom half
  const bottomText = fullText.slice(Math.floor(fullText.length * 0.6));
  const totalMatch =
    bottomText.match(/total\s*[\(€]?\w*[\)€]?\s*(\d+[.,]\d{2})/i) ||
    bottomText.match(/(\d{2,}[.,]\d{2})\s*$/m);
  const total = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : null;

  const selectedParser = selectParser(merchant);
  const layout = detectColumns(lines);
  const internalItems = selectedParser.parseItems(lines, layout);

  const items: ParsedTicketItem[] = internalItems.map(item => ({
    name: item.normalizedName,
    rawName: item.rawName,
    quantity: item.quantity || 1,
    price: item.totalPrice ?? 0,
    unitPrice: item.unitPrice,
    category: item.category,
    confidence: item.confidence >= 0.8 ? 'high' : item.confidence >= 0.55 ? 'medium' : 'low',
    needsReview: item.needsReview,
    mathematicalConsistency: item.mathematicalConsistency
  }));

  const totalConf = items.length > 0
    ? items.reduce((a, i) => a + (i.confidence === 'high' ? 1 : i.confidence === 'medium' ? 0.7 : 0.4), 0) / items.length
    : 0;

  return {
    supermarket: merchant,
    date,
    time,
    total,
    items,
    parserUsed: selectedParser.parserName,
    totalConfidence: totalConf
  };
}

export async function runOCRAndParse(
  file: File,
  onProgress: (event: OCRProgressEvent) => void
): Promise<ParsedTicket> {
  // Step 1: Preprocess image
  onProgress({ status: 'Preprocessant la imatge...', progress: 0.02 });
  let blob: Blob;
  try {
    const result = await preprocessImage(file);
    blob = result.blob;
  } catch {
    // If preprocessing fails, use original file
    blob = file;
  }

  // Step 2: OCR with single language (spa) for speed
  onProgress({ status: 'Inicialitzant motor OCR (spa)...', progress: 0.05 });
  const worker = await getWorker(onProgress);

  onProgress({ status: 'Reconeixent text del tiquet...', progress: 0.1 });
  const { data } = await worker.recognize(blob);
  // NOTE: worker is NOT terminated — it's cached for reuse

  const fullText = data.text;

  // Step 3: Build TicketLines from word-level data if available, else from text
  let lines: TicketLine[];
  const dataAny = data as any;

  if (dataAny.words && Array.isArray(dataAny.words) && dataAny.words.length > 5) {
    // Use bounding-box-based line grouping
    const rawWords: RawWord[] = dataAny.words
      .filter((w: any) => w.text && w.text.trim().length > 0)
      .map((w: any) => ({
        text: w.text.trim(),
        x0: w.bbox?.x0 ?? 0,
        y0: w.bbox?.y0 ?? 0,
        x1: w.bbox?.x1 ?? 0,
        y1: w.bbox?.y1 ?? 0,
        confidence: (w.confidence ?? 50) / 100
      }));
    lines = groupWordsIntoLines(rawWords);
  } else {
    // Fallback: build synthetic lines from raw text (still works well)
    lines = textLinesToTicketLines(fullText);
  }

  onProgress({ status: 'Analitzant estructura del tiquet...', progress: 0.92 });

  const result = buildResult(fullText, lines, selectParser(null));

  onProgress({ status: 'Completat!', progress: 1 });
  return result;
}

// For unit testing — no OCR, just text parsing
export function parseStructuredText(rawText: string): ParsedTicket {
  const lines = textLinesToTicketLines(rawText);
  return buildResult(rawText, lines, selectParser(null));
}
