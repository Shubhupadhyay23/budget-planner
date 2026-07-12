import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type Cycle = 1 | 2 | 3;

export interface Member {
  id: string;
  name: string;
  paid: number;
  share: number;
  balance: number;
}

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paidBy: string;
  splitMembers: string[];
  cycle: Cycle;
  isExtraExpense: boolean;
}

export interface Budget {
  month: number;
  year: number;
  income: number;
  currency: string;
  cycleBudgets: Record<Cycle, number>;
}

interface AppState {
  budget: Budget | null;
  members: Member[];
  expenses: Expense[];
  savings: number;
  extraExpenses: Expense[];
  
  // Actions
  setBudget: (budget: Budget) => void;
  addMember: (name: string) => void;
  removeMember: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  removeExpense: (id: string) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      budget: null,
      members: [],
      expenses: [],
      savings: 0,
      extraExpenses: [],
      
      setBudget: (budget) => set({ budget }),
      
      addMember: (name) => set((state) => ({
        members: [...state.members, { id: uuidv4(), name, paid: 0, share: 0, balance: 0 }]
      })),
      
      removeMember: (id) => set((state) => ({
        members: state.members.filter(m => m.id !== id)
      })),
      
      addExpense: (expense) => set((state) => {
        const newExpense = { ...expense, id: uuidv4() };
        let newMembers = [...state.members];
        
        // Update member balances if it's a split expense
        if (!expense.isExtraExpense && expense.splitMembers.length > 0) {
          const splitAmount = expense.amount / expense.splitMembers.length;
          
          newMembers = newMembers.map(m => {
            const updated = { ...m };
            if (m.id === expense.paidBy) {
              updated.paid += expense.amount;
            }
            if (expense.splitMembers.includes(m.id)) {
              updated.share += splitAmount;
            }
            updated.balance = updated.paid - updated.share;
            return updated;
          });
        }
        
        return {
          expenses: [...state.expenses, newExpense],
          members: newMembers,
          extraExpenses: expense.isExtraExpense 
            ? [...state.extraExpenses, newExpense] 
            : state.extraExpenses
        };
      }),
      
      removeExpense: (id) => set((state) => {
        // Implement reverse ledger logic if needed later
        return {
          expenses: state.expenses.filter(e => e.id !== id)
        };
      }),
      
      resetAll: () => set({ budget: null, members: [], expenses: [], savings: 0, extraExpenses: [] })
    }),
    {
      name: 'budget-planner-storage',
    }
  )
);
