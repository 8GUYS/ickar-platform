import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sun, 
  Moon, 
  Bookmark 
} from 'lucide-react';
import type { CatalogItem } from '../services/api';

interface ReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: CatalogItem;
}

export const ReaderModal: React.FC<ReaderModalProps> = ({ isOpen, onClose, media }) => {
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const totalPages = media.pages || 48;

  if (!isOpen) return null;

  // Font size classes
  const fontSizes = {
    sm: 'text-sm leading-relaxed',
    md: 'text-base leading-relaxed',
    lg: 'text-lg leading-loose',
    xl: 'text-xl leading-loose'
  };

  // Color schemes
  const themes = {
    dark: 'bg-[#0B0F17] text-slate-200 border-white/10',
    sepia: 'bg-[#Fbf0d9] text-[#5f4b32] border-[#e4d3b2]',
    light: 'bg-white text-slate-800 border-slate-200'
  };

  const sampleChapters = [
    {
      title: "Introduction: The New Continental Marketplace",
      content: `The modern digital African stands at the crossroads of an unprecedented technological renaissance. For centuries, physical distribution bottlenecks, localized currency friction, and infrastructure deficits limited the scale of intellectual and creative property across the continent. 

Yet today, fiber optic connectivity, instant mobile clearing rails, and decentralized cloud infrastructure have flattened the barriers to entry. What was once confined to print runs of three thousand physical copies in a central book market can now reach fifty thousand listeners across Nairobi, Lagos, Accra, and Johannesburg within forty-eight hours of publication.

The imperative for contemporary creators is no longer merely finding an audience; it is architecting an ownership model that withstands platform shift and retains sovereign pricing power.`
    },
    {
      title: "Chapter 1: The Economics of Attention & Scale",
      content: `Attention is the scarcest currency in the digital age. In a media ecosystem characterized by relentless notifications and algorithmic distraction, long-form audio and deep reading represent rare sanctuaries of intentional engagement.

When an individual commits three hours to listening to a specialized monograph or leadership masterclass, they are not passively consuming content—they are investing their most unrenewable asset. Creators who understand this dynamic do not price their works as commodity transactions; they structure their ecosystems as ongoing institutional relationships.`
    }
  ];

  const currentChapter = sampleChapters[(currentPage - 1) % sampleChapters.length];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Reader Topbar */}
      <header className={`h-16 border-b px-6 flex items-center justify-between ${themes[theme]}`}>
        <div className="flex items-center space-x-4">
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Close Reader"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{media.title}</h2>
            <p className="text-xs opacity-70 truncate">{media.author}</p>
          </div>
        </div>

        {/* Customization Controls */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Font Size Selector */}
          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setFontSize('sm')}
              className={`px-2 py-1 text-xs rounded-lg font-bold cursor-pointer ${fontSize === 'sm' ? 'bg-indigo-600 text-white' : 'opacity-70'}`}
            >
              A-
            </button>
            <button 
              onClick={() => setFontSize('md')}
              className={`px-2 py-1 text-xs rounded-lg font-bold cursor-pointer ${fontSize === 'md' ? 'bg-indigo-600 text-white' : 'opacity-70'}`}
            >
              A
            </button>
            <button 
              onClick={() => setFontSize('lg')}
              className={`px-2 py-1 text-xs rounded-lg font-bold cursor-pointer ${fontSize === 'lg' ? 'bg-indigo-600 text-white' : 'opacity-70'}`}
            >
              A+
            </button>
          </div>

          {/* Theme Toggles */}
          <div className="flex items-center bg-black/20 rounded-xl p-1 border border-white/10">
            <button 
              onClick={() => setTheme('dark')} 
              className={`p-1.5 rounded-lg cursor-pointer ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'opacity-70'}`}
              title="Dark Mode"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme('sepia')} 
              className={`p-1.5 rounded-lg cursor-pointer ${theme === 'sepia' ? 'bg-[#5f4b32] text-[#fbf0d9]' : 'opacity-70'}`}
              title="Sepia Mode"
            >
              <span className="text-xs font-serif font-black px-1">S</span>
            </button>
            <button 
              onClick={() => setTheme('light')} 
              className={`p-1.5 rounded-lg cursor-pointer ${theme === 'light' ? 'bg-slate-200 text-slate-900' : 'opacity-70'}`}
              title="Light Mode"
            >
              <Sun className="w-4 h-4" />
            </button>
          </div>

          {/* Bookmark Toggle */}
          <button 
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl border border-white/10 transition-colors cursor-pointer ${isBookmarked ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'hover:bg-white/10 opacity-70'}`}
            title="Bookmark Page"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reader Document Body */}
      <main className={`flex-1 overflow-y-auto px-6 py-12 flex justify-center ${themes[theme]}`}>
        <article className={`max-w-2xl w-full space-y-6 font-serif select-none ${fontSizes[fontSize]}`}>
          {/* Document Watermark (Security Layer) */}
          <div className="flex items-center justify-between border-b pb-4 text-xs font-sans opacity-50">
            <span>ICKAR Protected Reader</span>
            <span>Licensed to Registered Account</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-sans tracking-tight mb-8">
            {currentChapter.title}
          </h1>

          {currentChapter.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="text-justify leading-relaxed indent-6">
              {paragraph}
            </p>
          ))}
        </article>
      </main>

      {/* Reader Bottom Pagination Bar */}
      <footer className={`h-16 border-t px-6 flex items-center justify-between ${themes[theme]}`}>
        <button 
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-sans font-semibold disabled:opacity-30 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <div className="text-xs font-sans font-medium opacity-70">
          Page {currentPage} of {totalPages}
        </div>

        <button 
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-sans font-semibold disabled:opacity-30 cursor-pointer hover:bg-white/10 transition-colors"
        >
          <span>Next Page</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
