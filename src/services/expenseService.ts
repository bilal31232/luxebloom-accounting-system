import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export const expenseService = {
  async getExpenses() {
    const q = query(collection(db, 'luxe_expenses'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createExpense(data: any) {
    return await addDoc(collection(db, 'luxe_expenses'), {
      ...data,
      createdAt: new Date().toISOString(),
      expenseDate: new Date().toISOString()
    });
  },

  async deleteExpense(id: string) {
    return await deleteDoc(doc(db, 'luxe_expenses', id));
  }
};