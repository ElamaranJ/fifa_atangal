import React from 'react';

interface SuperstarsBackdropProps {
  activeTab: string;
}

export const SuperstarsBackdrop: React.FC<SuperstarsBackdropProps> = ({ activeTab }) => {
  // 1. Home Tab: Original Stadium Hero Photo + Green Turf Ground
  if (activeTab === 'home') {
    return (
      <div className="pointer-events-none select-none">
        <div className="absolute top-0 left-0 right-0 h-[480px] sm:h-[520px] stadium-hero-bg z-0 pointer-events-none" />
        <div className="absolute top-[400px] sm:top-[440px] left-0 right-0 bottom-0 turf-bg z-0 pointer-events-none" />
      </div>
    );
  }

  // 2. Players Section: Lionel Messi Wallpaper Background
  if (activeTab === 'players') {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#060b1e]">
        <img
          src="/bg_messi.png"
          alt="Lionel Messi Background"
          className="w-full h-full object-cover object-center scale-100 opacity-80 md:opacity-90"
        />
        {/* Soft overlay so content cards pop with high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/75 pointer-events-none" />
      </div>
    );
  }

  // 3. Fixtures Section: Cristiano Ronaldo Widescreen Wallpaper Background
  if (activeTab === 'fixtures') {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#060a14]">
        <img
          src="/bg_ronaldo_wide.jpg"
          alt="Cristiano Ronaldo Background"
          className="w-full h-full object-cover object-center scale-100 opacity-80 md:opacity-90"
        />
        {/* Soft overlay so fixture cards pop with high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/75 pointer-events-none" />
      </div>
    );
  }

  // 4. Standings (Points Table) & Golden Boot Sections: Neymar Jr Wallpaper Background
  if (activeTab === 'standings' || activeTab === 'goldenboot') {
    return (
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#050a16]">
        <img
          src="/bg_neymar.jpg"
          alt="Neymar Jr Background"
          className="w-full h-full object-cover object-center scale-100 opacity-80 md:opacity-90"
        />
        {/* Soft overlay so standings tables pop with high contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/75 pointer-events-none" />
      </div>
    );
  }

  // 5. Playoffs, Champion Celebration & Admin Setup: Stadium Floodlight Arena
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#070d1e]">
      <div className="absolute inset-0 superstars-bg opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/35 to-slate-950/75 pointer-events-none" />
    </div>
  );
};
