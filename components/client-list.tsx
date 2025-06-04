"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Search, UserPlus, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/ui/pagination";
import { useClientPagination } from "@/hooks/usePagination";
import AILeadgen from "./AiLeadgen";
import { deleteClient, deleteMultipleClients } from "@/services/clientService";
import toast from "react-hot-toast";
import { ClientGridView } from "./ClientGridView";
import { ClientTableView } from "./ClientTableView";

export default function ClientList() {
  const { user } = useAuth();
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState("all");
  const [view, setView] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? "table" : "grid";
    }
    return "grid"; // Default to grid for server-side rendering
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isMassDelete, setIsMassDelete] = useState(false);
  const [selectedClientNotes, setSelectedClientNotes] = useState<{ id: string; notes: string } | null>(null);
  const [selectedClientStatus, setSelectedClientStatus] = useState<{ id: string; status: string } | null>(null);

  // Keep track of selected client IDs for mass deletion
  const [selectedClientIds, setSelectedClientIds] = useState<Record<string, boolean>>({});

  const toggleClientSelection = (id: string) => {
    setSelectedClientIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Mass delete selected clients
  function handleDeleteSelected() {
    const selectedIds = Object.keys(selectedClientIds).filter((id) => selectedClientIds[id]);
    if (selectedIds.length === 0 || !user) return;

    setIsMassDelete(true);
    setShowDeleteModal(true);
  }

  // Use our custom pagination hook
  const {
    clients,
    loading,
    hasMore,
    loadMore,
    setSearchQuery,
    searchQuery,
    resetPagination,
  } = useClientPagination(
    user?.uid || "",
    view === "grid" ? 9 : 10,
    filterStatus !== "all" ? filterStatus : null
  );

  // Reset pagination when filter status changes
  useEffect(() => {
    resetPagination();
  }, [filterStatus]);

  const handleAddClient = () => {
    router.push("/clients/new");
  };

  const handleClientClick = (clientId: string) => {
    router.push(`/clients/${clientId}`);
  };

  const handleCreateProposal = (clientId: string) => {
    router.push(`/create-proposal?clientId=${clientId}`);
  };

  const handleLeadsAdded = () => {
    setRefreshKey((prev) => prev + 1); // Force a re-fetch
    resetPagination(); // Ensures the pagination hook re-queries
  };

  async function confirmDelete() {
    if (!user) return;
    try {
      if (isMassDelete) {
        const selectedIds = Object.keys(selectedClientIds).filter((id) => selectedClientIds[id]);
        await deleteMultipleClients(user.uid, selectedIds);
        toast.success(`${selectedIds.length} client${selectedIds.length > 1 ? "s" : ""} deleted`);
      } else if (deleteTarget) {
        await deleteClient(user.uid, deleteTarget);
        toast.success("Client deleted");
      }
      resetPagination();
      setSelectedClientIds({});
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error("Failed to delete client(s)");
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  }

  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const CLIENT_STATUS_DESCRIPTIONS = {
    lead: "A business who we haven't reached out to before (cold)",
    prospect: "A business we have reached out to and may have shown some interest",
    client: "An existing client who has purchased from us before",
  };

  // Handle window resize depending on whether on mobile or desktop
  useEffect(() => {
    const handleResize = () => {
      setView(window.innerWidth >= 768 ? "table" : "grid");
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDeleteClient = (clientId: string) => {
    if (!user) return;
    setDeleteTarget(clientId);
    setIsMassDelete(false);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      <AILeadgen onLeadsAdded={handleLeadsAdded} />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Clients & Prospects</h2>
          <Badge variant="outline" className="ml-2">
            {clients.length}
          </Badge>
          <Button
            variant="outline"
            className="text-red-500"
            disabled={Object.values(selectedClientIds).every((sel) => !sel)}
            onClick={handleDeleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
        <Button onClick={handleAddClient} className="shrink-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {loading && searchQuery.trim() !== "" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="prospect">Prospects</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
            </SelectContent>
          </Select>

          <div className="border rounded-md p-1">
            <Tabs value={view} onValueChange={setView} className="w-[120px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {loading && clients.length === 0 ? (
        <div className="flex justify-center p-6">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p>Loading clients...</p>
          </div>
        </div>
      ) : (
        <>
          {view === "grid" ? (
            <ClientGridView
              clients={clients}
              selectedClientIds={selectedClientIds}
              toggleClientSelection={toggleClientSelection}
              handleClientClick={handleClientClick}
              handleCreateProposal={handleCreateProposal}
              setSelectedClientNotes={setSelectedClientNotes}
              onDeleteClient={handleDeleteClient}
              isValidDate={isValidDate}
              CLIENT_STATUS_DESCRIPTIONS={CLIENT_STATUS_DESCRIPTIONS}
            />
          ) : (
            <ClientTableView
              clients={clients}
              selectedClientIds={selectedClientIds}
              toggleClientSelection={toggleClientSelection}
              handleClientClick={handleClientClick}
              handleCreateProposal={handleCreateProposal}
              setSelectedClientStatus={setSelectedClientStatus}
              setSelectedClientNotes={setSelectedClientNotes}
              onDeleteClient={handleDeleteClient}
              isValidDate={isValidDate}
              CLIENT_STATUS_DESCRIPTIONS={CLIENT_STATUS_DESCRIPTIONS}
            />
          )}

          {hasMore && clients.length > 0 && searchQuery.trim() === "" && (
            <div className="mt-6">
              <Pagination
                currentPage={1}
                totalPages={null}
                onPageChange={() => {}}
                onLoadMore={loadMore}
                hasMore={hasMore}
                loading={loading}
                mode="infinite"
                className="mt-4"
              />
            </div>
          )}

          {clients.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">No clients found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery.trim() !== ""
                  ? `No clients match "${searchQuery}"`
                  : "Add your first to get started"}
              </p>
              <Button onClick={handleAddClient}>Add New Client</Button>
            </div>
          )}
        </>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-6">
            <h2 className="text-xl font-semibold">Confirm Deletion</h2>
            <p className="text-gray-700">
              Are you sure you want to delete {isMassDelete ? "the selected clients" : "this client"}?
            </p>
            <div className="flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700 text-white">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Dialog */}
      <Dialog open={selectedClientStatus !== null} onOpenChange={(open) => !open && setSelectedClientStatus(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Status</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <h3 className="font-semibold capitalize mb-2">{selectedClientStatus?.status}</h3>
              <p className="text-gray-700">
                {CLIENT_STATUS_DESCRIPTIONS[selectedClientStatus?.status as keyof typeof CLIENT_STATUS_DESCRIPTIONS]}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedClientStatus(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={selectedClientNotes !== null} onOpenChange={(open) => !open && setSelectedClientNotes(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Client Notes</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700 whitespace-pre-wrap">
              {selectedClientNotes?.notes || "No notes available"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSelectedClientNotes(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}