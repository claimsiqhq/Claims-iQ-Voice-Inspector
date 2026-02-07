import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Mic, ArrowRight, Home, AlertTriangle, FileText, CheckSquare, CloudHail } from "lucide-react";
import { motion } from "framer-motion";

export default function InspectionBriefing({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();

  return (
    <Layout title="Inspection Briefing" showBack>
      <div className="max-w-4xl mx-auto pb-20">
        {/* Mission Header */}
        <div className="bg-foreground text-white p-8 rounded-2xl mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <CloudHail size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4 text-white/70">
              <span className="uppercase tracking-widest text-xs font-bold">Mission Briefing</span>
              <span className="h-px w-8 bg-white/30"></span>
              <span className="text-xs">CLM-2024-00847</span>
            </div>
            
            <h1 className="text-4xl font-display font-bold mb-2">Hail Inspection: 4517 Washington Ave</h1>
            <p className="text-xl text-white/80 font-light mb-6">Standard HO-3 Policy • Wind/Hail Deductible applies</p>
            
            <div className="flex gap-4">
              <Button 
                size="lg" 
                className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 h-14 px-8 text-lg shadow-lg font-semibold"
                onClick={() => setLocation(`/inspection/${params.id}`)}
              >
                <Mic className="mr-2 h-5 w-5" /> Start Active Inspection
              </Button>
            </div>
          </div>
        </div>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Property Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-primary">
                <Home className="h-5 w-5" /> Property Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video rounded-lg bg-gray-100 mb-4 overflow-hidden relative">
                <img src="/images/house_hail_damage.png" alt="Property" className="object-cover w-full h-full" />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                  Sat View Available
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Year Built</p>
                  <p className="font-semibold">2012</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Roof Type</p>
                  <p className="font-semibold">Architectural Shingle</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stories</p>
                  <p className="font-semibold">2 Story</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Siding</p>
                  <p className="font-semibold">Vinyl / Brick Veneer</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peril Analysis */}
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-accent-foreground">
                <CloudHail className="h-5 w-5" /> Peril Analysis: Hail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-white rounded-lg border border-accent/20 shadow-sm">
                <p className="font-semibold text-sm mb-1">Target Areas</p>
                <p className="text-sm text-muted-foreground">Focus on Soft Metals (gutters, vents) first to establish directionality. Check West facing slopes.</p>
              </div>
              
              <div className="p-3 bg-white rounded-lg border border-accent/20 shadow-sm">
                <p className="font-semibold text-sm mb-1">Collateral Indicators</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside">
                  <li>Window screens (west side)</li>
                  <li>AC Condenser fins</li>
                  <li>Mailbox dents</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Endorsement Impacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-foreground">
                <FileText className="h-5 w-5" /> Critical Endorsements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                <div className="bg-foreground text-white text-xs font-mono px-1.5 py-0.5 rounded mt-0.5">HO 88 02</div>
                <div>
                  <p className="text-sm font-semibold">Roof Surface ACV</p>
                  <p className="text-xs text-muted-foreground">Roof &gt; 15 years old. Depreciation is non-recoverable.</p>
                </div>
              </div>
              <div className="flex gap-3 items-start p-3 bg-muted/30 rounded-lg">
                <div className="bg-foreground text-white text-xs font-mono px-1.5 py-0.5 rounded mt-0.5">HO 81 17</div>
                <div>
                  <p className="text-sm font-semibold">Limited Water Backup</p>
                  <p className="text-xs text-muted-foreground">$5,000 sub-limit applies if interior water damage found.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-foreground">
                <CheckSquare className="h-5 w-5" /> Inspection Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                 <div className="flex items-center gap-2 text-sm">
                   <div className="h-4 w-4 rounded border border-input"></div>
                   <span>Overview photos (4 elevations)</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   <div className="h-4 w-4 rounded border border-input"></div>
                   <span>Roof Test Squares (N, S, E, W)</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   <div className="h-4 w-4 rounded border border-input"></div>
                   <span>Gutter & Downspout documentation</span>
                 </div>
                 <div className="flex items-center gap-2 text-sm">
                   <div className="h-4 w-4 rounded border border-input"></div>
                   <span>Interior leak inspection (Master Bed)</span>
                 </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Layout>
  );
}
