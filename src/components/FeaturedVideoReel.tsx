import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, ExternalLink, Instagram, Sparkles, Copy, Check, Share2, Film, Heart } from 'lucide-react';

interface FeaturedVideoReelProps {
  theme?: string;
}

export default function FeaturedVideoReel({ theme = 'classic' }: FeaturedVideoReelProps) {
  const [copied, setCopied] = useState(false);
  const [isPlayingEmbed, setIsPlayingEmbed] = useState(true);

  const reelUrl = "https://www.instagram.com/reel/DZx1rZhD6BL/?igsh=MXRza3Z5MnhqNWhlNQ==";
  const embedUrl = "https://www.instagram.com/reel/DZx1rZhD6BL/embed";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reelUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-14 bg-gradient-to-b from-brand-cream/30 via-brand-sugar/40 to-brand-cream/30 border-y border-brand-caramel/10 relative overflow-hidden">
      {/* Background ambient sparkle blobs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-brand-caramel/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-honey/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20 text-xs font-bold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5 animate-pulse" />
            <span>Featured Live Viral Reel</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <h3 className="text-3xl sm:text-4xl font-serif text-brand-chocolate font-black leading-tight">
            Fresh From Our Kitchen Reel 🎥
          </h3>

          <p className="text-xs sm:text-sm text-brand-chocolate/70 font-sans max-w-lg mx-auto">
            Take a peak inside our bakery! Catch our live artisanal baking process, fresh cake decorations, and daily sweet oven drops on Instagram.
          </p>
        </div>

        {/* Video Reel Container & Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Main Embedded Reel Player Column */}
          <div className="lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-brand-chocolate/5 rounded-3xl p-3 border border-brand-caramel/20 shadow-2xl relative group">
              
              {/* Card Badge Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-brand-sugar/80 backdrop-blur-md rounded-2xl mb-3 border border-brand-caramel/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 p-[2px] shrink-0">
                    <div className="w-full h-full bg-brand-sugar rounded-full flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-pink-500" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-brand-chocolate leading-none">@patashay_muffins</p>
                    <p className="text-[10px] text-brand-chocolate/60">Muffinns Sweets & Bakers</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-bold">
                    <Heart className="w-3 h-3 fill-red-500" /> Viral
                  </span>
                </div>
              </div>

              {/* Embedded Reel iframe or Interactive Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] min-h-[460px] flex items-center justify-center shadow-inner">
                {isPlayingEmbed ? (
                  <iframe
                    src={embedUrl}
                    className="w-full h-full min-h-[460px] border-0 rounded-2xl"
                    allow="encrypted-media"
                    title="Muffinns Sweets & Bakers Instagram Reel"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg animate-bounce">
                      <Play className="w-8 h-8 fill-white ml-1" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-white font-bold text-lg">Watch Live Kitchen Reel</h4>
                      <p className="text-xs text-white/80 max-w-xs">Tap below to open directly on Instagram app or web browser</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Player Quick Controls */}
              <div className="mt-3 flex items-center justify-between gap-2 px-1">
                <button
                  onClick={() => setIsPlayingEmbed(!isPlayingEmbed)}
                  className="px-3 py-1.5 rounded-xl bg-brand-sugar text-brand-chocolate font-bold text-xs border border-brand-caramel/20 flex items-center gap-1.5 hover:bg-brand-caramel/10 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 text-brand-caramel" />
                  <span>{isPlayingEmbed ? 'Reload Embedded Video' : 'Play Embedded Video'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 rounded-xl bg-brand-sugar text-brand-chocolate font-bold text-xs border border-brand-caramel/20 flex items-center gap-1.5 hover:bg-brand-caramel/10 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-brand-caramel" />}
                  <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* Reel Information & Direct Action Card Column */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-brand-sugar p-6 rounded-3xl border border-brand-caramel/15 shadow-lg space-y-5">
              
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-honey px-2.5 py-1 bg-brand-honey/10 rounded-full">
                  Featured Instagram Content
                </span>
                <h4 className="text-2xl font-serif font-black text-brand-chocolate">
                  Behind the Scenes at Muffinns 🎂✨
                </h4>
                <p className="text-xs sm:text-sm text-brand-chocolate/75 leading-relaxed font-sans">
                  Watch our expert confectioners prepare velvety cream cakes, fresh glazed donuts, and traditional mithai boxes live on Instagram reels.
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-brand-caramel/10">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-chocolate/80">
                  <span>Official Handle:</span>
                  <span className="text-pink-600 font-bold">@patashay_muffins</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-brand-chocolate/80">
                  <span>TikTok Channel:</span>
                  <span className="text-neutral-800 font-bold">@muffinns_sweetsbaker</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-brand-chocolate/80">
                  <span>Reel Code:</span>
                  <span className="font-mono text-brand-caramel">DZx1rZhD6BL</span>
                </div>
              </div>

              {/* Direct Buttons */}
              <div className="pt-2 space-y-3">
                <a
                  href={reelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-amber-500 text-white font-extrabold text-sm shadow-md hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Open Reel directly on Instagram</span>
                  <ExternalLink className="w-4 h-4 opacity-80 ml-auto" />
                </a>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-cream/80 text-brand-chocolate font-bold text-xs border border-brand-caramel/20 hover:bg-brand-caramel/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Share2 className="w-3.5 h-3.5 text-brand-caramel" />
                  <span>{copied ? 'Reel URL Copied to Clipboard!' : 'Share Reel with Friends'}</span>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
