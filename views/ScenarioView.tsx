import React from 'react';
import { Scenario } from '../types';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Target, Users, AlertTriangle, Play } from 'lucide-react';

interface ScenarioViewProps {
  scenario: Scenario;
  onStart: () => void;
}

export const ScenarioView: React.FC<ScenarioViewProps> = ({ scenario, onStart }) => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in w-full">
      <div className="mb-8 text-center">
        <span className="bg-slate-800 text-primary-400 border border-slate-700 px-4 py-1.5 rounded-full text-sm font-medium shadow-sm">
           دراسة حالة تفاعلية
        </span>
        <h2 className="text-3xl font-bold mt-4 text-white">{scenario.title}</h2>
        <p className="text-slate-400 mt-2 text-lg">{scenario.difficulty} • {scenario.role}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card title="سياق الموقف">
            <p className="text-slate-300 leading-relaxed whitespace-pre-line text-lg">
              {scenario.description}
            </p>
          </Card>
          
          <Card title="مهمتك">
            <div className="flex items-start gap-3 bg-amber-950/30 p-4 rounded-lg border border-amber-900/50 mb-4">
              <Target className="w-6 h-6 text-amber-500 mt-1 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-amber-400">الهدف المطلوب</h4>
                <p className="text-amber-200/80">{scenario.objective}</p>
              </div>
            </div>
            
            <h4 className="font-bold text-slate-200 mb-3">نقاط رئيسية يجب تغطيتها:</h4>
            <ul className="space-y-2">
              {scenario.keyPoints.map((point, idx) => (
                <li key={idx} className="flex items-center gap-2 text-slate-300">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold border border-slate-700">
                    {idx + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              الأطراف المشاركة
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">دورك</label>
                <p className="font-medium text-slate-200">{scenario.role}</p>
              </div>
              <div className="w-full h-px bg-slate-800"></div>
              <div>
                <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider">الطرف الآخر</label>
                <p className="font-medium text-slate-200">{scenario.counterpart}</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-primary-900 to-slate-900 border border-primary-900/50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-primary-400 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-1 text-white">تعليمات المحاكاة</h3>
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  سيتم تسجيل الفيديو والصوت لتحليل لغة جسدك ونبرة صوتك. تخيل أنك في الموقف الحقيقي وتحدث بثقة.
                </p>
                <Button onClick={onStart} className="w-full bg-white text-primary-900 hover:bg-slate-100 shadow-none border-0">
                  <Play className="w-4 h-4 ml-2 fill-current" />
                  ابدأ المحاكاة
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};