"use client"

import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import {
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Plus,
  ChevronRight,
  Link,
  RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getClient, deleteClient } from "@/services/clientService"
import { Client } from "@/models/Client"
import { getStatusColor } from '@/lib/utils';

interface Proposal {
  id: string;
  clientName?: string;
  clientCompany?: string;
  status?: string;
  createdAt: any;
  address?: string;
  email?: string;
  website?: string;
  notes?: string;
  phone?: string;
  userId?: string;
  clientId?: string;
}

export default function ClientDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoadingProposals, setIsLoadingProposals] = useState(true)

  useEffect(() => {
    const loadClient = async () => {
      if (!user) {
        router.push("/login")
        return
      }

      if (params && typeof params.id === 'string') {
        try {
          const clientData = await getClient(user.uid, params.id)

          if (!clientData) {
            setError("Client not found")
            return
          }

          setClient(clientData)
        } catch (error) {
          console.error("Error loading client:", error)
          setError("Failed to load client")
        } finally {
          setIsLoading(false)
        }
      } else {
        setError("Invalid client ID")
        setIsLoading(false)
      }
    }

    loadClient()
  }, [params, router, user])

  useEffect(() => {
    const loadProposals = async () => {
      if (!client || !user) return;

      try {
        setIsLoadingProposals(true);

        const proposalsRef = collection(db, 'proposals');
        const q = query(
          proposalsRef,
          where("userId", "==", user.uid),
          where("clientId", "==", client.id),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);

        const clientProposals: Proposal[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          clientProposals.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt
              ? (typeof data.createdAt.toDate === 'function'
                ? data.createdAt.toDate().toISOString()
                : new Date(data.createdAt).toISOString())
              : new Date().toISOString()
          });
        });

        setProposals(clientProposals);
      } catch (error) {
        console.error("Error loading proposals:", error);
      } finally {
        setIsLoadingProposals(false);
      }
    };

    loadProposals();
  }, [client, user]);

  const handleEdit = () => {
    if (params && typeof params.id === 'string') {
      router.push(`/clients/${params.id}/edit`)
    }
  }

  const handleCreateProposal = () => {
    if (!client) return;

    const queryParams = new URLSearchParams({
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email || "",
      clientWebsite: client.website || "",
      clientAddress: client.address || "",
      clientStatus: client.status || "",
      clientCompany: client.company || "",
      clientNotes: client.notes || "",
    }).toString();

    router.push(`/create-proposal?${queryParams}`)
  }

  const handleDeleteConfirm = async () => {
    if (!client || !user) return

    setIsDeleting(true)
    try {
      await deleteClient(user.uid, client.id)
      router.push("/clients")
    } catch (error) {
      console.error("Error deleting client:", error)
      setError("Failed to delete client")
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800"
      case "accepted":
        return "bg-emerald-100 text-emerald-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isValidDate = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  if (isLoading) {
    return <div className="flex justify-center p-6">Loading client details...</div>
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">{error}</h2>
            <Button onClick={() => router.push("/clients")} className="mt-4">
              Back to Client List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center py-10">
            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Client not found</h2>
            <Button onClick={() => router.push("/clients")} className="mt-4">
              Back to Client List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/clients")}
            className="mr-4"
          >
            Back
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold mr-3">{client.name}</h1>
          <Badge className={getStatusColor(client.status)}>
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </Badge>
        </div>
        <div className="flex space-x-2 self-end">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
            <span className="ml-2 sm:inline">Edit</span>
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4" />
                <span className="ml-2 sm:inline">Delete</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure you want to delete this client?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All data associated with this client
                  will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {client.email && (
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{client.email}</p>
                  </div>
                </div>
              )}
              {client.website && (
                <div className="flex items-start">
                  <Link className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p>{client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}</p>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{client.phone}</p>
                  </div>
                </div>
              )}
              {client.company && (
                <div className="flex items-start">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p>{client.company}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {client.address && (
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p>{client.address}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Last Contact</p>
                  <p>
                    {client.lastContactDate === "not_contacted"
                      ? "Not Contacted Yet"
                      : (isValidDate(client.lastContactDate)
                        ? new Date(client.lastContactDate).toLocaleDateString()
                        : "Not Contacted Yet")}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-500 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Client Since</p>
                  <p>{new Date(client.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateProposal}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Proposal
            </Button>
            <Button variant="outline" className="w-full" size="lg">
              <Calendar className="h-4 w-4 mr-2" />
              Add Interaction
            </Button>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{client.notes}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="proposals" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="proposals">Proposals</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>
        <TabsContent value="proposals">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Proposals</CardTitle>
              <Button size="sm" onClick={handleCreateProposal}>
                <Plus className="h-4 w-4 mr-2" />
                New Proposal
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingProposals ? (
                <div className="py-4 text-center">
                  <p>Loading proposals...</p>
                </div>
              ) : proposals.length > 0 ? (
                <div className="divide-y">
                  {proposals.map(proposal => (
                    <div
                      key={proposal.id}
                      className="py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-6 px-6"
                      onClick={() => router.push(`/proposals/${proposal.id}`)}
                    >
                      <div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <h3 className="font-medium">
                            {proposal.clientName}'s Proposal
                            {proposal.clientCompany && <span className="text-gray-500 ml-1">({proposal.clientCompany})</span>}
                          </h3>
                          {proposal.status && (
                            <Badge className={`ml-3 ${getProposalStatusColor(proposal.status || "draft")}`}>
                              {(proposal.status || "Draft").charAt(0).toUpperCase() + (proposal.status || "draft").slice(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Created on {new Date(proposal.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">No proposals yet</p>
                  <Button
                    onClick={handleCreateProposal}
                    variant="outline"
                    className="mt-4"
                  >
                    Create First Proposal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="interactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Interactions History</CardTitle>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Interaction
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <p className="text-gray-500">No interactions recorded</p>
                <Button
                  variant="outline"
                  className="mt-4"
                >
                  Add First Interaction
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}