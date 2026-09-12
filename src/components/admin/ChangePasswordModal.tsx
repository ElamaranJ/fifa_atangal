import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { KeyRound, X, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const { changeAdminPassword, isAdmin } = useTournament();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !isAdmin) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError('');
    setSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword.trim()) {
      setError('Please enter your current password');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.trim().length < 4) {
      setError('New password must be at least 4 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    if (newPassword.trim() === currentPassword.trim()) {
      setError('New password cannot be the same as the current password');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changeAdminPassword(currentPassword.trim(), newPassword.trim());
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setError(res.error || 'Failed to change password. Please check your current password.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto my-auto">
        <button
          onClick={handleClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg sm:text-xl font-bold text-slate-900 truncate">
              Change Admin Password
            </h3>
            <p className="text-xs text-slate-500">Update your dashboard security credentials</p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center text-emerald-600 mx-auto shadow-sm">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-lg font-display font-extrabold text-slate-900">
              Password Changed Successfully!
            </h4>
            <p className="text-xs text-slate-500">Your new admin password is now active across all devices.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter current password..."
                  className="w-full pl-4 pr-10 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#1d6bf3] focus:ring-2 focus:ring-[#1d6bf3]/20 font-mono tracking-wider"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="At least 4 characters..."
                  className="w-full pl-4 pr-10 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#1d6bf3] focus:ring-2 focus:ring-[#1d6bf3]/20 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Re-enter new password..."
                  className="w-full pl-4 pr-10 py-2.5 min-h-[44px] bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:border-[#1d6bf3] focus:ring-2 focus:ring-[#1d6bf3]/20 font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-2.5 min-h-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-all flex items-center justify-center disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-2.5 min-h-[44px] rounded-xl bg-[#1d6bf3] hover:bg-[#1557c0] text-white font-bold text-sm shadow-blue-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Save Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
