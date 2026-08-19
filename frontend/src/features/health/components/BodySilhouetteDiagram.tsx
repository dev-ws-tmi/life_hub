import { useState, useMemo } from 'react';
import type { HevyBodyMeasurement } from '../services/hevyApi';
import { Calendar, ChevronDown, Sparkles } from 'lucide-react';

interface BodySilhouetteDiagramProps {
  measurements: HevyBodyMeasurement[];
}

export default function BodySilhouetteDiagram({ measurements }: BodySilhouetteDiagramProps) {
  // 1. Filter ONLY days with > 2 body measurements
  const validMeasurements = useMemo(() => {
    return measurements.filter((m) => {
      let count = 0;
      if (m.chest_cm) count++;
      if (m.left_bicep_cm) count++;
      if (m.right_bicep_cm) count++;
      if (m.left_forearm_cm) count++;
      if (m.right_forearm_cm) count++;
      if (m.abdomen) count++;
      if (m.waist) count++;
      if (m.left_thigh) count++;
      if (m.right_thigh) count++;
      if (m.left_calf) count++;
      if (m.right_calf) count++;
      if (m.neck_cm) count++;
      return count > 2;
    });
  }, [measurements]);

  const [selectedDate, setSelectedDate] = useState<string>(
    validMeasurements.length > 0 ? validMeasurements[0].date : ''
  );

  const [activeZone, setActiveZone] = useState<string | null>(null);

  const selectedMeasurement = useMemo(() => {
    if (!validMeasurements || validMeasurements.length === 0) return null;
    return validMeasurements.find((m) => m.date === selectedDate) || validMeasurements[0];
  }, [validMeasurements, selectedDate]);

  if (!validMeasurements || validMeasurements.length === 0) {
    return (
      <div className="p-8 text-center bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] space-y-2">
        <p className="text-xs text-[var(--text-muted)] font-semibold">No s'han trobat dies amb més de 2 mesures corporals enregistrades.</p>
        <p className="text-[11px] text-[var(--text-secondary)]">Les mesures s'actualitzaran quan afegeixis noves dades corporals a Hevy.</p>
      </div>
    );
  }

  const m = selectedMeasurement;

  return (
    <div className="bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <h3 className="font-display font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            Resum de Composició i Silueta Corporal <Sparkles size={16} className="text-brand-500" />
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            Silueta de referència anatòmica mèdica · Fes hover sobre qualsevol zona o indicador
          </p>
        </div>

        {/* Date Selector Dropdown */}
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-brand-500" />
          <span className="text-xs text-[var(--text-muted)] font-medium">Data de mesures:</span>
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-xl px-3.5 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-brand-500 appearance-none pr-8 cursor-pointer shadow-sm"
            >
              {validMeasurements.map((item) => (
                <option key={item.id} value={item.date}>
                  {item.date} {item.weight_kg ? `(${item.weight_kg} kg)` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Body Silhouette Diagram Container */}
      <div className="relative w-full bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-center gap-10 overflow-hidden min-h-[580px]">
        
        {/* Professional Medical/Fitness Anatomical Vector Silhouette */}
        <div className="relative w-full max-w-md h-[520px] flex items-center justify-center">
          <svg
            viewBox="0 0 400 600"
            className="w-full h-full text-[var(--text-primary)]"
          >
            <defs>
              {/* Arrowhead Marker */}
              <marker
                id="med-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="currentColor" className="text-brand-500" />
              </marker>

              {/* Subtle Gradient Glow for Active Zone */}
              <radialGradient id="zoneGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--color-brand-500, #10b981)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="var(--color-brand-500, #10b981)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* --- ANATOMICAL FULL-BODY SOLID SILHOUETTE --- */}

            {/* Head & Neck */}
            <path
              d="M 200 25 C 215 25 225 38 225 55 C 225 72 214 84 209 88 L 210 102 C 235 106 256 112 272 120 L 265 145 C 255 132 238 124 218 120 L 218 160 L 182 160 L 182 120 C 162 124 145 132 135 145 L 128 120 C 144 112 165 106 190 102 L 191 88 C 186 84 175 72 175 55 C 175 38 185 25 200 25 Z"
              onMouseEnter={() => setActiveZone('NECK')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'NECK'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Torso - Chest & Shoulders */}
            <path
              d="M 135 125 C 150 118 175 115 200 115 C 225 115 250 118 265 125 C 275 140 270 170 262 195 L 138 195 C 130 170 125 140 135 125 Z"
              onMouseEnter={() => setActiveZone('CHEST')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'CHEST'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Torso - Abdomen & Waist */}
            <path
              d="M 138 195 L 262 195 C 255 225 248 245 242 265 L 158 265 C 152 245 145 225 138 195 Z"
              onMouseEnter={() => setActiveZone('ABDOMEN')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'ABDOMEN'
                  ? 'fill-amber-500 opacity-95'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-amber-500/80'
              }`}
            />

            {/* Pelvis / Hips Base */}
            <path
              d="M 158 265 L 242 265 C 252 285 255 305 252 320 L 148 320 C 145 305 148 285 158 265 Z"
              className="fill-[var(--text-primary)] opacity-85"
            />

            {/* Left Upper Arm / Bicep */}
            <path
              d="M 135 125 C 122 135 112 165 105 200 L 128 205 C 134 175 138 150 144 135 Z"
              onMouseEnter={() => setActiveZone('BICEP_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'BICEP_LEFT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Left Forearm & Hand */}
            <path
              d="M 105 200 C 95 240 85 280 78 320 L 98 325 C 106 288 116 248 128 205 Z"
              onMouseEnter={() => setActiveZone('BICEP_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'BICEP_LEFT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Right Upper Arm / Bicep */}
            <path
              d="M 265 125 C 278 135 288 165 295 200 L 272 205 C 266 175 262 150 256 135 Z"
              onMouseEnter={() => setActiveZone('BICEP_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'BICEP_RIGHT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Right Forearm & Hand */}
            <path
              d="M 295 200 C 305 240 315 280 322 320 L 302 325 C 294 288 284 248 272 205 Z"
              onMouseEnter={() => setActiveZone('BICEP_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'BICEP_RIGHT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Left Thigh */}
            <path
              d="M 148 320 L 195 320 C 192 370 188 415 184 450 L 148 450 C 145 410 144 360 148 320 Z"
              onMouseEnter={() => setActiveZone('THIGH_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'THIGH_LEFT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Right Thigh */}
            <path
              d="M 205 320 L 252 320 C 256 360 255 410 252 450 L 216 450 C 212 415 208 370 205 320 Z"
              onMouseEnter={() => setActiveZone('THIGH_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'THIGH_RIGHT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Left Calf & Foot */}
            <path
              d="M 148 450 L 184 450 C 180 495 175 535 170 575 L 142 575 C 145 535 146 495 148 450 Z"
              onMouseEnter={() => setActiveZone('CALF_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'CALF_LEFT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* Right Calf & Foot */}
            <path
              d="M 216 450 L 252 450 C 254 495 255 535 258 575 L 230 575 C 225 535 220 495 216 450 Z"
              onMouseEnter={() => setActiveZone('CALF_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`cursor-pointer transition-all ${
                activeZone === 'CALF_RIGHT'
                  ? 'fill-brand-500 opacity-90'
                  : 'fill-[var(--text-primary)] opacity-85 hover:opacity-100 hover:fill-brand-500/80'
              }`}
            />

            {/* --- PRECISION MEDICAL CALLOUT ARROW LINES --- */}

            {/* Coll Arrow (Left Top) */}
            <line x1="50" y1="95" x2="192" y2="95" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

            {/* Pit Arrow (Left Upper Chest) */}
            <line x1="45" y1="155" x2="165" y2="155" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

            {/* Bíceps Esq. Arrow (Left Mid Arm) */}
            <line x1="35" y1="210" x2="114" y2="210" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

            {/* Abdomen Arrow (Right Mid Waist) */}
            <line x1="355" y1="230" x2="235" y2="230" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-amber-500" markerEnd="url(#med-arrow)" />

            {/* Bíceps Dret Arrow (Right Arm) */}
            <line x1="365" y1="210" x2="286" y2="210" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

            {/* Cuixa Esq. Arrow (Left Mid Thigh) */}
            <line x1="45" y1="385" x2="165" y2="385" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

            {/* Bessons Dret Arrow (Right Calf) */}
            <line x1="355" y1="510" x2="236" y2="510" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-brand-500" markerEnd="url(#med-arrow)" />

          </svg>

          {/* HTML Overlay Callout Badges with Precise Arrow Anchors */}

          {/* Coll Callout */}
          {m?.neck_cm && (
            <div 
              onMouseEnter={() => setActiveZone('NECK')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[14%] left-[2%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'NECK' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Coll</span>
              <span className="text-xs font-bold text-brand-500">{m.neck_cm} cm</span>
            </div>
          )}

          {/* Pit Callout */}
          {m?.chest_cm && (
            <div 
              onMouseEnter={() => setActiveZone('CHEST')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[24%] left-[1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'CHEST' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Pit</span>
              <span className="text-xs font-bold text-brand-500">{m.chest_cm} cm</span>
            </div>
          )}

          {/* Bíceps Esq Callout */}
          {m?.left_bicep_cm && (
            <div 
              onMouseEnter={() => setActiveZone('BICEP_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[33%] left-[-1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'BICEP_LEFT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Bíceps E.</span>
              <span className="text-xs font-bold text-brand-500">{m.left_bicep_cm} cm</span>
            </div>
          )}

          {/* Bíceps Dret Callout */}
          {m?.right_bicep_cm && (
            <div 
              onMouseEnter={() => setActiveZone('BICEP_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[33%] right-[-1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'BICEP_RIGHT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Bíceps D.</span>
              <span className="text-xs font-bold text-brand-500">{m.right_bicep_cm} cm</span>
            </div>
          )}

          {/* Abdomen Callout */}
          {m?.abdomen && (
            <div 
              onMouseEnter={() => setActiveZone('ABDOMEN')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[37%] right-[1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'ABDOMEN' ? 'border-amber-500 bg-amber-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-amber-500 block uppercase tracking-wider">Abdomen</span>
              <span className="text-xs font-bold text-amber-500">{m.abdomen} cm</span>
            </div>
          )}

          {/* Cuixa Esq Callout */}
          {m?.left_thigh && (
            <div 
              onMouseEnter={() => setActiveZone('THIGH_LEFT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[63%] left-[1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'THIGH_LEFT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Cuixa E.</span>
              <span className="text-xs font-bold text-brand-500">{m.left_thigh} cm</span>
            </div>
          )}

          {/* Bessons Dret Callout */}
          {m?.right_calf && (
            <div 
              onMouseEnter={() => setActiveZone('CALF_RIGHT')}
              onMouseLeave={() => setActiveZone(null)}
              className={`absolute top-[83%] right-[1%] bg-[var(--bg-raised)] border px-3 py-1.5 rounded-xl shadow-md cursor-pointer transition-all ${
                activeZone === 'CALF_RIGHT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
              }`}
            >
              <span className="text-[9px] font-bold text-[var(--text-muted)] block uppercase tracking-wider">Bessó D.</span>
              <span className="text-xs font-bold text-brand-500">{m.right_calf} cm</span>
            </div>
          )}

        </div>

        {/* Interactive Muscle Details Breakdown Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
          
          {/* Coll */}
          <div
            onMouseEnter={() => setActiveZone('NECK')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'NECK' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Coll / Neck</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.neck_cm ? `${m.neck_cm} cm` : '—'}
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          </div>

          {/* Pit */}
          <div
            onMouseEnter={() => setActiveZone('CHEST')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'CHEST' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Pit / Chest</span>
              <p className="text-base font-bold text-brand-500">
                {m?.chest_cm ? `${m.chest_cm} cm` : '—'}
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
          </div>

          {/* Abdomen */}
          <div
            onMouseEnter={() => setActiveZone('ABDOMEN')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'ABDOMEN' ? 'border-amber-500 bg-amber-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Abdomen</span>
              <p className="text-base font-bold text-amber-500">
                {m?.abdomen ? `${m.abdomen} cm` : '—'}
              </p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>

          {/* Bíceps Esquerra */}
          <div
            onMouseEnter={() => setActiveZone('BICEP_LEFT')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'BICEP_LEFT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bíceps Esquerra</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.left_bicep_cm ? `${m.left_bicep_cm} cm` : '—'}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">Esq.</span>
          </div>

          {/* Bíceps Dret */}
          <div
            onMouseEnter={() => setActiveZone('BICEP_RIGHT')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'BICEP_RIGHT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bíceps Dret</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.right_bicep_cm ? `${m.right_bicep_cm} cm` : '—'}
              </p>
            </div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)]">Dret</span>
          </div>

          {/* Avantbraç Esquerra & Dret */}
          <div className="p-3.5 bg-[var(--bg-raised)] border border-[var(--border-subtle)] rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Avantbraç (E / D)</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.left_forearm_cm || m?.right_forearm_cm ? `${m?.left_forearm_cm || '—'} / ${m?.right_forearm_cm || '—'} cm` : '—'}
              </p>
            </div>
          </div>

          {/* Cuixa Esquerra */}
          <div
            onMouseEnter={() => setActiveZone('THIGH_LEFT')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'THIGH_LEFT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cuixa Esquerra</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.left_thigh ? `${m.left_thigh} cm` : '—'}
              </p>
            </div>
          </div>

          {/* Cuixa Dret */}
          <div
            onMouseEnter={() => setActiveZone('THIGH_RIGHT')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'THIGH_RIGHT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Cuixa Dret</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.right_thigh ? `${m.right_thigh} cm` : '—'}
              </p>
            </div>
          </div>

          {/* Bessons (E / D) */}
          <div
            onMouseEnter={() => setActiveZone('CALF_LEFT')}
            onMouseLeave={() => setActiveZone(null)}
            className={`p-3.5 bg-[var(--bg-raised)] border rounded-xl flex items-center justify-between shadow-sm cursor-pointer transition-all ${
              activeZone === 'CALF_LEFT' || activeZone === 'CALF_RIGHT' ? 'border-brand-500 bg-brand-500/10 scale-105' : 'border-[var(--border-subtle)]'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Bessons (E / D)</span>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {m?.left_calf || m?.right_calf ? `${m?.left_calf || '—'} / ${m?.right_calf || '—'} cm` : '—'}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
