import clsx from "clsx";

type Kind = "present" | "absent" | "excused" | "pending" | "approved" | "denied";

const STYLES: Record<Kind, string> = {
  present: "bg-status-present/10 text-status-present",
  approved: "bg-status-present/10 text-status-present",
  absent: "bg-status-absent/10 text-status-absent",
  denied: "bg-status-absent/10 text-status-absent",
  excused: "bg-status-excused/10 text-status-excused",
  pending: "bg-status-pending/10 text-status-pending",
};

export default function StatusBadge({ status }: { status: Kind }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        STYLES[status]
      )}
    >
      {status}
    </span>
  );
}
