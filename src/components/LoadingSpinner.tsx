export default function LoadingSpinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-primary">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-light border-t-primary" />
      <span className="font-body text-sm text-ink/60">{label}…</span>
    </div>
  );
}
