import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, PerilBadge } from "./StatusBadge";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";

interface ClaimCardProps {
  id: string;
  claimNumber: string;
  insuredName: string;
  address: string;
  peril: string;
  status: string;
  dateOfLoss: string;
  image?: string;
}

export default function ClaimCard({ 
  id, 
  claimNumber, 
  insuredName, 
  address, 
  peril, 
  status, 
  dateOfLoss,
  image 
}: ClaimCardProps) {
  // Determine next route based on status for the prototype flow
  const getNextRoute = () => {
    switch(status) {
      case "Draft": return `/upload/${id}`;
      case "Documents Uploaded": return `/review/${id}`;
      case "Briefing Ready": return `/briefing/${id}`;
      case "Inspecting": return `/inspection/${id}`;
      default: return `/upload/${id}`;
    }
  };

  return (
    <Link href={getNextRoute()}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer border-border overflow-hidden group h-full">
        <div className="flex h-full">
          {/* Image Section - Left (Desktop) or Top (Mobile) */}
          <div className="w-32 bg-gray-100 relative shrink-0">
            {image ? (
              <img src={image} alt={address} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-muted">
                <MapPin className="text-muted-foreground opacity-20 h-8 w-8" />
              </div>
            )}
            <div className="absolute top-2 left-2">
              <PerilBadge peril={peril} />
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                  {claimNumber}
                </h3>
                <StatusBadge status={status} />
              </div>
              
              <p className="font-medium text-foreground/80 mb-1">{insuredName}</p>
              
              <div className="flex items-center text-sm text-muted-foreground gap-1 mb-3">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{address}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <div className="flex items-center text-xs text-muted-foreground gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>DOL: {dateOfLoss}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
