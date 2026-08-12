import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Camera, RefreshCw, Plus, Trash2, Check, AlertCircle, AlertTriangle, Upload, Video } from 'lucide-react';
import { runOCRAndParse, type ParsedTicketItem } from '../lib/ticketParser';
import { useShoppingActions } from '../hooks/useShoppingActions';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import toast from 'react-hot-toast';

interface TicketScannerModalProps {
  onClose: () => void;
}

const CATEGORIES = ['Alimentació', 'Begudes', 'Neteja', 'Llar', 'Farmàcia i Salut', 'Mascotes', 'Altres'];

type Step = 'UPLOAD' | 'SCANNING' | 'REVIEW';

export default function TicketScannerModal({ onClose }: TicketScannerModalProps) {
  const actions = useShoppingActions();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [step, setStep] = useState<Step>('UPLOAD');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatus, setScanStatus] = useState('');
  
  const [isLiveCamera, setIsLiveCamera] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Real-time scanning state
  const isProcessingFrameRef = useRef(false);
  const autoScanIntervalRef = useRef<number | null>(null);

  // Parsed result state
  const [supermarket, setSupermarket] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemsList, setItemsList] = useState<ParsedTicketItem[]>([]);
  const [rawOCRText, setRawOCRText] = useState('');
  const [showRaw, setShowRaw] = useState(false);

  // Preview image
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Live Camera Logic
  const stopCamera = useCallback(() => {
    if (autoScanIntervalRef.current) {
      clearInterval(autoScanIntervalRef.current);
      autoScanIntervalRef.current = null;
    }
    
    // Cleanup stream directly from videoRef to avoid stale closures and infinite effect loops
    if (videoRef.current?.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setStream(null);
    setIsLiveCamera(false);
  }, []);

  const startCamera = async () => {
    setCameraError(false);
    setIsLiveCamera(true); // Render the video element immediately
    setScanStatus('Cercant text...');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      setIsLiveCamera(false);
      toast.error('No es pot accedir a la càmera. Verifica els permisos del navegador.');
    }
  };

  useEffect(() => {
    if (isLiveCamera && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
      
      // Start the auto-scan loop once video is playing
      autoScanIntervalRef.current = window.setInterval(captureAndAnalyzeFrame, 2000);
    }
    
    return () => {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
    };
  }, [isLiveCamera, stream]);

  // Handle unmount cleanup
  useEffect(() => {
    return () => {
      if (autoScanIntervalRef.current) clearInterval(autoScanIntervalRef.current);
      // We can't use stopCamera directly here because of React strict mode / unmount timings.
      // Just stop any active tracks.
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(s => s.getTracks().forEach(t => t.stop()))
        .catch(() => {}); // Fallback brute-force cleanup if needed, but videoRef is better if still alive
    };
  }, []);

  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || isProcessingFrameRef.current || !isLiveCamera) return;
    
    const video = videoRef.current;
    if (video.videoWidth === 0) return; // not ready yet
    
    isProcessingFrameRef.current = true;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      isProcessingFrameRef.current = false;
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        isProcessingFrameRef.current = false;
        return;
      }
      
      const file = new File([blob], 'live_capture.png', { type: 'image/png' });
      
      try {
        const parsed = await runOCRAndParse(file, (m) => {
          if (m.status === 'recognizing text') {
            setScanProgress(Math.round(m.progress * 100));
            setScanStatus(`Llegint tiquet... ${Math.round(m.progress * 100)}%`);
          }
        });

        // Evaluate if this was a successful scan:
        // We consider it good if we found at least 3 valid items OR (supermarket AND at least 1 valid item)
        const validItems = parsed.items.filter(i => i.name.trim() !== '' && i.price > 0);
        const isGoodScan = validItems.length >= 2 || (parsed.supermarket && validItems.length >= 1);

        if (isGoodScan && isLiveCamera) {
          // Success! Stop camera and go to review
          stopCamera();
          
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          
          setSupermarket(parsed.supermarket || '');
          if (parsed.date) setDate(parsed.date);
          setItemsList(parsed.items);
          setRawOCRText('OCR completed automatically from live feed.');
          setStep('REVIEW');
        } else {
          // Failed or poor scan, keep looking
          setScanStatus('Enfoca el tiquet sencer...');
          setScanProgress(0);
        }
      } catch (err) {
        // Just ignore errors during continuous scanning and try again
        setScanStatus('Cercant tiquet...');
      } finally {
        isProcessingFrameRef.current = false;
      }
    }, 'image/png');
  };

  const runOCR = async (file: File) => {
    // This is now only used for gallery uploads
    setStep('SCANNING');
    setScanProgress(0);
    setScanStatus('Carregant imatge...');

    // Preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      setScanStatus('Processant imatge del tiquet...');
      
      const parsed = await runOCRAndParse(file, (m) => {
        if (m.status === 'recognizing text') {
          setScanProgress(Math.round(m.progress * 100));
          setScanStatus(`Reconeixent text del tiquet... ${Math.round(m.progress * 100)}%`);
        } else {
          setScanStatus(m.status);
        }
      });

      setSupermarket(parsed.supermarket || '');
      if (parsed.date) setDate(parsed.date);
      setItemsList(parsed.items.length > 0 ? parsed.items : [
        { name: '', rawName: '', quantity: 1, price: 0, unitPrice: null, category: 'Alimentació', confidence: 'low', needsReview: false, mathematicalConsistency: null }
      ]);
      setRawOCRText(parsed.items.length > 0 ? 'OCR completed successfully.' : 'No items found.');

      setStep('REVIEW');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Error en el reconeixement OCR. Verifica que la imatge és llegible.');
      setStep('UPLOAD');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) runOCR(file);
  };

  // Item editing
  const handleItemChange = (index: number, field: keyof ParsedTicketItem, val: any) => {
    setItemsList(prev => prev.map((item, idx) =>
      idx === index ? { ...item, [field]: val, confidence: 'high' as const } : item
    ));
  };

  const handleAddItem = () => {
    setItemsList(prev => [
      ...prev,
      { name: '', rawName: '', quantity: 1, price: 0, unitPrice: null, category: 'Alimentació', confidence: 'low' as const, needsReview: false, mathematicalConsistency: null }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItemsList(prev => prev.filter((_, idx) => idx !== index));
  };

  // Save ticket
  const handleSaveTicket = async (addToActiveList: boolean) => {
    if (!supermarket.trim()) { toast.error('Introdueix el supermercat'); return; }
    const validItems = itemsList.filter(i => i.name.trim().length > 0 && i.price > 0);
    if (validItems.length === 0) { toast.error('Cal tenir almenys un article amb nom i preu'); return; }

    const total = validItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      await actions.addPurchase({
        supermarket: supermarket.trim(),
        date,
        total,
        items: validItems.map(i => ({
          name: i.name.trim(),
          quantity: i.quantity,
          price: i.price,
          category: i.category
        }))
      });

      if (addToActiveList) {
        for (const item of validItems) {
          await actions.addItem({
            name: item.name.trim(),
            quantity: item.quantity,
            unit: 'u',
            category: item.category,
            price: item.price,
            important: false,
            notes: `Tiquet de ${supermarket.trim()}`,
          });
        }
        toast.success('Tiquet desat i articles afegits a la llista activa!');
      } else {
        toast.success('Tiquet registrat a Compres Passades!');
      }
      onClose();
    } catch {
      toast.error('Error en desar el tiquet');
    }
  };

  const lowConfidenceCount = itemsList.filter(i => i.needsReview || i.confidence === 'low' || i.mathematicalConsistency === false).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-premium" onClick={() => { stopCamera(); onClose(); }} />
      <div className="relative w-full max-w-2xl bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col animate-scale-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-brand-500" />
            <h3 className="font-display font-bold text-base text-[var(--text-primary)]">
              Reconeixedor de Tiquets OCR
            </h3>
          </div>
          <button onClick={() => { stopCamera(); onClose(); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]/40 flex-shrink-0">
          {(['UPLOAD', 'SCANNING', 'REVIEW'] as Step[]).map((s, idx) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center transition-all
                ${step === s ? 'bg-brand-500 text-white' : idx < ['UPLOAD', 'SCANNING', 'REVIEW'].indexOf(step) ? 'bg-emerald-500 text-white' : 'bg-[var(--bg-subtle)] text-[var(--text-muted)]'}`}>
                {idx + 1}
              </div>
              <span className={`text-[10px] font-semibold ${step === s ? 'text-brand-500' : 'text-[var(--text-muted)]'}`}>
                {s === 'UPLOAD' ? 'Captura' : s === 'SCANNING' ? 'Anàlisi OCR' : 'Revisió'}
              </span>
              {idx < 2 && <div className="w-6 h-px bg-[var(--border-subtle)] mx-1" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* UPLOAD STEP */}
          {step === 'UPLOAD' && (
            <div className="flex flex-col items-center justify-center h-full py-2 space-y-6">
              
              {isLiveCamera ? (
                <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-inner border border-[var(--border-subtle)]">
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  {/* Aiming guide */}
                  <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40">
                    <div className="w-full h-full border-2 border-brand-500/50 border-dashed rounded-lg flex flex-col items-center justify-center relative overflow-hidden">
                      {/* Scanning laser animation */}
                      <div className="absolute w-full h-1 bg-brand-500 shadow-[0_0_15px_3px_rgba(99,102,241,0.5)] animate-scan-laser" />
                    </div>
                  </div>
                  
                  {/* Status overlay */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center pb-safe px-4">
                    <div className="bg-black/60 backdrop-blur border border-white/10 text-white text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
                      <RefreshCw size={14} className={isProcessingFrameRef.current ? "animate-spin text-brand-400" : "text-gray-400"} />
                      {scanStatus}
                    </div>
                  </div>
                  
                  {/* Close camera button */}
                  <button 
                    onClick={() => { stopCamera(); setIsLiveCamera(false); }}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                    <Video size={36} />
                  </div>
                  <div className="text-center space-y-1 max-w-xs">
                    <h4 className="font-display font-bold text-sm text-[var(--text-primary)]">Escaneja el tiquet de compra</h4>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Enfoca el tiquet amb la càmera en directe per a un millor reconeixement, o tria una imatge de la galeria.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    {/* Live Camera trigger */}
                    <button 
                      onClick={startCamera}
                      className="w-full flex items-center justify-center gap-2 cursor-pointer bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-sm"
                    >
                      <Camera size={16} /> Escanejar en directe
                    </button>

                    {/* Upload from gallery */}
                    <label className="w-full flex items-center justify-center gap-2 cursor-pointer border border-[var(--border-default)] text-[var(--text-primary)] font-bold py-3 px-4 rounded-xl text-xs transition-all hover:bg-[var(--bg-elevated)]">
                      <Upload size={14} /> Triar des de la Galeria
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {cameraError && (
                    <div className="flex items-start gap-2 text-[10px] text-amber-500 bg-amber-500/5 p-3 rounded-xl border border-amber-500/20 max-w-xs w-full">
                      <AlertTriangle size={12} className="flex-shrink-0 mt-0.5" />
                      <span>No s'ha pogut iniciar la càmera. Assegura't de donar permisos al navegador.</span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2 text-[10px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)] max-w-xs w-full">
                    <AlertCircle size={12} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    <span>L'escaneig en directe elimina problemes d'orientació i mida que afecten les fotos de l'aplicació nativa.</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SCANNING STEP */}
          {step === 'SCANNING' && (
            <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
              {previewUrl && (
                <div className="w-32 h-44 rounded-xl overflow-hidden border-2 border-brand-500/30 shadow-lg">
                  <img src={previewUrl} alt="Tiquet" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="w-full max-w-sm space-y-4">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="text-brand-500 animate-spin flex-shrink-0" />
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{scanStatus}</p>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center">{scanProgress}% complet</p>
              </div>
            </div>
          )}

          {/* REVIEW STEP */}
          {step === 'REVIEW' && (
            <div className="space-y-5">

              {/* Alert if fields need review */}
              {(lowConfidenceCount > 0 || !supermarket) && (
                <div className="flex items-start gap-2 text-[10px] text-amber-500 bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Cal revisió manual: </span>
                    {!supermarket && <span>No s'ha detectat el supermercat. </span>}
                    {lowConfidenceCount > 0 && <span>{lowConfidenceCount} article(s) marcats amb ⚠️ tenen confiança baixa i poden necesitar correcció. </span>}
                  </div>
                </div>
              )}

              {/* Image preview small */}
              {previewUrl && (
                <div className="flex items-center gap-3 bg-[var(--bg-elevated)] p-3 rounded-xl border border-[var(--border-subtle)]">
                  <img src={previewUrl} alt="Tiquet" className="w-12 h-16 object-cover rounded-lg border border-[var(--border-subtle)]" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-[var(--text-primary)]">Tiquet processat</p>
                    <p className="text-[9px] text-[var(--text-muted)]">{itemsList.length} articles reconeguts</p>
                    <button onClick={() => setShowRaw(!showRaw)} className="text-[9px] text-brand-500 hover:underline">
                      {showRaw ? 'Amagar text brut OCR' : 'Veure text brut OCR'}
                    </button>
                  </div>
                </div>
              )}

              {/* Raw OCR text */}
              {showRaw && rawOCRText && (
                <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 max-h-40 overflow-y-auto">
                  <pre className="text-[9px] text-[var(--text-secondary)] whitespace-pre-wrap font-mono">{rawOCRText}</pre>
                </div>
              )}

              {/* Supermarket + date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    id="ocr-super"
                    label={!supermarket ? '⚠️ Supermercat (no detectat)' : 'Supermercat'}
                    value={supermarket}
                    onChange={e => setSupermarket(e.target.value)}
                    placeholder="Ex: Mercadona, Lidl..."
                    required
                  />
                </div>
                <Input
                  id="ocr-date"
                  label="Data de la compra"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2">
                  <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Articles ({itemsList.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[10px] text-brand-500 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={11} /> Afegir manualment
                  </button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-2 px-1 text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <div className="col-span-5">Article</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-2 text-center">Preu €</div>
                  <div className="col-span-2">Categoria</div>
                  <div className="col-span-1"></div>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {itemsList.map((item, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-12 gap-2 items-center p-2.5 rounded-xl border transition-colors
                        ${item.needsReview
                          ? 'bg-amber-500/5 border-amber-500/25'
                          : item.confidence === 'low'
                          ? 'bg-orange-500/5 border-orange-500/25'
                          : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)]'
                        }`}
                    >
                      {/* Name */}
                      <div className="col-span-5 flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {item.mathematicalConsistency === false && (
                            <span className="text-[8px] font-bold bg-red-500/10 text-red-500 px-1 py-0.5 rounded flex-shrink-0" title="Inconsistència matemàtica (potser promoció?)">⚠️ Promoció?</span>
                          )}
                          {(item.needsReview || item.confidence === 'low') && (
                            <AlertTriangle size={10} className="text-amber-500 flex-shrink-0" />
                          )}
                          <input
                            type="text"
                            value={item.name}
                            placeholder="Nom de l'article"
                            onChange={e => handleItemChange(index, 'name', e.target.value)}
                            className="w-full h-8 px-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-brand-500"
                          />
                        </div>
                        {(item.rawName && item.rawName !== item.name || item.needsReview) && (
                          <span className="text-[8px] text-[var(--text-muted)] pl-4">OCR brut: {item.rawName}</span>
                        )}
                      </div>

                      {/* Qty */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                          className="w-full h-8 px-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] text-xs text-[var(--text-primary)] text-center focus:outline-none focus:border-brand-500"
                        />
                      </div>

                      {/* Price */}
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className={`w-full h-8 px-2 rounded-lg border text-xs text-[var(--text-primary)] text-center focus:outline-none focus:border-brand-500 bg-[var(--bg-raised)]
                            ${item.price === 0 ? 'border-amber-400' : 'border-[var(--border-default)]'}`}
                        />
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <select
                          value={item.category}
                          onChange={e => handleItemChange(index, 'category', e.target.value)}
                          className="w-full h-8 px-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-raised)] text-[10px] text-[var(--text-primary)] focus:outline-none"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center bg-[var(--bg-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Tiquet Estimat:</span>
                <span className="text-base font-bold text-[var(--text-primary)]">
                  {itemsList.filter(i => i.name.trim()).reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} €
                </span>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => handleSaveTicket(false)}
                >
                  Guardar a Compres Passades
                </Button>
                <Button
                  type="button"
                  onClick={() => handleSaveTicket(true)}
                  className="flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Desar i afegir a la llista activa
                </Button>
              </div>

              {/* Rescan button */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setStep('UPLOAD'); setPreviewUrl(null); setRawOCRText(''); }}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors underline"
                >
                  Tornar a escanejar un altre tiquet
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
