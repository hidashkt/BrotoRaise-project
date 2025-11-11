import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { formatDistanceToNow } from "date-fns";

interface ComplaintCardProps {
  complaint: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: "open" | "in_progress" | "resolved" | "closed";
    created_at: string;
    resolution_details?: string;
  };
  onClick?: () => void;
}

const categoryLabels: Record<string, string> = {
  basic_coding: "Basic Coding",
  mern_stack: "MERN Stack",
  python_django: "Python Django",
  brohub: "BroHub",
  game_dev_unity: "Game Dev (Unity)",
  github_challenge: "GitHub Challenge",
  cyber_security: "Cyber Security",
  other: "Other",
};

export const ComplaintCard = ({ complaint, onClick }: ComplaintCardProps) => {
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{complaint.title}</CardTitle>
            <CardDescription>{categoryLabels[complaint.category]}</CardDescription>
          </div>
          <StatusBadge status={complaint.status} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {complaint.description}
        </p>
        {complaint.resolution_details && (
          <div className="mt-3 p-3 bg-success/5 border border-success/20 rounded-md">
            <p className="text-sm text-success-foreground">
              <span className="font-semibold">Resolution: </span>
              {complaint.resolution_details}
            </p>
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          {formatDistanceToNow(new Date(complaint.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
};
