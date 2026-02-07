import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import ClaimsList from "@/pages/ClaimsList";
import DocumentUpload from "@/pages/DocumentUpload";
import ExtractionReview from "@/pages/ExtractionReview";
import InspectionBriefing from "@/pages/InspectionBriefing";
import ActiveInspection from "@/pages/ActiveInspection";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ClaimsList} />
      <Route path="/upload/:id" component={DocumentUpload} />
      <Route path="/review/:id" component={ExtractionReview} />
      <Route path="/briefing/:id" component={InspectionBriefing} />
      <Route path="/inspection/:id" component={ActiveInspection} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
