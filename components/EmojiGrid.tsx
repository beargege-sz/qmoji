
import React from 'react';
import { Lock } from 'lucide-react';
import { EMOJI_LABELS } from '../constants';

interface EmojiGridProps {
  images: string[] | undefined;
  onImageClick: (index: number) => void;
  isLocked?: boolean;
}

export const EmojiGrid: React.FC<EmojiGridProps> = ({ images, onImageClick, isLocked = false }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 p-4 pb-24">
      {EMOJI_LABELS.map((template, index) => {
        const imgUrl = images[index];
        if (!imgUrl) return null;

        return (
          <div 
            key={template.key} 
            className="relative aspect-square bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:opacity-80 active:scale-95 transition-transform"
            onClick={() => onImageClick(index)}
          >
            {/* Image */}
            <img 
              src={imgUrl} 
              alt={template.label}
              className={`w-full h-full object-cover ${isLocked ? 'blur-[2px]' : ''}`}
              loading="lazy"
            />
            
            {/* Locked Overlay */}
            {isLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 z-10">
                <Lock className="w-8 h-8 text-white drop-shadow-md opacity-80" />
              </div>
            )}
            
            {/* Label Badge */}
            <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full z-20">
              {template.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
