import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { 
  GraduationCap, Briefcase, Mic, Gavel, Stethoscope, Landmark, Zap, 
  Cpu, Shield, Plane, Sun, Coins, Calculator, BookOpen, PenTool, Radio, Globe
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  isLoading: boolean;
}

// قائمة شاملة لتخصصات سوق العمل السعودي
const MAJORS = [
  { id: 'general', label: 'مسار عام (تطوير ذاتي)', icon: Globe }, // Added General Path
  { id: 'tech', label: 'تقنية المعلومات وعلوم الحاسب', icon: Cpu },
  { id: 'cyber', label: 'الأمن السيبراني', icon: Shield },
  { id: 'ai', label: 'الذكاء الاصطناعي والبيانات', icon: Zap },
  { id: 'business', label: 'إدارة الأعمال والموارد البشرية', icon: Briefcase },
  { id: 'finance', label: 'المالية والمحاسبة', icon: Calculator },
  { id: 'marketing', label: 'التسويق والإعلام الرقمي', icon: Radio },
  { id: 'engineering', label: 'الهندسة (مدني، معماري، ميكانيكا)', icon: PenTool },
  { id: 'energy', label: 'الطاقة المتجددة والاستدامة', icon: Sun },
  { id: 'health', label: 'الطب والعلوم الصحية', icon: Stethoscope },
  { id: 'law', label: 'القانون والأنظمة', icon: Gavel },
  { id: 'tourism', label: 'السياحة والضيافة', icon: Plane },
  { id: 'education', label: 'التعليم والتدريب', icon: BookOpen },
  { id: 'arts', label: 'الآداب والعلوم الإنسانية', icon: Landmark },
  { id: 'logistics', label: 'سلاسل الإمداد والخدمات اللوجستية', icon: Coins },
];

const SKILLS = [
  { id: 'negotiation', label: 'التفاوض والإقناع', icon: GraduationCap },
  { id: 'leadership', label: 'القيادة واتخاذ القرار', icon: Briefcase },
  { id: 'public_speaking', label: 'الإلقاء والعرض التقديمي', icon: Mic },
  { id: 'conflict_resolution', label: 'حل النزاعات والمشكلات', icon: Gavel },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isLoading }) => {
  const [name, setName] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedMajor && selectedSkill) {
      onComplete({
        name,
        major: MAJORS.find(m => m.id === selectedMajor)?.label || selectedMajor,
        targetSkill: SKILLS.find(s => s.id === selectedSkill)?.label || selectedSkill,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-fade-in-up">
      <div className="text-center mb-10 flex flex-col items-center">
        <Logo size="lg" className="mb-6 drop-shadow-2xl" />
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          أهلاً بك في <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary-400 to-blue-500">منطلق</span>
        </h1>
        <p className="text-slate-400 text-lg">منصتك الذكية للتدريب والمحاكاة المهنية في سوق العمل</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ما هو اسمك؟</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-slate-600"
              placeholder="الاسم الكريم"
              required
            />
          </div>

          {/* Major Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">اختر تخصصك الدراسي / المهني</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MAJORS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedMajor(item.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all min-h-[100px] justify-center text-center ${
                    selectedMajor === item.id
                      ? 'border-primary-500 bg-primary-900/20 text-primary-400 ring-1 ring-primary-500 shadow-lg shadow-primary-900/20'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <item.icon className={`w-6 h-6 ${selectedMajor === item.id ? 'text-primary-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Skill Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">ما هي المهارة التي تريد التدرب عليها؟</label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {SKILLS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedSkill(item.id)}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all ${
                    selectedSkill === item.id
                      ? 'border-secondary-500 bg-secondary-900/20 text-secondary-400 ring-1 ring-secondary-500'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <div className={`p-2 rounded-full ${selectedSkill === item.id ? 'bg-secondary-900/50 text-secondary-400' : 'bg-slate-900 text-slate-500'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full text-lg py-4" 
            isLoading={isLoading}
            disabled={!name || !selectedMajor || !selectedSkill}
          >
            {isLoading ? 'جاري إعداد الجلسة...' : 'ابدأ رحلة التدريب'}
          </Button>
        </form>
      </Card>
    </div>
  );
};