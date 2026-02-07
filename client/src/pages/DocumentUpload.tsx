import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Shield, FileStack, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type UploadState = "empty" | "uploading" | "processing" | "complete";

interface DocCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  state: UploadState;
  onUpload: () => void;
  index: number;
}

const DocCard = ({ title, description, icon: Icon, color, state, onUpload, index }: DocCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card 
        className={cn(
          "relative h-64 border-2 border-dashed flex flex-col items-center justify-center p-6 cursor-pointer transition-all hover:border-primary/50 group overflow-hidden bg-white",
          state === "complete" && "border-solid border-green-500/30 bg-green-50/10",
          state === "uploading" && "border-solid border-primary/30"
        )}
        onClick={state === "empty" ? onUpload : undefined}
      >
        {state === "empty" && (
          <div className="text-center space-y-4">
            <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4", color)}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h3 className="font-display font-semibold text-lg">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">{description}</p>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-4 left-0 right-0 text-center text-xs text-primary font-medium">
              Click to upload PDF
            </div>
          </div>
        )}

        {state === "uploading" && (
          <div className="w-full max-w-xs text-center space-y-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" />
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-primary" 
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Uploading document...</p>
          </div>
        )}

        {state === "processing" && (
          <div className="w-full max-w-xs text-center space-y-4">
            <div className="relative mx-auto h-16 w-16">
              <div className={cn("absolute inset-0 rounded-full opacity-20 animate-ping", color.replace('bg-', 'bg-'))}></div>
              <div className={cn("relative h-16 w-16 rounded-full flex items-center justify-center", color)}>
                <Icon className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-sm font-medium animate-pulse">AI Parsing in progress...</p>
            <p className="text-xs text-muted-foreground">Extracting key data points</p>
          </div>
        )}

        {state === "complete" && (
          <div className="text-center space-y-3">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-display font-semibold text-lg text-green-900">Analysis Complete</h3>
            <div className="bg-white/50 rounded-lg p-2 text-xs text-left w-full max-w-[200px] mx-auto border border-green-200/50 space-y-1">
              <div className="h-2 w-3/4 bg-green-200/50 rounded"></div>
              <div className="h-2 w-1/2 bg-green-200/50 rounded"></div>
              <div className="h-2 w-2/3 bg-green-200/50 rounded"></div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

export default function DocumentUpload({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [docStates, setDocStates] = useState<UploadState[]>(["empty", "empty", "empty"]);

  // Simulate upload flow
  const handleUpload = (index: number) => {
    const newStates = [...docStates];
    newStates[index] = "uploading";
    setDocStates(newStates);

    setTimeout(() => {
      setDocStates(prev => {
        const next = [...prev];
        next[index] = "processing";
        return next;
      });

      setTimeout(() => {
        setDocStates(prev => {
          const next = [...prev];
          next[index] = "complete";
          return next;
        });
      }, 2000);
    }, 1500);
  };

  const allComplete = docStates.every(s => s === "complete");

  return (
    <Layout title="Document Upload" showBack>
      <div className="max-w-5xl mx-auto py-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-display font-bold text-foreground mb-3">Upload Claim Documents</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Upload the three required documents below. Our AI agents will automatically extract policy limits, property details, and endorsement impacts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <DocCard 
            index={0}
            title="FNOL Report"
            description="First Notice of Loss containing insured details and reported damage."
            icon={FileText}
            color="bg-primary"
            state={docStates[0]}
            onUpload={() => handleUpload(0)}
          />
          <DocCard 
            index={1}
            title="Policy Declarations"
            description="Standard HO policy form (e.g. HO 80 03) defining coverages."
            icon={Shield}
            color="bg-secondary"
            state={docStates[1]}
            onUpload={() => handleUpload(1)}
          />
          <DocCard 
            index={2}
            title="Endorsements"
            description="Additional policy modifications and special provisions."
            icon={FileStack}
            color="bg-accent"
            state={docStates[2]}
            onUpload={() => handleUpload(2)}
          />
        </div>

        <div className="flex justify-center">
          <Button 
            size="lg" 
            disabled={!allComplete} 
            className="w-64 h-12 text-lg shadow-xl shadow-primary/20"
            onClick={() => setLocation(`/review/${params.id}`)}
          >
            Review Extraction <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
        
        {allComplete && (
          <p className="text-center text-sm text-green-600 mt-4 animate-in fade-in slide-in-from-bottom-2">
            All documents parsed successfully. Ready for review.
          </p>
        )}
      </div>
    </Layout>
  );
}
