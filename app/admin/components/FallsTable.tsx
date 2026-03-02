"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Search, AlertTriangle, Activity } from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface FallRecord {
  id: string;
  patientId?: string;
  deviceId?: string;
  fallDatetime: string;
  confidenceScore?: number;
  confidenceLevel?: string;
  severity?: string;
  location?: string;
  sosTriggered: boolean;
  wasInjured?: boolean;
  notes?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  patient?: { user?: { firstName?: string; lastName?: string } };
}

interface FallsTableProps {
  falls: FallRecord[];
  total: number;
  onRefresh: () => Promise<void>;
}

export function FallsTable({ falls, total, onRefresh }: FallsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unresolved" | "resolved">(
    "all",
  );

  const filteredFalls = falls.filter((f) => {
    // Status filter
    if (filter === "unresolved" && f.resolved) return false;
    if (filter === "resolved" && !f.resolved) return false;

    // Search filter
    if (searchQuery) {
      const patientName =
        `${f.patient?.user?.firstName || ""} ${f.patient?.user?.lastName || ""}`.toLowerCase();
      const search = searchQuery.toLowerCase();
      return (
        patientName.includes(search) ||
        (f.severity || "").toLowerCase().includes(search) ||
        (f.location || "").toLowerCase().includes(search)
      );
    }
    return true;
  });

  const handleResolveFall = async (fall: FallRecord) => {
    try {
      const res = await fetch(`/api/admin/falls/${fall.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resolved: !fall.resolved }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        fall.resolved
          ? "Fall marked as unresolved"
          : "Fall resolved successfully",
      );
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update fall";
      toast.error(message);
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return (
          <Badge variant="destructive" className="bg-orange-500">
            High
          </Badge>
        );
      case "medium":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Medium
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="text-green-700">
            Low
          </Badge>
        );
      default:
        return <Badge variant="outline">{severity || "Unknown"}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Falls ({total})</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unresolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unresolved")}
            >
              Unresolved
            </Button>
            <Button
              variant={filter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("resolved")}
            >
              Resolved
            </Button>
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, severity, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredFalls.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No falls found"
            description={
              searchQuery || filter !== "all"
                ? "Try adjusting your filters"
                : "No fall events recorded yet"
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>SOS</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFalls.map((fall) => (
                  <TableRow key={fall.id}>
                    <TableCell className="font-medium">
                      {fall.patient?.user
                        ? `${fall.patient.user.firstName || ""} ${fall.patient.user.lastName || ""}`
                        : "Unknown"}
                    </TableCell>
                    <TableCell>
                      {format(
                        new Date(fall.fallDatetime),
                        "MMM d, yyyy h:mm a",
                      )}
                    </TableCell>
                    <TableCell>{getSeverityBadge(fall.severity)}</TableCell>
                    <TableCell>
                      {fall.confidenceScore != null
                        ? `${fall.confidenceScore}%`
                        : fall.confidenceLevel || "-"}
                    </TableCell>
                    <TableCell>{fall.location || "-"}</TableCell>
                    <TableCell>
                      {fall.sosTriggered ? (
                        <Badge variant="destructive">SOS</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {fall.resolved ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Unresolved</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResolveFall(fall)}
                        className="flex items-center gap-1"
                      >
                        {fall.resolved ? (
                          <>
                            <AlertTriangle className="h-3 w-3" />
                            Unresolve
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            Resolve
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
