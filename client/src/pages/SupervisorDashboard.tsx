import Layout from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Users, Zap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DashboardMetrics {
  totalClaims: number;
  activeSessions: number;
  avgInspectionTime: number;
  totalEstimateValue: number;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  activeClaims: number;
}

interface ActiveSession {
  id: number;
  claimNumber: string;
  claimId: number;
  adjusterName: string;
  currentPhase: number;
  status: string;
  startedAt: string;
}

export default function SupervisorDashboard() {
  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/admin/dashboard"],
  });

  const { data: teamMembers = [] } = useQuery<TeamMember[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: activeSessions = [] } = useQuery<ActiveSession[]>({
    queryKey: ["/api/admin/active-sessions"],
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-display font-bold text-foreground">Team Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage claims and monitor team performance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Claims</p>
            <p className="text-3xl font-bold mt-2">{metrics?.totalClaims || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Active Inspections</p>
            <p className="text-3xl font-bold mt-2 text-green-600">{metrics?.activeSessions || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Avg Inspection Time</p>
            <p className="text-3xl font-bold mt-2">{Math.round(metrics?.avgInspectionTime || 0)} min</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <p className="text-sm font-medium text-gray-600">Total Estimates</p>
            <p className="text-3xl font-bold mt-2">${(metrics?.totalEstimateValue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Members
          </h2>
          {teamMembers.length === 0 ? (
            <p className="text-muted-foreground">No team members assigned yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active Claims</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.fullName}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.role}</Badge>
                    </TableCell>
                    <TableCell className="font-bold">{member.activeClaims}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" /> Active Inspections
          </h2>
          {activeSessions.length === 0 ? (
            <p className="text-muted-foreground">No active inspections right now</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Adjuster</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-mono font-bold">{session.claimNumber}</TableCell>
                    <TableCell>{session.adjusterName}</TableCell>
                    <TableCell className="text-center">{session.currentPhase}</TableCell>
                    <TableCell>
                      <Badge variant="default">{session.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </Layout>
  );
}
