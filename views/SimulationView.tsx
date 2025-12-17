import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Mic, Video, Square, Play, Timer, VideoOff, Activity, BarChart2, Eye, Cpu, AlertCircle, CheckCircle2, Zap, Volume2 } from 'lucide-react';
import { Scenario } from '../types';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface SimulationViewProps {
  scenario: Scenario;
  onFinish: (audioBlob: Blob, images: string[]) => void;
  isLoadingAnalysis: boolean;
}

// --- Audio Utils for Gemini Live API ---

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function floatTo16BitPCM(float32Array: Float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ scenario, onFinish, isLoadingAnalysis }) => {
  // Video & Recording Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const frameIntervalRef = useRef<number | null>(null);
  const framesRef = useRef<string[]>([]);
  
  // Analysis Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Live API Refs
  const liveSessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<{buffer: AudioBuffer, time: number}[]>([]);
  const nextStartTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [duration, setDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Simulated Analysis States
  const [voiceTone, setVoiceTone] = useState<string>('جاري الاستماع...');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0);
  const [speakingPace, setSpeakingPace] = useState<string>('متوسط');
  const [liveFeedback, setLiveFeedback] = useState<{message: string, type: 'warning' | 'success'} | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      disconnectLiveSession();
    };
  }, []);

  // --- Live Feedback Simulation Loop ---
  useEffect(() => {
    if (isRecording) {
      drawAudioVisualizer();
      
      const analysisInt = setInterval(() => {
         // Update Simulated Metrics
         const tones = ['واثق', 'هادئ', 'متحمس', 'متزن', 'مقنع'];
         const randomTone = tones[Math.floor(Math.random() * tones.length)];
         setVoiceTone(randomTone);
         setConfidenceLevel(Math.floor(Math.random() * (98 - 70) + 70));
         
         const paceRandom = Math.random();
         let currentPace = 'مثالي';
         if (paceRandom > 0.8) currentPace = 'سريع قليلاً';
         else if (paceRandom < 0.2) currentPace = 'بطيء';
         setSpeakingPace(currentPace);

         // Generate Live Feedback
         const feedbackChance = Math.random();
         if (feedbackChance > 0.75) {
             const warnings = [
                 "حاول رفع صوتك قليلاً ليصبح أكثر وضوحاً",
                 "تتحدث بسرعة، خذ نفساً وعبر بهدوء",
                 "حافظ على التواصل البصري مع الطرف الآخر",
                 "تجنب التكرار، ركز على الحجج المنطقية",
                 "استمع جيداً لما يقوله الطرف الآخر قبل الرد"
             ];
             setLiveFeedback({ 
                 message: warnings[Math.floor(Math.random() * warnings.length)], 
                 type: 'warning' 
             });
         } else if (feedbackChance > 0.5) {
             const positives = [
                 "نبرة ممتازة! استمر بهذا الحماس",
                 "ردك منطقي ومقنع جداً",
                 "لغة جسدك تعكس ثقة عالية",
                 "سرعة حديثك متناسبة مع الموقف",
                 "تفاعل رائع مع السؤال"
             ];
             setLiveFeedback({ 
                 message: positives[Math.floor(Math.random() * positives.length)], 
                 type: 'success' 
             });
         } else {
             setLiveFeedback(null);
         }
      }, 4000); 

      return () => clearInterval(analysisInt);
    } else {
        setLiveFeedback(null);
        setVoiceTone('جاري الاستماع...');
        setConfidenceLevel(0);
        setSpeakingPace('متوسط');
    }
  }, [isRecording]);

  // --- Hardware Setup ---

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true; // Avoid feedback loop
      }
      setHasPermission(true);
      
      // Setup Visualizer Context
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

    } catch (err) {
      console.error("Camera error:", err);
      setHasPermission(false);
    }
  };

  const drawAudioVisualizer = () => {
    if (!canvasRef.current || !analyserRef.current || !isRecording) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgb(15, 23, 42)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;
        const r = barHeight + 25 * (i/bufferLength);
        const g = 200;
        const b = 255;

        ctx.fillStyle = `rgb(${r * 0.5}, ${g}, ${b})`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };
    draw();
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (timerInterval) clearInterval(timerInterval);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  // --- Gemini Live API Integration ---

  const connectToLiveSession = async () => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Input Audio Context (16kHz for Gemini)
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputAudioContextRef.current = inputCtx;

        // Output Audio Context (24kHz for playback)
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        outputAudioContextRef.current = outputCtx;
        nextStartTimeRef.current = outputCtx.currentTime;

        // Get Stream for Processing
        const stream = videoRef.current!.srcObject as MediaStream;
        const source = inputCtx.createMediaStreamSource(stream);
        
        // Processor to extract PCM data
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;
        
        processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const pcm16 = floatTo16BitPCM(inputData);
            const uint8 = new Uint8Array(pcm16);
            const base64 = btoa(String.fromCharCode(...uint8));
            
            // Send to Gemini
            if (liveSessionRef.current) {
                liveSessionRef.current.sendRealtimeInput({
                    media: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64
                    }
                });
            }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);

        // Establish Connection
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                systemInstruction: `
                    أنت تمثل دور (${scenario.counterpart}) في سيناريو تدريبي احترافي.
                    المستخدم هو: (${scenario.role}).
                    الموقف: ${scenario.description}.
                    هدفك: (${scenario.objective}) ولكن بطريقة تمثل تحدياً للمستخدم.
                    مستوى الصعوبة: ${scenario.difficulty}.
                    
                    تعليمات:
                    1. تحدث باللغة العربية (يمكنك استخدام لهجة سعودية بيضاء أو فصحى سهلة).
                    2. كن متفاعلاً وواقعياً جداً. قاطع المستخدم إذا كان ذلك يناسب الشخصية.
                    3. لا تخرج عن الشخصية أبداً. أنت لست مساعد ذكاء اصطناعي، أنت الشخصية.
                    4. ردودك يجب أن تكون قصيرة نسبياً لتسمح بالحوار.
                `,
            },
            callbacks: {
                onopen: () => {
                    console.log("Gemini Live Connected");
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData) {
                        setIsAiSpeaking(true);
                        const audioBytes = base64ToUint8Array(audioData);
                        
                        // Decode raw PCM from Gemini (24kHz)
                        const audioBuffer = outputCtx.createBuffer(1, audioBytes.length / 2, 24000);
                        const channelData = audioBuffer.getChannelData(0);
                        const view = new DataView(audioBytes.buffer);
                        for (let i = 0; i < channelData.length; i++) {
                            channelData[i] = view.getInt16(i * 2, true) / 32768.0;
                        }

                        // Schedule Playback
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        
                        // Ensure gapless playback
                        const startTime = Math.max(outputCtx.currentTime, nextStartTimeRef.current);
                        source.start(startTime);
                        nextStartTimeRef.current = startTime + audioBuffer.duration;
                        
                        source.onended = () => {
                           if (outputCtx.currentTime >= nextStartTimeRef.current - 0.1) {
                               setIsAiSpeaking(false);
                           }
                        };
                    }
                },
                onclose: () => {
                    console.log("Gemini Live Disconnected");
                },
                onerror: (e) => {
                    console.error("Gemini Live Error", e);
                }
            }
        });

        // Resolve Promise to get session controller
        liveSessionRef.current = await sessionPromise;

    } catch (e) {
        console.error("Failed to connect to Live API", e);
    }
  };

  const disconnectLiveSession = () => {
      // Close Script Processor
      if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect();
          scriptProcessorRef.current = null;
      }
      // Close Contexts
      if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close();
          inputAudioContextRef.current = null;
      }
      if (outputAudioContextRef.current) {
          outputAudioContextRef.current.close();
          outputAudioContextRef.current = null;
      }
      // Disconnect Live Client (Simulated logic as there is no explicit disconnect method on the generic object in snippet, 
      // but usually we just stop sending).
      liveSessionRef.current = null;
      setIsAiSpeaking(false);
  };

  // --- Main Recording Logic ---

  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
      framesRef.current.push(dataUrl.split(',')[1]); 
    }
  };

  const startRecording = async () => {
    if (!videoRef.current?.srcObject) return;
    
    // 1. Start MediaRecorder (For Assessment)
    const stream = videoRef.current.srcObject as MediaStream;
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];
    framesRef.current = [];
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.start();
    setIsRecording(true);
    mediaRecorderRef.current = mediaRecorder;

    // 2. Start Live Interaction
    await connectToLiveSession();

    // 3. Timers
    const interval = window.setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    setTimerInterval(interval);

    const frameInt = window.setInterval(captureFrame, 2000);
    frameIntervalRef.current = frameInt;
  };

  const stopRecording = () => {
    // Stop Live Session
    disconnectLiveSession();

    // Stop Recorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' }); 
        onFinish(blob, framesRef.current);
      };
      
      setIsRecording(false);
      if (timerInterval) clearInterval(timerInterval);
      if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === false) {
    return (
      <div className="text-center p-10 bg-red-950/30 rounded-xl border border-red-900/50">
        <VideoOff className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400">تعذر الوصول للكاميرا</h3>
        <p className="text-red-200 mt-2">يرجى السماح بالوصول للكاميرا والميكروفون للمتابعة.</p>
        <Button onClick={startCamera} className="mt-4" variant="outline">محاولة مرة أخرى</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col items-center animate-fade-in h-[calc(100vh-180px)] min-h-[500px]">
      
      {/* Header Context */}
      <div className="w-full mb-4 flex justify-between items-center bg-slate-900 p-4 rounded-xl shadow-lg border border-slate-800 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isRecording ? 'bg-red-500' : 'bg-slate-500'}`}></span>
            {isRecording ? 'جلسة محاكاة مباشرة' : 'جاهز للبدء'}
          </h2>
          <p className="text-slate-400 text-sm">{scenario.title}</p>
        </div>
        <div className="flex items-center gap-4">
             {!isRecording ? (
                <Button 
                    onClick={startRecording} 
                    className="rounded-full px-6 py-2 text-sm bg-red-600 hover:bg-red-700 shadow-red-500/20"
                >
                    بدء المحاكاة
                </Button>
                ) : (
                <Button 
                    onClick={stopRecording} 
                    className="rounded-full px-6 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700"
                >
                    <Square className="w-4 h-4 ml-2 fill-current" />
                    إنهاء الجلسة
                </Button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-slate-300 font-mono text-lg font-bold border border-slate-700">
                <Timer className={`w-5 h-5 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />
                {formatTime(duration)}
            </div>
        </div>
      </div>

      {/* Split Screen Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full flex-1 min-h-0">
        
        {/* Right: Camera Feed */}
        <div className="relative w-full h-full bg-black rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800 group">
            <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover transform scale-x-[-1]" 
            />
            
            {/* AI Speaking Indicator Overlay */}
            {isAiSpeaking && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary-500/50 animate-pulse">
                    <Volume2 className="w-4 h-4 text-primary-400" />
                    <span className="text-xs text-primary-200 font-bold">{scenario.counterpart} يتحدث...</span>
                </div>
            )}

            {!isRecording && duration === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white p-6 text-center">
                <Mic className="w-12 h-12 mb-4 text-primary-400" />
                <h3 className="text-2xl font-bold mb-2">جاهز للتسجيل؟</h3>
                <p className="text-slate-300 max-w-md">
                سيقوم الذكاء الاصطناعي بلعب دور <span className="text-primary-400 font-bold">{scenario.counterpart}</span>. تحدث معه بوضوح.
                </p>
            </div>
            )}
        </div>

        {/* Left: Real-time Analysis Dashboard */}
        <div className="relative w-full h-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm flex justify-between items-center">
                <h3 className="text-primary-400 font-bold flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    التحليل الذكي المباشر
                </h3>
                {isRecording && <span className="text-xs text-emerald-400 px-2 py-1 bg-emerald-900/20 rounded border border-emerald-900/50 animate-pulse">متصل بالنموذج</span>}
            </div>

            <div className="flex-1 p-6 flex flex-col gap-6 relative overflow-y-auto">
                
                {/* LIVE COACH FEEDBACK AREA */}
                <div className={`transition-all duration-500 transform ${liveFeedback ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
                    {liveFeedback && (
                        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-lg ${
                            liveFeedback.type === 'warning' 
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                            : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        }`}>
                            {liveFeedback.type === 'warning' ? <AlertCircle className="w-6 h-6 shrink-0 text-amber-500" /> : <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-500" />}
                            <div>
                                <h4 className={`font-bold text-sm mb-1 ${liveFeedback.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                    {liveFeedback.type === 'warning' ? 'تنبيه تحسين الأداء' : 'نقطة قوة'}
                                </h4>
                                <p className="text-sm font-medium">{liveFeedback.message}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audio Wave Visualizer */}
                <div className="h-32 bg-slate-950 rounded-xl border border-slate-800 relative overflow-hidden flex items-end justify-center shrink-0">
                    <canvas ref={canvasRef} className="w-full h-full opacity-80" width="400" height="150" />
                    {!isRecording && <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">في انتظار الصوت...</div>}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 shrink-0">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
                            <Activity className="w-4 h-4" />
                            نبرة الصوت
                        </div>
                        <div className="text-lg font-bold text-white transition-all duration-500 truncate">
                            {isRecording ? voiceTone : '--'}
                        </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
                            <BarChart2 className="w-4 h-4" />
                            مستوى الثقة
                        </div>
                        <div className="text-lg font-bold text-emerald-400 transition-all duration-500">
                            {isRecording ? `${confidenceLevel}%` : '--'}
                        </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
                            <Timer className="w-4 h-4" />
                            سرعة الحديث
                        </div>
                        <div className="text-lg font-bold text-blue-400 transition-all duration-500 truncate">
                             {isRecording ? speakingPace : '--'}
                        </div>
                    </div>
                     <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 transition-colors hover:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-400 mb-2 text-sm">
                            <Eye className="w-4 h-4" />
                            التواصل البصري
                        </div>
                        <div className="text-lg font-bold text-yellow-400 transition-all duration-500">
                             {isRecording ? 'جيد جداً' : '--'}
                        </div>
                    </div>
                </div>

                {/* AI Status */}
                <div className={`mt-auto border p-3 rounded-lg flex items-center gap-3 shrink-0 transition-all duration-300 ${isAiSpeaking ? 'bg-primary-900/30 border-primary-500/50' : 'bg-slate-950/50 border-slate-800'}`}>
                     <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-primary-400 animate-ping' : isRecording ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                     <div className="flex-1">
                        <p className="text-xs text-primary-200 font-mono flex items-center gap-2 font-bold uppercase">
                            <Zap className="w-3 h-3" />
                            {isAiSpeaking ? 'المحاكي يتحدث...' : isRecording ? 'المحاكي يستمع...' : 'وضع الاستعداد'}
                        </p>
                     </div>
                </div>
            </div>
            
             {/* Loading Overlay */}
             {isLoadingAnalysis && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in">
                <div className="relative mb-6">
                    <div className="w-20 h-20 border-4 border-slate-800 rounded-full"></div>
                    <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Cpu className="w-8 h-8 text-primary-500 animate-pulse" />
                    </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">جاري تحليل البيانات...</h3>
                <p className="text-slate-400 text-center px-4">يقوم "منطلق" الآن بمعالجة الجلسة لإنتاج تقرير مفصل</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};