export function TelegramLogo({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Telegram">
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path d="M5.4 11.8l11.2-4.3c.5-.2 1 .1.8.9l-1.9 9c-.1.6-.5.8-1.1.5l-3-2.2-1.4 1.4c-.2.2-.3.3-.6.3l.2-3.1 5.6-5.1c.2-.2 0-.3-.4-.1l-6.9 4.4-3-.9c-.6-.2-.7-.6.1-.9z" fill="#fff" />
    </svg>
  );
}

export function EmailLogo({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-label="Email">
      <rect width="24" height="24" rx="6" fill="#EA4335" />
      <path d="M5 8l7 5 7-5" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="5" y="7" width="14" height="10" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.8" />
    </svg>
  );
}

export default function Integrations() {
  return (
    <div className="hidden items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1 md:flex">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">Alerts</span>
      <a
        href="https://t.me/gapcheckclaudebot"
        target="_blank"
        title="Telegram: connected. Rate alerts and /gap, /whatif commands"
        className="relative rounded-full p-1 hover:bg-slate-100"
      >
        <TelegramLogo />
        <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full border border-white bg-lime-500" />
      </a>
      <span title="Email digests: coming soon" className="relative rounded-full p-1 opacity-60">
        <EmailLogo />
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-slate-700 px-1 text-[8px] font-bold uppercase leading-3 text-white">soon</span>
      </span>
    </div>
  );
}
