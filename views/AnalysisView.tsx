import React from 'react';
import { AnalysisResult, UserProfile } from '../types';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Logo } from '../components/Logo';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { CheckCircle, AlertCircle, TrendingUp, RefreshCcw, Printer, Activity, User, MessageSquare } from 'lucide-react';

interface AnalysisViewProps {
  result: AnalysisResult;
  profile: UserProfile;
  onRestart: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ result, profile, onRestart }) => {
  
  const chartData = result.skillScores.map(s => ({
    subject: s.skill,
    A: s.score,
    fullMark: 100,
  }));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 print:text-emerald-700';
    if (score >= 60) return 'text-yellow-400 print:text-yellow-700';
    return 'text-red-400 print:text-red-700';
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto w-full animate-fade-in pb-12 print:pb-0">
      {/* Header Summary */}
      <div className="bg-slate-900 print:bg-white rounded-2xl p-8 shadow-lg shadow-black/20 border border-slate-800 print:border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden print:shadow-none">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-secondary-500 print:hidden"></div>
        <div className="flex items-center gap-6">
            <div className="hidden md:block print:block">
                <Logo size="lg" showText={false} className="print:text-slate-900" />
            </div>
            <div>
            <h1 className="text-3xl font-bold text-white print:text-slate-900 mb-2">تقرير الأداء الشخصي</h1>
            <div className="flex items-center gap-3 text-slate-400 print:text-slate-600 text-sm">
                <span className="px-3 py-1 rounded-full bg-slate-800 print:bg-slate-100 border border-slate-700 print:border-slate-300">{profile.name}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="px-3 py-1 rounded-full bg-slate-800 print:bg-slate-100 border border-slate-700 print:border-slate-300">{profile.major}</span>
            </div>
            </div>
        </div>

        <div className="flex items-center gap-6 print:hidden">
          <div className="text-center">
            <span className="block text-sm text-slate-500 font-semibold uppercase mb-1">التقييم العام</span>
            <div className={`text-5xl font-extrabold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}<span className="text-2xl text-slate-600">%</span>
            </div>
          </div>
          <div className="w-px h-16 bg-slate-800"></div>
          <Button variant="outline" onClick={handlePrint} className="h-12 w-12 rounded-full p-0 flex items-center justify-center border-slate-700 text-slate-300 hover:bg-slate-800" title="طباعة التقرير">
            <Printer className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Printable Score (visible only in print) */}
        <div className="hidden print:block text-right">
             <span className="block text-sm text-slate-600 font-semibold uppercase mb-1">التقييم العام</span>
             <div className="text-5xl font-extrabold text-slate-900">
              {result.overallScore}%
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Column 1: Visual Analytics */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="خريطة المهارات" className="min-h-[350px] print:border-slate-200 print:bg-white print:shadow-none">
            <div className="h-[250px] w-full -mr-4 print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="الأداء" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
                {result.skillScores.map((skill, idx) => (
                    <div key={idx} className="text-sm border-b border-slate-800 print:border-slate-200 pb-2 last:border-0">
                        <div className="flex justify-between mb-1">
                            <span className="font-semibold text-slate-300 print:text-slate-800">{skill.skill}</span>
                            <span className="font-bold text-primary-400 print:text-primary-700">{skill.score}/100</span>
                        </div>
                        <p className="text-slate-500 print:text-slate-600 text-xs">{skill.feedback}</p>
                    </div>
                ))}
            </div>
          </Card>

          <Card title="تحليل لغة الجسد (AI Vision)" className="print:border-slate-200 print:bg-white print:shadow-none">
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-800 print:bg-slate-100 text-primary-400 print:text-primary-700 rounded-lg"><User className="w-4 h-4" /></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200 print:text-slate-800">التواصل البصري</h4>
                  <p className="text-sm text-slate-400 print:text-slate-600">{result.bodyLanguageAnalysis.eyeContact}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="p-2 bg-slate-800 print:bg-slate-100 text-primary-400 print:text-primary-700 rounded-lg"><Activity className="w-4 h-4" /></div>
                <div>
                  <h4 className="font-bold text-sm text-slate-200 print:text-slate-800">وضعية الجسم</h4>
                  <p className="text-sm text-slate-400 print:text-slate-600">{result.bodyLanguageAnalysis.posture}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Column 2: Detailed Feedback */}
        <div className="lg:col-span-2 space-y-6">
            <Card title="ملخص المدرب الذكي" className="print:border-slate-200 print:bg-white print:shadow-none">
                <p className="text-slate-300 print:text-slate-700 leading-relaxed text-lg bg-slate-950/50 print:bg-slate-50 p-4 rounded-xl border border-slate-800 print:border-slate-200">
                    {result.summary}
                </p>
                
                <div className="mt-6 flex items-start gap-4 p-4 bg-primary-900/10 print:bg-slate-50 border border-primary-900/30 print:border-slate-200 rounded-xl">
                   <div className="p-2 bg-slate-800 print:bg-slate-200 rounded-full shadow-sm">
                        <MessageSquare className="w-5 h-5 text-primary-400 print:text-primary-700" />
                   </div>
                   <div>
                       <h4 className="font-bold text-primary-300 print:text-primary-800 mb-1">تحليل النبرة الصوتية: {result.toneAnalysis.label}</h4>
                       <p className="text-primary-200/60 print:text-slate-600 text-sm">{result.toneAnalysis.description}</p>
                   </div>
                </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-emerald-500/50 print:border-slate-200 print:bg-white print:shadow-none print:border-t-emerald-600">
                    <h3 className="flex items-center gap-2 font-bold text-slate-100 print:text-slate-900 mb-4 text-lg">
                        <CheckCircle className="w-5 h-5 text-emerald-500 print:text-emerald-700" />
                        نقاط القوة
                    </h3>
                    <ul className="space-y-3">
                        {result.strengths.map((str, i) => (
                            <li key={i} className="flex gap-2 text-slate-400 print:text-slate-700 text-sm">
                                <span className="text-emerald-500 print:text-emerald-700 mt-1">•</span>
                                {str}
                            </li>
                        ))}
                    </ul>
                </Card>

                <Card className="border-t-4 border-t-orange-500/50 print:border-slate-200 print:bg-white print:shadow-none print:border-t-orange-600">
                    <h3 className="flex items-center gap-2 font-bold text-slate-100 print:text-slate-900 mb-4 text-lg">
                        <AlertCircle className="w-5 h-5 text-orange-500 print:text-orange-700" />
                        نقاط للتحسين
                    </h3>
                     <ul className="space-y-3">
                        {result.weaknesses.map((weak, i) => (
                            <li key={i} className="flex gap-2 text-slate-400 print:text-slate-700 text-sm">
                                <span className="text-orange-500 print:text-orange-700 mt-1">•</span>
                                {weak}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            <Card className="bg-gradient-to-r from-slate-800 to-slate-900 print:bg-none print:bg-white text-white print:text-black border-none print:border print:border-slate-200 print:shadow-none">
                <h3 className="flex items-center gap-2 font-bold text-xl mb-4 text-white print:text-slate-900">
                    <TrendingUp className="w-6 h-6 text-emerald-400 print:text-emerald-700" />
                    المسار التدريبي المقترح
                </h3>
                <div className="space-y-4">
                    {result.nextSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/5 print:bg-slate-50 p-3 rounded-lg backdrop-blur-sm border border-white/5 print:border-slate-200">
                            <span className="w-8 h-8 rounded-full bg-white/10 print:bg-slate-200 flex items-center justify-center font-bold text-sm text-primary-300 print:text-slate-700">
                                {i + 1}
                            </span>
                            <p className="text-slate-300 print:text-slate-700">{step}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-8 flex justify-end print:hidden">
                    <Button onClick={handlePrint} variant="secondary" className="mr-3">
                        <Printer className="w-4 h-4 ml-2" />
                        طباعة التقرير
                    </Button>
                    <Button onClick={onRestart} className="bg-slate-200 text-slate-900 hover:bg-white hover:text-slate-950">
                        <RefreshCcw className="w-4 h-4 ml-2" />
                        بدء تدريب جديد
                    </Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};