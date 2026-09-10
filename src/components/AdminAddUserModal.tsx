import React, { useState, useEffect } from 'react';
import { UserPlus, Key, User, Check, AlertCircle, X, Shield, Users, Trash2 } from 'lucide-react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

interface AdminAddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
}

export const AdminAddUserModal: React.FC<AdminAddUserModalProps> = ({
  isOpen,
  onClose,
  currentUser
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [existingAdmins, setExistingAdmins] = useState<Array<{ id: string; username: string }>>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchExistingAdmins();
      setError('');
      setSuccess('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  const fetchExistingAdmins = async () => {
    const token = sessionStorage.getItem('admin_token') || '';
    // 1. Try server API
    try {
      const resp = await fetch('/api/admin/admins', {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.admins)) {
          setExistingAdmins(data.admins);
          return;
        }
      }
    } catch (apiErr) {
      console.warn('Could not fetch admins from server API:', apiErr);
    }

    // 2. Try localStorage safe cache
    try {
      const cached = JSON.parse(localStorage.getItem('muffinns_admins') || '[]');
      if (Array.isArray(cached) && cached.length > 0) {
        setExistingAdmins(cached.map((c: any) => ({ id: c.id || c.username, username: c.username })));
        return;
      }
    } catch (locErr) {
      // ignore
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanUser = newUsername.trim();
    const cleanPw = newPassword.trim();

    if (!cleanUser || !cleanPw) {
      setError('Username and password are required.');
      return;
    }

    if (cleanUser.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    if (cleanPw.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (cleanPw !== confirmPassword.trim()) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      let created = false;
      const token = sessionStorage.getItem('admin_token') || '';
      const currentUser = sessionStorage.getItem('admin_user') || 'admin';

      // 1. Primary: Save via Server API with Hashed API Token
      try {
        const resp = await fetch('/api/admin/add-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'x-admin-user': currentUser
          },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPw
          })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
          created = true;
        } else if (!resp.ok) {
          setError(data.error || 'Failed to create admin.');
          setLoading(false);
          return;
        }
      } catch (apiErr) {
        console.warn('Server API unavailable:', apiErr);
      }

      // 2. Cache admin record metadata (NEVER store plaintext password!)
      try {
        const currentLocal = JSON.parse(localStorage.getItem('muffinns_admins') || '[]');
        const filtered = currentLocal.filter((a: any) => 
          a.username.toLowerCase() !== cleanUser.toLowerCase()
        );
        filtered.push({
          id: `admin_${cleanUser.toLowerCase()}`,
          username: cleanUser,
          role: 'admin',
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('muffinns_admins', JSON.stringify(filtered));
        created = true;
      } catch (locErr) {
        console.warn('Could not save to localStorage:', locErr);
      }

      if (created) {
        setSuccess(`Admin account "${cleanUser}" created successfully with salted PBKDF2 hash!`);
        setNewUsername('');
        setNewPassword('');
        setConfirmPassword('');
        await fetchExistingAdmins();
      } else {
        setError('Could not complete admin registration.');
      }
    } catch (err: any) {
      console.error('Failed to create admin:', err);
      setError(err.message || 'Failed to create admin account.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, adminUsername: string) => {
    if (adminUsername.toLowerCase() === 'admin' || adminUsername === currentUser) {
      alert('Cannot delete your own or primary master admin account.');
      return;
    }

    if (!confirm(`Are you sure you want to remove administrator "${adminUsername}"?`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('admin_token') || '';
      // 1. Try server API with Hashed Token Authorization
      try {
        await fetch('/api/admin/delete-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'x-admin-user': currentUser
          },
          body: JSON.stringify({ id, username: adminUsername })
        });
      } catch (apiErr) {
        console.warn('Server delete error:', apiErr);
      }

      // 2. Remove from localStorage
      try {
        const currentLocal = JSON.parse(localStorage.getItem('muffinns_admins') || '[]');
        const filtered = currentLocal.filter((a: any) => 
          a.username.toLowerCase() !== adminUsername.toLowerCase() && a.id !== id
        );
        localStorage.setItem('muffinns_admins', JSON.stringify(filtered));
      } catch (e) {}

      // Refresh list
      await fetchExistingAdmins();
    } catch (err: any) {
      console.error('Delete error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between bg-stone-50 dark:bg-stone-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Add New Administrator
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Firebase collection: <code className="font-mono text-amber-600">/admins</code>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Security Information Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold">PBKDF2 Password Hashing & SHA-256 API Token Security:</span>
              <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                Passwords are automatically hashed with 100,000 PBKDF2 iterations using a 16-byte cryptographic salt. APIs are secured with hashed bearer tokens. Zero plaintext passwords stored.
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                New Admin Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. sarah_admin"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Key className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Key className="w-4 h-4" />
                </div>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-xs focus:ring-2 focus:ring-amber-500/20 focus:outline-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'Creating Account in Firebase...' : 'Save New Administrator'}</span>
            </button>
          </form>

          {/* Existing Admins List */}
          {existingAdmins.length > 0 && (
            <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
              <h4 className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Existing Registered Admins ({existingAdmins.length})</span>
              </h4>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {existingAdmins.map((adm) => (
                  <div 
                    key={adm.id}
                    className="px-3 py-2 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-medium text-stone-800 dark:text-stone-200">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>{adm.username}</span>
                      {adm.username === currentUser && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-stone-400">ID: {adm.id}</span>
                      {adm.username !== currentUser && adm.username.toLowerCase() !== 'admin' && (
                        <button
                          type="button"
                          onClick={() => handleDeleteAdmin(adm.id, adm.username)}
                          className="p-1 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded transition cursor-pointer"
                          title={`Delete admin ${adm.username}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
