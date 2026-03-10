import React from 'react';
import { Facebook, Twitter, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButtons({ title, url, className = '' }) {
  const encodedUrl = encodeURIComponent(url || window.location.href);
  const encodedTitle = encodeURIComponent(title || '');

  const copyLink = () => {
    navigator.clipboard.writeText(url || window.location.href);
    toast.success('Link copied!');
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} data-testid="share-buttons">
      <span className="text-xs text-gray-600 uppercase tracking-widest mr-1 flex items-center gap-1">
        <Share2 className="w-3 h-3" /> Share
      </span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 flex items-center justify-center border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all rounded-sm"
        data-testid="share-facebook"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-3.5 h-3.5" />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 flex items-center justify-center border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all rounded-sm"
        data-testid="share-twitter"
        aria-label="Share on X/Twitter"
      >
        <Twitter className="w-3.5 h-3.5" />
      </a>
      <button
        onClick={copyLink}
        className="w-8 h-8 flex items-center justify-center border border-white/10 text-gray-500 hover:text-amber hover:border-amber/20 transition-all rounded-sm"
        data-testid="share-copy-link"
        aria-label="Copy link"
      >
        <Link2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
