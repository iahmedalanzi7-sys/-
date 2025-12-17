import React, { useState } from 'react';
import { Onboarding } from './views/Onboarding';
import { ScenarioView } from './views/ScenarioView';
import { SimulationView } from './views/SimulationView';
import { AnalysisView } from './views/AnalysisView';
import { AppStep, Scenario, UserProfile, AnalysisResult } from './types';
import { generateScenario, analyzePerformance } from './services/geminiService';
import { Logo } from './components/Logo';

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/wav;base64,")
      resolve(base64.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.ONBOARDING);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOnboardingComplete = async (userProfile: UserProfile) => {
    setProfile(userProfile);
    setLoading(true);
    setStep(AppStep.SCENARIO_LOADING);
    
    try {
      const newScenario = await generateScenario(userProfile);
      setScenario(newScenario);
      setStep(AppStep.SCENARIO_VIEW);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء توليد السيناريو. يرجى المحاولة مرة أخرى.");
      setStep(AppStep.ONBOARDING);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSimulation = () => {
    setStep(AppStep.SIMULATION);
  };

  const handleSimulationFinish = async (audioBlob: Blob, images: string[]) => {
    if (!profile || !scenario) return;

    setStep(AppStep.ANALYSIS_LOADING);
    
    try {
      const audioBase64 = await blobToBase64(audioBlob);
      const result = await analyzePerformance(profile, scenario, audioBase64, images);
      setAnalysis(result);
      setStep(AppStep.ANALYSIS_VIEW);
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء تحليل الأداء.");
      setStep(AppStep.SCENARIO_VIEW); // Go back so they can retry or re-record
    }
  };

  const handleRestart = () => {
    setStep(AppStep.ONBOARDING);
    setProfile(null);
    setScenario(null);
    setAnalysis(null);
  };

  return (
    <div className="h-screen w-screen bg-slate-950 print:bg-white flex flex-col font-sans text-slate-50 print:text-black selection:bg-primary-500 selection:text-white overflow-hidden print:overflow-visible" dir="rtl">
      
      {/* Navbar - Hidden on Print */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
          </div>
          {profile && (
            <div className="hidden md:flex items-center gap-4 text-sm font-medium text-slate-400 bg-slate-800/50 py-1.5 px-4 rounded-full border border-slate-700">
                <span className="text-slate-200">{profile.name}</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>{profile.major}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden print:overflow-visible flex flex-col">
        {/* Background Ambient Glow - Hidden on Print */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-900/20 rounded-full blur-[128px] pointer-events-none z-0 print:hidden"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-900/20 rounded-full blur-[128px] pointer-events-none z-0 print:hidden"></div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full z-10 scroll-smooth print:overflow-visible">
            <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-8 print:p-0 print:block">
                {step === AppStep.ONBOARDING && (
                <Onboarding onComplete={handleOnboardingComplete} isLoading={loading} />
                )}

                {step === AppStep.SCENARIO_LOADING && (
                <div className="text-center animate-pulse">
                    <div className="w-32 h-32 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden p-6 backdrop-blur-sm border border-slate-700">
                        <Logo size="lg" showText={false} className="animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">جاري تصميم حالة عملية خاصة بك...</h2>
                    <p className="text-slate-400 mt-2">يتم استخدام الذكاء الاصطناعي لتخصيص التجربة حسب تخصصك</p>
                </div>
                )}

                {step === AppStep.SCENARIO_VIEW && scenario && (
                <ScenarioView scenario={scenario} onStart={handleStartSimulation} />
                )}

                {(step === AppStep.SIMULATION || step === AppStep.ANALYSIS_LOADING) && scenario && (
                <SimulationView 
                    scenario={scenario} 
                    onFinish={handleSimulationFinish} 
                    isLoadingAnalysis={step === AppStep.ANALYSIS_LOADING}
                />
                )}

                {step === AppStep.ANALYSIS_VIEW && analysis && profile && (
                <AnalysisView result={analysis} profile={profile} onRestart={handleRestart} />
                )}
            </div>
        </div>
      </main>
      
      {/* Footer - Hidden on Print */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 shrink-0 z-20 print:hidden">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>© 2024 منصة منطلق. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;