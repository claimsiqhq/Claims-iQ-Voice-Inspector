import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { AlertCircle, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ExtractionReview({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();

  return (
    <Layout title="Extraction Review" showBack>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold">Review AI Extractions</h2>
            <p className="text-muted-foreground">Verify the data extracted from your uploaded documents.</p>
          </div>
          <Button onClick={() => setLocation(`/briefing/${params.id}`)} size="lg">
            Confirm & Generate Briefing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="fnol" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white border border-border rounded-xl">
            <TabsTrigger value="fnol" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">FNOL Data</TabsTrigger>
            <TabsTrigger value="policy" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">Policy Limits</TabsTrigger>
            <TabsTrigger value="endorsements" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">Endorsements (2)</TabsTrigger>
          </TabsList>

          {/* FNOL Tab */}
          <TabsContent value="fnol" className="mt-6 space-y-6">
            <Card className="border-border">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" /> High Confidence Extraction
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <Label>Claim Number</Label>
                  <Input defaultValue="CLM-2024-00847" readOnly className="bg-muted/50 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Insured Name</Label>
                  <Input defaultValue="Robert Fox" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Property Address</Label>
                  <Input defaultValue="4517 Washington Ave. Manchester, KY 39495" />
                </div>
                <div className="space-y-2">
                  <Label>Date of Loss</Label>
                  <Input type="date" defaultValue="2024-10-24" />
                </div>
                <div className="space-y-2">
                  <Label>Reported Peril</Label>
                  <div className="relative">
                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm">
                      <option selected>Hail</option>
                      <option>Wind</option>
                      <option>Water</option>
                      <option>Fire</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Damage Description</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" defaultValue="Insured reports golf-ball sized hail damage to roof shingles and gutters. Some leaks reported in master bedroom ceiling." />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Policy Tab */}
          <TabsContent value="policy" className="mt-6">
            <Card className="border-border">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display">Policy Coverage (HO-3)</CardTitle>
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    <AlertCircle className="h-3 w-3 mr-1" /> Review Deductible
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Coverage A (Dwelling)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono text-lg" defaultValue="450,000.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Coverage B (Other Structures)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono text-lg" defaultValue="45,000.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Coverage C (Personal Property)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono text-lg" defaultValue="225,000.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Coverage D (Loss of Use)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono text-lg" defaultValue="90,000.00" />
                    </div>
                  </div>
                  
                  <div className="col-span-full border-t border-dashed border-border my-2" />
                  
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Deductible (All Peril)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono font-bold text-foreground bg-amber-50/50 border-amber-200" defaultValue="1,000.00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Wind/Hail Deductible</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input className="pl-7 font-mono font-bold text-foreground bg-amber-50/50 border-amber-200" defaultValue="2,500.00" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endorsements Tab */}
          <TabsContent value="endorsements" className="mt-6 space-y-4">
             <Card className="border-l-4 border-l-accent">
               <CardContent className="pt-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-lg font-mono text-accent-foreground">HO 88 02</h3>
                       <Badge variant="secondary">Roof Surfacing</Badge>
                     </div>
                     <p className="font-medium text-foreground">Special Loss Settlement</p>
                     <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                       Updates the loss settlement for roof surfacing to Actual Cash Value (ACV) if the roof is older than 15 years.
                     </p>
                   </div>
                   <Button variant="ghost" size="sm">Remove</Button>
                 </div>
               </CardContent>
             </Card>

             <Card className="border-l-4 border-l-primary">
               <CardContent className="pt-6">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <h3 className="font-bold text-lg font-mono text-primary">HO 81 17</h3>
                       <Badge variant="secondary">Water Backup</Badge>
                     </div>
                     <p className="font-medium text-foreground">Limited Water Back-up</p>
                     <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                       Provides coverage for water which backs up through sewers or drains. Limit: $5,000.
                     </p>
                   </div>
                   <Button variant="ghost" size="sm">Remove</Button>
                 </div>
               </CardContent>
             </Card>

             <Button variant="outline" className="w-full border-dashed py-6 text-muted-foreground">
               + Add Missing Endorsement
             </Button>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
