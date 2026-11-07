export function Card({ children, className = "", ...rest }) {
  return (
    <div {...rest} className={`rounded-2xl border border-slate-200 bg-white p-5 ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "slate" }) {
  const tones = {
    slate: "text-slate-900",
    red: "text-red-600",
    green: "text-emerald-600",
    amber: "text-amber-600",
  };
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </Card>
  );
}

export function Badge({ status }) {
  const map = {
    confirmed: "bg-emerald-100 text-emerald-800",
    open: "bg-emerald-100 text-emerald-800",
    unconfirmed: "bg-amber-100 text-amber-800",
    competitive: "bg-orange-100 text-orange-800",
    lottery: "bg-orange-100 text-orange-800",
    closed: "bg-slate-200 text-slate-600",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] || "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

export function NumberInput({ value, onChange, step = 1, className = "" }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
      className={`w-full rounded-lg border border-slate-300 px-2 py-1 text-sm ${className}`}
    />
  );
}
