'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { setupFamilyBudget } from '@/app/actions';

interface OnboardingProps {
  onComplete: () => void
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [income, setIncome] = useState('');
  const [currency, setCurrency] = useState('₹');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [members, setMembers] = useState([{ id: 1, name: 'Admin' }]);
  const [loading, setLoading] = useState(false);
  const [cycle1, setCycle1] = useState('');
  const [cycle2, setCycle2] = useState('');
  const [cycle3, setCycle3] = useState('');

  const handleIncomeChange = (val: string) => {
    setIncome(val);
    const parsed = parseFloat(val) || 0;
    const split = (parsed / 3).toFixed(0);
    setCycle1(split);
    setCycle2(split);
    setCycle3((parsed - parseFloat(split)*2).toFixed(0));
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const addMember = () => {
    setMembers([...members, { id: Date.now(), name: '' }]);
  };

  const removeMember = (id: number) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const updateMember = (id: number, name: string) => {
    setMembers(members.map(m => m.id === id ? { ...m, name } : m));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const names = members.map(m => m.name.trim()).filter(Boolean);
      await setupFamilyBudget({
        income: parseFloat(income),
        currency,
        month,
        year,
        members: names,
        cycle_1_budget: parseFloat(cycle1) || 0,
        cycle_2_budget: parseFloat(cycle2) || 0,
        cycle_3_budget: parseFloat(cycle3) || 0
      });
      onComplete();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-2xl border-none bg-card/80 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Budget Setup</CardTitle>
          <CardDescription>Configure your monthly family budget in Supabase.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-hidden min-h-[300px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>Monthly Income / Budget</Label>
                  <div className="flex gap-2">
                    <Select value={currency} onValueChange={(v) => { if (v) setCurrency(v); }}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="₹">₹ INR</SelectItem>
                        <SelectItem value="$">$ USD</SelectItem>
                        <SelectItem value="€">€ EUR</SelectItem>
                        <SelectItem value="£">£ GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      type="number" 
                      placeholder="24000" 
                      value={income}
                      onChange={(e) => handleIncomeChange(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Month</Label>
                    <Select value={month.toString()} onValueChange={(v) => { if (v) setMonth(parseInt(v)); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 12}).map((_, i) => (
                          <SelectItem key={i+1} value={(i+1).toString()}>
                            {new Date(0, i).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Year</Label>
                    <Select value={year.toString()} onValueChange={(v) => { if (v) setYear(parseInt(v)); }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[year, year+1].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Label>Family Members</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {members.map((member, index) => (
                    <div key={member.id} className="flex gap-2 items-center">
                      <Input 
                        placeholder={index === 0 ? "Admin (Me)" : "e.g. Mother, Brother"} 
                        value={member.name}
                        disabled={index === 0}
                        onChange={(e) => updateMember(member.id, e.target.value)}
                      />
                      {index > 0 && (
                        <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-2" onClick={addMember}>
                  <Plus className="w-4 h-4 mr-2" /> Add Member
                </Button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6 text-center py-4"
              >
                <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-medium">All Set!</h3>
                <p className="text-muted-foreground text-sm">
                  Customize the pocket money for each cycle if needed:
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4 text-left">
                  {[1, 2, 3].map(c => {
                    const val = c === 1 ? cycle1 : c === 2 ? cycle2 : cycle3;
                    const setVal = c === 1 ? setCycle1 : c === 2 ? setCycle2 : setCycle3;
                    return (
                      <div key={c} className="bg-secondary p-3 rounded-2xl flex flex-col gap-1 items-center">
                        <span className="text-xs text-muted-foreground font-bold">Cycle {c}</span>
                        <div className="flex items-center w-full">
                          <span className="text-sm font-bold text-muted-foreground mr-0.5">{currency}</span>
                          <Input 
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const v = e.target.value;
                              setVal(v);
                              const c1Val = c === 1 ? parseFloat(v) || 0 : parseFloat(cycle1) || 0;
                              const c2Val = c === 2 ? parseFloat(v) || 0 : parseFloat(cycle2) || 0;
                              const c3Val = c === 3 ? parseFloat(v) || 0 : parseFloat(cycle3) || 0;
                              setIncome((c1Val + c2Val + c3Val).toString());
                            }}
                            className="h-8 p-1 text-center font-extrabold text-sm"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={handleBack} disabled={loading}>Back</Button>
          ) : <div></div>}
          
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!income || (step === 2 && members.some(m => !m.name.trim()))}>
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleComplete} className="w-full" disabled={loading}>
              {loading ? 'Creating Workspace...' : 'Get Started'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
