import React, { useState, useEffect } from 'react';
import { Candidate } from '../types';
import { AlertTriangle, ImageOff } from 'lucide-react';

interface ComparisonViewProps {
  groundTruthUrl: string;
  candidate: Candidate;
}

const ImageWithFallback: React.FC<{ src: string; alt: string; label: string }> = ({ src, alt, label }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset error state when src changes
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`Failed to load image: ${src}`, e);
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 border-2 border-dashed border-slate-300 rounded-lg">
        <ImageOff size={48} className="mb-2 opacity-50" />
        <p className="text-sm font-medium text-slate-500">Image not found</p>
        <p className="text-xs text-slate-400 mt-1 break-all text-center px-4 max-w-md">{src}</p>
        <p className="text-xs text-slate-500 mt-2">Check browser console for details</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-indigo-600"></div>
        </div>
      )}
      <img 
        src={src} 
        alt={alt} 
        onLoad={handleLoad}
        onError={handleError}
        className={`max-w-full max-h-full object-contain shadow-md rounded-md bg-white transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}
      />
    </div>
  );
};

// Wrapped in React.memo to prevent re-renders when typing in the form
export const ComparisonView = React.memo(({ groundTruthUrl, candidate }: ComparisonViewProps) => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header Labels */}
      <div className="flex flex-shrink-0 border-b border-slate-200 bg-white shadow-sm z-10">
        <div className="w-1/2 p-3 text-center font-semibold text-slate-700 border-r border-slate-200 bg-slate-50">
          GROUND TRUTH
        </div>
        <div className="w-1/2 p-3 text-center font-semibold text-primary bg-indigo-50">
          {candidate.label.toUpperCase()}
        </div>
      </div>

      {/* Image Container */}
      <div className="flex flex-1 relative bg-slate-100 w-full overflow-hidden">
        
        {/* Ground Truth Side */}
        <div className="w-1/2 h-full flex items-center justify-center border-r-4 border-slate-300 relative overflow-hidden p-4">
          <ImageWithFallback src={groundTruthUrl} alt="Ground Truth" label="Ground Truth" />
          <div className="absolute top-4 left-4 bg-slate-800/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
            Reference
          </div>
        </div>

        {/* Candidate Side */}
        <div className="w-1/2 h-full flex items-center justify-center relative overflow-hidden p-4">
          <ImageWithFallback src={candidate.imageUrl} alt={candidate.label} label={candidate.label} />
           <div className="absolute top-4 right-4 bg-indigo-600/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
            Evaluating
          </div>
        </div>

      </div>
    </div>
  );
});