import { useState } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { AlertCircle, Check, ArrowRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Extraction {
  id: number;
  claimId: number;
  documentType: string;
  extractedData: any;
  confidence: any;
  confirmedByUser: boolean;
}

function ConfidenceBadge({ level }: { level: string }) {
  if (level === "high") {
    return (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 text-xs">
        <Check className="h-3 w-3 mr-1" /> High
      </Badge>
    );
  }
  if (level === "medium") {
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 text-xs">
        <AlertCircle className="h-3 w-3 mr-1" /> Medium
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 text-xs">
      <AlertCircle className="h-3 w-3 mr-1" /> Low
    </Badge>
  );
}

function EditableField({ label, value, confidence, onChange }: {
  label: string;
  value: string;
  confidence?: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>
      <Input
        data-testid={`input-${label.toLowerCase().replace(/\s+/g, "-")}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={confidence === "low" ? "bg-red-50/50 border-red-200" : confidence === "medium" ? "bg-amber-50/50 border-amber-200" : ""}
      />
    </div>
  );
}

function FnolTab({ extraction }: { extraction: Extraction }) {
  const data = extraction.extractedData || {};
  const conf = extraction.confidence || {};
  const addr = data.propertyAddress || {};

  return (
    <Card className="border-border">
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-lg font-display flex items-center gap-2">
          <Check className="h-5 w-5 text-green-600" /> FNOL Extraction
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <EditableField label="Claim Number" value={data.claimNumber || ""} confidence={conf.claimNumber} onChange={() => {}} />
        <EditableField label="Insured Name" value={data.insuredName || ""} confidence={conf.insuredName} onChange={() => {}} />
        <div className="space-y-2 md:col-span-2">
          <Label>Property Address</Label>
          <Input
            value={`${addr.street || ""}, ${addr.city || ""}, ${addr.state || ""} ${addr.zip || ""}`}
            readOnly
            className="bg-muted/50"
          />
        </div>
        <EditableField label="Date of Loss" value={data.dateOfLoss || ""} confidence={conf.dateOfLoss} onChange={() => {}} />
        <EditableField label="Peril Type" value={data.perilType || ""} confidence={conf.perilType} onChange={() => {}} />
        <div className="space-y-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Reported Damage</Label>
            {conf.reportedDamage && <ConfidenceBadge level={conf.reportedDamage} />}
          </div>
          <textarea
            data-testid="input-reported-damage"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            defaultValue={data.reportedDamage || ""}
          />
        </div>
        <EditableField label="Property Type" value={data.propertyType || ""} confidence={conf.propertyType} onChange={() => {}} />
        <EditableField label="Year Built" value={data.yearBuilt?.toString() || ""} confidence={conf.yearBuilt} onChange={() => {}} />
      </CardContent>
    </Card>
  );
}

function PolicyTab({ extraction }: { extraction: Extraction }) {
  const data = extraction.extractedData || {};
  const conf = extraction.confidence || {};
  const ded = data.deductible || {};

  const fmt = (v: number | null | undefined) => v != null ? v.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "";

  return (
    <Card className="border-border">
      <CardHeader className="pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display">Policy Coverage ({data.policyType || "HO-3"})</CardTitle>
          {conf.deductible === "medium" && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              <AlertCircle className="h-3 w-3 mr-1" /> Review Deductible
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Coverage A (Dwelling)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input className="pl-7 font-mono text-lg" defaultValue={fmt(data.coverageA)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Coverage B (Other Structures)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input className="pl-7 font-mono text-lg" defaultValue={fmt(data.coverageB)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Coverage C (Personal Property)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input className="pl-7 font-mono text-lg" defaultValue={fmt(data.coverageC)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Coverage D (Loss of Use)</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input className="pl-7 font-mono text-lg" defaultValue={fmt(data.coverageD)} />
            </div>
          </div>

          <div className="col-span-full border-t border-dashed border-border my-2" />

          <div className="space-y-2">
            <Label className="font-semibold text-foreground">Deductible ({ded.type || "All Peril"})</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
              <Input className="pl-7 font-mono font-bold text-foreground bg-amber-50/50 border-amber-200" defaultValue={fmt(ded.amount)} />
            </div>
          </div>
          {ded.windHailDeductible != null && (
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Wind/Hail Deductible</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input className="pl-7 font-mono font-bold text-foreground bg-amber-50/50 border-amber-200" defaultValue={fmt(ded.windHailDeductible)} />
              </div>
            </div>
          )}

          <div className="col-span-full border-t border-dashed border-border my-2" />

          <EditableField label="Loss Settlement" value={data.lossSettlement || ""} confidence={conf.lossSettlement} onChange={() => {}} />
          <EditableField label="Construction Type" value={data.constructionType || ""} confidence={conf.constructionType} onChange={() => {}} />
          <EditableField label="Roof Type" value={data.roofType || ""} confidence={conf.roofType} onChange={() => {}} />
        </div>
      </CardContent>
    </Card>
  );
}

function EndorsementsTab({ extraction }: { extraction: Extraction }) {
  const data = extraction.extractedData || {};
  const endorsements = data.endorsements || [];

  return (
    <div className="space-y-4">
      {endorsements.map((end: any, i: number) => (
        <Card key={i} className="border-l-4 border-l-accent">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg font-mono text-accent-foreground">{end.endorsementId}</h3>
                  <Badge variant="secondary">{end.title?.split(" ").slice(0, 2).join(" ")}</Badge>
                </div>
                <p className="font-medium text-foreground">{end.title}</p>
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{end.claimImpact}</p>
                {end.keyProvisions && end.keyProvisions.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {end.keyProvisions.map((p: string, j: number) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span className="text-primary mt-0.5">&#8226;</span> {p}
                      </li>
                    ))}
                  </ul>
                )}
                {end.sublimits && end.sublimits.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {end.sublimits.map((s: any, k: number) => (
                      <Badge key={k} variant="outline" className="text-xs">
                        {s.description}: ${s.amount?.toLocaleString()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {endorsements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No endorsements extracted. Upload an endorsements document first.
        </div>
      )}
    </div>
  );
}

export default function ExtractionReview({ params }: { params: { id: string } }) {
  const [, setLocation] = useLocation();
  const claimId = params.id;

  const { data: extractionsList = [], isLoading } = useQuery<Extraction[]>({
    queryKey: [`/api/claims/${claimId}/extractions`],
  });

  const fnolExt = extractionsList.find((e) => e.documentType === "fnol");
  const policyExt = extractionsList.find((e) => e.documentType === "policy");
  const endorsementsExt = extractionsList.find((e) => e.documentType === "endorsements");

  const endorsementCount = endorsementsExt?.extractedData?.endorsements?.length || 0;

  const confirmAndGenerate = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/claims/${claimId}/extractions/confirm-all`);
      const res = await apiRequest("POST", `/api/claims/${claimId}/briefing/generate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/claims/${claimId}`] });
      setLocation(`/briefing/${claimId}`);
    },
  });

  if (isLoading) {
    return (
      <Layout title="Extraction Review" showBack>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Extraction Review" showBack>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-bold">Review AI Extractions</h2>
            <p className="text-muted-foreground">Verify the data extracted from your uploaded documents.</p>
          </div>
          <Button
            data-testid="button-confirm-generate"
            onClick={() => confirmAndGenerate.mutate()}
            size="lg"
            disabled={confirmAndGenerate.isPending || extractionsList.length < 3}
          >
            {confirmAndGenerate.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                Confirm & Generate Briefing <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="fnol" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-white border border-border rounded-xl">
            <TabsTrigger value="fnol" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">
              FNOL Data {fnolExt ? <Check className="inline ml-1 h-3 w-3 text-green-600" /> : null}
            </TabsTrigger>
            <TabsTrigger value="policy" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">
              Policy Limits {policyExt ? <Check className="inline ml-1 h-3 w-3 text-green-600" /> : null}
            </TabsTrigger>
            <TabsTrigger value="endorsements" className="py-3 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg font-medium">
              Endorsements ({endorsementCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fnol" className="mt-6 space-y-6">
            {fnolExt ? <FnolTab extraction={fnolExt} /> : (
              <div className="text-center py-12 text-muted-foreground">No FNOL extraction available. Upload the FNOL document first.</div>
            )}
          </TabsContent>

          <TabsContent value="policy" className="mt-6">
            {policyExt ? <PolicyTab extraction={policyExt} /> : (
              <div className="text-center py-12 text-muted-foreground">No policy extraction available. Upload the policy document first.</div>
            )}
          </TabsContent>

          <TabsContent value="endorsements" className="mt-6 space-y-4">
            {endorsementsExt ? <EndorsementsTab extraction={endorsementsExt} /> : (
              <div className="text-center py-12 text-muted-foreground">No endorsements extraction available. Upload the endorsements document first.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
