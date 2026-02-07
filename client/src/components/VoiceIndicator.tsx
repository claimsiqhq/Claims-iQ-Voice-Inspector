import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceIndicatorProps {
  status: "idle" | "listening" | "processing" | "speaking";
  className?: string;
}

export default function VoiceIndicator({ status, className }: VoiceIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-1 h-12", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className={cn(
            "w-1.5 rounded-full",
            status === "listening" ? "bg-primary" : 
            status === "speaking" ? "bg-accent" : 
            status === "processing" ? "bg-secondary" : "bg-muted-foreground/30"
          )}
          initial={{ height: 8 }}
          animate={{ 
            height: status === "idle" ? 8 : [8, 24, 8],
            opacity: status === "idle" ? 0.5 : 1
          }}
          transition={{ 
            duration: status === "idle" ? 0 : 0.8, 
            repeat: Infinity, 
            delay: i * 0.1,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
}
