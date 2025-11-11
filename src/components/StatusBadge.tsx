import { Badge } from "@/components/ui/badge";

type Status = "open" | "in_progress" | "resolved" | "closed";

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  open: { label: "Open", variant: "default" },
  in_progress: { label: "In Progress", variant: "secondary" },
  resolved: { label: "Resolved", variant: "outline" },
  closed: { label: "Closed", variant: "outline" },
};

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={
        status === "resolved" 
          ? "bg-success/10 text-success hover:bg-success/20 border-success/20" 
          : status === "in_progress"
          ? "bg-warning/10 text-warning hover:bg-warning/20 border-warning/20"
          : ""
      }
    >
      {config.label}
    </Badge>
  );
};
