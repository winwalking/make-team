import React, { useState } from "react";

const MEMBER_LIST = [
  { name: "김은석", part: "Bas", role: "" },
  { name: "이동현", part: "Bas", role: "" },
  { name: "오병호", part: "Bas", role: "" },
  { name: "양원석", part: "Bas", role: "" },
  { name: "김정문", part: "Bas", role: "" },
  { name: "유민수", part: "Bas", role: "leader" },
  { name: "이승찬", part: "Bas", role: "leader" }, // Bas
  { name: "김두현", part: "Ten", role: "leader" },
  { name: "강재형", part: "Ten", role: "" },
  { name: "김승진", part: "Ten", role: "" },
  { name: "김서진", part: "Ten", role: "" }, // Ten
  { name: "윤혜린", part: "Alt", role: "" },
  { name: "이해민", part: "Alt", role: "" },
  { name: "정현진", part: "Alt", role: "" },
  { name: "김예원", part: "Alt", role: "idk" },
  { name: "정지요", part: "Alt", role: "idk" },
  { name: "윤희원", part: "Alt", role: "idk" }, // Alt
  { name: "김소이", part: "Sop", role: "" },
  { name: "김정현", part: "Sop", role: "" },
  { name: "이경미", part: "Sop", role: "" },
  { name: "이아영", part: "Sop", role: "" },
  { name: "정진희", part: "Sop", role: "" },
  { name: "김수빈", part: "Sop", role: "" },
  { name: "김은선", part: "Sop", role: "idk" },
  { name: "이혜린", part: "Sop", role: "idk" }, // Sop
  { name: "강은수", part: "🎹", role: "piano" },
  { name: "정선미", part: "🎹", role: "piano" },
  { name: "이채은", part: "🎹", role: "piano" },
];

// 1. 리더의 Pick (리더 포함 3명씩 한 묶음)
const LEADER_TOGETHER_PAIRS = [
  ["김두현", "김수빈", "정진희"],
  ["이승찬", "이혜린", "김은선"],
  ["유민수", "김은석", "이동현"],
];

// 2. 리더와 반주자들끼리는 절대 같은 조 불가
const EXCLUSION_PAIRS = [
  ["김두현", "이승찬", "유민수"],
  ["강은수", "정선미", "이채은"],
]; // 배제 조합

// 3. 개인 단원들의 선호 픽
const TOGETHER_PAIRS = [
  ["윤희원", "김은선"],
  ["김정문", "이경미"],
  ["정선미", "이채은"],
  ["김은선", "이채은"],
]; // 조건 조합

function App() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  const fetchNames = async () => {
    try {
      setIsLoading(true);
      setError("");
      setIsAnimating(true);
      setShowResults(false);
      setAnimationPhase(1);

      // 로직 실행
      const assignedGroups = assignToGroups(
        MEMBER_LIST,
        LEADER_TOGETHER_PAIRS,
        TOGETHER_PAIRS,
        EXCLUSION_PAIRS,
      );

      // 가차 애니메이션 연출 (4초 후 결과 준비)
      setTimeout(() => {
        setGroups(assignedGroups);
        setAnimationPhase(2);
      }, 4000);

      // 5.5초 후 최종 결과 공개
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

const assignToGroups = (members, leaderTogetherPairs, togetherPairs, exclusionPairs) => {
  const numberOfGroups = 3;
  const partOrder = { Sop: 1, Alt: 2, Ten: 3, Bas: 4 };
  let attempts = 0;

  while (attempts < 5000) {
    attempts++;
    const tempGroups = Array.from({ length: numberOfGroups }, (_, i) => ({
      id: i + 1,
      members: [],
      partsCount: { Sop: 0, Alt: 0, Ten: 0, Bas: 0 },
      hasPiano: false,
      idkCount: 0,
    }));

    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);
    const assignedNames = new Set();

    // [1순위] 리더 픽 배정 (LEADER_TOGETHER_PAIRS)
    leaderTogetherPairs.forEach((pair, idx) => {
      const targetGroup = tempGroups[idx % numberOfGroups];
      pair.forEach((name) => {
        const m = shuffledMembers.find((member) => member.name === name);
        if (m && !assignedNames.has(name)) {
          if (m.role === "piano") targetGroup.hasPiano = true;
          if (m.role === "idk") targetGroup.idkCount++;
          targetGroup.members.push(m);
          targetGroup.partsCount[m.part]++;
          assignedNames.add(name);
        }
      });
    });

    // [2순위] 배제 조합 처리 (EXCLUSION_PAIRS)
    // 배제 대상자들이 이미 리더픽으로 흩어졌는지 확인하고, 안 흩어졌다면 강제로 다른 조에 배정
    exclusionPairs.forEach((exPair) => {
      exPair.forEach((name, idx) => {
        if (assignedNames.has(name)) return; // 이미 리더픽으로 배정됐다면 패스

        const m = shuffledMembers.find((member) => member.name === name);
        if (m) {
          // 배제 인원이 들어갈 수 있는 조 찾기 (해당 조에 이 배제 조합의 다른 인원이 없어야 함)
          const targetGroup = tempGroups.find(g => 
            !exPair.some(exName => g.members.some(member => member.name === exName))
          ) || tempGroups.sort((a, b) => a.members.length - b.members.length)[0];

          if (m.role === "piano") targetGroup.hasPiano = true;
          if (m.role === "idk") targetGroup.idkCount++;
          targetGroup.members.push(m);
          targetGroup.partsCount[m.part]++;
          assignedNames.add(name);
        }
      });
    });

    // [3순위] 단원 픽 배정 (TOGETHER_PAIRS)
    togetherPairs.forEach((pair) => {
      const pairMembers = pair.map(n => shuffledMembers.find(m => m.name === n)).filter(Boolean);
      const hasPianoInPair = pairMembers.some(m => m.role === "piano");

      // 1. 기존 배정된 사람 있는지 확인
      let targetGroup = tempGroups.find(g => pair.some(n => g.members.some(m => m.name === n)));

      // 2. 배제 조합과 충돌하는지 확인 로직 추가
      if (!targetGroup) {
        targetGroup = tempGroups
          .filter(g => {
            const groupNames = g.members.map(m => m.name);
            // 이 조에 들어갔을 때 배제 조합(EXCLUSION_PAIRS) 중 한 곳이라도 겹치면 제외
            const conflictEx = exclusionPairs.some(ex => 
              pair.some(pName => ex.includes(pName)) && ex.some(exName => groupNames.includes(exName))
            );
            const pianoConflict = hasPianoInPair && g.hasPiano;
            return !conflictEx && !pianoConflict;
          })
          .sort((a, b) => a.members.length - b.members.length)[0];
      }

      // 조를 못 찾았다면 가장 널널한 조로 (이 경우 주황색 창 안내 발생)
      if (!targetGroup) targetGroup = tempGroups.sort((a, b) => a.members.length - b.members.length)[0];

      pair.forEach((name) => {
        const m = shuffledMembers.find((member) => member.name === name);
        if (m && !assignedNames.has(name)) {
          if (m.role === "piano") targetGroup.hasPiano = true;
          if (m.role === "idk") targetGroup.idkCount++;
          targetGroup.members.push(m);
          targetGroup.partsCount[m.part]++;
          assignedNames.add(name);
        }
      });
    });

      // [4순위] 남은 반주자 및 나머지 인원 배정
      const remainingPianos = shuffledMembers.filter(
        (m) => m.role === "piano" && !assignedNames.has(m.name),
      );

      for (const piano of remainingPianos) {
        // 1순위: 반주자가 없는 조 / 2순위: 인원이 가장 적은 조
        const targetGroup = tempGroups
          .filter((g) => !g.hasPiano)
          .sort((a, b) => a.members.length - b.members.length)[0];

        // 만약 모든 조에 반주자가 이미 찼다면, 인원 적은 조에 강제 배정
        const finalGroup =
          targetGroup ||
          tempGroups.sort((a, b) => a.members.length - b.members.length)[0];

        finalGroup.members.push(piano);
        finalGroup.partsCount[piano.part]++;
        finalGroup.hasPiano = true;
        assignedNames.add(piano.name);
      }

      // 나머지 일반 인원 배정
      const remainingMembers = shuffledMembers.filter(
        (m) => !assignedNames.has(m.name),
      );
      for (const member of remainingMembers) {
        tempGroups.sort((a, b) => {
          if (member.role === "idk")
            return (
              a.idkCount - b.idkCount || a.members.length - b.members.length
            );
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

      // [결과 검증] 모든 조에 반주자가 2명 이상 들어갔는지 체크하여 사유 생성 준비
      const pianoIssue = tempGroups.some(
        (g) => g.members.filter((m) => m.role === "piano").length >= 2,
      );

      // 반환 (정렬 로직 포함)
      return tempGroups
        .sort((a, b) => a.id - b.id)
        .map((g) => ({
          ...g,
          members: [...g.members]
            .sort(
              (a, b) =>
                (a.role === "leader" ? 1 : a.role === "piano" ? 2 : 3) -
                  (b.role === "leader" ? 1 : b.role === "piano" ? 2 : 3) ||
                partOrder[a.part] - partOrder[b.part] ||
                a.name.localeCompare(b.name, "ko"),
            )
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

          <div className="text-center mb-8">
            {isAnimating ? (
              <div
                className={`relative mb-8 ${animationPhase === 2 ? "animate-fade-out" : ""}`}
              >
                {/* 가차 머신 */}
                <div className="relative w-48 h-64 mx-auto bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg shadow-lg border-4 border-indigo-200">
                  <div className="absolute w-36 h-36 bg-white/20 rounded-full top-6 left-6"></div>
                  <div className="absolute w-32 h-32 bg-white/40 rounded-full top-8 left-8 overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-br from-purple-300 to-purple-400 rounded-full animate-bounce"></div>
                  </div>
                  {/* 레버 */}
                  <div className="absolute w-4 h-16 bg-purple-600 rounded-full right-4 top-1/2 origin-top transform -translate-y-1/2">
                    <div className="absolute w-10 h-4 bg-purple-700 rounded-full -right-6 top-8 animate-spin"></div>
                  </div>
                  {/* 다이얼 */}
                  <div className="absolute w-8 h-8 bg-white rounded-full border-4 border-purple-500 left-8 bottom-8">
                    <div className="w-1 h-6 bg-purple-500 absolute top-1 left-3.5 origin-bottom transform rotate-45 animate-spin"></div>
                  </div>
                </div>

                {/* 캡슐 애니메이션 */}
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
                  className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-4 border-2 border-indigo-100 shadow-md"
                >
                  <h3 className="text-lg font-bold text-indigo-700 mb-3 text-center border-b pb-2">
                    {group.id}조 ({group.members.length}명)
                    <div className="mt-2 flex flex-col gap-1 text-sm font-medium text-slate-600">
                      {/* 팀장 찾아서 표시 */}
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded">
                          팀장
                        </span>
                        <span>
                          {group.members.find((m) => m.icon === "👑")?.name ||
                            "미배정"}
                        </span>
                      </div>
                      {/* 반주자 찾아서 표시 */}
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                          반주자
                        </span>
                        <span>
                          {group.members.find((m) => m.icon === "🎹")?.name ||
                            "미배정"}
                        </span>
                      </div>
                    </div>
                  </h3>
                  <ul className="space-y-2">
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
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
