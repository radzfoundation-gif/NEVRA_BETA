/**
 * Firebase Mock Implementation using localStorage
 * Used as fallback when Firebase credentials are missing in development
 */

export interface MockDoc {
    id: string;
    data: any;
    createdAt: number;
    updatedAt: number;
}

class FirebaseMock {
    private storage: Storage;
    private prefix = 'firebase_mock_';

    constructor() {
        this.storage = typeof window !== 'undefined' ? window.localStorage : ({} as Storage);
    }

    private getCollectionKey(collection: string): string {
        return `${this.prefix}${collection}`;
    }

    private getCollection(collection: string): MockDoc[] {
        const key = this.getCollectionKey(collection);
        const data = this.storage.getItem(key);
        return data ? JSON.parse(data) : [];
    }

    private setCollection(collection: string, docs: MockDoc[]): void {
        const key = this.getCollectionKey(collection);
        this.storage.setItem(key, JSON.stringify(docs));
    }

    async getDoc(collection: string, docId: string): Promise<any | null> {
        const docs = this.getCollection(collection);
        const doc = docs.find(d => d.id === docId);
        return doc ? doc.data : null;
    }

    async setDoc(collection: string, docId: string, data: any, merge: boolean = false): Promise<void> {
        const docs = this.getCollection(collection);
        const existingIndex = docs.findIndex(d => d.id === docId);

        const now = Date.now();
        if (existingIndex >= 0) {
            if (merge) {
                docs[existingIndex].data = { ...docs[existingIndex].data, ...data };
            } else {
                docs[existingIndex].data = data;
            }
            docs[existingIndex].updatedAt = now;
        } else {
            docs.push({
                id: docId,
                data,
                createdAt: now,
                updatedAt: now,
            });
        }

        this.setCollection(collection, docs);
    }

    async addDoc(collection: string, data: any): Promise<string> {
        const docs = this.getCollection(collection);
        const docId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();

        docs.push({
            id: docId,
            data,
            createdAt: now,
            updatedAt: now,
        });

        this.setCollection(collection, docs);
        return docId;
    }

    async updateDoc(collection: string, docId: string, updates: any): Promise<void> {
        const docs = this.getCollection(collection);
        const existingIndex = docs.findIndex(d => d.id === docId);

        if (existingIndex >= 0) {
            docs[existingIndex].data = { ...docs[existingIndex].data, ...updates };
            docs[existingIndex].updatedAt = Date.now();
            this.setCollection(collection, docs);
        }
    }

    async deleteDoc(collection: string, docId: string): Promise<void> {
        const docs = this.getCollection(collection);
        const filtered = docs.filter(d => d.id !== docId);
        this.setCollection(collection, filtered);
    }

    async getDocs(collection: string, where?: { field: string; op: string; value: any }[], orderBy?: { field: string; direction: 'asc' | 'desc' }, limit?: number): Promise<any[]> {
        let docs = this.getCollection(collection);

        // Apply where filters
        if (where && where.length > 0) {
            docs = docs.filter(doc => {
                return where.every(filter => {
                    const fieldValue = doc.data[filter.field];
                    switch (filter.op) {
                        case '==':
                            return fieldValue === filter.value;
                        case '!=':
                            return fieldValue !== filter.value;
                        case '>':
                            return fieldValue > filter.value;
                        case '<':
                            return fieldValue < filter.value;
                        case '>=':
                            return fieldValue >= filter.value;
                        case '<=':
                            return fieldValue <= filter.value;
                        default:
                            return true;
                    }
                });
            });
        }

        // Apply orderBy
        if (orderBy) {
            docs.sort((a, b) => {
                const aVal = a.data[orderBy.field] ?? a[orderBy.field as keyof MockDoc];
                const bVal = b.data[orderBy.field] ?? b[orderBy.field as keyof MockDoc];

                if (orderBy.direction === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }

        // Apply limit
        if (limit) {
            docs = docs.slice(0, limit);
        }

        return docs.map(doc => ({ id: doc.id, ...doc.data }));
    }

    async getAll(collection: string): Promise<any[]> {
        const docs = this.getCollection(collection);
        return docs.map(doc => ({ id: doc.id, ...doc.data }));
    }
}

export const firebaseMock = new FirebaseMock();
