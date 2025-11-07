import React, { useEffect, useState } from "react";
import axios from "axios";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Paperclip } from "lucide-react";
import { toast } from "sonner";

interface MediaSource {
  _id: string;
  name: string;
  type: string;
  domain?: string;
  handle?: string;
  reach: number;
  country: string;
  logo_url?: string;
}

export default function MediaSources() {
  const [sources, setSources] = useState<MediaSource[]>([]);
  const [filteredSources, setFilteredSources] = useState<MediaSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  // Add/Edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<MediaSource | null>(null);
  const [newSource, setNewSource] = useState({
    name: "",
    type: "online",
    domain: "",
    handle: "",
    reach: 0,
    country: "",
  });

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/media-sources`
      );
      setSources(response.data || []);
      setFilteredSources(response.data || []);
    } catch (error) {
      console.error("Error fetching media sources:", error);
      toast.error("Failed to load media sources");
    } finally {
      setLoading(false);
    }
  };

  const uniqueCountries = Array.from(
    new Set(sources.map((a) => a.country).filter(Boolean))
  );

  // Apply filters
  useEffect(() => {
    let filtered = [...sources];

    if (searchQuery) {
      filtered = filtered.filter(
        (source) =>
          source.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          source.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          source.handle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((source) => source.type === typeFilter);
    }

    if (countryFilter !== "all") {
      filtered = filtered.filter(
        (source) => source.country === countryFilter
      );
    }

    setFilteredSources(filtered);
  }, [sources, searchQuery, typeFilter, countryFilter]);

  const handleAddSource = async () => {
    try {
      await axios.post(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/media-sources`,
        newSource
      );
      toast.success("Media source added successfully");
      setIsDialogOpen(false);
      fetchSources();
      resetForm();
    } catch (error) {
      console.error("Error adding source:", error);
      toast.error("Failed to add media source");
    }
  };

  const handleUpdateSource = async () => {
    if (!editingSource) return;
    try {
      await axios.put(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/media-sources/${editingSource._id}`,
        newSource
      );
      toast.success("Media source updated successfully");
      setIsDialogOpen(false);
      fetchSources();
      resetForm();
    } catch (error) {
      console.error("Error updating source:", error);
      toast.error("Failed to update media source");
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this media source?"))
      return;
    try {
      await axios.delete(
        `https://sociallightbw-backend-34f7586fa57c.herokuapp.com/media-sources/${id}`
      );
      toast.success("Media source deleted successfully");
      fetchSources();
    } catch (error) {
      console.error("Error deleting source:", error);
      toast.error("Failed to delete media source");
    }
  };

  const openEditDialog = (source: MediaSource) => {
    setEditingSource(source);
    setNewSource({
      name: source.name,
      type: source.type,
      domain: source.domain || "",
      handle: source.handle || "",
      reach: source.reach,
      country: source.country,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingSource(null);
    setNewSource({
      name: "",
      type: "online",
      domain: "",
      handle: "",
      reach: 0,
      country: "",
    });
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      online: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      print: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      broadcast: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      social: "bg-green-500/10 text-green-500 border-green-500/20",
    };
    return (
      <Badge variant="outline" className={colors[type] || ""}>
        {type}
      </Badge>
    );
  };

  const uniqueTypes = Array.from(
    new Set(sources.map((s) => s.type).filter(Boolean))
  );

  return (
    <SidebarLayout>
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              Media Sources
            </h1>
            <p className="text-muted-foreground">
              Manage your media sources and contacts
            </p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingSource ? "Edit Media Source" : "Add New Media Source"}
                </DialogTitle>
                <DialogDescription>
                  {editingSource
                    ? "Update the media source details"
                    : "Add a new media source to your database"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newSource.name}
                    onChange={(e) =>
                      setNewSource({ ...newSource, name: e.target.value })
                    }
                    placeholder="Media source name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={newSource.type}
                      onValueChange={(value) =>
                        setNewSource({ ...newSource, type: value })
                      }
                    >
                      <SelectTrigger id="type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="print">Print</SelectItem>
                        <SelectItem value="broadcast">Broadcast</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={newSource.country}
                      onChange={(e) =>
                        setNewSource({
                          ...newSource,
                          country: e.target.value,
                        })
                      }
                      placeholder="Country"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="domain">URL</Label>
                    <Input
                      id="domain"
                      value={newSource.domain}
                      onChange={(e) =>
                        setNewSource({ ...newSource, domain: e.target.value })
                      }
                      placeholder="example.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="handle">Handle (Optional)</Label>
                    <Input
                      id="handle"
                      value={newSource.handle}
                      onChange={(e) =>
                        setNewSource({ ...newSource, handle: e.target.value })
                      }
                      placeholder="@handle"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="reach">Reach</Label>
                  <Input
                    id="reach"
                    type="number"
                    value={newSource.reach}
                    onChange={(e) =>
                      setNewSource({
                        ...newSource,
                        reach: Number(e.target.value),
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={editingSource ? handleUpdateSource : handleAddSource}
                >
                  {editingSource ? "Update" : "Add"} Source
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media sources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Media Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {uniqueCountries.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sources Table */}
        <Card>
          <CardHeader>
            <CardTitle>Media Sources ({filteredSources.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading sources...
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No media sources found
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Reach</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSources.slice(0, visibleCount).map((source) => (
                      <TableRow key={source._id}>
                        <TableCell className="max-w-md">
                          <div className="flex items-center gap-3">
                            {source.logo_url && (
                              <img
                                src={source.logo_url}
                                alt={source.name}
                                className="w-10 h-10 rounded-full border-2 border-border object-cover flex-shrink-0"
                              />
                            )}
                            <span className="font-medium">{source.name}</span>
                          </div>
                        </TableCell>
                        {/* <TableCell className="font-medium">
                          {source.name}
                        </TableCell> */}
                        <TableCell>{getTypeBadge(source.type)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <a
                            href={source.domain}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline text-primary block line-clamp-1"
                          >
                            {source.domain}
                          </a>
                        </TableCell>
                        <TableCell>{source.country}</TableCell>
                        <TableCell className="text-right">
                          {source.reach?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => openEditDialog(source)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteSource(source._id)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredSources.length > visibleCount && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount(visibleCount + 20)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
