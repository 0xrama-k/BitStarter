import type { CampaignStatus } from "@/features/campaigns/types";

const styles: Record<CampaignStatus, string> = {
  Active: "bg-teal-50 text-teal-800 border-teal-200",
  VotingOpen: "bg-sky-50 text-sky-800 border-sky-200",
  Approved: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Rejected: "bg-rose-50 text-rose-800 border-rose-200",
  Cancelled: "bg-amber-50 text-amber-800 border-amber-200"
};

const labels: Record<CampaignStatus, string> = {
  Active: "Active",
  VotingOpen: "Voting open",
  Approved: "Completed",
  Rejected: "Rejected",
  Cancelled: "Cancelled"
};

function isGoalReached(status: CampaignStatus, totalInvested?: number, goalAmount?: number) {
  return (
    (status === "Active" || status === "VotingOpen") &&
    typeof totalInvested === "number" &&
    typeof goalAmount === "number" &&
    goalAmount > 0 &&
    totalInvested >= goalAmount
  );
}

export function StatusBadge({
  status,
  totalInvested,
  goalAmount
}: {
  status: CampaignStatus;
  totalInvested?: number;
  goalAmount?: number;
}) {
  const label = isGoalReached(status, totalInvested, goalAmount) ? "Goal reached" : labels[status];

  return (
    <span className={`whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {label}
    </span>
  );
}
