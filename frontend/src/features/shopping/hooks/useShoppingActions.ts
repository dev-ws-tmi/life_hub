import { doc, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useShoppingStore, type ShoppingItem, type Purchase } from '@/shared/stores/useShoppingStore';

// Helper to remove undefined properties recursively or replace with null for Firestore
function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined);
  
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    newObj[key] = val === undefined ? null : cleanUndefined(val);
  });
  return newObj;
}

export function useShoppingActions() {
  const { user } = useAuth();
  const store = useShoppingStore();

  const getDocRef = (subcollection: string, docId: string) => {
    if (!user?.uid) return null;
    const shoppingDocRef = doc(db, 'users', user.uid, 'shopping', 'data');
    const itemsCollection = collection(shoppingDocRef, subcollection);
    return doc(itemsCollection, docId);
  };

  const addItem = async (itemData: Omit<ShoppingItem, 'id' | 'updatedAt' | 'checked'>) => {
    const newItem = store.addItem(itemData);
    const dRef = getDocRef('items', newItem.id);
    if (dRef) {
      await setDoc(dRef, cleanUndefined(newItem));
    }
    return newItem;
  };

  const updateItem = async (id: string, data: Partial<ShoppingItem>) => {
    store.updateItem(id, data);
    const dRef = getDocRef('items', id);
    if (dRef) {
      await updateDoc(dRef, cleanUndefined({
        ...data,
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const deleteItem = async (id: string) => {
    store.deleteItem(id);
    const dRef = getDocRef('items', id);
    if (dRef) {
      await deleteDoc(dRef);
    }
  };

  const toggleItemChecked = async (id: string) => {
    store.toggleItemChecked(id);
    const item = store.items.find(i => i.id === id);
    if (item) {
      const dRef = getDocRef('items', id);
      if (dRef) {
        await updateDoc(dRef, {
          checked: !item.checked,
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  const clearCheckedItems = async () => {
    const checkedItems = store.items.filter(i => i.checked);
    store.clearCheckedItems();
    
    for (const item of checkedItems) {
      const dRef = getDocRef('items', item.id);
      if (dRef) {
        await deleteDoc(dRef);
      }
    }
  };

  const addPurchase = async (purchaseData: Omit<Purchase, 'id' | 'createdAt'>) => {
    const newPurchase = store.addPurchase(purchaseData);
    const dRef = getDocRef('purchases', newPurchase.id);
    if (dRef) {
      await setDoc(dRef, cleanUndefined(newPurchase));
    }
    return newPurchase;
  };

  const deletePurchase = async (id: string) => {
    // Delete local first
    store.setPurchases(store.purchases.filter(p => p.id !== id));
    const dRef = getDocRef('purchases', id);
    if (dRef) {
      await deleteDoc(dRef);
    }
  };

  return {
    addItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    clearCheckedItems,
    addPurchase,
    deletePurchase,
  };
}
