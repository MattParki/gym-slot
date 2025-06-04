export interface Proposal {
    id?: string;
    userId: string;
    clientId?: string;
    yourName: string;
    yourEmail: string;
    yourPhone: string;
    clientName: string;
    clientEmail?: string;
    clientAddress?: string;
    clientCompany?: string;
    clientStatus?: string;
    date: string;
    proposalDescription: string;
    proposal: string;
    tone: string;
    template: string;
    length: string;
    language: string;
    audience: string;
    format: string;
    style: string;
    pitchType: string;
    status?: string;
    createdAt: number;
  }