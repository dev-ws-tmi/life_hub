import { useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/shared/lib/firebase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useShoppingStore, type ShoppingItem, type Purchase } from '@/shared/stores/useShoppingStore';

export function useShoppingSync() {
  const { user } = useAuth();
  const store = useShoppingStore();

  useEffect(() => {
    if (!user?.uid) {
      store.setItems([]);
      store.setPurchases([]);
      store.setLoading(false);
      return;
    }

    store.setLoading(true);

    const shoppingDocRef = doc(db, 'users', user.uid, 'shopping', 'data');
    
    // Sync active items
    const itemsCollection = collection(shoppingDocRef, 'items');
    const qItems = query(itemsCollection, orderBy('updatedAt', 'desc'));
    
    const unsubscribeItems = onSnapshot(
      qItems,
      (snapshot) => {
        const itemsList: ShoppingItem[] = [];
        snapshot.forEach((docSnap) => {
          itemsList.push({ id: docSnap.id, ...docSnap.data() } as ShoppingItem);
        });
        store.setItems(itemsList);
      },
      (error) => {
        if (error.code === 'permission-denied') return;
        console.error('Error syncing shopping items:', error);
      }
    );

    // Sync past purchases
    const purchasesCollection = collection(shoppingDocRef, 'purchases');
    const qPurchases = query(purchasesCollection, orderBy('date', 'desc'));

    const unsubscribePurchases = onSnapshot(
      qPurchases,
      (snapshot) => {
        const purchasesList: Purchase[] = [];
        snapshot.forEach((docSnap) => {
          purchasesList.push({ id: docSnap.id, ...docSnap.data() } as Purchase);
        });
        store.setPurchases(purchasesList);
        store.setLoading(false);
      },
      (error) => {
        if (error.code === 'permission-denied') return;
        console.error('Error syncing past purchases:', error);
        store.setLoading(false);
      }
    );

    return () => {
      unsubscribeItems();
      unsubscribePurchases();
    };
  }, [user?.uid]);
}
