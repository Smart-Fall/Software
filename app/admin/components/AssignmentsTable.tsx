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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Search,
  ToggleLeft,
  ToggleRight,
  Link2,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface AssignmentRecord {
  id: string;
  caregiverId: string;
  patientId: string;
  assignedDate: string;
  isActive: boolean;
  caregiverName: string;
  patientName: string;
  facilityName?: string;
}

interface AssignmentsTableProps {
  assignments: AssignmentRecord[];
  onRefresh: () => Promise<void>;
}

export function AssignmentsTable({
  assignments,
  onRefresh,
}: AssignmentsTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<AssignmentRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    caregiverId: "",
    patientId: "",
  });

  const filteredAssignments = assignments.filter((a) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      a.caregiverName.toLowerCase().includes(search) ||
      a.patientName.toLowerCase().includes(search) ||
      (a.facilityName || "").toLowerCase().includes(search)
    );
  });

  const handleCreateAssignment = async () => {
    if (!formData.caregiverId || !formData.patientId) {
      toast.error("Both Caregiver ID and Patient ID are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Assignment created successfully");
      setCreateDialogOpen(false);
      setFormData({ caregiverId: "", patientId: "" });
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create assignment";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (assignment: AssignmentRecord) => {
    try {
      const res = await fetch(`/api/admin/assignments/${assignment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          isActive: !assignment.isActive,
          caregiverId: assignment.caregiverId,
          patientId: assignment.patientId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `Assignment ${assignment.isActive ? "deactivated" : "activated"} successfully`,
      );
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update assignment";
      toast.error(message);
    }
  };

  const handleDeleteAssignment = async () => {
    if (!selectedAssignment) return;
    try {
      const res = await fetch(
        `/api/admin/assignments/${selectedAssignment.id}?caregiverId=${encodeURIComponent(selectedAssignment.caregiverId)}&patientId=${encodeURIComponent(selectedAssignment.patientId)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Assignment deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedAssignment(null);
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete assignment";
      toast.error(message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Caregiver-Patient Assignments ({assignments.length})
          </CardTitle>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Assignment
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by caregiver, patient, or facility..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredAssignments.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No assignments found"
            description={
              searchQuery
                ? "Try adjusting your search query"
                : "No caregiver-patient assignments yet"
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caregiver</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Facility</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">
                      {assignment.caregiverName}
                    </TableCell>
                    <TableCell>{assignment.patientName}</TableCell>
                    <TableCell>
                      {assignment.facilityName || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(assignment.assignedDate), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {assignment.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(assignment)}
                          title={
                            assignment.isActive
                              ? "Deactivate assignment"
                              : "Activate assignment"
                          }
                        >
                          {assignment.isActive ? (
                            <ToggleRight className="h-4 w-4 text-green-500" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete assignment"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create Assignment Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Caregiver ID *</Label>
              <Input
                placeholder="Enter caregiver ID"
                value={formData.caregiverId}
                onChange={(e) =>
                  setFormData({ ...formData, caregiverId: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Patient ID *</Label>
              <Input
                placeholder="Enter patient ID"
                value={formData.patientId}
                onChange={(e) =>
                  setFormData({ ...formData, patientId: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAssignment} disabled={creating}>
              {creating ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <div>
            <AlertDialogTitle>Delete Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the assignment between{" "}
              <strong>{selectedAssignment?.caregiverName}</strong> and{" "}
              <strong>{selectedAssignment?.patientName}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
