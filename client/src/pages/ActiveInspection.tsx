import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { 
  Mic, 
  Camera, 
  MoreHorizontal, 
  Map as MapIcon, 
  CheckCircle2, 
  X,
  ChevronLeft,
  Image as ImageIcon,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import VoiceIndicator from "@/components/VoiceIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";

// Mock data for the inspection flow
const ROOMS = [
  { id: "ext", name: "Exterior", status: "in-progress", damageCount: 2 },
  { id: "roof", name: "Roof", status: "pending", damageCount: 0 },
  { id: "entry", name: "Entryway", status: "pending", damageCount: 0 },
  { id: "living", name: "Living Room", status: "pending", damageCount: 0 },
  { id: "master", name: "Master Bed", status: "pending", damageCount: 0 },
];

const TRANSCRIPT_LOG = [
  { role: "agent", text: "I'm ready. We're starting with the Exterior." },
  { role: "user", text: "Okay, looking at the front elevation." },
  { role: "agent", text: "Front elevation noted. I've tagged this photo 'Front Elevation'." },
  { role: "user", text: "There is a dent on the aluminum gutter here." },
  { role: "agent", text: "Logged: Gutter damage on Front Elevation. Added to estimate." },
];

export default function ActiveInspection({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [currentRoom, setCurrentRoom] = useState("Exterior");
  const [showCamera, setShowCamera] = useState(false);
  const [lastTranscript, setLastTranscript] = useState(TRANSCRIPT_LOG[TRANSCRIPT_LOG.length - 1]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Simulate voice interaction loop
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly cycle states to simulate activity
      const states: ("idle" | "listening" | "processing" | "speaking")[] = ["idle", "idle", "listening", "processing", "speaking"];
      const randomState = states[Math.floor(Math.random() * states.length)];
      setVoiceStatus(randomState);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleMicClick = () => {
    setVoiceStatus("listening");
    setTimeout(() => setVoiceStatus("processing"), 2000);
    setTimeout(() => {
      setVoiceStatus("speaking");
      setLastTranscript({ role: "agent", text: "I've added that photo to the report." });
    }, 4000);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden relative">
      
      {/* LEFT SIDEBAR - Progress Map */}
      <div className="w-80 bg-gray-900 border-r border-white/10 flex flex-col z-20">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-6">
             <Link href={`/briefing/${params.id}`} className="text-white/50 hover:text-white">
               <ChevronLeft />
             </Link>
             <h1 className="font-display font-bold text-lg">Active Inspection</h1>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-widest text-white/40">Current Location</p>
            <h2 className="text-2xl font-display font-bold text-primary">{currentRoom}</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ROOMS.map(room => (
            <div 
              key={room.id}
              onClick={() => setCurrentRoom(room.name)}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center",
                currentRoom === room.name 
                  ? "bg-primary/20 border-primary" 
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              )}
            >
              <div>
                <p className="font-medium">{room.name}</p>
                <p className="text-xs text-white/50">{room.damageCount} items logged</p>
              </div>
              {room.status === "in-progress" && <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />}
              {room.status === "completed" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-white/10">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 justify-start" onClick={() => setLocation("/")}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Finish Inspection
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN HUD AREA */}
      <div className="flex-1 relative flex flex-col">
        
        {/* Camera Viewfinder (Simulated Background) */}
        <div className="absolute inset-0 bg-black z-0">
          <img 
            src="/images/house_hail_damage.png" 
            className="w-full h-full object-cover opacity-60" 
            alt="Viewfinder"
          />
          {/* Augmented Reality Overlays */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 border-2 border-white/30 w-64 h-64 rounded-lg flex items-center justify-center">
            <div className="w-full h-px bg-white/30 absolute top-1/2"></div>
            <div className="h-full w-px bg-white/30 absolute left-1/2"></div>
          </div>
          
          <div className="absolute top-20 right-20">
             <div className="bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 text-xs">
                <p className="text-accent font-bold">HAIL DAMAGE DETECTED</p>
                <p>Confidence: 94%</p>
             </div>
          </div>
        </div>

        {/* Top HUD Bar */}
        <div className="h-20 bg-gradient-to-b from-black/80 to-transparent z-10 p-6 flex justify-between items-start">
           <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
             <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-mono">REC • 04:12</span>
           </div>
           
           <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                 <MapIcon />
              </Button>
              <Button variant="ghost" size="icon" className="bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                 <MoreHorizontal />
              </Button>
           </div>
        </div>

        {/* Middle Area - Dynamic Transcripts */}
        <div className="flex-1 z-10 flex flex-col justify-end pb-32 px-12 pointer-events-none">
          <div className="space-y-4 max-w-2xl mx-auto w-full">
             <AnimatePresence>
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0 }}
                 className="bg-black/60 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-2xl"
               >
                 <div className="flex gap-4">
                   <div className={cn("mt-1", lastTranscript.role === 'agent' ? "text-primary" : "text-white/70")}>
                     {lastTranscript.role === 'agent' ? <Mic size={20} /> : <MessageSquare size={20} />}
                   </div>
                   <div>
                     <p className={cn("text-lg font-medium leading-relaxed", lastTranscript.role === 'agent' ? "text-white" : "text-white/80 italic")}>
                       "{lastTranscript.text}"
                     </p>
                   </div>
                 </div>
               </motion.div>
             </AnimatePresence>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="h-28 bg-black/80 backdrop-blur-xl border-t border-white/10 z-20 flex items-center justify-between px-12 absolute bottom-0 w-full">
           
           {/* Gallery Preview */}
           <div className="flex gap-2">
             <div className="h-16 w-16 bg-white/10 rounded-lg border border-white/20 overflow-hidden relative group cursor-pointer">
               <img src="/images/house_hail_damage.png" className="h-full w-full object-cover" />
               <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                 <ImageIcon size={16} />
               </div>
             </div>
             <div className="h-16 w-16 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-white/30">
               +
             </div>
           </div>

           {/* Main Voice Control */}
           <div className="flex flex-col items-center -mt-8">
             <button 
               onClick={handleMicClick}
               className={cn(
                 "h-20 w-20 rounded-full flex items-center justify-center shadow-2xl transition-all scale-100 hover:scale-105 active:scale-95 border-4",
                 voiceStatus === 'listening' ? "bg-primary border-primary/50" : "bg-white text-black border-white/50"
               )}
             >
               <Mic className={cn("h-8 w-8", voiceStatus === 'listening' ? "text-white" : "text-black")} />
             </button>
             <div className="mt-4 h-8">
               <VoiceIndicator status={voiceStatus} />
             </div>
           </div>

           {/* Quick Actions */}
           <div className="flex gap-4">
             <Button size="lg" variant="outline" className="border-white/20 text-white bg-transparent hover:bg-white/10 h-14 w-14 rounded-full p-0">
               <Camera />
             </Button>
           </div>

        </div>
      </div>

    </div>
  );
}
