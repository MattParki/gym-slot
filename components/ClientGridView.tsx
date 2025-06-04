import { Client } from "@/models/Client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileEdit, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusColor } from "@/lib/utils";

interface ClientGridViewProps {
  clients: Client[];
  selectedClientIds: Record<string, boolean>;
  toggleClientSelection: (id: string) => void;
  handleClientClick: (clientId: string) => void;
  handleCreateProposal: (clientId: string) => void;
  setSelectedClientNotes: (data: { id: string; notes: string } | null) => void;
  onDeleteClient: (clientId: string) => void;
  isValidDate: (dateString: string) => boolean;
  CLIENT_STATUS_DESCRIPTIONS: Record<string, string>;
}

export function ClientGridView({
  clients,
  selectedClientIds,
  toggleClientSelection,
  handleClientClick,
  handleCreateProposal,
  setSelectedClientNotes,
  onDeleteClient,
  isValidDate,
  CLIENT_STATUS_DESCRIPTIONS,
}: ClientGridViewProps) {
  const maxClients = 200;
  const isAtLimit = clients.length >= maxClients;
  const limitedClients = clients.slice(0, maxClients);

  return (
    <div>
      {isAtLimit && (
        <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md px-4 py-3 mb-4 text-center font-medium">
          You have reached the maximum of {maxClients} clients. Please delete some clients to add more.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {limitedClients.map((client) => (
          <Card
            key={client.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleClientClick(client.id)}
          >
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{client.name}</CardTitle>
                  <CardDescription>{client.company}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    className="h-5 w-5"
                    checked={!!selectedClientIds[client.id]}
                    onCheckedChange={() => toggleClientSelection(client.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="relative inline-flex">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{CLIENT_STATUS_DESCRIPTIONS[client.status as keyof typeof CLIENT_STATUS_DESCRIPTIONS]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="truncate">{client.email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Website</p>
                  <p
                    className="truncate"
                    title={
                      client.website
                        ? client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
                        : "N/A"
                    }
                  >
                    {client.website
                      ? client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p>{client.phone}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-500">Last Contact</p>
                  <p>
                    {client.lastContactDate === "not_contacted"
                      ? "Not Contacted Yet"
                      : isValidDate(client.lastContactDate)
                        ? new Date(client.lastContactDate).toLocaleDateString()
                        : "Not Contacted Yet"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 px-6 py-3 flex justify-between items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p
                      className="truncate cursor-pointer hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClientNotes({ id: client.id, notes: client.notes });
                      }}
                    >
                      {client.notes || "No notes"}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs whitespace-normal">{client.notes || "No notes"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateProposal(client.id);
                      }}
                      className="hover:text-primary"
                    >
                      <FileEdit className="w-4 h-4" />
                      <span className="sr-only">Create Proposal</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Create a new proposal</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClient(client.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete Client</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete client</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}