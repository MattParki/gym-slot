import { db } from "@/lib/firebase";
import {
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  getDoc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  writeBatch
} from 'firebase/firestore';
import { Client } from '@/models/Client'

const CLIENTS_COLLECTION = 'clients';

export interface PaginationResult<T> {
  data: T[];
  metadata: {
    hasMore: boolean;
    lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  }
}

export async function getPaginatedClients(
  userId: string,
  options: {
    pageSize?: number;
    lastVisible?: QueryDocumentSnapshot<DocumentData> | null;
    statusFilter?: string | null;
    searchQuery?: string | null;
  } = {}
): Promise<PaginationResult<Client>> {
  try {
    const {
      pageSize = 10,
      lastVisible = null,
      statusFilter = null,
      searchQuery = null
    } = options;

    const clientsRef = collection(db, CLIENTS_COLLECTION);
    
    const isFiltering = (searchQuery && searchQuery.trim() !== '') || 
      (statusFilter && statusFilter !== 'all');
    
    if (isFiltering) {
      let baseQuery = query(
        clientsRef, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(baseQuery);
      const allClients: Client[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        let includeClient = true;
        
        // Text search (case insensitive)
        if (searchQuery && searchQuery.trim() !== '') {
          const searchLower = searchQuery.toLowerCase();
          const nameMatch = (data.name || '').toLowerCase().includes(searchLower);
          const emailMatch = (data.email || '').toLowerCase().includes(searchLower);
          const companyMatch = (data.company || '').toLowerCase().includes(searchLower);
          const phoneMatch = (data.phone || '').toLowerCase().includes(searchLower);
          
          if (!(nameMatch || emailMatch || companyMatch || phoneMatch)) {
            includeClient = false;
          }
        }
        
        // Status filter
        if (statusFilter && statusFilter !== 'all' && data.status !== statusFilter) {
          includeClient = false;
        }
        
        if (includeClient) {
          allClients.push({
            id: doc.id,
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            company: data.company || '',
            website: data.website || '',
            address: data.address || '',
            status: data.status || 'lead',
            lastContactDate: data.lastContactDate || '',
            notes: data.notes || '',
            userId: data.userId,
            createdAt: data.createdAt?.toDate?.() 
              ? data.createdAt.toDate().toISOString() 
              : new Date().toISOString()
          });
        }
      });
      
      // For pagination when filtering
      let startIndex = 0;
      
      // If we have a lastVisible cursor, find its index in the filtered results
      if (lastVisible) {
        const lastVisibleIndex = allClients.findIndex(c => c.id === lastVisible.id);
        if (lastVisibleIndex !== -1) {
          startIndex = lastVisibleIndex + 1;
        }
      }
      
      const endIndex = Math.min(startIndex + pageSize, allClients.length);
      const paginatedClients = allClients.slice(startIndex, endIndex);
      
      // Check if there are more results
      const hasMore = endIndex < allClients.length;
      
      let newLastVisible = null;
      if (paginatedClients.length > 0) {
        const lastClientId = paginatedClients[paginatedClients.length - 1].id;
        const docRef = doc(db, CLIENTS_COLLECTION, lastClientId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          newLastVisible = docSnap;
        }
      }
      
      return {
        data: paginatedClients,
        metadata: {
          hasMore,
          lastVisible: newLastVisible
        }
      };
    }
    
    // If not filtering, use the regular pagination approach
    let clientQuery = lastVisible
      ? query(
          clientsRef, 
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          startAfter(lastVisible),
          limit(pageSize + 1)
        )
      : query(
          clientsRef, 
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(pageSize + 1)
        );
    
    const querySnapshot = await getDocs(clientQuery);
    
    const hasMore = querySnapshot.docs.length > pageSize;
    
    const docsToUse = hasMore 
      ? querySnapshot.docs.slice(0, pageSize) 
      : querySnapshot.docs;
    
    const clients: Client[] = [];
    
    docsToUse.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        address: data.address || '',
        status: data.status || 'lead',
        lastContactDate: data.lastContactDate || '',
        notes: data.notes || '',
        userId: data.userId,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : new Date().toISOString()
      });
    });
    
    const newLastVisible = docsToUse.length > 0 
      ? docsToUse[docsToUse.length - 1] 
      : null;
    
    return {
      data: clients,
      metadata: {
        hasMore,
        lastVisible: newLastVisible
      }
    };
  } catch (error) {
    console.error("Error getting paginated clients:", error);
    throw error;
  }
}

export async function getClients(userId: string): Promise<Client[]> {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION);
    const q = query(
      clientsRef, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    
    const clients: Client[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      clients.push({
        id: doc.id,
        name: data.name,
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        website: data.website || '',
        address: data.address || '',
        status: data.status || 'lead',
        lastContactDate: data.lastContactDate || '',
        notes: data.notes || '',
        userId: data.userId,
        createdAt: data.createdAt?.toDate?.() 
          ? data.createdAt.toDate().toISOString() 
          : new Date().toISOString()
      });
    });
    
    return clients;
  } catch (error) {
    console.error("Error getting clients:", error);
    throw error;
  }
}

export async function getClient(userId: string, clientId: string): Promise<Client | null> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    const clientSnapshot = await getDoc(clientRef);

    if (!clientSnapshot.exists()) {
      return null;
    }

    const data = clientSnapshot.data();

    if (data.userId !== userId) {
      console.error("Permission denied: Client does not belong to the current user");
      return null;
    }

    return {
      id: clientSnapshot.id,
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      company: data.company || '',
      website: data.website || '',
      address: data.address || '',
      status: data.status || 'lead',
      lastContactDate: data.lastContactDate || new Date().toISOString(),
      notes: data.notes || '',
      userId: data.userId,
      createdAt: data.createdAt?.toDate?.() 
        ? data.createdAt.toDate().toISOString() 
        : new Date().toISOString()
    };
  } catch (error) {
    console.error("Error getting client:", error);
    throw error;
  }
}

export async function createClient(clientData: Omit<Client, 'id' | 'createdAt'>): Promise<string> {
  try {
    const clientsRef = collection(db, CLIENTS_COLLECTION);
    const newClient = {
      ...clientData,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(clientsRef, newClient);
    return docRef.id;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
}

export async function updateClient(clientId: string, clientData: Partial<Client>): Promise<void> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    
    // Remove id and createdAt if they exist in the update data
    const { id, createdAt, ...dataToUpdate } = clientData;
    
    await updateDoc(clientRef, dataToUpdate);
  } catch (error) {
    console.error("Error updating client:", error);
    throw error;
  }
}

export async function deleteClient(userId: string, clientId: string): Promise<void> {
  try {
    const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
    const clientSnapshot = await getDoc(clientRef);
    
    if (!clientSnapshot.exists()) {
      throw new Error("Client not found");
    }
    
    const clientData = clientSnapshot.data();
    if (clientData.userId !== userId) {
      throw new Error("You don't have permission to delete this client");
    }
    
    await deleteDoc(clientRef);
  } catch (error) {
    console.error("Error deleting client:", error);
    throw error;
  }
}

export async function deleteMultipleClients(userId: string, clientIds: string[]): Promise<void> {
  try {
    // Firestore batch allows up to 500 operations
    const batchSize = 500;
    const batches = Math.ceil(clientIds.length / batchSize);
    
    for (let i = 0; i < batches; i++) {
      const batch = writeBatch(db);
      const batchClientIds = clientIds.slice(i * batchSize, (i + 1) * batchSize);
      
      // For each client ID in this batch
      for (const clientId of batchClientIds) {
        const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
        const clientSnapshot = await getDoc(clientRef);
        
        if (clientSnapshot.exists()) {
          const clientData = clientSnapshot.data();
          
          // Verify this client belongs to the current user
          if (clientData.userId === userId) {
            batch.delete(clientRef);
          } else {
            console.warn(`Permission denied: Client ${clientId} does not belong to the current user`);
          }
        } else {
          console.warn(`Client ${clientId} not found`);
        }
      }
      
      // Commit this batch
      await batch.commit();
    }
  } catch (error) {
    console.error("Error deleting multiple clients:", error);
    throw error;
  }
}