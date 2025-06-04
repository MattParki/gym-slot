import { Client } from "@/models/Client";
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
import { Checkbox } from "@/components/ui/checkbox";
import { FileEdit, Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getStatusColor } from "@/lib/utils";

interface ClientTableViewProps {
  clients: Client[];
  selectedClientIds: Record<string, boolean>;
  toggleClientSelection: (id: string) => void;
  handleClientClick: (clientId: string) => void;
  handleCreateProposal: (clientId: string) => void;
  setSelectedClientStatus: (data: { id: string; status: string } | null) => void;
  setSelectedClientNotes: (data: { id: string; notes: string } | null) => void;
  onDeleteClient: (clientId: string) => void;
  isValidDate: (dateString: string) => boolean;
  CLIENT_STATUS_DESCRIPTIONS: Record<string, string>;
}

export function ClientTableView({
  clients,
  selectedClientIds,
  toggleClientSelection,
  handleClientClick,
  handleCreateProposal,
  setSelectedClientStatus,
  setSelectedClientNotes,
  onDeleteClient,
  isValidDate,
  CLIENT_STATUS_DESCRIPTIONS,
}: ClientTableViewProps) {
  const maxClients = 200;
  const isAtLimit = clients.length >= maxClients;
  const limitedClients = clients.slice(0, maxClients);

  return (
    <div className="rounded-md border overflow-x-auto">
      {isAtLimit && (
        <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md px-4 py-3 mb-4 text-center font-medium">
          You have reached the maximum of {maxClients} clients. Please delete some clients to see more.
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden md:table-cell">Website</TableHead>
            <TableHead className="hidden md:table-cell">Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Last Contact</TableHead>
            <TableHead className="hidden md:table-cell">Notes</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {limitedClients.map((client) => (
            <TableRow
              key={client.id}
            >
              <TableCell
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Checkbox
                  className="h-5 w-5"
                  checked={!!selectedClientIds[client.id]}
                  onCheckedChange={() => toggleClientSelection(client.id)}
                />
              </TableCell>
              <TableCell
                className="font-medium  cursor-pointer hover:bg-gray-50"
                onClick={() => handleClientClick(client.id)}
              >
                <div>
                  {client.name}
                  <div className="block md:hidden text-sm text-gray-500">
                    {client.company && <div>{client.company}</div>}
                    {client.email && <div className="truncate">{client.email}</div>}
                  </div>
                </div>
              </TableCell>
              <TableCell
                className="hidden md:table-cell cursor-pointer hover:bg-gray-50"
                onClick={() => handleClientClick(client.id)}
              >
                {client.company}
              </TableCell>
              <TableCell className="hidden md:table-cell">{client.email}</TableCell>
              <TableCell className="hidden md:table-cell">
                {client.website
                  ? client.website.replace(/^https?:\/\//, "").replace(/\/$/, "")
                  : "N/A"
                }
              </TableCell>
              <TableCell className="hidden md:table-cell">{client.phone}</TableCell>
              <TableCell
                className="hidden md:table-cell max-w-[200px]"
              >
                <div className="relative inline-flex">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          className={getStatusColor(client.status) + " cursor-pointer hover:bg-gray-50"}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientStatus({ id: client.id, status: client.status });
                          }}
                        >
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{CLIENT_STATUS_DESCRIPTIONS[client.status as keyof typeof CLIENT_STATUS_DESCRIPTIONS]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {client.lastContactDate === "not_contacted"
                  ? "Not Contacted Yet"
                  : isValidDate(client.lastContactDate)
                  ? new Date(client.lastContactDate).toLocaleDateString()
                  : "Not Contacted Yet"}
              </TableCell>
              <TableCell 
                className="hidden md:table-cell max-w-[200px]"
              >
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
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
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
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}