import { collection, getDocs, addDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { db } from '../firebase';

export const productService = {
  async getProducts() {
    const q = query(collection(db, 'luxe_products'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async createProduct(data: any) {
    // حساب إجمالي الكمية من مصفوفة المقاسات
    const totalQty = data.variants?.reduce((sum: number, v: any) => sum + parseInt(v.quantity || 0), 0) || 0;
    
    return await addDoc(collection(db, 'luxe_products'), {
      ...data,
      quantity: totalQty, // الكمية الإجمالية للمخزون
      variants: data.variants || [], 
      createdAt: new Date().toISOString()
    });
  },

  async deleteProduct(id: string) {
    return await deleteDoc(doc(db, 'luxe_products', id));
  }
};