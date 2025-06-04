import { useState } from "react";
import { Plus, RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/clientService";
import { toast } from "@/components/ui/use-toast";

// Define the Lead interface to describe the shape of a lead object
interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
  notes?: string;
  validation?: {
    companiesHouseFound: boolean;
    isInternational?: boolean;
    country?: string;
    isActive?: boolean;
    officialName?: string;
    companyNumber?: string;
    companyStatus?: string;
    dateOfCreation?: string;
    addressUpdated?: boolean;
    suggestedName?: string;
    businessType?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
}

interface AILeadgenProps {
  onLeadsAdded?: () => void;
}

export default function AILeadgen({ onLeadsAdded }: AILeadgenProps) {
  const { user } = useAuth();
  const router = useRouter();

  // State for the main dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State for the prompt and data
  const [prompt, setPrompt] = useState("");
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for the preview dialog
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [validationSummary, setValidationSummary] = useState<any>(null);

  const [scrapeContacts, setScrapeContacts] = useState(false);
  const [usePlaywright, setUsePlaywright] = useState(false);

  // Get validation status icon and color
  const getValidationIcon = (lead: Lead) => {
    if (!lead.validation) {
      return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }

    // UK companies with validation
    if (lead.validation.companiesHouseFound && lead.validation.isActive) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }

    if (lead.validation.companiesHouseFound && !lead.validation.isActive) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }

    // International companies
    if (lead.validation.isInternational) {
      return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }

    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  const getValidationBadge = (lead: Lead) => {
    if (!lead.validation) {
      return <Badge variant="secondary">Not Validated</Badge>;
    }

    // UK companies
    if (lead.validation.companiesHouseFound && lead.validation.isActive) {
      return <Badge className="bg-green-100 text-green-800">UK Verified Active</Badge>;
    }

    if (lead.validation.companiesHouseFound && !lead.validation.isActive) {
      return <Badge className="bg-yellow-100 text-yellow-800">UK - {lead.validation.companyStatus}</Badge>;
    }

    // International companies
    if (lead.validation.isInternational) {
      return <Badge className="bg-blue-100 text-blue-800">{lead.validation.country} Company</Badge>;
    }

    // UK companies not found
    if (lead.validation.country === 'UK') {
      return <Badge variant="destructive">UK - Not Found</Badge>;
    }

    return <Badge variant="secondary">Unknown</Badge>;
  };

  // Handle prompt submission
  const handleSubmitPrompt = async () => {
    if (!prompt.trim()) {
      toast?.({
        title: "Error",
        description: "Please enter a search prompt",
        variant: "destructive",
      }) || alert("Please enter a search prompt");
      return;
    }

    setIsLoading(true);

    try {
      // Call our new API endpoint
      const response = await fetch("/api/leadgen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          website: website.trim() || undefined,
          userId: user?.uid,
          scrapeContacts,
          usePlaywright,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate leads");
      }

      if (!data.leads || data.leads.length === 0) {
        toast?.({
          title: "No leads found",
          description: "No results returned. Try refining your search query.",
          variant: "destructive",
        }) || alert("No leads found. Try refining your search query.");
        setIsLoading(false);
        return;
      }

      setGeneratedLeads(data.leads);
      setValidationSummary(data.validation_summary || null);

      // Initialize all leads as selected by default
      const initialSelectedState: Record<string, boolean> = {};
      data.leads.forEach((lead: Lead) => {
        initialSelectedState[lead.id] = true;
      });
      setSelectedLeads(initialSelectedState);

      // Open the preview dialog
      setIsPreviewOpen(true);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error generating leads:", error);
      toast?.({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate leads",
        variant: "destructive",
      }) || alert("Error: " + (error instanceof Error ? error.message : "Failed to generate leads"));
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle lead selection
  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle adding selected leads to the database
  const handleAddSelectedLeads = async () => {
    try {
      setIsSaving(true);
      // Filter only selected leads
      const leadsToAdd = generatedLeads.filter((lead) => selectedLeads[lead.id]);

      if (leadsToAdd.length === 0) {
        toast?.({
          title: "No leads selected",
          description: "Please select at least one lead to add",
          variant: "default",
        }) || alert("Please select at least one lead to add");
        setIsSaving(false);
        return;
      }

      // Add leads to database
      if (user) {
        for (const lead of leadsToAdd) {
          // Use official name if available, otherwise use the provided company name
          const companyName = lead.validation?.officialName || lead.company || "";
          
          const clientData = {
            name: lead.name || "",
            email: lead.email || "",
            phone: lead.phone || "",
            company: companyName,
            address: lead.address || "",
            website: lead.website || "",
            status: "lead",
            lastContactDate: "not_contacted",
            notes: lead.notes ? 
              `${lead.notes}${lead.validation?.companyNumber ? ` (Companies House: ${lead.validation.companyNumber})` : ''}` : 
              lead.validation?.companyNumber ? `Companies House: ${lead.validation.companyNumber}` : "",
            userId: user.uid,
          };

          // Using your existing createClient function from services
          await createClient(clientData);
        }

        // Mark the lead generation task as completed
        try {
          const token = await user.getIdToken();

          await fetch("/api/user-tasks", {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ taskId: "generate-leads", completed: true }),
          });
        } catch (taskError) {
          console.error("Error marking lead generation task as completed:", taskError);
        }
      }

      // Close the preview dialog and reset states
      setIsPreviewOpen(false);
      setGeneratedLeads([]);
      setSelectedLeads({});
      setValidationSummary(null);
      setPrompt("");
      setWebsite("");

      // Show success message
      toast?.({
        title: "Success",
        description: `${leadsToAdd.length} lead(s) added successfully`,
        variant: "default",
      }) || alert(`${leadsToAdd.length} lead(s) added successfully`);

      // Call the callback function to refresh the client list
      if (onLeadsAdded) {
        onLeadsAdded();
      }

      // Force router refresh to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error adding leads:", error);
      toast?.({
        title: "Error",
        description: "Failed to add leads. Please try again.",
        variant: "destructive",
      }) || alert("Failed to add leads. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate how many leads are selected
  const selectedLeadCount = Object.values(selectedLeads).filter(Boolean).length;

  return (
    <>
      {/* Main AI Leadgen Button */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl shadow-xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center justify-center bg-white text-blue-500 rounded-full w-10 h-10 sm:w-12 sm:h-12 shadow-md shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-bold">AI Lead Generation</h2>
            <p className="text-sm sm:text-base text-white/90">
              Discover business leads effortlessly with enhanced company validation.
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="outline"
          className="w-full sm:w-auto bg-white text-blue-500 hover:bg-blue-100 font-semibold px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg shadow-md transition-all"
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Generate Leads
          </div>
        </Button>
      </div>

      {/* Main Dialog for Entering Prompt */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] h-[95vh] sm:h-auto max-h-[95vh] p-4 sm:p-6 overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle>AI Lead Generation</DialogTitle>
            <DialogDescription>
              Describe the businesses you&apos;re looking for, and our AI will find potential leads
              for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                Search Prompt
              </label>
              <Textarea
                id="prompt"
                placeholder="e.g. Find independent florists in Kent, UK. I need 15 genuine business names, descriptions of their services, and contact information."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Contact scraping options */}
            <div className="space-y-3 p-3 sm:p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-900">Contact Information (Coming Soon)</h4>
              
              <div className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  id="scrapeContacts"
                  checked={scrapeContacts}
                  onChange={(e) => setScrapeContacts(e.target.checked)}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={true}
                />
                <div>
                  <label htmlFor="scrapeContacts" className="text-sm text-gray-700 block">
                    Extract potential buyer contact information
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    This will attempt to find contact names, titles, and email addresses (slower but more thorough)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
              <p className="font-medium text-amber-800">Example Prompts:</p>
              <ul className="text-amber-700 mt-2 space-y-2 list-disc list-inside text-sm">
                <li className="leading-tight">"Find web design agencies in Manchester, UK with fewer than 10 employees"</li>
                <li className="leading-tight">"Search for independent coffee shops in Toronto, Canada"</li>
                <li className="leading-tight">"Locate B2B companies in the healthcare sector founded in the last 5 years"</li>
                <li className="leading-tight">"Find SaaS startups in London founded in the last 3 years"</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
            <Button
              variant="outline"
              className="w-full sm:w-auto order-1 sm:order-none"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitPrompt}
              disabled={!prompt.trim() || isLoading}
              className="w-full sm:w-auto min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                "Generate & Validate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog for Generated Leads */}
      <Dialog
        open={isPreviewOpen}
        onOpenChange={(open) => {
          if (!open && !isSaving) setIsPreviewOpen(false);
        }}
      >
        <DialogContent className="w-full sm:max-w-[1000px] h-[95vh] sm:h-auto max-h-[95vh] p-3 sm:p-6 overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle>Review Generated Leads with Validation</DialogTitle>
            <DialogDescription>
              Select which leads you want to add to your client database.
            </DialogDescription>
          </DialogHeader>

          {/* Validation Summary */}
          {validationSummary && (
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 my-4">
              <h4 className="font-medium mb-3">Validation Summary</h4>
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-sm">
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{validationSummary.total_leads}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">Total Leads</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{validationSummary.companies_house_validated}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">Verified</div>
                </div>
                <div className="text-center p-2 bg-white rounded-lg">
                  <div className="text-xl sm:text-2xl font-bold text-emerald-600">{validationSummary.active_companies}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">Active</div>
                </div>
              </div>
            </div>
          )}

          <div className="py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <p className="text-sm font-medium">
                {selectedLeadCount} of {generatedLeads.length} leads selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allSelected = generatedLeads.every((lead) => selectedLeads[lead.id]);
                  const newState: Record<string, boolean> = {};
                  generatedLeads.forEach((lead) => {
                    newState[lead.id] = !allSelected;
                  });
                  setSelectedLeads(newState);
                }}
              >
                {generatedLeads.every((lead) => selectedLeads[lead.id]) ? "Deselect All" : "Select All"}
              </Button>
            </div>

            <div className="space-y-4">
              {generatedLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className={`border ${selectedLeads[lead.id] ? "border-blue-300 bg-blue-50" : "border-gray-200"
                    } ${lead.validation?.companiesHouseFound ? 'ring-1 ring-green-200' : ''}`}
                >
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="flex gap-2">
                      <Checkbox
                        checked={!!selectedLeads[lead.id]}
                        onCheckedChange={() => toggleLeadSelection(lead.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {lead.validation?.officialName || lead.name || lead.company}
                          </CardTitle>
                          {getValidationIcon(lead)}
                        </div>
                        <CardDescription>
                          {lead.validation?.suggestedName && lead.validation.suggestedName !== lead.company && (
                            <span className="text-blue-600">Official: {lead.validation.suggestedName}</span>
                          )}
                          {lead.company && !lead.validation?.suggestedName && lead.company}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {getValidationBadge(lead)}
                      {lead.validation?.companyNumber && (
                        <Badge variant="outline" className="text-xs">
                          #{lead.validation.companyNumber}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        {lead.email && (
                          <div className="text-sm">
                            <span className="font-medium">Email:</span> {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span> {lead.phone}
                          </div>
                        )}
                        {lead.website && (
                          <div className="text-sm">
                            <span className="font-medium">Website:</span> {lead.website}
                          </div>
                        )}
                        {lead.address && (
                          <div className="text-sm">
                            <span className="font-medium">Address:</span> 
                            {lead.validation?.addressUpdated && (
                              <Badge variant="secondary" className="ml-1 text-xs">Updated</Badge>
                            )}
                            <p className="mt-1 text-gray-600">{lead.address}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="mt-1 text-gray-600">{lead.notes}</p>
                        </div>
                        
                        {/* Validation Details */}
                        {lead.validation && (
                          <div className="text-sm">
                            <span className="font-medium">Validation:</span>
                            <div className="mt-1 space-y-1">
                              {lead.validation.companiesHouseFound && (
                                <div className="text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Found in Companies House</span>
                                </div>
                              )}
                              {lead.validation.isInternational && (
                                <div className="text-blue-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>International company ({lead.validation.country})</span>
                                </div>
                              )}
                              {lead.validation.isActive !== undefined && (
                                <div className={`flex items-center gap-1 ${
                                  lead.validation.isActive ? 'text-green-600' : 'text-yellow-600'
                                }`}>
                                  {lead.validation.isActive ? (
                                    <CheckCircle className="w-3 h-3" />
                                  ) : (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  <span>Status: {lead.validation.companyStatus}</span>
                                </div>
                              )}
                              {lead.validation.dateOfCreation && (
                                <div className="text-gray-600 text-xs">
                                  Established: {new Date(lead.validation.dateOfCreation).getFullYear()}
                                </div>
                              )}
                              {lead.validation.businessType && (
                                <div className="text-gray-600 text-xs">
                                  SIC: {lead.validation.businessType}
                                </div>
                              )}
                              {lead.validation.info && (
                                <div className="text-blue-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="text-xs">{lead.validation.info}</span>
                                </div>
                              )}
                              {lead.validation.warning && (
                                <div className="text-yellow-600 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  <span className="text-xs">{lead.validation.warning}</span>
                                </div>
                              )}
                              {lead.validation.error && (
                                <div className="text-red-600 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  <span className="text-xs">{lead.validation.error}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-4">
            <Badge variant="outline" className="justify-center sm:justify-start">
              {selectedLeadCount} lead{selectedLeadCount !== 1 ? "s" : ""} selected
            </Badge>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto order-1 sm:order-none"
                onClick={() => setIsPreviewOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddSelectedLeads}
                disabled={selectedLeadCount === 0 || isSaving}
                className="w-full sm:w-auto"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Selected ({selectedLeadCount})
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}