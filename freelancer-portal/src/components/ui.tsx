/* Small shared UI helpers used by the portal pages. */

export const formatCurrency = (amount: number | undefined | null) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export const formatDate = (date: string | undefined | null) => {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTime = (date: string | undefined | null) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatFileSize = (bytes: number | undefined | null) => {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const STATUS_STYLES: Record<string, string> = {
  Paid: "bg-green-500/10 text-green-400",
  Completed: "bg-green-500/10 text-green-400",
  Pending: "bg-yellow-500/10 text-yellow-400",
  Overdue: "bg-red-500/10 text-red-400",
  "In Progress": "bg-blue-500/10 text-blue-400",
  Draft: "bg-gray-500/10 text-gray-400",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_STYLES[status] || "bg-gray-500/10 text-gray-400"
      }`}
    >
      {status}
    </span>
  );
}

export function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111827] p-6">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-2 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-2 text-gray-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 p-12 text-gray-400">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      {label}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="p-10 text-center text-gray-400">{message}</p>;
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
    >
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-500/30 px-3 py-1 hover:bg-red-500/10"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function Card({
  title,
  children,
  action,
}: {
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827]">
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const inputClass =
  "w-full rounded-lg border border-white/10 bg-[#0b0f19] px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none";

export const thClass =
  "whitespace-nowrap px-5 py-4 text-left text-xs font-medium uppercase tracking-wider text-gray-400";

export const tdClass = "whitespace-nowrap px-5 py-4 text-sm";
