import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users as UsersIcon, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "super_admin" | "org_admin";
  organizationId?: string;
  organizationName?: string;
}

interface Organization {
  _id: string;
  organizationName: string;
}

const Users = () => {
  const { orgId } = useParams();
  const [currentUser] = useState(
    JSON.parse(localStorage.getItem("user") || '{}')
  );
  
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("");
  
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (editUser) {
      setFirstName(editUser.firstName || "");
      setLastName(editUser.lastName || "");
      setEmail(editUser.email || "");
      setUserRole(editUser.role || "");
      setSelectedOrg(editUser.organizationId || "");
    } else {
      resetForm();
    }
  }, [editUser]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/users"
      );
      setUsers(response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get(
        "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/organizations"
      );
      setOrganizations(response.data);
    } catch (error) {
      console.error("Error loading organizations:", error);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setUserRole("");
    setSelectedOrg("");
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !email || !userRole) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const payload = {
        email,
        role: userRole,
        firstName,
        lastName,
        organizationId: userRole === "org_admin" ? selectedOrg : undefined,
      };

      if (editUser) {
        await axios.put(
          `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/users/${editUser._id}`,
          payload
        );
        toast.success("User updated successfully");
      } else {
        await axios.post(
          "https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/users/create",
          payload
        );
        toast.success("User created successfully");
      }

      setDialogOpen(false);
      setEditUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error("Failed to save user");
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.userId) return;

    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/api/users/${deleteDialog.userId}`
      );
      toast.success("User deleted successfully");
      setDeleteDialog({ open: false, userId: null });
      fetchUsers();
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const roleDisplayMap: Record<string, string> = {
    super_admin: "Platform Admin",
    org_admin: "Org Admin",
  };

  if (currentUser.role !== "super_admin") {
    return (
      <SidebarLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Access Denied</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                User Management
              </h1>
              <p className="text-muted-foreground">
                Manage platform users and their roles
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditUser(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editUser ? "Edit User" : "Add New User"}
                  </DialogTitle>
                  <DialogDescription>
                    {editUser
                      ? "Modify user details"
                      : "Fill in the details to add a new user"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!editUser}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={userRole}
                      onValueChange={(value) => {
                        setUserRole(value);
                        if (value !== "org_admin") setSelectedOrg("");
                      }}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                        <SelectItem value="org_admin">Org Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {userRole === "org_admin" && (
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Select
                        value={selectedOrg}
                        onValueChange={setSelectedOrg}
                      >
                        <SelectTrigger id="organization">
                          <SelectValue placeholder="Select Organization" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizations.map((org) => (
                            <SelectItem key={org._id} value={org._id}>
                              {org.organizationName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button onClick={handleSave} className="w-full">
                    {editUser ? "Update User" : "Create User"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">
                            {user.firstName} {user.lastName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                user.role === "super_admin"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {roleDisplayMap[user.role] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.organizationName || "-"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditUser(user);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setDeleteDialog({
                                  open: true,
                                  userId: user._id,
                                })
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center text-muted-foreground"
                        >
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        {/* </div> */}
      </div>

      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, userId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarLayout>
  );
};

export default Users;
