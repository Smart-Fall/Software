"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format, isValid } from "date-fns";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  UserPlus,
  Pencil,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Search,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/dashboard/EmptyState";

interface UserRecord {
  id: string;
  email: string;
  accountType: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersTableProps {
  users: UserRecord[];
  total: number;
  onRefresh: () => Promise<void>;
}

export function UsersTable({ users, total, onRefresh }: UsersTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    accountType: "user",
    dob: "",
    medicalConditions: "",
    facilityName: "",
    specialization: "",
    yearsOfExperience: "",
  });
  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dob: "",
  });

  const filteredUsers = users.filter(
    (u) =>
      (u.firstName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (u.lastName?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.accountType.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreateUser = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User created successfully");
      setCreateDialogOpen(false);
      setFormData({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        accountType: "user",
        dob: "",
        medicalConditions: "",
        facilityName: "",
        specialization: "",
        yearsOfExperience: "",
      });
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create user";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (user: UserRecord) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        `User ${user.isActive ? "deactivated" : "reactivated"} successfully`,
      );
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(editFormData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User updated successfully");
      setEditDialogOpen(false);
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update user";
      toast.error(message);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("User deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      await onRefresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete user";
      toast.error(message);
    }
  };

  const openEditDialog = (user: UserRecord) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      dob: user.dob ? new Date(user.dob).toISOString().split("T")[0] : "",
    });
    setEditDialogOpen(true);
  };

  const getAccountTypeBadge = (type: string) => {
    switch (type) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "caregiver":
        return <Badge variant="secondary">Caregiver</Badge>;
      case "user":
        return <Badge variant="outline">Patient</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Users ({total})</CardTitle>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={
              searchQuery
                ? "Try adjusting your search query"
                : "No users in the system yet"
            }
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName || ""} {user.lastName || ""}
                      {!user.firstName && !user.lastName && (
                        <span className="text-muted-foreground italic">
                          No name
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {getAccountTypeBadge(user.accountType)}
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge
                          variant="default"
                          className="bg-green-100 text-green-800 hover:bg-green-100"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isValid(new Date(user.createdAt)) ? format(new Date(user.createdAt), "MMM d, yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(user)}
                          title={
                            user.isActive
                              ? "Deactivate user"
                              : "Reactivate user"
                          }
                        >
                          {user.isActive ? (
                            <ShieldOff className="h-4 w-4 text-orange-500" />
                          ) : (
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        {user.accountType !== "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Account Type *</Label>
              <Select
                value={formData.accountType}
                onValueChange={(val) =>
                  setFormData({ ...formData, accountType: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Patient</SelectItem>
                  <SelectItem value="caregiver">Caregiver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>

            {formData.accountType === "user" && (
              <div className="space-y-2">
                <Label>Medical Conditions</Label>
                <Input
                  value={formData.medicalConditions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      medicalConditions: e.target.value,
                    })
                  }
                  placeholder="e.g., Diabetes, Hypertension"
                />
              </div>
            )}

            {formData.accountType === "caregiver" && (
              <>
                <div className="space-y-2">
                  <Label>Facility Name</Label>
                  <Input
                    value={formData.facilityName}
                    onChange={(e) =>
                      setFormData({ ...formData, facilityName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Years of Experience</Label>
                  <Input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        yearsOfExperience: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateUser} disabled={creating}>
              {creating ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input
                  value={editFormData.firstName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={editFormData.lastName}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={editFormData.dob}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, dob: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <div>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <strong>
                {selectedUser?.firstName} {selectedUser?.lastName}
              </strong>{" "}
              ({selectedUser?.email})? This action cannot be undone and will
              remove all associated data.
            </AlertDialogDescription>
          </div>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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
