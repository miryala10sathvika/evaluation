
import React, { useState, useEffect, useMemo } from 'react';
import { generateMockSamples } from './mockData';
import { Sample, UserEvaluation, EvaluationStore, Candidate, LLMCriteria, LLMJudgement } from './types';
import { ComparisonView } from './components/ComparisonView';
import { EvaluationForm } from './components/EvaluationForm';
import { Download, ChevronRight, ChevronLeft, Check, Menu, FileSpreadsheet, FolderOpen, User, LogOut, Users } from 'lucide-react';

// Initial empty evaluation state
const createEmptyEvaluation = (): UserEvaluation => ({
  clarityAgree: null,
  clarityJustification: '',
  completenessAgree: null,
  completenessJustification: '',
  consistencyAgree: null,
  consistencyJustification: '',
  accuracyRating: null,
  accuracyJustification: '',
  detailRating: null,
  detailJustification: '',
  timestamp: Date.now(),
});

// --- COMPONENTS ---

// 1. Login / User Selection Screen
const UserSelectionScreen: React.FC<{ onSelect: (user: string) => void }> = ({ onSelect }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSelect(name.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome to EvalStudio</h1>
        <p className="text-slate-500 mb-8">Please enter your name to load your personal evaluation workspace.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Please enter your name"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-lg"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full p-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-lg transition-all flex items-center justify-center gap-2"
          >
            Continue
            <ChevronRight size={20} />
          </button>
        </form>

        <div className="mt-8 text-xs text-slate-400">
          Data is stored locally in your browser and is separate for each user.
        </div>
      </div>
    </div>
  );
};

// 2. Main Workspace (The Application)
const Workspace: React.FC<{ user: string; onLogout: () => void }> = ({ user, onLogout }) => {
  // Dynamic Storage Key based on User
  const STORAGE_KEY = `eval_studio_data_${user.toLowerCase()}`;

  const [samples, setSamples] = useState<Sample[]>(generateMockSamples());
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Initialize store from LocalStorage specific to this user
  const [evalStore, setEvalStore] = useState<EvaluationStore>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      console.error("Failed to load from local storage", e);
      return {};
    }
  });

  const currentSample = samples[currentSampleIndex];
  const currentCandidate = currentSample.candidates[currentCandidateIndex];

  // Save to User-Specific LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(evalStore));
  }, [evalStore, STORAGE_KEY]);

  // Load LLM Judgment JSON if exists (Public Folder Mode)
  useEffect(() => {
    const loadJudgement = async () => {
      if (isLocalMode) return;

      if (currentCandidate.jsonUrl && !currentCandidate.llmJudgement) {
        try {
          const response = await fetch(currentCandidate.jsonUrl);
          if (response.ok) {
            const data = await response.json();
            setSamples(prevSamples => {
              const newSamples = [...prevSamples];
              const sample = newSamples[currentSampleIndex];
              const candidate = sample.candidates[currentCandidateIndex];
              candidate.llmJudgement = data;
              return newSamples;
            });
          } else {
             // Silent fail for missing JSON
          }
        } catch (error) {
          // Silent fail
        }
      }
    };
    loadJudgement();
  }, [currentSampleIndex, currentCandidateIndex, currentCandidate.jsonUrl, currentCandidate.llmJudgement, isLocalMode]);

  // --- LOCAL FOLDER LOADING LOGIC (UPDATED FOR NESTED STRUCTURE) ---
  const handleLoadLocalDataset = async () => {
    try {
      // @ts-ignore
      if (!('showDirectoryPicker' in window)) {
        alert("Your browser does not support the File System Access API. Please use Chrome/Edge.");
        return;
      }
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker();
      
      const newSamples: Sample[] = [];
      // Capitalized folders matching your ls -R output
      const CANDIDATE_FOLDERS = ['model_A', 'model_B', 'model_C', 'model_D', 'model_E'];

      const getFile = async (folderHandle: any, filename: string) => {
        try { return await (await folderHandle.getFileHandle(filename)).getFile(); } catch (e) { return null; }
      };
      
      const getSubDir = async (parentHandle: any, name: string) => {
        try { return await parentHandle.getDirectoryHandle(name); } catch (e) { return null; }
      };

      // 1. Navigate to ground_truth/images
      const gtRootHandle = await getSubDir(dirHandle, 'ground_truth');
      if (!gtRootHandle) { alert("Could not find 'ground_truth' folder."); return; }
      
      const gtImagesHandle = await getSubDir(gtRootHandle, 'images');
      if (!gtImagesHandle) { alert("Could not find 'ground_truth/images' folder."); return; }

      // 2. Iterate through Ground Truth files
      let idCounter = 1;
      // @ts-ignore
      for await (const entry of gtImagesHandle.values()) {
         if (entry.kind === 'file') {
            const gtFilename = entry.name;
            // Skip system files like .DS_Store
            if (gtFilename.startsWith('.')) continue;

            // remove extension to match with models (handles .PNG, .jpg, .png)
            const baseName = gtFilename.substring(0, gtFilename.lastIndexOf('.')) || gtFilename;
            const gtFile = await entry.getFile();
            
            const candidates: Candidate[] = [];

            // 3. Find corresponding candidate files
            for (let cIdx = 0; cIdx < CANDIDATE_FOLDERS.length; cIdx++) {
               const modelFolderName = CANDIDATE_FOLDERS[cIdx];
               const modelRoot = await getSubDir(dirHandle, modelFolderName);
               
               // Default empty candidate
               let candidate: Candidate = {
                  id: cIdx + 1,
                  label: `Model ${String.fromCharCode(65 + cIdx)}`,
                  imageUrl: '' 
               };

               if (modelRoot) {
                  const modelImages = await getSubDir(modelRoot, 'images');
                  const modelJsons = await getSubDir(modelRoot, 'jsons');

                  // Try to find image (Assuming .png for models based on structure)
                  if (modelImages) {
                     const candFile = await getFile(modelImages, `${baseName}.png`);
                     if (candFile) {
                        candidate.imageUrl = URL.createObjectURL(candFile);
                     }
                  }

                  // Try to find JSON (baseName + _comparison.json)
                  if (modelJsons) {
                     const jsonFile = await getFile(modelJsons, `${baseName}_comparison.json`);
                     if (jsonFile) {
                        try {
                           candidate.llmJudgement = JSON.parse(await jsonFile.text());
                        } catch (e) {}
                     }
                  }
               }
               candidates.push(candidate);
            }

            newSamples.push({
               id: idCounter++,
               title: baseName.replace(/[-_]/g, ' '),
               groundTruthUrl: URL.createObjectURL(gtFile),
               candidates: candidates
            });
         }
      }

      if (newSamples.length > 0) {
        // Sort by ID or Name to ensure consistency
        newSamples.sort((a, b) => a.title.localeCompare(b.title));
        setSamples(newSamples);
        setIsLocalMode(true);
        setCurrentSampleIndex(0);
        setCurrentCandidateIndex(0);
        alert(`Loaded ${newSamples.length} samples locally.`);
      } else {
        alert("No files found in ground_truth/images.");
      }
    } catch (err) { 
      console.error(err); 
      alert("Error loading files. Please ensure you selected the root folder containing 'ground_truth', 'model_A', etc."); 
    }
  };

  const currentEvaluation = useMemo(() => {
    const sampleStore = evalStore[currentSample?.id] || {};
    return sampleStore[currentCandidate?.id] || createEmptyEvaluation();
  }, [evalStore, currentSample?.id, currentCandidate?.id]);

  const handleEvaluationChange = (updatedEval: UserEvaluation) => {
    setEvalStore((prev) => ({
      ...prev,
      [currentSample.id]: {
        ...(prev[currentSample.id] || {}),
        [currentCandidate.id]: updatedEval,
      },
    }));
  };

  const downloadCSV = () => {
    const headers = [
      "User", "Sample Title", "Candidate ID", "Timestamp", 
      "Clarity Agree", "Clarity Justification", 
      "Completeness Agree", "Completeness Justification", 
      "Consistency Agree", "Consistency Justification",
      "Accuracy Rating", "Accuracy Justification", 
      "Detail Rating", "Detail Justification"
    ];
    const escape = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = [];
    // Map to access sample titles easily
    const sampleMap = new Map(samples.map(s => [s.id, s.title]));

    for (const [sampleId, candidates] of Object.entries(evalStore)) {
      const sId = Number(sampleId);
      const title = sampleMap.get(sId) || `Sample ${sId}`;
      
      for (const [candidateId, ev] of Object.entries(candidates)) {
        rows.push([
          user, escape(title), candidateId, new Date(ev.timestamp).toISOString(),
          ev.clarityAgree === true ? "TRUE" : ev.clarityAgree === false ? "FALSE" : "", escape(ev.clarityJustification),
          ev.completenessAgree === true ? "TRUE" : ev.completenessAgree === false ? "FALSE" : "", escape(ev.completenessJustification),
          ev.consistencyAgree === true ? "TRUE" : ev.consistencyAgree === false ? "FALSE" : "", escape(ev.consistencyJustification),
          escape(ev.accuracyRating), escape(ev.accuracyJustification),
          escape(ev.detailRating), escape(ev.detailJustification),
        ].join(","));
      }
    }
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `evaluation_${user.toLowerCase()}.csv`;
    link.click();
  };
  
  const downloadJSON = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(evalStore, null, 2));
      const link = document.createElement('a');
      link.href = dataStr;
      link.download = `evaluation_${user.toLowerCase()}.json`;
      link.click();
  };

  const isSampleComplete = (sampleId: number) => {
    return (evalStore[sampleId] && Object.keys(evalStore[sampleId]).length === 5);
  };

  if (!currentSample) return <div>Loading...</div>;

  return (
    <div className="flex h-screen w-screen bg-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 flex flex-col bg-white border-r border-slate-200 shadow-lg z-20`}>
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 overflow-hidden">
             <div className="w-8 h-8 bg-indigo-600 text-white rounded-md flex items-center justify-center font-bold shrink-0">E</div>
             <div className="flex flex-col">
                <h1 className="font-bold text-indigo-900 text-sm leading-none">EvalStudio</h1>
                <span className="text-[10px] text-slate-500">User: {user}</span>
             </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-200 rounded text-slate-400">
            <ChevronLeft size={18}/>
          </button>
        </div>

        <div className="p-2 border-b border-slate-200 bg-slate-50 space-y-2">
          <button onClick={handleLoadLocalDataset} className="w-full flex items-center gap-2 text-indigo-700 bg-white border border-indigo-200 p-2 rounded text-xs font-bold hover:bg-indigo-50 shadow-sm">
            <FolderOpen size={14} /> {isLocalMode ? "Change Dataset" : "Load Local Dataset"}
          </button>
          {isLocalMode && <div className="text-[10px] text-center text-green-600 font-medium bg-green-50 py-1 rounded border border-green-100">Local Mode Active</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {samples.map((sample, idx) => (
            <button
              key={sample.id}
              onClick={() => { setCurrentSampleIndex(idx); setCurrentCandidateIndex(0); }}
              className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center justify-between group transition-colors ${
                currentSampleIndex === idx ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{sample.title}</span>
              {isSampleComplete(sample.id) && <Check size={14} className="text-green-500" />}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200 space-y-2 bg-slate-50">
          <button onClick={downloadCSV} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-xs font-bold shadow-sm transition-colors">
            <FileSpreadsheet size={14} /> Export CSV
          </button>
          <button onClick={downloadJSON} className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-md text-xs font-bold shadow-sm transition-colors">
            <Download size={14} /> Export JSON
          </button>
          <hr className="border-slate-200"/>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 py-2 rounded-md text-xs font-bold transition-colors">
            <LogOut size={14} /> Switch User
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded text-slate-600">
                <Menu size={20} />
              </button>
            )}
            <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Sample</span>
               <span className="font-bold text-slate-800 truncate max-w-md">{currentSample.title}</span>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg shadow-inner">
            {currentSample.candidates.map((cand, idx) => (
              <button
                key={cand.id}
                onClick={() => setCurrentCandidateIndex(idx)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  currentCandidateIndex === idx ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Model {String.fromCharCode(65 + idx)}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 flex flex-row overflow-hidden">
          <div className="flex-1 relative min-w-0 bg-slate-100">
            <ComparisonView groundTruthUrl={currentSample.groundTruthUrl} candidate={currentCandidate} />
          </div>
          <div className="w-[400px] border-l border-slate-200 bg-white h-full shadow-xl z-10 flex flex-col">
            <EvaluationForm 
              key={`${user}-${currentSample.id}-${currentCandidate.id}`} 
              candidate={currentCandidate}
              evaluation={currentEvaluation}
              onChange={handleEvaluationChange}
            />
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
               <button 
                 onClick={() => setCurrentCandidateIndex(Math.max(0, currentCandidateIndex - 1))}
                 disabled={currentCandidateIndex === 0}
                 className="p-2 rounded-full hover:bg-slate-200 disabled:opacity-30 text-slate-600 transition-colors"
               >
                 <ChevronLeft size={20} />
               </button>
               <div className="text-xs font-semibold text-slate-400">
                 CANDIDATE {currentCandidateIndex + 1} / {currentSample.candidates.length}
               </div>
               <button 
                 onClick={() => {
                    if (currentCandidateIndex < 4) {
                        setCurrentCandidateIndex(currentCandidateIndex + 1);
                    } else if (currentSampleIndex < samples.length - 1) {
                        setCurrentSampleIndex(currentSampleIndex + 1);
                        setCurrentCandidateIndex(0);
                    }
                 }}
                 disabled={currentSampleIndex === samples.length - 1 && currentCandidateIndex === 4}
                 className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shadow-sm"
               >
                 {currentCandidateIndex === 4 ? 'Next Sample' : 'Next Candidate'}
                 <ChevronRight size={14} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Root App
const App: React.FC = () => {
  // State to track the currently logged-in user
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    // Optional: Auto-login last user? 
    // For now, let's force selection to ensure they know who they are logged in as.
    return null; 
  });

  const handleLogin = (user: string) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <UserSelectionScreen onSelect={handleLogin} />;
  }

  // Key ensures Workspace remounts completely when user changes
  return <Workspace key={currentUser} user={currentUser} onLogout={handleLogout} />;
};

export default App;
