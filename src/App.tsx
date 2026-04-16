import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, updateDoc, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { cn } from './lib/utils';
import { Plus, Minus, Trophy, UserPlus, FileText, Activity, Sun, Moon } from 'lucide-react';

interface Scores {
  social: number;
  attitude: number;
  expertise: number;
  preliminary: number;
}

interface Candidate {
  id: string;
  name: string;
  class_name: string;
  academic_performance: string;
  conduct: string;
  experience: string;
  aspiration1: string;
  scores: Scores;
  total_score: number;
}

const DEPARTMENTS = [
  "🏯 Bộ phận Nghiên cứu & Chế tạo Sa bàn",
  "⚙️ Bộ Phận Phát Triển Phần Cứng",
  "💻 Bộ Phận Phát Triển Phần Mềm",
  "🧧 Bộ phận Kế toán thường trực",
  "📦 Bộ Phận Hậu Cần",
  "📏 Bộ phận Phát triển Bản vẽ Kỹ thuật"
];

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedDept1, setSelectedDept1] = useState<string>('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(DEPARTMENTS[0]);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: '',
    class_name: '',
    academic_performance: 'Giỏi',
    conduct: 'Tốt',
    experience: '',
    aspiration1: DEPARTMENTS[0],
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const q = query(collection(db, 'candidates'), orderBy('total_score', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Candidate[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Candidate);
      });
      data.sort((a,b) => b.total_score - a.total_score);
      setCandidates(data);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.class_name) return;

    try {
      await addDoc(collection(db, 'candidates'), {
        ...newCandidate,
        scores: { social: 10, attitude: 10, expertise: 10, preliminary: 10 },
        total_score: 40,
        createdAt: serverTimestamp()
      });
      setShowAddForm(false);
      setNewCandidate({
        name: '', class_name: '', academic_performance: 'Giỏi', conduct: 'Tốt', experience: '', aspiration1: DEPARTMENTS[0]
      });
    } catch (error) {
      console.error("Error adding candidate: ", error);
    }
  };

  const updateScore = async (candidateId: string, criteria: keyof Scores, delta: number) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    let currentScore = candidate.scores[criteria] || 0;
    let newScore = currentScore + delta;
    if (newScore < 0) newScore = 0;
    if (newScore > 10) newScore = 10;

    const newScores = { ...candidate.scores, [criteria]: newScore };
    const newTotal = newScores.social + newScores.attitude + newScores.expertise + newScores.preliminary;

    try {
      await updateDoc(doc(db, 'candidates', candidateId), {
        [`scores.${criteria}`]: newScore,
        total_score: newTotal
      });
    } catch (error) {
      console.error("Error updating score: ", error);
    }
  };

  const filteredForDropdown = candidates.filter(c => {
    if (selectedDept1 && c.aspiration1 !== selectedDept1) return false;
    return true;
  });

  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId);

  const getQuotaForDept = (dept: string) => {
    if (dept.includes("Sa bàn")) return 3;
    if (dept.includes("Phần Cứng")) return 5;
    if (dept.includes("Phần Mềm")) return 1;
    if (dept.includes("Kế toán")) return 2;
    if (dept.includes("Hậu Cần")) return 2;
    return 0;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-200">
      <header className="bg-indigo-600 dark:bg-indigo-900 text-white py-4 px-6 shadow-md flex flex-wrap sm:flex-nowrap justify-between items-center gap-4 sticky top-0 z-10 transition-colors duration-200">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-200" />
          <h1 className="text-xl font-bold tracking-tight text-white">Tuyển Chọn Thành Viên</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            title="Chuyển chế độ giao diện"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-yellow-300" /> : <Moon className="w-5 h-5 text-indigo-100" />}
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-400 dark:hover:bg-indigo-600 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 text-white"
          >
            <UserPlus className="w-4 h-4" />
            {showAddForm ? 'Đóng' : 'Thêm Thí Sinh'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Scoring Panel */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          
          {/* Add Form */}
          {showAddForm && (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-top-4 transition-colors duration-200">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
                <UserPlus className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                Thêm Thí Sinh Mới
              </h2>
              <form onSubmit={handleAddCandidate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Họ và tên</label>
                  <input required value={newCandidate.name} onChange={e => setNewCandidate({...newCandidate, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none" placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lớp</label>
                  <input required value={newCandidate.class_name} onChange={e => setNewCandidate({...newCandidate, class_name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none" placeholder="10A1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Học lực</label>
                    <select value={newCandidate.academic_performance} onChange={e => setNewCandidate({...newCandidate, academic_performance: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none">
                      <option>Giỏi</option>
                      <option>Khá</option>
                      <option>Trung bình</option>
                      <option>Xuất Sắc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Đạo đức</label>
                    <select value={newCandidate.conduct} onChange={e => setNewCandidate({...newCandidate, conduct: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none">
                      <option>Tốt</option>
                      <option>Khá</option>
                      <option>Trung bình</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kinh nghiệm</label>
                  <textarea value={newCandidate.experience} onChange={e => setNewCandidate({...newCandidate, experience: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none text-sm h-20" placeholder="Từng tham gia CLB..." />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nguyện vọng</label>
                    <select value={newCandidate.aspiration1} onChange={e => setNewCandidate({...newCandidate, aspiration1: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white focus:outline-none">
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-medium py-2 rounded-lg transition-colors shadow-sm">
                  Tạo Thí Sinh
                </button>
              </form>
            </div>
          )}

          {/* Selector */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 transition-colors duration-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              Châm Điểm Thí Sinh
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Lọc theo Bộ phận</label>
                  <select value={selectedDept1} onChange={e => {setSelectedDept1(e.target.value); setSelectedCandidateId('');}} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg text-sm">
                    <option value="">Tất cả</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Chọn Thí Sinh</label>
                <select 
                  value={selectedCandidateId} 
                  onChange={e => setSelectedCandidateId(e.target.value)} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-base font-bold"
                >
                  <option value="" disabled>-- Chọn Thí Sinh --</option>
                  {filteredForDropdown.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - Lớp {c.class_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scoring Table */}
            {selectedCandidate ? (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-slate-900 dark:text-white">{selectedCandidate.name}</h3>
                    <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-200 text-lg font-bold px-3 py-1 rounded-lg">
                      {selectedCandidate.total_score}đ
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 flex flex-col gap-1">
                    <span><strong className="text-slate-800 dark:text-slate-200">Lớp:</strong> {selectedCandidate.class_name} | <strong className="text-slate-800 dark:text-slate-200">Học lực:</strong> {selectedCandidate.academic_performance}</span>
                    <span className="truncate"><strong className="text-slate-800 dark:text-slate-200">Nguyện vọng:</strong> {selectedCandidate.aspiration1}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { key: 'social', label: 'Xã hội' },
                    { key: 'attitude', label: 'Thái độ' },
                    { key: 'expertise', label: 'Chuyên môn' },
                    { key: 'preliminary', label: 'Đánh giá sơ' },
                  ].map((criteria) => (
                    <div key={criteria.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">{criteria.label}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Tối đa: 10</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => updateScore(selectedCandidate.id, criteria.key as keyof Scores, -1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 transition"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-black text-lg text-slate-900 dark:text-white">
                          {(selectedCandidate.scores as any)[criteria.key]}
                        </span>
                        <button 
                          onClick={() => updateScore(selectedCandidate.id, criteria.key as keyof Scores, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/60 hover:bg-indigo-200 dark:hover:bg-indigo-800/80 text-indigo-700 dark:text-indigo-300 transition"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                <p className="text-slate-500 dark:text-slate-400 font-medium">Vui lòng chọn thí sinh để chấm điểm</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Leaderboard */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map(dept => (
              <button
                key={dept}
                onClick={() => setActiveTab(dept)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
                  activeTab === dept
                    ? "bg-indigo-600 text-white shadow-md dark:bg-indigo-500"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                )}
              >
                {dept}
              </button>
            ))}
          </div>

          {(() => {
            const deptCandidates = candidates.filter(
              (c) => c.aspiration1 === activeTab
            );

            return (
              <div
                key={activeTab}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-colors duration-200"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between items-start gap-2">
                  <h2 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    {activeTab} ({deptCandidates.length})
                  </h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 sticky top-0 uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-5 py-3 font-bold">Hạng</th>
                        <th className="px-5 py-3 font-bold">Họ và tên</th>
                        <th className="px-5 py-3 font-bold">Lớp</th>
                        <th className="px-5 py-3 font-bold">Tổng điểm</th>
                        <th className="px-5 py-3 font-bold">Nguyện vọng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {deptCandidates.map((c, idx) => {
                        const quota = getQuotaForDept(activeTab);
                        const isPass = idx < quota;
                        const bgColor = isPass 
                          ? "bg-green-100 dark:bg-emerald-900/30 text-green-900 dark:text-emerald-100 border-l-4 border-green-500" 
                          : "bg-red-50 dark:bg-rose-900/20 text-red-900 dark:text-rose-100 border-l-4 border-red-500";
                          
                        return (
                          <tr
                            key={c.id}
                            className={cn(
                              "transition-colors cursor-pointer hover:opacity-80",
                              bgColor,
                              selectedCandidateId === c.id
                                ? "ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400 z-10 relative"
                                : ""
                            )}
                            onClick={() => setSelectedCandidateId(c.id)}
                          >
                            <td className="px-5 py-4 font-black">#{idx + 1}</td>
                            <td className="px-5 py-4">
                              <div className="font-extrabold text-base">
                                {c.name}
                                {isPass ? (
                                  <span className="bg-green-600 dark:bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">ĐẠT</span>
                                ) : (
                                  <span className="bg-red-600 dark:bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">LOẠI</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-semibold opacity-90">{c.class_name}</td>
                            <td className="px-5 py-4">
                              <span className="font-black text-lg">
                                {c.total_score}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-col text-xs gap-1.5 min-w-[200px] whitespace-normal">
                                <span className={cn(
                                  "px-2 py-1 rounded font-bold",
                                  isPass ? "bg-green-200/50 dark:bg-green-800/30" : "bg-red-200/50 dark:bg-red-800/30"
                                )}>
                                  {c.aspiration1}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {deptCandidates.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 font-medium"
                          >
                            Chưa có thí sinh nào đăng ký bộ phận này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}


