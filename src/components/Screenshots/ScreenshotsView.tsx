import { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import SectionCard from '@/components/shared/SectionCard';
import { Camera, Image as ImageIcon, Eye, ShieldCheck } from 'lucide-react';

export default function ScreenshotsView() {
  const { analysis, screenshotHistory, captureScreenshot } = useAnalysis();
  const [isCapturing, setIsCapturing] = useState(false);
  const [activePreview, setActivePreview] = useState<string | null>(null);

  if (!analysis) return null;

  const handleCapture = async () => {
    setIsCapturing(true);
    // Let the panel UI clear so it doesn't block the screen
    setTimeout(async () => {
      try {
        await captureScreenshot();
      } catch (err) {
        console.error('Capture failed:', err);
      } finally {
        setIsCapturing(false);
      }
    }, 250);
  };

  const activeImage = screenshotHistory[0] || null;

  return (
    <div className="flex-1 p-5 overflow-y-auto space-y-4 animate-slide-up bg-white">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
          <Camera size={18} className="text-primary-dark" />
          Screenshot Monitoring
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">{analysis.site.hostname}</p>
      </div>

      {/* Main capture action & Preview */}
      <div className="space-y-3">
        {activeImage ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-2xs font-semibold text-gray-400 uppercase tracking-wide">
              <span>Latest Captured Screen</span>
              <span className="text-primary-dark font-medium flex items-center gap-1">
                <ShieldCheck size={10} /> Active
              </span>
            </div>
            
            {/* Device Mockup Frame */}
            <div className="border border-border rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
              {/* Browser Header Decorator */}
              <div className="h-6 border-b border-border bg-surface-2 flex items-center px-3 gap-1.5 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <div className="flex-1 max-w-[150px] mx-auto h-3.5 bg-white border border-border rounded text-3xs text-center text-gray-400 truncate px-2 font-mono flex items-center justify-center">
                  {analysis.site.hostname}
                </div>
              </div>
              {/* Image Preview Container */}
              <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden group">
                <img
                  src={activeImage}
                  alt="Current tab screenshot capture"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => setActivePreview(activeImage)}
                    className="p-1.5 bg-white text-gray-800 rounded-md hover:bg-gray-100 text-xs font-semibold flex items-center gap-1"
                  >
                    <Eye size={12} /> View
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border border-border flex flex-col items-center justify-center py-16 text-center">
            <ImageIcon size={32} className="text-gray-300 mb-3" />
            <p className="text-xs font-semibold text-gray-600">No screen captures found</p>
            <p className="text-2xs text-gray-400 mt-0.5">Capture a visual snapshot of the page to monitor layouts.</p>
          </div>
        )}

        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50"
        >
          <Camera size={14} className={isCapturing ? 'animate-pulse' : ''} />
          <span>{isCapturing ? 'Capturing Window...' : 'Capture Active Tab Screen'}</span>
        </button>
      </div>

      {/* Screenshots Log database */}
      {screenshotHistory.length > 1 && (
        <SectionCard title="Scan Log Database" badge={<span className="badge badge-neutral">{screenshotHistory.length}</span>}>
          <div className="grid grid-cols-3 gap-2">
            {screenshotHistory.map((src, i) => (
              <div
                key={i}
                onClick={() => setActivePreview(src)}
                className={`relative aspect-[4/3] rounded-md overflow-hidden border bg-gray-100 cursor-pointer hover:border-primary transition-all ${
                  i === 0 ? 'border-primary shadow-xs ring-1 ring-primary/20' : 'border-border'
                }`}
              >
                <img src={src} alt={`Screenshot ${i}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition-colors" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 px-1 bg-primary text-white font-bold rounded text-3xs scale-90">
                    NEW
                  </span>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Full Screen Overlay Modal */}
      {activePreview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setActivePreview(null)}
        >
          <div className="relative max-w-full max-h-[85vh] border-2 border-white bg-white rounded-lg overflow-hidden shadow-2xl">
            <img src={activePreview} alt="Screenshot expansion zoom" className="max-w-full max-h-[80vh] object-contain" />
            <div className="p-2 text-center text-3xs font-semibold text-gray-600 bg-white">
              Scan Visual Capture · Click anywhere to return
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
