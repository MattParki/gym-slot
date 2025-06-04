"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getProposal } from "@/services/proposalService";
import { Proposal } from "@/models/Proposal";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Mail,
  Building,
  User,
  FileText,
  Printer,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import toast from 'react-hot-toast';

export default function ProposalDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams() as { id: string };
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    async function loadProposal() {
      if (!loading && !user) {
        router.push("/login");
        return;
      }

      if (params.id && user) {
        try {
          const proposalData = await getProposal(params.id as string);

          if (!proposalData) {
            setError("Proposal not found");
            return;
          }

          // Verify this proposal belongs to the current user
          if (proposalData.userId !== user.uid) {
            setError("You don't have permission to view this proposal");
            router.push("/my-proposals");
            return;
          }

          setProposal(proposalData);
        } catch (error) {
          console.error("Error loading proposal:", error);
          setError("Failed to load proposal");
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadProposal();
  }, [user, loading, params.id, router]);

  const handleCopy = () => {
    if (!proposal) return;

    navigator.clipboard.writeText(proposal.proposal);
    toast.success("Proposal copied to clipboard");
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCreatedDate = (createdAt: any): string => {
    if (!createdAt) return 'Unknown date';

    if (typeof createdAt === 'object' && createdAt.toDate && typeof createdAt.toDate === 'function') {
      return createdAt.toDate().toLocaleDateString();
    }

    if (typeof createdAt === 'number') {
      return new Date(createdAt).toLocaleDateString();
    }

    const date = new Date(createdAt);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }

    return 'Unknown date';
  };

  const sendEmailViaService = async () => {
    if (!proposal || !proposal.clientEmail || !proposal.yourEmail) return;

    setSendingEmail(true);
    setEmailError("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: proposal.yourEmail,
          to: proposal.clientEmail,
          subject: "Proposal for Your Review",
          text: `Dear ${proposal.clientName || "Client"},\n\n${proposal.proposal}\n`,
          userId: user?.uid,
          ...(proposal?.id ? { proposalId: proposal.id } : {})
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");

      toast.success("Email sent successfully!");
      setShowSendModal(false);
    } catch (err: any) {
      setEmailError(err.message);
      toast.error("Failed to send email");
    } finally {
      setSendingEmail(false);
    }
  };

  const getProposalStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "accepted":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading || isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => router.push('/my-proposals')}>
            Back to My Proposals
          </Button>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <p className="mb-4">Proposal not found.</p>
          <Button onClick={() => router.push('/my-proposals')}>
            Back to My Proposals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-10 max-w-6xl px-4">
      <div className="flex flex-col space-y-6">
        {/* Header with back button and actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex flex-col w-full sm:flex-row sm:items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="self-start mb-4 sm:mb-0 sm:mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                Proposal for {proposal.clientName}
                {proposal.clientCompany && (
                  <span className="text-gray-500 text-lg block sm:inline">
                    ({proposal.clientCompany})
                  </span>
                )}
              </h1>
              {proposal.status && (
                <div className="mt-2 sm:mt-0 sm:ml-3 inline-block">
                  <Badge className={getProposalStatusColor(proposal.status)}>
                    {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                  </Badge>
                </div>
              )}
              <p className="text-gray-500 mt-1">
                Created on {formatCreatedDate(proposal.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              title="Copy to clipboard"
              className="flex-1 sm:flex-none"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              title="Print proposal"
              className="flex-1 sm:flex-none"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            <Card className="print:shadow-none border-0 print:border-0">
              <CardHeader className="print:pb-0">
                <CardTitle className="text-xl print:text-2xl">Proposal Content</CardTitle>
              </CardHeader>
              <CardContent className="print:pt-2">
                <div className="bg-white p-4 sm:p-6 rounded-lg border print:border-0 shadow-sm print:shadow-none">
                  <div className="print:text-sm">
                    <p className="whitespace-pre-line leading-relaxed text-gray-800">{proposal.proposal}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="print:hidden flex justify-center pt-0">
                {proposal.clientEmail && (
                  <Button
                    variant="outline"
                    onClick={() => setShowSendModal(true)}
                    className="w-full sm:w-auto"
                    disabled={true} // Disable the button until we go live
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Edit/Send Email
                  </Button>
                )}
              </CardFooter>
            </Card>

            {proposal.proposalDescription && (
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Proposal Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{proposal.proposalDescription}</p>
                </CardContent>
              </Card>
            )}

            {/* Print-only header */}
            <div className="hidden print:block print:mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold mb-2">Proposal for {proposal.clientName}</h1>
                  <p className="text-sm text-gray-500">Created on {formatCreatedDate(proposal.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold mb-1">{proposal.yourName}</p>
                  {proposal.yourEmail && <p className="text-sm">{proposal.yourEmail}</p>}
                  {proposal.yourPhone && <p className="text-sm">{proposal.yourPhone}</p>}
                </div>
              </div>
              <Separator className="my-4" />
            </div>
          </div>

          {/* Sidebar with metadata - On mobile appears second */}
          <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
            {/* Your Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 mr-2 text-primary" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{proposal.yourName}</p>
                </div>
                {proposal.yourEmail && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{proposal.yourEmail}</p>
                  </div>
                )}
                {proposal.yourPhone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{proposal.yourPhone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  Client Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{proposal.clientName}</p>
                </div>
                {proposal.clientCompany && (
                  <div>
                    <p className="text-sm text-gray-500">Company</p>
                    <p className="font-medium">{proposal.clientCompany}</p>
                  </div>
                )}
                {proposal.clientEmail && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{proposal.clientEmail}</p>
                  </div>
                )}
                {proposal.clientAddress && (
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{proposal.clientAddress}</p>
                  </div>
                )}
                {proposal.date && (
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{proposal.date}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proposal Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-primary" />
                  Proposal Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {proposal.tone && (
                    <div>
                      <p className="text-sm text-gray-500">Tone</p>
                      <Badge variant="outline" className="mt-1">
                        {proposal.tone.charAt(0).toUpperCase() + proposal.tone.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {proposal.style && (
                    <div>
                      <p className="text-sm text-gray-500">Style</p>
                      <Badge variant="outline" className="mt-1">
                        {proposal.style.charAt(0).toUpperCase() + proposal.style.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {proposal.template && (
                    <div>
                      <p className="text-sm text-gray-500">Template</p>
                      <Badge variant="outline" className="mt-1">
                        {proposal.template.charAt(0).toUpperCase() + proposal.template.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {proposal.format && (
                    <div>
                      <p className="text-sm text-gray-500">Format</p>
                      <Badge variant="outline" className="mt-1">
                        {proposal.format.charAt(0).toUpperCase() + proposal.format.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {proposal.pitchType && (
                    <div>
                      <p className="text-sm text-gray-500">Pitch Type</p>
                      <Badge variant="outline" className="mt-1">
                        {proposal.pitchType.charAt(0).toUpperCase() + proposal.pitchType.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Email sending modal */}
      {showSendModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 space-y-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Confirm Email</h2>
              <p className="text-gray-700">
                Are you sure you want to send this proposal to <b>{proposal.clientEmail}</b>?
              </p>

              {emailError && <p className="text-red-500">{emailError}</p>}

              <h3 className="text-xl font-semibold">Preview Email</h3>

              <div className="border rounded-md p-6 bg-gray-50 space-y-4">
                <p className="text-sm text-gray-600">To: <b>{proposal.clientEmail}</b></p>
                <p className="text-sm text-gray-600">Subject: Proposal for Your Review</p>
                <div className="mt-4 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                  {`Dear ${proposal.clientName || "Client"},\n\n${proposal.proposal}\n`}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="ghost" onClick={() => setShowSendModal(false)}>Cancel</Button>
              <div className="flex justify-end gap-4">
                <Button variant="ghost" onClick={() => setShowSendModal(false)}>
                  Cancel
                </Button>
                <Button onClick={sendEmailViaService} disabled={sendingEmail}>
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
        </div>
      )}
    </div>
  );
}