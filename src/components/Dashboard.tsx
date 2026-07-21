'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  LogOut, Mic, MicOff, Languages, Check, Settings
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { addExpense, updateFamilyBudget } from '@/app/actions';
import { createClient } from '@/utils/supabase/client';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend
} from 'recharts';

import { FamilyData } from './BudgetApp';

interface DashboardProps {
  initialData: FamilyData
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FFCC00', '#8E8E93'];

// Easy-to-understand Category Map with Large Emojis
const CATEGORY_ICONS: Record<string, string> = {
  Food: '🍔',
  Travel: '🚗',
  Shopping: '🛍️',
  Medical: '🏥',
  Bills: '🔌',
  Fuel: '⛽',
  Entertainment: '🎮',
  Other: '✨'
};

const translations = {
  en: {
    title: "Family Budget",
    cycle: "Cycle",
    day: "Day",
    of: "of",
    remaining: "Pocket Money Left",
    spent: "Spent",
    totalBudget: "Total Budget",
    extra: "Surprise Spendings 🎁",
    members: "Family Members 👥",
    recent: "Recent Taps 📜",
    noTransactions: "No spendings recorded yet!",
    paidBy: "Who paid?",
    splitWith: "Split between",
    ledgerTitle: "Who Owes Who? 🤝",
    ledgerDesc: "Green (+) gets money back. Red (-) pays back.",
    totalPaid: "Paid",
    splitShare: "Share",
    addExpense: "Add New Spending 💰",
    amount: "How much? 💵",
    category: "What for? 📦",
    description: "Short note 📝",
    date: "When? 📅",
    saveExpense: "Save to Piggybank 🐷",
    markExtra: "This is a special surprise expense (Skip normal budget)",
    voicePlaceholder: "Tap Mic and say: 'spent 500 on Food'",
    adjustBudgets: "Adjust Budgets ⚙️",
    editBudgetDesc: "Adjust cycle budgets for this month.",
    cycle1Label: "Cycle 1",
    cycle2Label: "Cycle 2",
    cycle3Label: "Cycle 3",
    saveBudget: "Save Budgets 🐷",
    monthlySavings: "Monthly Savings",
    monthlySpent: "Spent this Month",
    monthlyIncome: "Monthly Income",
    monthlyTransactions: "Month's Spendings 📅",
    noMonthlyTransactions: "No spendings recorded this month!",
    exportCSV: "Export CSV"
  },
  hi: {
    title: "पारिवारिक बजट",
    cycle: "चक्र",
    day: "दिन",
    of: "का",
    remaining: "बचे हुए पैसे",
    spent: "खर्च किया",
    totalBudget: "कुल बजट",
    extra: "विशेष खर्च 🎁",
    members: "परिवार के सदस्य 👥",
    recent: "हाल के खर्चे 📜",
    noTransactions: "अभी तक कोई खर्च नहीं किया!",
    paidBy: "किसने दिया?",
    splitWith: "किसके बीच बांटें?",
    ledgerTitle: "किसका कितना हिसाब? 🤝",
    ledgerDesc: "हरा (+) वापस मिलेगा। लाल (-) चुकाना है।",
    totalPaid: "दिया",
    splitShare: "हिस्सा",
    addExpense: "नया खर्च जोड़ें 💰",
    amount: "कितने पैसे? 💵",
    category: "किसलिए? 📦",
    description: "छोटा नोट 📝",
    date: "कब? 📅",
    saveExpense: "गुल्लक में डालें 🐷",
    markExtra: "यह एक विशेष अतिरिक्त खर्च है (बजट न घटाएं)",
    voicePlaceholder: "माइक दबाकर बोलें: 'भोजन पर 500 रुपये'",
    adjustBudgets: "बजट बदलें ⚙️",
    editBudgetDesc: "इस महीने के चक्र बजट को बदलें।",
    cycle1Label: "चक्र 1",
    cycle2Label: "चक्र 2",
    cycle3Label: "चक्र 3",
    saveBudget: "बजट बचाएं 🐷",
    monthlySavings: "मासिक बचत",
    monthlySpent: "इस महीने का खर्च",
    monthlyIncome: "मासिक आय",
    monthlyTransactions: "महीने के खर्चे 📅",
    noMonthlyTransactions: "इस महीने कोई खर्च दर्ज नहीं किया गया!",
    exportCSV: "निर्यात CSV"
  },
  gu: {
    title: "કૌટુંબિક બજેટ",
    cycle: "ચક્ર",
    day: "દિવસ",
    of: "નું",
    remaining: "બાકી રહેલા પૈસા",
    spent: "વાપરેલા પૈસા",
    totalBudget: "કુલ બજેટ",
    extra: "ખાસ ખર્ચ 🎁",
    members: "પરિવારના સભ્યો 👥",
    recent: "તાજેતરના ખર્ચાઓ 📜",
    noTransactions: "હજુ સુધી કોઈ ખર્ચ નથી થયો!",
    paidBy: "કોણે ચુકવ્યા?",
    splitWith: "કોની વચ્ચે વહેંચવું?",
    ledgerTitle: "કોનું કેટલું દેવું? 🤝",
    ledgerDesc: "લીલું (+) પાછા મળશે. લાલ (-) આપવાના રહેશે.",
    totalPaid: "ચુકવ્યા",
    splitShare: "ભાગ",
    addExpense: "નવો ખર્ચ ઉમેરો 💰",
    amount: "કેટલા પૈસા? 💵",
    category: "શેના માટે? 📦",
    description: "ટૂંકી નોંધ 📝",
    date: "ક્યારે? 📅",
    saveExpense: "ગલ્લાકમાં સાચવો 🐷",
    markExtra: "આ એક વિશેષ વધારાનો ખર્ચ છે",
    voicePlaceholder: "માઈક દબાવીને બોલો: 'ભોજન પર 500 રૂપિયા'",
    adjustBudgets: "બજેટ બદલો ⚙️",
    editBudgetDesc: "આ મહિના માટે ચક્ર બજેટ ગોઠવો.",
    cycle1Label: "ચક્ર ૧",
    cycle2Label: "ચક્ર ૨",
    cycle3Label: "ચક્ર ૩",
    saveBudget: "બજેટ સાચવો 🐷",
    monthlySavings: "માસિક બચત",
    monthlySpent: "આ મહિનાનો ખર્ચ",
    monthlyIncome: "માસિક આવક",
    monthlyTransactions: "મહિનાના ખર્ચાઓ 📅",
    noMonthlyTransactions: "આ મહિને કોઈ ખર્ચ નોંધાયેલ નથી!",
    exportCSV: "નિકાસ CSV"
  }
};

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionInstance {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: () => void
  onend: () => void
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionInstance
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance
}

export default function Dashboard({ initialData }: DashboardProps) {
  const { profile, members, expenses, logs } = initialData;
  const budget = initialData.budget!;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi' | 'gu'>('en');
  const [listening, setListening] = useState(false);
  const supabase = createClient();

  // Form State
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(profile?.id || '');
  const [selectedSplitMembers, setSelectedSplitMembers] = useState<string[]>(members.map(m => m.id));
  const [isExtraExpense, setIsExtraExpense] = useState(false);

  // Edit Budget State
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [editIncome, setEditIncome] = useState('');
  const [editCycle1, setEditCycle1] = useState('');
  const [editCycle2, setEditCycle2] = useState('');
  const [editCycle3, setEditCycle3] = useState('');

  const openEditBudget = () => {
    setEditIncome(budget.income.toString());
    setEditCycle1(budget.cycle_1_budget.toString());
    setEditCycle2(budget.cycle_2_budget.toString());
    setEditCycle3(budget.cycle_3_budget.toString());
    setEditBudgetOpen(true);
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateFamilyBudget({
        budgetId: budget.id,
        income: parseFloat(editIncome) || 0,
        cycle_1_budget: parseFloat(editCycle1) || 0,
        cycle_2_budget: parseFloat(editCycle2) || 0,
        cycle_3_budget: parseFloat(editCycle3) || 0
      });
      setEditBudgetOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Category", "Description", "Amount", "Paid By", "Split Members", "Type"];
    
    const rows = monthlyExpenses.map(expense => {
      const payer = members.find(m => m.id === expense.paid_by);
      const payerName = payer ? payer.name : 'Unknown';
      const splitNames = expense.split_members
        .map(id => members.find(m => m.id === id)?.name || 'Unknown')
        .join(', ');
      
      const category = expense.category;
      const description = expense.description || category;
      const amount = expense.amount.toString();
      const date = expense.date;
      const type = expense.is_extra_expense ? "Extra" : "Regular";
      
      const cleanField = (field: string) => {
        const escaped = field.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped;
      };

      return [
        cleanField(date),
        cleanField(category),
        cleanField(description),
        cleanField(amount),
        cleanField(payerName),
        cleanField(splitNames),
        cleanField(type)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const monthStr = (budget.month < 10 ? '0' : '') + budget.month;
    const filename = `family_budget_transactions_${budget.year}_${monthStr}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key];
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Voice Speech Parsing
  const handleVoiceEntry = () => {
    const SpeechRecognition = (window as unknown as WindowWithSpeech).SpeechRecognition || (window as unknown as WindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Google Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      parseVoiceInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
  };

  const parseVoiceInput = (text: string) => {
    const amountMatch = text.match(/\d+/);
    if (amountMatch) setAmount(amountMatch[0]);

    const categories = ['food', 'travel', 'shopping', 'medical', 'bills', 'fuel', 'entertainment', 'other'];
    const matchedCategory = categories.find(cat => text.includes(cat));
    if (matchedCategory) {
      setCategory(matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1));
    }

    if (text.includes('description') || text.includes('for')) {
      const splitWord = text.includes('description') ? 'description' : 'for';
      const descPart = text.split(splitWord)[1]?.trim();
      if (descPart) setDescription(descPart);
    } else {
      setDescription(text);
    }

    members.forEach(m => {
      if (text.includes(`paid by ${m.name.toLowerCase()}`) || text.includes(`${m.name.toLowerCase()} paid`)) {
        setPaidBy(m.id);
      }
    });
  };

  // Cycle calculations
  const currentDay = new Date().getDate();
  let currentCycle = 1;
  if (currentDay > 10 && currentDay <= 20) currentCycle = 2;
  else if (currentDay > 20) currentCycle = 3;

  const cycleBudgetField = `cycle_${currentCycle}_budget` as 'cycle_1_budget' | 'cycle_2_budget' | 'cycle_3_budget';
  const cycleBudget = Number(budget[cycleBudgetField]) || 0;

  const currentCycleExpenses = expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const day = expenseDate.getDate();
    let cycle = 1;
    if (day > 10 && day <= 20) cycle = 2;
    else if (day > 20) cycle = 3;
    return cycle === currentCycle && !e.is_extra_expense;
  });

  const spent = currentCycleExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const remaining = cycleBudget - spent;
  const percentage = Math.min((spent / cycleBudget) * 100, 100);

  const extraExpensesTotal = expenses
    .filter(e => e.is_extra_expense)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Monthly calculations
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const monthlyExpenses = expenses.filter(e => {
    const parts = e.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      return month === (budget.month || currentMonth) && year === (budget.year || currentYear);
    }
    return false;
  });

  const monthlySpent = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const monthlySavings = Number(budget.income) - monthlySpent;
  const monthlyPercentage = Math.min((monthlySpent / Number(budget.income)) * 100, 100);

  const formatExpenseDate = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const tempDate = new Date(Number(year), monthIndex, day);
      return tempDate.toLocaleDateString(lang === 'hi' ? 'hi-IN' : lang === 'gu' ? 'gu-IN' : 'en-US', { day: 'numeric', month: 'short' });
    }
    return dateStr;
  };

  // Split calculations
  const ledger = members.map(m => {
    let totalPaid = 0;
    let totalShare = 0;
    expenses.forEach(e => {
      if (e.is_extra_expense) return;
      if (e.paid_by === m.id) totalPaid += Number(e.amount);
      if (e.split_members.includes(m.id)) totalShare += Number(e.amount) / e.split_members.length;
    });
    return { ...m, paid: totalPaid, share: totalShare, balance: totalPaid - totalShare };
  });

  // Recharts
  const categoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.is_extra_expense) return;
    categoryMap[e.category] = (categoryMap[e.category] || 0) + Number(e.amount);
  });
  const categoryChartData = Object.keys(categoryMap).map(cat => ({ name: cat, value: categoryMap[cat] }));

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount),
        category,
        description: description || category,
        date,
        paid_by: paidBy,
        split_members: selectedSplitMembers,
        cycle: currentCycle,
        is_extra_expense: isExtraExpense
      });
      setOpen(false);
      setAmount('');
      setDescription('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedSplitMembers(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-6 md:p-8 select-none">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Kid-friendly chunky Header */}
        <header className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xl">
              🐷
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{t('title')}</h1>
              <p className="text-[11px] text-zinc-500 font-semibold uppercase">
                {t('cycle')} {currentCycle} • {t('day')} {currentDay}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={lang} onValueChange={(v) => { if (v) setLang(v); }}>
              <SelectTrigger className="w-[75px] h-8 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl text-xs font-bold">
                <Languages className="w-3.5 h-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">EN</SelectItem>
                <SelectItem value="hi">HI</SelectItem>
                <SelectItem value="gu">GU</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="icon" onClick={openEditBudget} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-500 rounded-xl">
              <Settings className="w-4 h-4 text-zinc-500" />
            </Button>

            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 hover:bg-red-50 hover:text-red-500 rounded-xl">
              <LogOut className="w-4 h-4 text-zinc-500" />
            </Button>
          </div>
        </header>

        {/* Tab Selection: Rounded, Chunky pill layout */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-5 bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl h-12">
            <TabsTrigger value="overview" className="rounded-xl text-xs font-bold py-2">🏠</TabsTrigger>
            <TabsTrigger value="monthly" className="rounded-xl text-xs font-bold py-2">📅</TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl text-xs font-bold py-2">📊</TabsTrigger>
            <TabsTrigger value="ledger" className="rounded-xl text-xs font-bold py-2">🤝</TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl text-xs font-bold py-2">📜</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-4 outline-none">
            {/* Pocket Money Display Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-500 text-white border-none shadow-xl rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-9xl opacity-10 select-none">💳</div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-100">{t('remaining')}</span>
              <h2 className="text-4xl font-extrabold mt-1 tracking-tight">{budget.currency}{remaining.toLocaleString()}</h2>
              
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-xs font-bold text-blue-100">
                  <span>{t('spent')}: {budget.currency}{spent.toLocaleString()}</span>
                  <span>{t('totalBudget')}: {budget.currency}{cycleBudget.toLocaleString()}</span>
                </div>
                <Progress value={percentage} className="h-3 bg-white/20 rounded-full" />
              </div>
            </Card>

            {/* Micro Widgets */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="text-2xl mb-1">🎁</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{t('extra')}</span>
                <span className="text-lg font-extrabold mt-0.5 text-zinc-900 dark:text-zinc-100">{budget.currency}{extraExpensesTotal.toLocaleString()}</span>
              </Card>

              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="text-2xl mb-1">👥</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{t('members')}</span>
                <span className="text-lg font-extrabold mt-0.5 text-zinc-900 dark:text-zinc-100">{members.length}</span>
              </Card>
            </div>

            {/* Simplified Kid-friendly Transactions List */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">🍔 {t('recent')}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[200px] pr-2">
                  <div className="space-y-3">
                    {expenses.length === 0 ? (
                      <p className="text-zinc-400 text-center text-sm py-8 font-semibold">{t('noTransactions')}</p>
                    ) : (
                      expenses.map((expense) => {
                        const payer = members.find(m => m.id === expense.paid_by);
                        const emoji = CATEGORY_ICONS[expense.category] || '✨';
                        return (
                          <div key={expense.id} className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{emoji}</span>
                              <div>
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{expense.description || expense.category}</p>
                                <p className="text-[10px] text-zinc-400 font-bold">
                                  {t('paidBy')} {payer?.name} • {expense.split_members.length} {t('members')}
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">{budget.currency}{expense.amount}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MONTHLY SUMMARY TAB */}
          <TabsContent value="monthly" className="space-y-4 outline-none">
            {/* Monthly Savings Display Card */}
            <Card className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white border-none shadow-xl rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-9xl opacity-10 select-none">🐷</div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">{t('monthlySavings')}</span>
              <h2 className="text-4xl font-extrabold mt-1 tracking-tight">
                {budget.currency}{monthlySavings.toLocaleString()}
              </h2>
              
              <div className="space-y-2 mt-6">
                <div className="flex justify-between text-xs font-bold text-indigo-100">
                  <span>{t('monthlySpent')}: {budget.currency}{monthlySpent.toLocaleString()}</span>
                  <span>{t('monthlyIncome')}: {budget.currency}{Number(budget.income).toLocaleString()}</span>
                </div>
                <Progress value={monthlyPercentage} className="h-3 bg-white/20 rounded-full" />
              </div>
            </Card>

            {/* Micro Widgets */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="text-2xl mb-1">💰</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{t('monthlyIncome')}</span>
                <span className="text-lg font-extrabold mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {budget.currency}{Number(budget.income).toLocaleString()}
                </span>
              </Card>

              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 p-4 rounded-2xl flex flex-col items-center text-center">
                <span className="text-2xl mb-1">💸</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{t('monthlySpent')}</span>
                <span className="text-lg font-extrabold mt-0.5 text-zinc-900 dark:text-zinc-100">
                  {budget.currency}{monthlySpent.toLocaleString()}
                </span>
              </Card>
            </div>

            {/* Monthly Transactions List */}
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl p-4">
              <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-bold flex items-center gap-2">📅 {t('monthlyTransactions')}</CardTitle>
                <Button 
                  onClick={handleExportCSV} 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-xl text-[10px] font-extrabold gap-1 px-2.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  📥 {t('exportCSV')}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-3">
                    {monthlyExpenses.length === 0 ? (
                      <p className="text-zinc-400 text-center text-sm py-8 font-semibold">{t('noMonthlyTransactions')}</p>
                    ) : (
                      monthlyExpenses.map((expense) => {
                        const payer = members.find(m => m.id === expense.paid_by);
                        const emoji = CATEGORY_ICONS[expense.category] || '✨';
                        return (
                          <div key={expense.id} className="flex justify-between items-center p-2.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-2xl">{emoji}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{expense.description || expense.category}</p>
                                <p className="text-[10px] text-zinc-400 font-bold">
                                  {t('paidBy')} {payer?.name} • {expense.split_members.length} {t('members')}
                                </p>
                                <div className="flex gap-1.5 mt-1 flex-wrap">
                                  <span className="text-[9px] bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold px-1.5 py-0.5 rounded-md">
                                    {t('cycle')} {expense.cycle}
                                  </span>
                                  {expense.is_extra_expense && (
                                    <span className="text-[9px] bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 font-bold px-1.5 py-0.5 rounded-md">
                                      🎁 Extra
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end justify-between self-stretch gap-2 pl-2 shrink-0">
                              <span className="text-sm font-extrabold text-zinc-950 dark:text-zinc-50">{budget.currency}{expense.amount}</span>
                              <span className="text-[9px] font-bold text-zinc-400">{formatExpenseDate(expense.date)}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-4 outline-none">
            {mounted && categoryChartData.length > 0 ? (
              <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl p-4">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold">📊 Budget Charts</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${budget.currency}${value}`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ) : (
              <p className="text-zinc-400 text-center py-12 font-semibold">No chart data yet!</p>
            )}
          </TabsContent>

          {/* LEDGER TAB */}
          <TabsContent value="ledger" className="space-y-4 outline-none">
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base font-bold">{t('ledgerTitle')}</CardTitle>
                <CardDescription className="text-xs">{t('ledgerDesc')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-3">
                    {ledger.map(member => (
                      <div key={member.id} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                            {member.name.substring(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{member.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold">{t('totalPaid')}: {budget.currency}{member.paid.toFixed(0)}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-black ${member.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {member.balance >= 0 ? '+' : ''}{budget.currency}{member.balance.toFixed(0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY TAB */}
          <TabsContent value="history" className="space-y-4 outline-none">
            <Card className="border-none shadow-sm bg-white dark:bg-zinc-900 rounded-3xl p-4">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="text-base font-bold">📜 Action Log</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px] pr-2">
                  <div className="space-y-3">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-xs space-y-1">
                        <span className="font-semibold text-zinc-500 block">{new Date(log.created_at).toLocaleTimeString()}</span>
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">
                          {log.action === 'SETUP_BUDGET' ? '🐷 Piggybank Setup Done' : `${log.details?.paid_by_name || 'Member'} added ${budget.currency}${log.details?.amount} (${log.details?.category})`}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Big Giant Pulse Add Button */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all bg-blue-600 hover:bg-blue-700 text-white border-none flex items-center justify-center text-3xl animate-bounce">
            ➕
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-3xl p-6">
            <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <DialogTitle className="text-lg font-bold">{t('addExpense')}</DialogTitle>
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                onClick={handleVoiceEntry} 
                className={`h-10 w-10 rounded-full ${listening ? 'text-red-500 animate-pulse bg-red-50' : 'text-zinc-500 bg-zinc-100'}`}
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            </DialogHeader>

            <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
              {listening && (
                <div className="text-xs text-red-500 font-bold text-center bg-red-50 py-2 rounded-xl border border-red-100 animate-pulse">
                  🎙️ Listening... Speak now!
                </div>
              )}

              {/* Easy-to-use Emojis Selector Grid (Instantly choose categories with one tap) */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-500 uppercase">{t('category')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.keys(CATEGORY_ICONS).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-2xl flex flex-col items-center gap-1 border text-xs font-bold transition-all ${category === cat ? 'bg-blue-600 border-blue-600 text-white scale-105' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'}`}
                    >
                      <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                      <span>{cat}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-xs font-bold text-zinc-500 uppercase">{t('amount')}</Label>
                  <Input 
                    id="amount" 
                    type="number" 
                    placeholder="💵 1000" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 rounded-2xl font-black text-lg"
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paidBy" className="text-xs font-bold text-zinc-500 uppercase">{t('paidBy')}</Label>
                  <Select value={paidBy} onValueChange={(v) => { if (v) setPaidBy(v); }}>
                    <SelectTrigger className="h-12 rounded-2xl text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase">{t('description')}</Label>
                <Input 
                  id="description" 
                  placeholder="📝 Dinner, taxi, movies..." 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-12 rounded-2xl font-semibold"
                />
              </div>

              {/* Split selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-zinc-500 uppercase">{t('splitWith')}</Label>
                <div className="flex flex-wrap gap-2 p-2 border rounded-2xl bg-zinc-50 dark:bg-zinc-900">
                  {members.map(m => {
                    const selected = selectedSplitMembers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleMember(m.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${selected ? 'bg-green-600 border-green-600 text-white' : 'bg-white dark:bg-zinc-800 border-zinc-200'}`}
                      >
                        {selected && <Check className="w-3.5 h-3.5" />}
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="extra" 
                  checked={isExtraExpense}
                  onCheckedChange={(checked) => setIsExtraExpense(!!checked)}
                />
                <label htmlFor="extra" className="text-xs font-bold leading-none cursor-pointer text-zinc-500">
                  {t('markExtra')}
                </label>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg" disabled={loading}>
                {loading ? 'Saving...' : t('saveExpense')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
        <Dialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
          <DialogContent className="max-w-[90vw] sm:max-w-[425px] rounded-3xl p-6">
            <DialogHeader className="border-b pb-2">
              <DialogTitle className="text-lg font-bold">{t('adjustBudgets')}</DialogTitle>
              <DialogDescription className="text-xs">{t('editBudgetDesc')}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleUpdateBudget} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="editIncome" className="text-xs font-bold text-zinc-500 uppercase">{t('totalBudget')}</Label>
                <Input 
                  id="editIncome" 
                  type="number" 
                  value={editIncome}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditIncome(val);
                    const parsed = parseFloat(val) || 0;
                    const split = (parsed / 3).toFixed(0);
                    setEditCycle1(split);
                    setEditCycle2(split);
                    setEditCycle3((parsed - parseFloat(split)*2).toFixed(0));
                  }}
                  className="h-12 rounded-2xl font-black text-lg"
                  required 
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="editCycle1" className="text-[10px] font-bold text-zinc-500 uppercase">{t('cycle1Label')}</Label>
                  <Input 
                    id="editCycle1" 
                    type="number" 
                    value={editCycle1}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditCycle1(v);
                      const c1Val = parseFloat(v) || 0;
                      const c2Val = parseFloat(editCycle2) || 0;
                      const c3Val = parseFloat(editCycle3) || 0;
                      setEditIncome((c1Val + c2Val + c3Val).toString());
                    }}
                    className="h-12 rounded-2xl font-bold text-sm text-center"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCycle2" className="text-[10px] font-bold text-zinc-500 uppercase">{t('cycle2Label')}</Label>
                  <Input 
                    id="editCycle2" 
                    type="number" 
                    value={editCycle2}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditCycle2(v);
                      const c1Val = parseFloat(editCycle1) || 0;
                      const c2Val = parseFloat(v) || 0;
                      const c3Val = parseFloat(editCycle3) || 0;
                      setEditIncome((c1Val + c2Val + c3Val).toString());
                    }}
                    className="h-12 rounded-2xl font-bold text-sm text-center"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCycle3" className="text-[10px] font-bold text-zinc-500 uppercase">{t('cycle3Label')}</Label>
                  <Input 
                    id="editCycle3" 
                    type="number" 
                    value={editCycle3}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditCycle3(v);
                      const c1Val = parseFloat(editCycle1) || 0;
                      const c2Val = parseFloat(editCycle2) || 0;
                      const c3Val = parseFloat(v) || 0;
                      setEditIncome((c1Val + c2Val + c3Val).toString());
                    }}
                    className="h-12 rounded-2xl font-bold text-sm text-center"
                    required 
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-base shadow-lg" disabled={loading}>
                {loading ? 'Saving...' : t('saveBudget')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
