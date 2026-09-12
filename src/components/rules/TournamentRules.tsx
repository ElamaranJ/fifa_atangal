import React, { useState } from 'react';
import { 
  Home, 
  GraduationCap, 
  Wifi, 
  Tv, 
  Smartphone, 
  User, 
  BadgeCheck, 
  Gamepad2, 
  Users, 
  Clock, 
  Info, 
  ArrowRight, 
  Scale, 
  Edit3, 
  ShieldAlert, 
  X,
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import { TournamentRuleItem } from '../../types/tournament';
import { EditRulesModal } from './EditRulesModal';

export const TournamentRules: React.FC = () => {
  const { rules, isAdmin } = useTournament();
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedRule, setSelectedRule] = useState<TournamentRuleItem | null>(null);
  const [isRulebookModalOpen, setIsRulebookModalOpen] = useState<boolean>(false);

  // Helper to pick appropriate icon for each rule based on title / id
  const getRuleIcon = (rule: TournamentRuleItem) => {
    const t = rule.title.toLowerCase();
    const id = rule.id.toLowerCase();

    if (t.includes('internet') || t.includes('wifi') || id.includes('internet')) {
      return <Wifi className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('recording') || t.includes('screen') || id.includes('recording')) {
      return <Tv className="w-5 h-5 text-teal-600" />;
    }
    if (t.includes('phone') || t.includes('proxy') || id.includes('phone')) {
      return <Smartphone className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('one device') || t.includes('device') || id.includes('device')) {
      return <User className="w-5 h-5 text-sky-600" />;
    }
    if (t.includes('id') || t.includes('identity') || id.includes('id')) {
      return <BadgeCheck className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('organizer') || t.includes('setup') || t.includes('controller') || id.includes('setup')) {
      return <Gamepad2 className="w-5 h-5 text-emerald-600" />;
    }
    if (t.includes('assistance') || t.includes('crowd') || t.includes('family') || id.includes('assistance')) {
      return <Users className="w-5 h-5 text-blue-600" />;
    }
    if (t.includes('schedule') || t.includes('grace') || t.includes('time') || id.includes('schedule')) {
      return <Clock className="w-5 h-5 text-amber-600" />;
    }
    if (t.includes('teacher') || id.includes('teacher')) {
      return <GraduationCap className="w-5 h-5 text-emerald-600" />;
    }
    if (t.includes('cheat') || t.includes('disconnect') || id.includes('cheat')) {
      return <ShieldAlert className="w-5 h-5 text-rose-600" />;
    }

    return rule.category === 'home' 
      ? <Home className="w-5 h-5 text-blue-600" />
      : <GraduationCap className="w-5 h-5 text-emerald-600" />;
  };

  const getIconContainerBg = (rule: TournamentRuleItem) => {
    const t = rule.title.toLowerCase();
    if (t.includes('recording')) return 'bg-teal-50 border-teal-100';
    if (t.includes('organizer') || t.includes('teacher')) return 'bg-emerald-50 border-emerald-100';
    if (t.includes('schedule') || t.includes('grace')) return 'bg-amber-50 border-amber-100';
    if (t.includes('cheat') || rule.severity === 'critical') return 'bg-rose-50 border-rose-100';
    return 'bg-blue-50 border-blue-100';
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full select-text animate-in fade-in duration-200">
      
      {/* Outer Card Container matching the exact white/soft-slate UI mockup */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 p-6 sm:p-10 space-y-8">

        {/* 1. Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-2 border-b border-slate-100">
          <div className="space-y-1.5 max-w-3xl">
            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase block">
              TOURNAMENT RULES
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Same Game. Fair Play. Everywhere.
            </h1>
            <p className="text-sm sm:text-base text-slate-500 font-normal">
              Standardized rules for both home online play and college campus matches.
            </p>
          </div>

          <div className="flex items-center gap-6 self-start md:self-auto shrink-0">
            {/* ONLY Admin sees the Edit Rules button */}
            {isAdmin && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                title="Admin only: Edit tournament rules"
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Rules</span>
              </button>
            )}

            {/* Handwritten / Calligraphy Style Slogan */}
            <div className="text-right select-none pr-1">
              <div className="text-xl sm:text-2xl font-serif italic text-slate-800 leading-tight font-black tracking-tight">
                <div>Play</div>
                <div>Compete</div>
                <div className="relative inline-block text-slate-900">
                  Belong
                  {/* Blue curved brush stroke under 'Belong' */}
                  <svg 
                    className="absolute -bottom-2 left-0 right-0 w-full h-2.5 text-blue-600" 
                    viewBox="0 0 120 18" 
                    fill="none" 
                    preserveAspectRatio="none"
                  >
                    <path 
                      d="M2 10 Q 60 18 118 6" 
                      stroke="currentColor" 
                      strokeWidth="3.5" 
                      strokeLinecap="round" 
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Side-by-Side Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          
          {/* ================= LEFT COLUMN: Playing at Home ================= */}
          <div className="bg-gradient-to-b from-[#eef5fc] via-[#f6f9fe] to-[#eef5fc] rounded-3xl p-5 sm:p-7 border border-blue-200/80 flex flex-col justify-between space-y-5 shadow-sm">
            
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Rounded blue icon badge */}
                  <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                    <Home className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Playing at Home
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Rules for online matches played from your home.
                    </p>
                  </div>
                </div>

                {/* Clean, elegant status badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100/90 border border-blue-200/80 text-blue-700 text-xs font-bold shrink-0 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Online Matches</span>
                </div>
              </div>

              {/* Home Rule Cards List */}
              <div className="space-y-3">
                {rules.homeRules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    onClick={() => setSelectedRule(rule)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-blue-400/60 hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon inside soft circle */}
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${getIconContainerBg(rule)}`}>
                        {getRuleIcon(rule)}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {rule.title}
                          </h3>
                          {rule.badge && (
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600 shrink-0">
                              {rule.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Callout Banner in Home Column */}
            <div className="bg-blue-100/70 border border-blue-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-blue-900 font-medium">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                <Info className="w-3.5 h-3.5" />
              </div>
              <p className="leading-relaxed">
                Home matches are monitored through recordings and random checks. Violations may result in an instant forfeit.
              </p>
            </div>

          </div>

          {/* ================= RIGHT COLUMN: Playing at College ================= */}
          <div className="bg-gradient-to-b from-[#eafaf2] via-[#f3fbf6] to-[#eafaf2] rounded-3xl p-5 sm:p-7 border border-emerald-200/80 flex flex-col justify-between space-y-5 shadow-sm">
            
            <div className="space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Rounded emerald icon badge */}
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      Playing at College
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Rules for offline matches conducted on campus.
                    </p>
                  </div>
                </div>

                {/* Clean, elegant status badge */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100/90 border border-emerald-200/80 text-emerald-700 text-xs font-bold shrink-0 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>On-Campus Venue</span>
                </div>
              </div>

              {/* College Rule Cards List */}
              <div className="space-y-3">
                {rules.collegeRules.map((rule, idx) => (
                  <div
                    key={rule.id || idx}
                    onClick={() => setSelectedRule(rule)}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-emerald-400/60 hover:shadow-md transition-all flex items-center justify-between gap-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Icon inside soft circle */}
                      <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${getIconContainerBg(rule)}`}>
                        {getRuleIcon(rule)}
                      </div>
                      
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors truncate">
                            {rule.title}
                          </h3>
                          {rule.badge && (
                            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600 shrink-0">
                              {rule.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Callout Banner in College Column */}
            <div className="bg-emerald-100/70 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900 font-medium">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                <Info className="w-3.5 h-3.5" />
              </div>
              <p className="leading-relaxed">
                College matches are supervised by tournament officials. All decisions made on-site are final.
              </p>
            </div>

          </div>

        </div>

        {/* 3. Bottom Full-Width Banner: Common Rules for All Matches */}
        <div className="bg-[#f8f5ff] border border-purple-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Common Rules for All Matches
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                {rules.generalNotice || 'In addition to the above, all participants must follow the general tournament rules, code of conduct, and accept the decisions of the organizers.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRulebookModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-900 shrink-0 self-end sm:self-auto hover:underline"
          >
            <span>View Full Rulebook</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* Interactive Rule Details Modal when a rule card is clicked */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedRule(null)}
          />
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 border border-slate-200 text-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${getIconContainerBg(selectedRule)}`}>
                  {getRuleIcon(selectedRule)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {selectedRule.category === 'home' ? '🏠 Playing at Home' : '🏫 Playing at College'}
                    </span>
                    {selectedRule.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        {selectedRule.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                    {selectedRule.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedRule(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Rule Protocol
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">
                {selectedRule.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Arbitration binding across all fixtures</span>
              </span>
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Rulebook & Dispute Guidelines Modal */}
      {isRulebookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setIsRulebookModalOpen(false)}
          />
          <div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-900 border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Official Tournament Code of Conduct
                  </h3>
                  <p className="text-xs text-slate-500">
                    Full dispute guidelines & penalties
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRulebookModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-rose-700 font-bold">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Zero Tolerance on Network Manipulation</span>
                </div>
                <p>
                  Deliberately disconnecting mobile data or Wi-Fi when conceding a goal is considered cheating. The opponent is immediately awarded a 3-0 victory and 3 points. Repeat offenses result in full tournament disqualification.
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold">
                  <Smartphone className="w-4 h-4" />
                  <span>Proxy Playing Penalty (+3 Points)</span>
                </div>
                <p>
                  Handing over your phone to a friend or senior to play on your behalf is strictly prohibited. If proven, the match is forfeited and the opponent is awarded +3 Points.
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <GraduationCap className="w-4 h-4" />
                  <span>The "Teacher Alert" Rematch Rule (College Play)</span>
                </div>
                <p>
                  If a teacher enters or interrupts the match on college premises, a rematch is allowed ONLY IF the distraction lasts ≥ 5 seconds AND is flagged immediately to the opponent. Claims made after the match ends are void.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 text-blue-700 font-bold">
                  <Tv className="w-4 h-4" />
                  <span>Screen Recording Mandatory</span>
                </div>
                <p>
                  All contenders must screen-record their fixtures from start to finish. Screen recordings serve as the primary source of truth for referees during disputed incidents.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsRulebookModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
              >
                Close Rulebook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {isEditModalOpen && (
        <EditRulesModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

    </div>
  );
};
