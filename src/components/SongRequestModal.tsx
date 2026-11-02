import { XIcon } from '@phosphor-icons/react';
import { useState, type FormEvent } from 'react';
import type { Translations } from '../i18n';

const IS_FIREFOX = import.meta.env.BROWSER === 'firefox';
// Sized so every Discord embed stays inside its limits, matching the jawr.org API.
const FIELD_LIMITS = { name: 100, email: 254, song: 200, message: 1000 } as const;
const HTTP_TOO_MANY_REQUESTS = 429;

export function requestSongRequestConsent(): Promise<boolean> {
  if (!IS_FIREFOX) return Promise.resolve(true);
  return browser.permissions.request({
    data_collection: ['personallyIdentifyingInfo', 'personalCommunications'],
  });
}

export function SongRequestModal({
  t,
  onClose,
}: {
  t: Translations;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ name: '', email: '', song: '', message: '' });
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setFailed(null);
    const status = await fetch('https://jawr.org/api/song-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(
      (res) => (res.ok ? 'sent' : res.status),
      () => 'failed' as const,
    );
    setSending(false);
    if (status === 'sent') setSent(true);
    else setFailed(status === HTTP_TOO_MANY_REQUESTS ? t.song_request_rate_limited : t.song_request_error);
  }

  const inputCls = 'border border-gray-200 dark:border-[#2a2a2a] bg-gray-50 dark:bg-[#1a1a1a] px-3 py-2 text-xs text-gray-800 dark:text-[#f0f0f0] outline-none focus:border-gray-400 dark:focus:border-[#6e6e6e] transition-colors';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] w-full max-w-sm mx-4 flex flex-col gap-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#f0f0f0]">
            {t.song_request_title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 dark:hover:text-[#f0f0f0] transition-colors cursor-pointer"
            aria-label={t.close}
          >
            <XIcon />
          </button>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="text-xs text-gray-600 dark:text-[#b0b0b0]">
              {t.song_request_success}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                autoFocus
                onClick={onClose}
                className="px-4 py-2 text-xs bg-gray-900 dark:bg-[#f0f0f0] text-white dark:text-gray-900 hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {t.close}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">
                  {t.song_request_name} <span className="text-gray-400 dark:text-[#6e6e6e]">*</span>
                </span>
                <input
                  type="text"
                  value={form.name}
                  required
                  maxLength={FIELD_LIMITS.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                />
              </label>
    
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">{t.song_request_email}</span>
                <input
                  type="email"
                  value={form.email}
                  maxLength={FIELD_LIMITS.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                />
              </label>
    
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">
                  {t.song_request_song} <span className="text-gray-400 dark:text-[#6e6e6e]">*</span>
                </span>
                <input
                  type="text"
                  value={form.song}
                  required
                  maxLength={FIELD_LIMITS.song}
                  onChange={(e) => setForm({ ...form, song: e.target.value })}
                  className={inputCls}
                />
              </label>
    
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] text-gray-600 dark:text-[#b0b0b0]">{t.song_request_message}</span>
                <textarea
                  value={form.message}
                  maxLength={FIELD_LIMITS.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </label>
            </div>
    
            {failed && (
              <p role="alert" className="text-[11px] text-red-700">
                {failed}
              </p>
            )}
    
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!form.name.trim() || !form.song.trim() || sending}
                className="px-4 py-2 text-xs bg-gray-900 dark:bg-[#f0f0f0] text-white dark:text-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {sending ? t.song_request_sending : t.song_request_submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
