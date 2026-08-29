import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  Clock,
  UserCheck,
  AlertOctagon,
  Sparkles,
  LogIn,
  LogOut,
  Flame,
  Sun,
  Moon,
  Search,
} from 'lucide-react';
import { soundManager } from '../common/TacticalAudioAlert';
import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from '../../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  currentUser: User;
  onSwitchUserRole: (role: UserRole) => void;
  onOpenReportModal: () => void;
  onOpenDemoModal: () => void;
  onResetDemo: () => void;
  onTriggerFloodCrisis: () => void;
  criticalCount: number;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchUserRole,
  onOpenReportModal,
  onOpenDemoModal,
  criticalCount,
  darkMode = false,
  onToggleDarkMode,
  onOpenCommandPalette,
}) => {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const [timeIST, setTimeIST] = useState('');
  const [timeUTC, setTimeUTC] = useState('');
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFbUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeIST(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
      setTimeUTC(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'UTC',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleGoogleAuth = async () => {
    if (fbUser) {
      await signOutUser();
    } else {
      setIsSigningIn(true);
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error('Google Sign In failed:', err);
      } finally {
        setIsSigningIn(false);
      }
    }
  };

  return (
    <header className="bg-white/95 border-b border-slate-200/90 sticky top-0 z-50 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & System Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-sm shadow-indigo-200 flex items-center justify-center text-white shrink-0">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold text-lg text-slate-900 tracking-tight leading-none">RESQRA</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 sm:px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0">
                  <Flame className="w-3 h-3 text-amber-500 fill-amber-500 animate-pulse" />
                  <span className="hidden sm:inline">FIREBASE-CONNECTED</span>
                  <span className="sm:hidden">FIREBASE</span>
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Sense · Decide · Respond
              </p>
            </div>
          </div>

          {/* Operational Beacon */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-700 font-semibold">Grid Active</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Lucknow Operations</span>
          </div>

          {criticalCount > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold text-rose-700 beacon-critical">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>{criticalCount} Critical Active</span>
            </div>
          )}
        </div>

        {/* Clocks, Avatar Stack & Controls */}
        <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
          {/* Live Telemetry Time */}
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-slate-700 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="font-semibold">{timeIST}</span>
            <span className="text-slate-300 font-sans">·</span>
            <span className="text-slate-400">{timeUTC}</span>
          </div>

          {/* Google / Firebase Auth Button */}
          {fbUser ? (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
              {fbUser.photoURL ? (
                <img
                  src={fbUser.photoURL}
                  alt={fbUser.displayName || 'User'}
                  className="w-6 h-6 rounded-full border border-slate-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                  {fbUser.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline max-w-[120px] truncate">
                {fbUser.displayName || fbUser.email}
              </span>
              <button
                onClick={handleGoogleAuth}
                title="Sign out of Firebase"
                className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleAuth}
              disabled={isSigningIn}
              title="Sign in with Google Firebase Auth"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{isSigningIn ? 'Signing in...' : 'Firebase Auth'}</span>
            </button>
          )}

          {/* Dark Mode Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to Standard Light Environment' : 'Switch to Tactical Low-Light Dark Environment'}
            className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
              darkMode
                ? 'bg-amber-400/15 text-amber-400 border-amber-500/30 hover:bg-amber-400/25 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Audio Alert Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Tactical Audio Alerts' : 'Mute Audio Alerts'}
            className={`p-2 rounded-xl border text-xs transition-colors ${
              isMuted
                ? 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                : 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-xs'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Quick Command Palette Trigger */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="Search incidents, assets, tools, or run actions (Cmd+K)"
              className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Jump</span>
              <kbd className="hidden lg:inline text-[9px] font-mono bg-white px-1 py-0.2 rounded border border-slate-200 text-slate-400">⌘K</kbd>
            </button>
          )}

          {/* Demo Scenario Controller Trigger */}
          <button
            onClick={onOpenDemoModal}
            className="hidden sm:flex px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold items-center gap-1.5 shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">Judge Guide</span>
          </button>

          {/* Quick Emergency Report Trigger */}
          <button
            onClick={onOpenReportModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold shadow-sm shadow-indigo-200 flex items-center gap-1.5 transition-all transform active:scale-95"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Report SOS</span>
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 max-w-[145px] sm:max-w-none">
            <UserCheck className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            <select
              value={currentUser.role}
              onChange={(e) => onSwitchUserRole(e.target.value as UserRole)}
              className="bg-transparent text-slate-800 text-xs font-semibold focus:outline-none cursor-pointer pr-1 w-full truncate"
            >
              <option value="OPERATOR">SEOC Commander</option>
              <option value="RESPONDER">Field Responder</option>
              <option value="CITIZEN">Citizen Portal</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};


