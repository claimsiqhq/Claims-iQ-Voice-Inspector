import React from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Mic, 
  CheckCircle,
  Menu,
  Bell,
  Search,
  ChevronLeft
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

export default function Layout({ children, title = "Claims IQ", showBack = false }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation Bar - Deep Purple */}
      <header className="h-16 bg-foreground text-white flex items-center justify-between px-6 shadow-md z-50">
        <div className="flex items-center gap-4">
          {showBack && (
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => window.history.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-lg font-display font-bold tracking-wide">Claims IQ</h1>
          </div>

          {title !== "Claims IQ" && (
            <>
              <div className="h-6 w-px bg-white/20 mx-2" />
              <h2 className="text-lg font-display font-medium text-white/90">{title}</h2>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/50" />
            <input 
              className="h-9 w-64 rounded-full bg-white/10 border-none pl-9 pr-4 text-sm text-white placeholder:text-white/50 focus:ring-1 focus:ring-primary"
              placeholder="Search claims..." 
            />
          </div>
          
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full" />
          </Button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-white/10">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium leading-none">Alex Morgan</p>
              <p className="text-xs text-white/60 mt-1">Senior Adjuster</p>
            </div>
            <Avatar className="h-9 w-9 border border-white/20">
              <AvatarImage src="/images/avatar_adjuster.png" />
              <AvatarFallback>AM</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
