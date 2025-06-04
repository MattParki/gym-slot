"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserProposals, deleteProposal } from "@/services/proposalService";
import { Proposal } from "@/models/Proposal";
import { Button } from "@/components/ui/button";
import toast from 'react-hot-toast'
import { collection, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Check, Eye, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import MarkAsRespondedButton from "@/components/MarkAsRespondedButton";
import { formatDateOnly, formatDateTime, getStatusColor } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

// Define SentEmail type
interface SentEmail {
    id: string;
    to: string;
    subject: string;
    sentAt: any;
    deliveryStatus: string;
    openStatus?: string;
    openCount?: number;
    firstOpenedAt?: any;
    userId: string;
    emailId?: string;
    clientStatus?: string;
    responded?: boolean;
    respondedAt?: any;
    proposalId?: string;
}

export default function MyProposalsContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("emails");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [emailIdToDelete, setEmailIdToDelete] = useState<string | null>(null);
    const [openedDetailId, setOpenedDetailId] = useState<string | null>(null);

    // Only emails with a proposalId
    const filteredEmails = sentEmails.filter(email => !!email.proposalId);
    const maxProposals = 200;
    const isAtLimit = filteredEmails.length >= maxProposals;

    useEffect(() => {
        async function loadData() {
            if (!loading && !user) {
                router.push("/login");
                return;
            }

            if (user) {
                try {
                    const userProposals = await getUserProposals(user.uid);
                    setProposals(userProposals);

                    const proposalClientStatusMap: Record<string, string> = {};
                    userProposals.forEach(proposal => {
                        if (proposal.id) {
                            proposalClientStatusMap[proposal.id] = proposal.clientStatus || 'unknown';
                        }
                    });

                    const emailsRef = collection(db, "sentEmails");
                    const emailsQuery = query(
                        emailsRef,
                        where("userId", "==", user.uid),
                        orderBy("sentAt", "desc")
                    );
                    const emailsSnapshot = await getDocs(emailsQuery);

                    const emailsData: SentEmail[] = [];
                    emailsSnapshot.forEach((doc) => {
                        const data = doc.data();
                        emailsData.push({
                            id: doc.id,
                            to: data.to || "Unknown",
                            subject: data.subject || "No Subject",
                            sentAt: data.sentAt,
                            deliveryStatus: data.deliveryStatus || "pending",
                            userId: data.userId || "",
                            emailId: data.emailId || undefined,
                            openStatus: data.openStatus || undefined,
                            openCount: data.openCount || 0,
                            firstOpenedAt: data.firstOpenedAt || undefined,
                            responded: data.responded || false,
                            respondedAt: data.respondedAt || null,
                            proposalId: data.proposalId || undefined,
                            clientStatus: data.proposalId ?
                                proposalClientStatusMap[data.proposalId] || 'unknown' :
                                'unknown'
                        });
                    });

                    setSentEmails(emailsData);
                } catch (error) {
                    console.error("Error loading data:", error);
                    toast.error("Failed to load data");
                } finally {
                    setIsLoading(false);
                }
            }
        }

        loadData();
    }, [user, loading, router]);

    const openDeleteModal = (id: string) => {
        setEmailIdToDelete(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!emailIdToDelete) return;
        try {
            // Delete the proposal
            await deleteProposal(emailIdToDelete);

            // Delete the linked email(s) from Firestore
            const emailQuery = query(
                collection(db, "sentEmails"),
                where("proposalId", "==", emailIdToDelete)
            );
            const snapshot = await getDocs(emailQuery);
            snapshot.forEach(async (docRef) => {
                await deleteDoc(docRef.ref);
            });

            // Remove the proposal and email(s) from UI state
            setProposals((prev) => prev.filter((p) => p.id !== emailIdToDelete));
            setSentEmails((prev) => prev.filter((email) => email.proposalId !== emailIdToDelete));

            toast.success("Proposal deleted successfully");
        } catch (error) {
            console.error("Error deleting proposal:", error);
            toast.error("Failed to delete proposal");
        } finally {
            setShowDeleteModal(false);
            setEmailIdToDelete(null);
        }
    };

    const handleView = (id: string) => {
        router.push(`/proposals/${id}`);
    };

    const getDeliveryStatusIcon = (status: string) => {
        if (status === "delivered") {
            return <CheckCircle className="w-4 h-4 text-green-500" />;
        } else if (status === "pending") {
            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span>
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <span>
                                Pending. This may be because the recipient has unsubscribed or their email is unreachable.
                            </span>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            );
        } else {
            return <AlertCircle className="w-4 h-4 text-red-500" />;
        }
    };

    if (loading || isLoading) {
        return (
            <div className="container mx-auto py-10 flex justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    const handleProposalUpdate = (emailId: string, responded: boolean, respondedAt?: any) => {
        setProposals(prevProposals =>
            prevProposals.map(proposal =>
                proposal.id === emailId
                    ? { ...proposal, responded, respondedAt, clientStatus: 'prospect' }
                    : proposal
            )
        );

        setSentEmails(prevEmails =>
            prevEmails.map(email =>
                email.id === emailId
                    ? { ...email, responded, respondedAt, clientStatus: 'prospect' }
                    : email
            )
        );
    };

    return (
        <div className="w-full  py-5">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
                <TabsContent value="emails" className="space-y-6">
                    {filteredEmails.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="mb-4">You haven't sent any proposal emails yet.</p>
                            <Button onClick={() => router.push("/create-proposal")}>
                                Create and Send a Proposal
                            </Button>
                        </div>
                    ) : (
                        <>
                            {isAtLimit && (
                                <div className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md px-4 py-3 mb-4 text-center font-medium">
                                    You have reached the maximum of {maxProposals} proposals. Please delete some proposals to see more.
                                </div>
                            )}
                            {/* Desktop table view */}
                            <div className="hidden md:block rounded-md border">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-fit divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                                                    Recipient
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                                                    Status
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-56">
                                                    Subject
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-40">
                                                    Sent At
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                                                    Delivery
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-20">
                                                    Opened
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-44">
                                                    Response
                                                </th>
                                                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredEmails.slice(0, maxProposals).map((email) => {
                                                return (
                                                    <tr key={email.id} className="hover:bg-gray-50">
                                                        <td className="px-3 py-4 text-sm text-gray-900 w-48">
                                                            <div className="truncate" title={email.to}>
                                                                {email.to}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm w-32">
                                                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(email.clientStatus || "unknown")}`}>
                                                                {(email.clientStatus || "Unknown").charAt(0).toUpperCase() + (email.clientStatus || "unknown").slice(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-900 w-56">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger className="w-full">
                                                                        <div className="truncate">
                                                                            {email.subject.length > 30 ? `${email.subject.substring(0, 30)}...` : email.subject}
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>{email.subject}</TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500 w-40">
                                                            <div className="truncate">
                                                                {formatDateTime(email.sentAt)}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm w-32">
                                                            <div className="flex items-center gap-1">
                                                                {getDeliveryStatusIcon(email.deliveryStatus)}
                                                                <span className="capitalize text-xs">
                                                                    {email.deliveryStatus || "pending"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500 w-20 text-center">
                                                            {email.firstOpenedAt ? (
                                                                <span className="inline-flex items-center gap-1 text-green-600 font-semibold">
                                                                    <Check className="h-4 w-4" /> Yes
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 text-gray-400">
                                                                    <AlertCircle className="h-4 w-4" /> No
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm w-44">
                                                            {email?.responded ? (
                                                                <div className="text-green-600 text-xs">
                                                                    <div className="flex items-center gap-1">
                                                                        <Check className="h-3 w-3" />
                                                                        <span>Responded</span>
                                                                    </div>
                                                                    {email.respondedAt && (
                                                                        <div className="text-gray-500 mt-1 truncate">
                                                                            {formatDateOnly(email.respondedAt)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                email && (
                                                                    <MarkAsRespondedButton
                                                                        emailId={email.id ?? ""}
                                                                        isResponded={email.responded ?? false}
                                                                        respondedAt={email.respondedAt}
                                                                        onUpdate={(responded, respondedAt) =>
                                                                            handleProposalUpdate(email.id ?? "", responded, respondedAt)
                                                                        }
                                                                        variant="button"
                                                                        size="sm"
                                                                        showDatePicker={true}
                                                                    />
                                                                )
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm w-24 flex gap-1">
                                                            <>
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => handleView(email.proposalId!)}
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>View Proposal</TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={() => openDeleteModal(email.proposalId!)}
                                                                            >
                                                                                <Trash className="w-4 h-4 text-red-600" />
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Delete Proposal</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            {showDeleteModal && (
                                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
                                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-6">
                                        <h2 className="text-xl font-semibold">Confirm Deletion</h2>
                                        <p className="text-gray-700">
                                            Are you sure you want to delete this proposal?
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

                            {/* Mobile card view */}
                            <div className="md:hidden w-full flex flex-col gap-5">
                                {filteredEmails.slice(0, maxProposals).map((email) => {
                                    const isOpened = !!email.firstOpenedAt;
                                    const showOpenedDetail = openedDetailId === email.id;

                                    return (
                                        <div
                                            key={email.id}
                                            className="relative w-full border rounded-xl p-4 shadow-sm bg-white"
                                        >
                                            {/* Delivery status top-right */}
                                            <div className="absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full w-fit">
                                                {getDeliveryStatusIcon(email.deliveryStatus)}
                                                <span className="capitalize">{email.deliveryStatus || "Pending"}</span>
                                            </div>

                                            {/* Email recipient row */}
                                            <div className="text-sm font-medium text-gray-900 break-words mb-4 mt-4 pr-10">
                                                {email.to}
                                            </div>

                                            {/* Client status */}
                                            <div className="text-xs text-gray-500 mb-1">
                                                Status:{" "}
                                                <span className={`px-2 py-0.5 rounded-full ${getStatusColor(email.clientStatus || "unknown")}`}>
                                                    {(email.clientStatus || "Unknown").charAt(0).toUpperCase() +
                                                        (email.clientStatus || "unknown").slice(1)}
                                                </span>
                                            </div>

                                            <div className="text-sm truncate text-gray-800 mb-2 mt-2 pr-10">
                                                <strong>Subject:</strong>{" "}
                                                <span title={email.subject}>
                                                    {email.subject.length > 40 ? email.subject.slice(0, 40) + "..." : email.subject}
                                                </span>
                                            </div>

                                            <div className="text-xs text-gray-600 space-y-1 mb-4">
                                                <div>
                                                    <strong>Sent:</strong> {formatDateTime(email.sentAt)}
                                                </div>
                                                <div>
                                                    <strong>Opened:</strong>{" "}
                                                    {isOpened ? (
                                                        <button
                                                            type="button"
                                                            className="inline-flex items-center gap-1 text-green-600 font-semibold underline"
                                                            onClick={() =>
                                                                setOpenedDetailId(showOpenedDetail ? null : email.id)
                                                            }
                                                        >
                                                            <Check className="h-4 w-4" /> Yes
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-gray-400">
                                                            <AlertCircle className="h-4 w-4" /> No
                                                        </span>
                                                    )}
                                                    {showOpenedDetail && isOpened && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Opened at: {formatDateTime(email.firstOpenedAt)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Response section */}
                                            <div className="border-t pt-3 mt-3">
                                                {email?.responded ? (
                                                    <div className="text-green-600 text-sm">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Check className="h-4 w-4" />
                                                            Client Responded
                                                        </div>
                                                        {email.respondedAt && (
                                                            <div className="text-gray-500 text-xs">
                                                                on {formatDateOnly(email.respondedAt)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    email && (
                                                        <MarkAsRespondedButton
                                                            emailId={email.id ?? ""}
                                                            isResponded={email.responded ?? false}
                                                            respondedAt={email.respondedAt}
                                                            onUpdate={(responded, respondedAt) =>
                                                                handleProposalUpdate(email.id ?? "", responded, respondedAt)
                                                            }
                                                            variant="button"
                                                            size="sm"
                                                            showDatePicker={true}
                                                        />
                                                    )
                                                )}
                                            </div>

                                            {email.proposalId && (
                                                <div className="border-t pt-3 mt-3 flex flex-col gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleView(email.proposalId!)}
                                                        className="w-full"
                                                    >
                                                        View Proposal
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-red-600 border-red-300 hover:bg-red-50"
                                                        onClick={() => openDeleteModal(email.proposalId!)}
                                                    >
                                                        Delete Proposal
                                                    </Button>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}