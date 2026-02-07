import React, { useState } from "react";
import Layout from "@/components/Layout";
import ClaimCard from "@/components/ClaimCard";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MOCK_CLAIMS = [
  {
    id: "1",
    claimNumber: "CLM-2024-00847",
    insuredName: "Robert Fox",
    address: "4517 Washington Ave. Manchester, KY 39495",
    peril: "Hail",
    status: "Draft",
    dateOfLoss: "Oct 24, 2024",
    image: "/images/house_hail_damage.png"
  },
  {
    id: "2",
    claimNumber: "CLM-2024-00921",
    insuredName: "Eleanor Pena",
    address: "2118 Thornridge Cir. Syracuse, NY 35624",
    peril: "Water",
    status: "Documents Uploaded",
    dateOfLoss: "Nov 02, 2024",
    image: "/images/house_modern.png"
  },
  {
    id: "3",
    claimNumber: "CLM-2024-01004",
    insuredName: "Cameron Williamson",
    address: "1901 Thornridge Cir. Shiloh, HI 81063",
    peril: "Fire",
    status: "Briefing Ready",
    dateOfLoss: "Jan 15, 2025"
  },
  {
    id: "4",
    claimNumber: "CLM-2024-01255",
    insuredName: "Esther Howard",
    address: "4140 Parker Rd. Allentown, NM 31134",
    peril: "Wind",
    status: "Inspecting",
    dateOfLoss: "Feb 01, 2025"
  }
];

export default function ClaimsList() {
  const [filter, setFilter] = useState("all");

  return (
    <Layout>
      <div className="flex flex-col space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-display font-bold text-foreground">My Claims</h2>
            <p className="text-muted-foreground mt-1">Manage your active inspections and assignments.</p>
          </div>
          
          <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-5 w-5" /> New Claim
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-border">
          <Tabs defaultValue="all" className="w-full max-w-2xl" onValueChange={setFilter}>
            <TabsList className="bg-transparent p-0 gap-2 h-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 h-auto text-sm">All Claims</TabsTrigger>
              <TabsTrigger value="pending" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 h-auto text-sm">Pending</TabsTrigger>
              <TabsTrigger value="in-progress" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 h-auto text-sm">In Progress</TabsTrigger>
              <TabsTrigger value="complete" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-full px-4 py-2 h-auto text-sm">Complete</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button variant="outline" size="sm" className="hidden md:flex gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        {/* Claims Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CLAIMS.map((claim) => (
            <ClaimCard key={claim.id} {...claim} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
