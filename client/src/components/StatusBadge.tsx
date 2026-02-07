import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusType = "Draft" | "Documents Uploaded" | "Briefing Ready" | "Inspecting" | "Complete";
type PerilType = "Hail" | "Water" | "Fire" | "Wind";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

interface PerilBadgeProps {
  peril: PerilType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let colorClass = "bg-muted text-muted-foreground"; // Default
  
  switch(status) {
    case "Draft": 
      colorClass = "bg-gray-100 text-gray-700 border-gray-200"; 
      break;
    case "Documents Uploaded": 
      colorClass = "bg-blue-50 text-blue-700 border-blue-200"; 
      break;
    case "Briefing Ready": 
      colorClass = "bg-primary/10 text-primary border-primary/20"; 
      break;
    case "Inspecting": 
      colorClass = "bg-accent/10 text-accent-foreground border-accent/20"; 
      break;
    case "Complete": 
      colorClass = "bg-green-50 text-green-700 border-green-200"; 
      break;
  }

  return (
    <Badge variant="outline" className={cn("font-medium px-2.5 py-0.5 border", colorClass, className)}>
      {status}
    </Badge>
  );
}

export function PerilBadge({ peril, className }: PerilBadgeProps) {
  let colorClass = "bg-muted text-muted-foreground";

  switch(peril) {
    case "Hail": colorClass = "bg-primary text-white hover:bg-primary/90"; break;
    case "Water": colorClass = "bg-secondary text-white hover:bg-secondary/90"; break;
    case "Fire": colorClass = "bg-destructive text-white hover:bg-destructive/90"; break;
    case "Wind": colorClass = "bg-accent text-white hover:bg-accent/90"; break;
  }

  return (
    <Badge className={cn("font-medium border-0", colorClass, className)}>
      {peril}
    </Badge>
  );
}
