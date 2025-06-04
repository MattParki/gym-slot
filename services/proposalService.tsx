import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { Proposal } from '@/models/Proposal';

const COLLECTION_NAME = 'proposals';
const CLIENTS_COLLECTION = 'clients';

export async function saveProposal(proposal: Omit<Proposal, 'id' | 'createdAt'>): Promise<string> {
  let clientStatus = 'unknown';

  if (proposal.clientId) {
    try {
      const clientRef = doc(db, CLIENTS_COLLECTION, proposal.clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        const clientData = clientSnap.data();
        clientStatus = clientData.status || 'unknown';
      }
    } catch (error) {
      console.error("Error fetching client status:", error);
      // Continue with unknown status if client lookup fails
    }
  }

  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...proposal,
    clientStatus,
    createdAt: Date.now(),
    responded: false,
    respondedAt: null,
  });
  return docRef.id;
}

export async function getUserProposals(userId: string): Promise<Proposal[]> {
  const q = query(
    collection(db, COLLECTION_NAME), 
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  const proposals: Proposal[] = [];
  
  querySnapshot.forEach(doc => {
    proposals.push({
      id: doc.id,
      ...doc.data() as Omit<Proposal, 'id'>
    });
  });
  
  return proposals;
}

export async function getProposal(id: string): Promise<Proposal | null> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data() as Omit<Proposal, 'id'>
    };
  }
  
  return null;
}

export async function updateProposal(id: string, data: Partial<Proposal>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);

  if (data.clientId) {
    try {
      const clientRef = doc(db, CLIENTS_COLLECTION, data.clientId);
      const clientSnap = await getDoc(clientRef);
      
      if (clientSnap.exists()) {
        const clientData = clientSnap.data();
        data.clientStatus = clientData.status || 'unknown';
      } else {
        data.clientStatus = 'unknown';
      }
    } catch (error) {
      console.error("Error fetching client status during update:", error);
      data.clientStatus = 'unknown';
    }
  }
  
  await updateDoc(docRef, data);
}

export async function deleteProposal(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export async function markProposalAsResponded(id: string, customDate?: Date): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  
  const responseDate = customDate ? customDate : serverTimestamp();
  
  await updateDoc(docRef, {
    responded: true,
    respondedAt: responseDate
  });
}