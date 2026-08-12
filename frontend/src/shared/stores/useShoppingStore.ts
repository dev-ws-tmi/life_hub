import { create } from 'zustand';

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  price: number;
  checked: boolean;
  important: boolean;
  notes: string;
  updatedAt: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  price: number;
  category: string;
}

export interface Purchase {
  id: string;
  supermarket: string;
  date: string;
  total: number;
  items: PurchaseItem[];
  createdAt: string;
}

interface ShoppingState {
  items: ShoppingItem[];
  purchases: Purchase[];
  loading: boolean;
  
  // Setters
  setItems: (items: ShoppingItem[]) => void;
  setPurchases: (purchases: Purchase[]) => void;
  setLoading: (loading: boolean) => void;
  
  // Actions
  addItem: (item: Omit<ShoppingItem, 'id' | 'updatedAt' | 'checked'>) => ShoppingItem;
  updateItem: (id: string, data: Partial<ShoppingItem>) => void;
  deleteItem: (id: string) => void;
  toggleItemChecked: (id: string) => void;
  clearCheckedItems: () => void;
  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt'>) => Purchase;
}

export const useShoppingStore = create<ShoppingState>((set) => ({
  items: [],
  purchases: [],
  loading: true,
  
  setItems: (items) => set({ items }),
  setPurchases: (purchases) => set({ purchases }),
  setLoading: (loading) => set({ loading }),
  
  addItem: (itemData) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: `shop_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      checked: false,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ items: [...state.items, newItem] }));
    return newItem;
  },
  
  updateItem: (id, data) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
    )
  })),
  
  deleteItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id)
  })),
  
  toggleItemChecked: (id) => set((state) => ({
    items: state.items.map((item) => 
      item.id === id ? { ...item, checked: !item.checked, updatedAt: new Date().toISOString() } : item
    )
  })),
  
  clearCheckedItems: () => set((state) => ({
    items: state.items.filter((item) => !item.checked)
  })),

  addPurchase: (purchaseData) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `pur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ purchases: [newPurchase, ...state.purchases] }));
    return newPurchase;
  },
}));
