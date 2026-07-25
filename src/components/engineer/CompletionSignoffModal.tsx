import React, { useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Eraser, PenTool, Sparkles } from 'lucide-react';

interface CompletionSignoffModalProps {
  siteId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string, signatureDataUrl: string) => void;
}

export const CompletionSignoffModal: React.FC<CompletionSignoffModalProps> = ({
  siteId,
  clientName,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [notes, setNotes] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = '#38bdf8'; // Cyan line
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const sigData = canvas ? canvas.toDataURL() : '';

    // Fire Confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    onConfirm(notes, sigData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel-glow rounded-3xl p-5 border border-cyan-500/30 text-slate-100 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Job Completion Sign-Off</h3>
              <p className="text-xs text-slate-400">{clientName} ({siteId})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Work Execution Log & Maintenance Summary</label>
            <textarea
              required
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail work performed, replaced parts, safety checks..."
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                Digital Client Signature
              </label>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
              >
                <Eraser className="w-3 h-3" /> Clear
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={360}
                height={130}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full cursor-crosshair bg-slate-950/60"
              />
            </div>
            {!hasSignature && (
              <p className="text-[10px] text-amber-400/80 mt-1 italic">Sign on box above to confirm work acceptance.</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasSignature || !notes.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold shadow-lg shadow-emerald-500/20 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Sign & Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
