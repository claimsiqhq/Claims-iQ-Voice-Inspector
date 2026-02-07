import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

interface PerilBadgeProps {
  peril: string;
  className?: string;
}

const STATUS_DISPLAY: Record<string, string> = {
  draft: "Draft",
  documents_uploaded: "Documents Uploaded",
  extractions_confirmed: "Extractions Confirmed",
  briefing_ready: "Briefing Ready",
  inspecting: "Inspecting",
  review: "Review",
  complete: "Complete",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  let colorClass = "bg-muted text-muted-foreground";

  switch (normalized) {
    case "draft":
      colorClass = "bg-gray-100 text-gray-700 border-gray-200";
      break;
    case "documents_uploaded":
      colorClass = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "extractions_confirmed":
      colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200";
      break;
    case "briefing_ready":
      colorClass = "bg-primary/10 text-primary border-primary/20";
      break;
    case "inspecting":
      colorClass = "bg-accent/10 text-accent-foreground border-accent/20";
      break;
    case "complete":
      colorClass = "bg-green-50 text-green-700 border-green-200";
      break;
  }

  const display = STATUS_DISPLAY[normalized] || status;

  return (
    <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 border", colorClass, className)}>
      {display}
    </Badge>
  );
}

export function PerilBadge({ peril, className }: PerilBadgeProps) {
  const normalized = peril.toLowerCase();
  let colorClass = "bg-muted text-muted-foreground";

  switch (normalized) {
    case "hail": colorClass = "bg-primary text-white hover:bg-primary/90"; break;
    case "water": colorClass = "bg-secondary text-white hover:bg-secondary/90"; break;
    case "fire": colorClass = "bg-destructive text-white hover:bg-destructive/90"; break;
    case "wind": colorClass = "bg-accent text-white hover:bg-accent/90"; break;
    case "freeze": colorClass = "bg-cyan-600 text-white hover:bg-cyan-700"; break;
    case "multi": colorClass = "bg-gray-700 text-white hover:bg-gray-800"; break;
  }

  const display = peril.charAt(0).toUpperCase() + peril.slice(1);

  return (
    <Badge className={cn("font-medium border-0", colorClass, className)}>
      {display}
    </Badge>
  );
}
