"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/contexts/AuthContext"
import { getClients, getClient } from "@/services/clientService"
import { Client } from "@/models/Client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import ProposalOutput from "./proposal-output"
import { Input } from "@/components/ui/input"
import { getAuth, User } from "firebase/auth"
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore"
import { MobileTooltip } from "./MobileTooltip"
import toast from 'react-hot-toast'
import { AlertCircle, Info, RefreshCw } from "lucide-react"

// Social media links for email footer
const SOCIAL_LINKS = [
  { name: "TikTok", href: "https://tiktok.com/@prospectseasy" },
  { name: "YouTube", href: "https://youtube.com/@prospectseasy" },
  { name: "X (Twitter)", href: "https://x.com/prospectseasy" },
  { name: "Instagram", href: "https://instagram.com/prospectseasy" },
];

// Email footer component that includes social links and logo
const generateEmailFooter = (yourName: string, businessEmail: string, yourPhone?: string) => {
  return `

--
${yourName}
${businessEmail}${yourPhone ? ` | ${yourPhone}` : ''}

ProspectsEasy - Sales Automation Made Simple
https://prospectseasy.com

Follow us:
TikTok: @prospectseasy | YouTube: @prospectseasy | X: @prospectseasy | Instagram: @prospectseasy
`;
};

export default function ProposalForm() {
  const searchParams = useSearchParams();
  const PLATFORM_DOMAIN = "prospectseasy.com"

  const proposalRef = useRef<HTMLDivElement | null>(null);

  const [yourName, setYourName] = useState("")
  const [yourEmail, setYourEmail] = useState("")
  const [businessEmail, setBusinessEmail] = useState("")
  const [yourPhone, setYourPhone] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [proposalDescription, setproposalDescription] = useState("")
  const [tone, setTone] = useState("professional")
  const [template, setTemplate] = useState("general")
  const [length, setLength] = useState("short")
  const [language, setLanguage] = useState("english")
  const [audience, setAudience] = useState("general")
  const [format, setFormat] = useState("paragraph")
  const [style, setStyle] = useState("confident")
  const [pitchType, setPitchType] = useState("email")

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState("")
  const [clientStatus, setClientStatus] = useState("lead")
  const [clientCompany, setClientCompany] = useState("")
  const [clientNotes, setClientNotes] = useState("")
  const [clientWebsite, setClientWebsite] = useState("")

  const [proposal, setProposal] = useState("")
  const [generatedProposalId, setGeneratedProposalId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [initialUserData, setInitialUserData] = useState({
    displayName: "",
    email: "",
    phoneNumber: ""
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [businessId, setBusinessId] = useState("")
  const [businessDomain, setBusinessDomain] = useState("")
  const [proposalsRemaining, setProposalsRemaining] = useState(0)
  const [editableProposal, setEditableProposal] = useState("");
  const [subject, setSubject] = useState("");
  const [usingCustomDomain, setUsingCustomDomain] = useState(false);

  const isDemo = process.env.NEXT_PUBLIC_ENVIRONMENT === "demo";

  useEffect(() => {
    if (proposal && proposalRef.current) {
      proposalRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [proposal]);

  useEffect(() => {
    if (proposal) {
      if (
        currentUser?.email === "matt@prospectseasy.com" ||
        currentUser?.email === "mikel@prospectseasy.com"
      ) {
        const proposalWithFooter = proposal + generateEmailFooter(yourName, businessEmail, yourPhone);
        setEditableProposal(proposalWithFooter);
      } else {
        setEditableProposal(proposal);
      }
    } else {
      setEditableProposal("");
    }
  }, [proposal, yourName, businessEmail, yourPhone]);

  // Function to format email with platform domain
  const formatEmailWithPlatformDomain = (email: string) => {
    if (!email) return email;

    if (isDemo) {
      const username = email.split("@")[0];
      return `${username}@${PLATFORM_DOMAIN}`;
    }

    // In production, return email as-is
    return email;
  };
  // Handle email input change
  const handleEmailChange = (value: string) => {
    // Store the original email for reference
    setYourEmail(value);

    // Always format the business email with the platform domain
    setBusinessEmail(formatEmailWithPlatformDomain(value));

    // Check if the user is trying to use a custom domain that's not @prospectseasy.com
    const domain = value.includes('@') ? value.split('@')[1] : '';
    setUsingCustomDomain(value.includes('@') && domain !== PLATFORM_DOMAIN);
  }

  const markProposalTaskComplete = async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();

      await fetch('/api/user-tasks', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskId: "create-proposal", completed: true })
      });
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const parseProposalForSubject = (proposalText: string): { subject: string; body: string } => {
    if (!proposalText) {
      return { subject: '', body: '' };
    }

    // Split by lines and check for subject line
    const lines = proposalText.trim().split('\n');
    const firstLine = lines[0].trim();

    if (firstLine.toLowerCase().startsWith('subject:')) {
      // Extract subject
      const extractedSubject = firstLine.substring('subject:'.length).trim();

      // Remove the subject line and get the rest as body
      // Skip any blank lines that might come after the subject
      let startIndex = 1;
      while (startIndex < lines.length && lines[startIndex].trim() === '') {
        startIndex++;
      }

      // Join the rest of the lines as the body
      const bodyLines = lines.slice(startIndex);
      const bodyText = bodyLines.join('\n');

      console.log("Extracted subject:", extractedSubject);
      console.log("Body starts with:", bodyText.substring(0, 30));

      return {
        subject: extractedSubject,
        body: bodyText
      };
    }

    // No subject found
    return {
      subject: `Proposal for ${clientName || 'your review'}`,
      body: proposalText
    };
  };

  useEffect(() => {
    // Check if we have client information in the URL
    const params = searchParams;

    if (params) {
      const clientIdParam = params.get("clientId");

      if (clientIdParam) {
        setSelectedClient(clientIdParam);

        // Only set these fields if they're present in the URL
        const clientNameParam = params.get("clientName");
        const clientEmailParam = params.get("clientEmail");
        const clientAddressParam = params.get("clientAddress");
        const clientStatusParam = params.get("clientStatus");
        const clientCompanyParam = params.get("clientCompany");
        const clientNotesParam = params.get("clientNotes");
        const clientWebsiteParam = params.get("clientWebsite");

        if (clientNameParam) setClientName(clientNameParam);
        if (clientEmailParam) setClientEmail(clientEmailParam);
        if (clientAddressParam) setClientAddress(clientAddressParam);
        if (clientStatusParam) setClientStatus(clientStatusParam);
        if (clientCompanyParam) setClientCompany(clientCompanyParam);
        if (clientNotesParam) setClientNotes(clientNotesParam);
        if (clientWebsiteParam) setClientWebsite(clientWebsiteParam);

      } else {
        // If no client ID in URL, set to manual by default
        setSelectedClient("manual");
      }
    }
  }, [searchParams]);



  // Fetch current user data and business information on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true)

        // Load from localStorage first
        const savedUserData = localStorage.getItem("userData")
        if (savedUserData) {
          const data = JSON.parse(savedUserData)
          setYourName(data.yourName || "")
          setYourEmail(data.yourEmail || "")
          setYourPhone(data.yourPhone || "")
          setInitialUserData({
            displayName: data.yourName || "",
            email: data.yourEmail || "",
            phoneNumber: data.yourPhone || ""
          })
        }

        const auth = getAuth()
        const user = auth.currentUser

        if (user) {
          setCurrentUser(user)
          setYourEmail(user.email || "")

          const db = getFirestore()
          const userDoc = await getDoc(doc(db, "users", user.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()
            setYourName(userData.displayName || "")
            setYourPhone(userData.phoneNumber || "")

            // Update initial state and localStorage
            const latestUserData = {
              yourName: userData.displayName || "",
              yourEmail: user.email || "",
              yourPhone: userData.phoneNumber || ""
            }

            setInitialUserData({
              displayName: latestUserData.yourName,
              email: latestUserData.yourEmail,
              phoneNumber: latestUserData.yourPhone
            })

            // Get the business ID from the user document
            if (userData.businessId) {
              setBusinessId(userData.businessId)

              // Fetch the business details
              const businessDoc = await getDoc(doc(db, "businesses", userData.businessId))

              if (businessDoc.exists()) {
                const businessData = businessDoc.data()
                setProposalsRemaining(businessData.proposalsRemaining || 0)

                // Get business email domain
                if (businessData.emailDomain) {
                  setBusinessDomain(businessData.emailDomain)
                } else if (businessData.email) {
                  // Extract domain from business email if domain is not directly stored
                  const domain = businessData.email.split('@')[1]
                  setBusinessDomain(domain || "")
                }

                // Always format email with platform domain regardless of business domain
                if (user.email) {
                  setBusinessEmail(formatEmailWithPlatformDomain(user.email))
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [])

  // Update business email whenever yourEmail changes to ensure it's always using the platform domain
  useEffect(() => {
    setBusinessEmail(formatEmailWithPlatformDomain(yourEmail))
  }, [yourEmail])

  const { user } = useAuth() // Add this hook at the top level

  useEffect(() => {
    const fetchClients = async () => {
      if (user) {
        try {
          const clientsList = await getClients(user.uid)
          setClients(clientsList)
        } catch (err) {
          console.error("Error fetching clients:", err)
        }
      }
    }

    fetchClients()
  }, [user])

  useEffect(() => {
    // If a client is selected (not manual) but client fields are empty, try to load the data
    if (selectedClient && selectedClient !== "manual" && !clientName && clients.length > 0 && user) {

      // Find the client in the local list first for immediate display
      const selectedClientData = clients.find(client => client.id === selectedClient);

      if (selectedClientData) {
        setClientName(selectedClientData.name || "");
        setClientEmail(selectedClientData.email || "");
        setClientAddress(selectedClientData.address || "");
        setClientStatus(selectedClientData.status || "lead");
        setClientCompany(selectedClientData.company || "");
        setClientNotes(selectedClientData.notes || "");
        setClientWebsite(selectedClientData.website || "");
      } else {
        // If not found in local cache, fetch from backend
        handleClientSelect(selectedClient);
      }
    }
  }, [selectedClient, clients, user]);

  const handleClientSelect = async (clientId: string) => {
    setSelectedClient(clientId);

    // Reset form when manual option is selected
    if (clientId === "manual") {
      setClientName("");
      setClientEmail("");
      setClientAddress("");
      setClientStatus("lead");
      setClientCompany("");
      setClientNotes("");
      setClientWebsite("");
      return;
    }

    if (clientId && user) {
      try {
        // Always fetch fresh client data when selecting from dropdown
        const clientData = await getClient(user.uid, clientId);

        if (clientData) {
          setClientName(clientData.name || "");
          setClientEmail(clientData.email || "");
          setClientAddress(clientData.address || "");
          setClientStatus(clientData.status || "lead");
          setClientCompany(clientData.company || "");
          setClientNotes(clientData.notes || "");
          setClientWebsite(clientData.website || "");
          // console.log("Client data loaded successfully:", clientData.name);
        } else {
          // console.error("Client data not found for ID:", clientId);
        }
      } catch (err) {
        console.error("Error loading client details:", err);
        toast.error("Failed to load client details. Please try again.");
      }
    }
  };

  const handleGenerate = async () => {

    // Check if there are proposals remaining in the business
    if (businessId && proposalsRemaining <= 0) {
      toast.error("Your business has no proposals remaining.");
      return;
    }

    setIsGenerating(true);
    setProposal("");
    setError("");

    // Fetch user data from Firebase client-side
    let userSpecializations = "various products and services";
    let userIndustry = "general business";

    if (currentUser) {
      try {
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Get specializations
          if (userData.specializations && userData.specializations.length > 0) {
            if (userData.specializations.length === 1) {
              userSpecializations = userData.specializations[0];
            } else if (userData.specializations.length === 2) {
              userSpecializations = `${userData.specializations[0]} and ${userData.specializations[1]}`;
            } else {
              const lastSpec = userData.specializations[userData.specializations.length - 1];
              const otherSpecs = userData.specializations.slice(0, -1).join(", ");
              userSpecializations = `${otherSpecs}, and ${lastSpec}`;
            }
          }

          // Get industry
          userIndustry = userData.industry || "general business";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }

    try {
      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yourName,
          businessEmail, // Use business email instead of displayEmail
          yourEmail, // Include original email as well
          yourPhone,
          clientId: selectedClient !== "manual" ? selectedClient : undefined,
          clientName,
          clientEmail,
          clientAddress,
          clientStatus,
          proposalDescription,
          tone,
          template,
          length,
          language,
          audience,
          format,
          style,
          pitchType,
          userId: currentUser?.uid,
          businessId: businessId,
          userSpecializations,
          userIndustry,
          saveToFirebase: true,
          includeSocialLinks: false,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setProposal(data.proposal);
      setSubject(data.subject);


      if (data.proposalId) {
        setGeneratedProposalId(data.proposalId);
      }

      await markProposalTaskComplete();

      toast.success(`Proposal for ${clientName || "client"} generated!`);
      // Update local proposals remaining count
      if (businessId) {
        const db = getFirestore();
        const businessRef = doc(db, "businesses", businessId);
        await updateDoc(businessRef, {
          proposalsRemaining: Math.max(0, proposalsRemaining - 1),
        });
        setProposalsRemaining((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate proposal.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Check for changes in user data and update Firebase if needed
  const updateUserData = async () => {
    if (!currentUser) return

    try {
      setIsUpdating(true)
      const db = getFirestore()
      const userRef = doc(db, "users", currentUser.uid)
      let updated = false

      // Check if any data has changed
      if (yourName !== initialUserData.displayName || yourPhone !== initialUserData.phoneNumber) {
        // Update Firestore document
        await updateDoc(userRef, {
          displayName: yourName,
          phoneNumber: yourPhone
        })
        updated = true
      }

      // Update local state with new initial values
      if (updated) {
        const updatedData = {
          yourName,
          yourEmail,
          yourPhone
        }

        setInitialUserData({
          displayName: yourName,
          email: yourEmail,
          phoneNumber: yourPhone
        })

        localStorage.setItem("userData", JSON.stringify(updatedData))
        toast.success("Profile information updated successfully")
      }

    } catch (err) {
      console.error("Error updating user data:", err)
      toast.error("Failed to update profile information")
    } finally {
      setIsUpdating(false)
    }
  }

  // Check for user data changes when form fields change
  useEffect(() => {
    // Only run if we have initial data and user is loaded (not during initial load)
    if (!isLoading && currentUser &&
      (yourName !== initialUserData.displayName ||
        yourPhone !== initialUserData.phoneNumber)) {

      // Debounce the update to avoid too many saves while typing
      const timer = setTimeout(() => {
        updateUserData()
      }, 2000) // 2 second delay after typing stops

      return () => clearTimeout(timer) // Clean up the timer
    }
  }, [yourName, yourPhone])

  // Component for the email footer in the modal
  const EmailFooter = () => (
    <div className="mt-6 border-t pt-4 text-gray-500 text-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <img
            src="/images/logo-white.jpg"
            alt="ProspectsEasy Logo"
            className="h-6 w-auto"
          />
        </div>
        <div>
          <strong>ProspectsEasy</strong> - Sales Automation Made Simple
        </div>
      </div>
      <div className="flex justify-center space-x-4 mt-2">
        {SOCIAL_LINKS.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            {link.name}
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className={showSendModal ? "" : "space-y-8"}>

      {showSendModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Confirm Email</h2>
              <p className="text-gray-700">
                Are you sure you want to send this proposal to <b>{clientEmail}</b>?
              </p>

              {/* Email error message */}
              {emailError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p>{emailError}</p>
                </div>
              )}

              <h3 className="text-xl font-semibold">Preview Email</h3>

              <div className="border rounded-md p-6 bg-gray-50 space-y-4">
                <p className="text-sm text-gray-600">From: <b>{businessEmail}</b></p>
                <p className="text-sm text-gray-600">To: <b>{clientEmail}</b></p>
                <div className="flex items-center gap-2">
                  <label htmlFor="subject" className="text-sm text-gray-600">
                    Subject:
                  </label>
                  <Input
                    id="subject"
                    placeholder="Enter email subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="max-w-lg text-sm"
                  />
                </div>

                <div className="flex items-start gap-2 text-sm rounded-md border border-yellow-200 bg-yellow-50 text-yellow-800 px-4 py-2">
                  <Info className="h-4 w-4 mt-0.5 text-yellow-500" />
                  <p>
                    This email will be sent from <strong>@prospectseasy.com</strong>.
                    To use your own domain, please upgrade to a subscription.
                  </p>
                </div>

                <div className="mt-4 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                  {proposal && (
                    <div className="mt-4">
                      <Textarea
                        value={editableProposal}
                        onChange={(e) => setEditableProposal(e.target.value)}
                        className="min-h-[300px]"
                      />
                    </div>
                  )}
                </div>

                {/* Visual representation of how footer will look */}
                {(currentUser?.email === "matt@prospectseasy.com" || currentUser?.email === "mikel@prospectseasy.com") && (
                  <EmailFooter />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setShowSendModal(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  setSendingEmail(true);
                  setEmailError("");
                  try {
                    const res = await fetch("/api/send-email", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        from: businessEmail,
                        to: clientEmail,
                        subject: subject,
                        text: `${editableProposal}\n`,
                        userId: currentUser?.uid,
                        yourName,
                        businessEmail,
                        yourPhone,
                        ...(generatedProposalId ? { proposalId: generatedProposalId } : {}),
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to send email");

                    toast.success("Email sent successfully!");
                    setShowSendModal(false);
                  } catch (err: any) {
                    setEmailError(err.message);
                  } finally {
                    setSendingEmail(false);
                  }
                }}
                disabled={sendingEmail}
              >
                {sendingEmail ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>

            </div>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="pt-6 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-6">Loading user data...</div>
          ) : (
            <>
              {/* Business Information Banner */}
              {businessId && (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <div className={`font-medium ${proposalsRemaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {proposalsRemaining} proposals remaining
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Your Name" value={yourName} onChange={setYourName} />

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Label>Your Email</Label>
                    {isDemo ? (
                      <MobileTooltip
                        content={
                          <p className="w-64">
                            All emails are sent using the @{PLATFORM_DOMAIN} domain. To use your own domain, a subscription is required.
                          </p>
                        }
                        iconSize={16}
                        className="text-gray-500"
                      />
                    ) : (
                      <MobileTooltip
                        content={
                          <p className="w-64 text-green">
                            You are subscribed! You can use your own domain for emails.
                          </p>
                        }
                        iconSize={16}
                        className="text-gray-500"
                      />

                    )}
                  </div>
                  <Input
                    id="yourEmail"
                    value={yourEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="yourname@domain.com"
                    className="w-full"
                  />
                  {/* Email domain notification */}
                  <div className="flex items-start gap-2 text-sm mt-1">
                    <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-blue-600">
                      Sending as: <strong>{businessEmail}</strong>
                      {usingCustomDomain && (
                        <span className="block text-amber-600 mt-1">
                          Note: A subscription is required to send from your own domain.
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <TextField label="Your Phone" value={yourPhone} onChange={setYourPhone} />

                <div className="space-y-2">
                  <Label>Select Existing Client</Label>
                  <Select value={selectedClient} onValueChange={handleClientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a client or enter details manually" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Enter client details manually</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name} {client.company ? `(${client.company})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <TextField label="Client's Name" value={clientName} onChange={setClientName} />
                <TextField label="Client's Email" value={clientEmail} onChange={setClientEmail} />
                <TextField label="Client's Address" value={clientAddress} onChange={setClientAddress} />
                <TextField label="Client's Website" value={clientWebsite} onChange={setClientWebsite} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proposalDescription">Proposal Prompt</Label>
                <Textarea
                  id="proposalDescription"
                  placeholder="(Optional) Add any extra details or requirements for this proposal. If left blank, we'll use the client's notes and info automatically."
                  className="min-h-[150px]"
                  value={proposalDescription}
                  onChange={(e) => setproposalDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Dropdown label="Pitch Type" value={pitchType} onChange={setPitchType} options={["email", "call"]} />
                <Dropdown label="Tone" value={tone} onChange={setTone} options={["professional", "friendly", "casual", "formal"]} />
                <Dropdown label="Template" value={template} onChange={setTemplate} options={["general", "detailed", "sales", "technical"]} />
                <Dropdown label="Length" value={length} onChange={setLength} options={["short", "detailed"]} />
                <Dropdown label="Language" value={language} onChange={setLanguage} options={["english", "spanish"]} />
                <Dropdown label="Audience" value={audience} onChange={setAudience} options={["general", "technical manager", "non-technical client"]} />
                <Dropdown label="Format" value={format} onChange={setFormat} options={["paragraph", "bullet points"]} />
                <Dropdown label="Style" value={style} onChange={setStyle} options={["confident", "humble", "creative", "precise"]} />
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || (!!businessId && proposalsRemaining <= 0)}
                  className="px-8"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </Button>
              </div>

              {(businessId && proposalsRemaining <= 0) && (
                <p className="text-red-500 text-center">
                  You have no proposals remaining. Please contact support to increase your limit.
                </p>
              )}

              {error && <p className="text-red-500 text-center">{error}</p>}
              {isUpdating && <p className="text-blue-500 text-center">Saving your profile changes...</p>}
            </>
          )}
        </CardContent>
      </Card>

      {proposal && (
        <div ref={proposalRef} className={`transition-all duration-200`}>
          <ProposalOutput proposal={proposal} />
        </div>
      )}

      {proposal && clientEmail && (
        <div className="flex justify-center">
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => setShowSendModal(true)}>
              Edit/Send Email
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// Utility components
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

function Dropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  options: string[]
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}