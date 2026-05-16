import React, { useState } from "react";
import choirBoy from "./assets/choir_boy.png";
import choirGirl from "./assets/choir_girl.png";

const MEMBER_LIST = [
  { name: "김은석", part: "Bas", role: "" },
  { name: "이동현", part: "Bas", role: "" },
  { name: "오병호", part: "Bas", role: "" },
  { name: "양원석", part: "Bas", role: "" },
  { name: "김정문", part: "Bas", role: "" },
  { name: "유민수", part: "Bas", role: "leader" },
  { name: "이승찬", part: "Bas", role: "leader" }, 
  { name: "김두현", part: "Ten", role: "leader" },
  { name: "강재형", part: "Ten", role: "" },
  { name: "김승진", part: "Ten", role: "" },
  { name: "김서진", part: "Ten", role: "" }, 
  { name: "윤혜린", part: "Alt", role: "" },
  { name: "이해민", part: "Alt", role: "" },
  { name: "정현진", part: "Alt", role: "" },
  { name: "김예원", part: "Alt", role: "" }, 
  { name: "정지요", part: "Alt", role: "" }, 
  { name: "윤희원", part: "Alt", role: "" }, 
  { name: "김소이", part: "Sop", role: "" },
  { name: "김정현", part: "Sop", role: "" },
  { name: "이경미", part: "Sop", role: "" },
  { name: "이아영", part: "Sop", role: "" },
  { name: "정진희", part: "Sop", role: "" },
  { name: "김수빈", part: "Sop", role: "" },
  { name: "김은선", part: "Sop", role: "" }, 
  { name: "이혜린", part: "Sop", role: "" }, 
  { name: "강은수", part: "🎹", role: "piano" },
  { name: "정선미", part: "🎹", role: "piano" },
  { name: "이채은", part: "🎹", role: "piano" },
];

// 1. 리더의 Pick (리더 포함 4명씩 고정 묶음) -> 무조건 100% 우선 수용
const LEADER_TOGETHER_PAIRS = [
  ["김두현", "김서진", "양원석", "강은수"],
  ["이승찬", "이경미", "김승진", "이채은"],
  ["유민수", "정진희", "강재형", "정선미"],
];

// 2. 제한 배제 조건 (리더 픽이 고정되었으므로, 남은 인원 배치 시 참고용으로 유지)
const EXCLUSION_PAIRS = [
  ["김두현", "이승찬", "유민수"],
  ["강은수", "정선미", "이채은"],
]; 

// 3. 개인 단원들의 선호 픽
const TOGETHER_PAIRS = []; 

function App() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [openStatsGroupId, setOpenStatsGroupId] = useState(null);

  const fetchNames = async () => {
    try {
      setIsLoading(true);
      setError("");
      setIsAnimating(true);
      setShowResults(false);
      setAnimationPhase(1);

      const assignedGroups = assignToGroups(
        MEMBER_LIST,
        LEADER_TOGETHER_PAIRS,
        TOGETHER_PAIRS,
        EXCLUSION_PAIRS,
      );

      setTimeout(() => {
        setGroups(assignedGroups);
        setAnimationPhase(2);
      }, 4000);

      setTimeout(() => {
        setIsAnimating(false);
        setAnimationPhase(3);
        setTimeout(() => setShowResults(true), 200);
      }, 5500);
    } catch (err) {
      setError(err.message);
      setIsAnimating(false);
      setAnimationPhase(0);
    } finally {
      setIsLoading(false);
    }
  };

  const assignToGroups = (
    members,
    leaderTogetherPairs,
    togetherPairs,
    exclusionPairs,
  ) => {
    const numberOfGroups = 3;
    const partOrder = { Sop: 1, Alt: 2, Ten: 3, Bas: 4 };
    let attempts = 0;

    while (attempts < 5000) {
      attempts++;

      // 1. 조 데이터 초기화
      const tempGroups = Array.from({ length: numberOfGroups }, (_, i) => ({
        id: i + 1,
        members: [],
        partsCount: { Sop: 0, Alt: 0, Ten: 0, Bas: 0 },
        hasPiano: false,
        hasLeader: false,
        idkCount: 0,
      }));

      const assignedNames = new Set();
      // 전체 명단을 섞어 일반 배정자들의 무작위성 확보
      const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

      // [1순위 - 절대 조건] LEADER_TOGETHER_PAIRS 묶음을 각 조에 통째로 먼저 채워넣기
      // 3개의 리더 픽 묶음을 셔플하여 어떤 묶음이 몇 조(1,2,3조)로 갈지 랜덤 결정
      const shuffledLeaderPairs = [...leaderTogetherPairs].sort(() => Math.random() - 0.5);

      for (let i = 0; i < numberOfGroups; i++) {
        const targetGroup = tempGroups[i];
        const currentPair = shuffledLeaderPairs[i];

        if (currentPair) {
          currentPair.forEach((name) => {
            const m = members.find((member) => member.name === name);
            if (m) {
              targetGroup.members.push(m);
              targetGroup.partsCount[m.part]++;
              if (m.role === "leader") targetGroup.hasLeader = true;
              if (m.role === "piano") targetGroup.hasPiano = true;
              if (m.role === "idk") targetGroup.idkCount++;
              assignedNames.add(name);
            }
          });
        }
      }

      // [2순위] 배제 조합 처리 (EXCLUSION_PAIRS) - 이미 들어간 사람은 넘어가고 남은 인원 조율
      exclusionPairs.forEach((exPair) => {
        exPair.forEach((name) => {
          if (assignedNames.has(name)) return;

          const m = shuffledMembers.find((member) => member.name === name);
          if (m) {
            const targetGroup =
              tempGroups.find(
                (g) =>
                  !exPair.some((exName) =>
                    g.members.some((member) => member.name === exName),
                  ),
              ) ||
              tempGroups.sort((a, b) => a.members.length - b.members.length)[0];

            targetGroup.members.push(m);
            targetGroup.partsCount[m.part]++;
            if (m.role === "idk") targetGroup.idkCount++;
            if (m.role === "piano") targetGroup.hasPiano = true;
            assignedNames.add(name);
          }
        });
      });

      // [3순위] 일반 단원 픽 배정 (TOGETHER_PAIRS)
      togetherPairs.forEach((pair) => {
        let targetGroup = tempGroups.find((g) =>
          pair.some((n) => g.members.some((m) => m.name === n)),
        );

        if (!targetGroup) {
          targetGroup = tempGroups
            .filter((g) => {
              const groupNames = g.members.map((m) => m.name);
              const conflictEx = exclusionPairs.some(
                (ex) =>
                  pair.some((pName) => ex.includes(pName)) &&
                  ex.some((exName) => groupNames.includes(exName)),
              );
              return !conflictEx;
            })
            .sort((a, b) => a.members.length - b.members.length)[0];
        }

        if (!targetGroup)
          targetGroup = tempGroups.sort(
            (a, b) => a.members.length - b.members.length,
          )[0];

        pair.forEach((name) => {
          if (!assignedNames.has(name)) {
            const m = shuffledMembers.find((member) => member.name === name);
            if (m) {
              if (m.role === "idk") targetGroup.idkCount++;
              targetGroup.members.push(m);
              targetGroup.partsCount[m.part]++;
              assignedNames.add(name);
            }
          }
        });
      });

      // [4순위] 남은 인원 배정 (파트 밸런스를 맞춰 남은 칸에 밀어넣기)
      const remainingMembers = shuffledMembers.filter(
        (m) => !assignedNames.has(m.name),
      );

      for (const member of remainingMembers) {
        tempGroups.sort((a, b) => {
          if (member.role === "idk") {
            return (
              a.idkCount - b.idkCount || a.members.length - b.members.length
            );
          }
          // 파트가 부족한 조 -> 전체 인원이 적은 조 순서로 가중치 부여
          return (
            a.partsCount[member.part] - b.partsCount[member.part] ||
            a.members.length - b.members.length
          );
        });

        const targetGroup = tempGroups[0];
        targetGroup.members.push(member);
        targetGroup.partsCount[member.part]++;
        if (member.role === "idk") targetGroup.idkCount++;
        assignedNames.add(member.name);
      }

      // [밸런스 검증] 리더 픽이 고정되었으므로 파트 최대 상한선을 total * 0.6으로 유연하게 체크
      const isBalanced = tempGroups.every((g) => {
        const total = g.members.length;
        if (total === 0) return true;
        const partOverload = Object.values(g.partsCount).some(
          (count) => count > Math.max(2, total * 0.6),
        );
        return !partOverload;
      });

      // 검증에 통과했거나 상한선에 걸려 5000회 오버 시 결과 반환
      if (isBalanced || attempts > 4999) {
        return tempGroups
          .sort((a, b) => a.id - b.id)
          .map((g) => ({
            ...g,
            members: [...g.members]
              .sort((a, b) => {
                const roleOrder = { leader: 1, piano: 2, member: 3, idk: 4 };
                const aOrder = roleOrder[a.role] || 3;
                const bOrder = roleOrder[b.role] || 3;
                return (
                  aOrder - bOrder ||
                  partOrder[a.part] - partOrder[b.part] ||
                  a.name.localeCompare(b.name, "ko")
                );
              })
              .map((m) => ({
                ...m,
                icon:
                  m.role === "leader"
                    ? "👑"
                    : m.role === "piano"
                      ? "🎹"
                      : m.role === "idk"
                        ? "❓"
                        : "",
                state: m.role === "idk" ? " (미정)" : "",
                isIdk: m.role === "idk",
              })),
          }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-indigo-200 py-12">
      <style>{`
        @keyframes fade-out { 0% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(0.8); } }
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-out { animation: fade-out 1.5s ease-out forwards; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>

      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-indigo-300">
          <h1 className="text-3xl font-bold text-center text-indigo-600 mb-2">
            청년성가대 🎶
          </h1>
          <h2 className="text-xl text-center text-indigo-500 mb-8">
            찬양발표회 조 편성
          </h2>

          <div className="space-y-3 mb-8 text-sm">
            <div className="bg-red-50 border border-red-200 text-red-800 font-bold px-4 py-3 rounded-xl">
              <span>* 하기 안내사항들을 실 운영 시 삭제할 예정입니다</span>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl">
              <strong>🛠 개발 모드:</strong> 참여 인원 데이터를 기반으로 조를 편성합니다.
            </div>

            {LEADER_TOGETHER_PAIRS.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-xl">
                <div className="font-bold mb-1">
                  👑 팀장 픽 (무조건 결합) 가상 데이터:
                </div>
                <ul className="list-disc list-inside space-y-1">
                  {LEADER_TOGETHER_PAIRS.map((pair, idx) => (
                    <li key={idx}>
                      <span className="font-bold text-indigo-600">
                        {pair[0]}
                      </span>
                      의 픽: {pair.slice(1).join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {TOGETHER_PAIRS.length > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-2xl">
                <div className="flex items-center gap-2 font-bold mb-2 text-emerald-700">
                  <span>💚</span>
                  <span>단원 픽 (조건 결합) 가상 데이터:</span>
                </div>
                <ul className="space-y-1.5 ml-1">
                  {TOGETHER_PAIRS.map((pair, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-1 text-[10px]">●</span>
                      <div className="leading-tight">
                        <span className="font-bold text-emerald-600">
                          {pair[0]}
                        </span>
                        <span className="text-emerald-700/80 mx-1">의 픽:</span>
                        <span className="font-medium">
                          {pair.slice(1).join(", ")}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {EXCLUSION_PAIRS.length > 0 && (
              <div className="bg-pink-50 border border-pink-200 text-pink-700 px-4 py-3 rounded-xl">
                <strong>🚫 제한 조건:</strong>{" "}
                {EXCLUSION_PAIRS.map((p) => p.join(" ≠ ")).join(" | ")}
              </div>
            )}

            {groups.some((g) =>
              Object.values(g.partsCount).some((count) => count >= 4),
            ) && (
              <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-xl animate-pulse">
                <strong>⚠️ 파트 불균형 안내:</strong> 리더 및 개인 픽(우선 결합) 조건 충족을 위해 특정 조의 파트 밸런스가 조정되었습니다.
              </div>
            )}
          </div>

          <div className="text-center mb-8">
            {isAnimating ? (
              <div className={`relative mb-8 ${animationPhase === 2 ? "animate-fade-out" : ""}`}>
                <div className="relative w-48 h-64 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg shadow-lg border-4 border-indigo-200">
                  <div className="absolute w-36 h-36 bg-white/20 rounded-full top-6 left-6"></div>
                  <div className="absolute w-32 h-32 bg-white/40 rounded-full top-8 left-8 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-purple-300 to-purple-400 rounded-full animate-bounce"></div>
                  </div>
                  <div className="absolute w-4 h-16 bg-purple-600 rounded-full right-4 top-1/2 origin-top transform -translate-y-1/2">
                    <div className="absolute w-10 h-4 bg-purple-700 rounded-full -right-6 top-8 animate-spin"></div>
                  </div>
                  <div className="absolute w-8 h-8 bg-white rounded-full border-4 border-purple-500 left-8 bottom-8">
                    <div className="w-1 h-6 bg-purple-500 absolute top-1 left-3.5 origin-bottom transform rotate-45 animate-spin"></div>
                  </div>
                </div>
                <div className="w-20 h-32 mx-auto bg-gradient-to-b from-transparent via-white to-purple-200 rounded-full shadow-lg"></div>
              </div>
            ) : (
              <button
                onClick={fetchNames}
                disabled={isLoading}
                className="px-8 py-4 rounded-full text-white font-bold text-lg bg-indigo-500 hover:bg-indigo-600 active:scale-95 shadow-lg transition-all"
              >
                ✨ 조 편성 시작 ✨
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          {groups.length > 0 && showResults && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border-2 border-indigo-100 shadow-md flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold text-indigo-700 mb-3 text-center border-b pb-2">
                      {group.id}조 ({group.members.length}명)
                      <div className="mt-2 flex flex-col gap-1 text-sm font-medium text-slate-600">
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
                            팀장
                          </span>
                          <span>
                            {group.members.find((m) => m.role === "leader")?.name || "미배정"}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-sm bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                            반주자
                          </span>
                          <span>
                            {group.members.find((m) => m.role === "piano")?.name || "미배정"}
                          </span>
                        </div>
                      </div>
                    </h3>
                    <ul className="space-y-2 mb-4">
                      {group.members.map((member, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between text-gray-700 bg-white border border-indigo-50 px-3 py-1.5 rounded-lg text-center text-sm font-medium"
                        >
                          <span className="font-bold">
                            {member.name}
                            {member.icon}
                          </span>
                          <span className="text-[10px] bg-indigo-50 px-2 py-0.5 rounded text-indigo-400 font-bold uppercase">
                            {member.part}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-2 border-t border-indigo-50 relative mt-auto">
                    <button
                      onClick={() =>
                        setOpenStatsGroupId(
                          openStatsGroupId === group.id ? null : group.id,
                        )
                      }
                      className="w-full flex items-center justify-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      {openStatsGroupId === group.id ? "통계 닫기 ▲" : "파트별 통계 보기 ▼"}
                    </button>

                    {openStatsGroupId === group.id && (
                      <div className="absolute bottom-full left-0 w-full mb-2 bg-white/95 backdrop-blur-sm border border-indigo-200 rounded-xl shadow-xl p-3 z-20 animate-fade-in-up">
                        <div className="text-[10px] font-bold text-indigo-300 mb-2 text-center uppercase tracking-wider">
                          파트별 인원
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(group.partsCount)
                            .filter(([part]) => part.toLowerCase() !== "🎹") // piano라는 이름의 키는 제외
                            .map(([part, count]) => (
                            <div
                              key={part}
                              className="flex items-center justify-between bg-indigo-50/50 px-2 py-1.5 rounded-md"
                            >
                              <span className="text-xs font-bold text-indigo-600">
                                {part}
                              </span>
                              <span className="text-xs font-black text-slate-700">
                                {count}명
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between bg-purple-50/50 px-2 py-1.5 rounded-md border border-purple-100">
                            <span className="text-xs font-bold text-purple-600">
                              반주자
                            </span>
                            <span className="text-xs font-black text-slate-700">
                              {group.members.filter((m) => m.role === "piano").length}명
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="fixed left-0 right-0 pointer-events-none z-50 flex justify-between" style={{ bottom: -15 }}>
          <div className="animate-praise-custom origin-bottom">
            <img src={choirGirl} alt="찬양하는 소녀" className="w-28 h-auto md:w-24 lg:w-40 scale-x-[-1]" />
          </div>
          <div className="animate-praise-custom origin-bottom" style={{ animationDelay: "0.2s" }}>
            <img src={choirBoy} alt="찬양하는 소년" className="w-28 h-auto md:w-24 lg:w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;