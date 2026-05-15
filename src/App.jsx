import React, { useState } from 'react';

function App() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [exclusions, setExclusions] = useState([]);
  const [exclusionGroups, setExclusionGroups] = useState([]);
  const [debug, setDebug] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0); // 0: 없음, 1: 가차머신, 2: 페이드, 3: 결과

  const fetchNames = async () => {
    try {
      setIsLoading(true);
      setError('');
      setDebug('');
      setIsAnimating(true);
      setShowResults(false);
      setAnimationPhase(1);

      let names, exclusionPairs, exclusionGroupsData;

      const isDevelopment = window.location.hostname === 'localhost'
          || window.location.hostname === '127.0.0.1';

      if (isDevelopment) {
        names = [
          '김민준', '이서준', '박서연', '최윤서', '정지호',
          '장도윤', '오유준', '정지윤', '김하린', '이준우',
          '홍승아', '김사랑', '이유진', '박민서', '최지우'
        ];
        exclusionPairs = [
          ['김민준', '이서준'],
          ['박서연', '최윤서']
        ];
        exclusionGroupsData = [
          ['정지호', '장도윤', '오유준'],
          ['김하린', '이준우', '홍승아'],
          ['박서연', '최윤서', '김민준']
        ];
        console.log('🚀 로컬 환경 - 임시 데이터 사용');
        setDebug(`로컬 데이터: ${names.length}명, 제외조합: ${exclusionPairs.length}개, 제외그룹: ${exclusionGroupsData.length}개`);
      } else {
        console.log('🌐 프로덕션 환경 - API 호출');
        const response = await fetch('/api/getNames');

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '데이터를 가져올 수 없습니다.');
        }

        const data = await response.json();
        names = data.names;
        exclusionPairs = data.exclusions || [];
        exclusionGroupsData = data.exclusionGroups || [];
      }

      setExclusions(exclusionPairs);
      setExclusionGroups(exclusionGroupsData);
      const assignedGroups = assignToGroups(names, exclusionPairs, exclusionGroupsData);

      // 애니메이션 타이밍
      setTimeout(() => {
        setGroups(assignedGroups);
        setAnimationPhase(2); // 페이드 아웃 시작
      }, 4000);

      setTimeout(() => {
        setIsAnimating(false);
        setAnimationPhase(3); // 결과 표시
        setTimeout(() => setShowResults(true), 200);
      }, 5500);

    } catch (err) {
      setError(err.message);
      setIsAnimating(false);
      setAnimationPhase(0);
      console.error('❌ Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const assignToGroups = (names, exclusionPairs, exclusionGroupsData) => {
    const totalPeople = names.length;

    if (totalPeople <= 3) {
      return [{
        id: 1,
        members: names
      }];
    }

    let numberOfGroups = Math.round(totalPeople / 3);
    let avgPerGroup = totalPeople / numberOfGroups;

    while (avgPerGroup < 3 && numberOfGroups > 1) {
      numberOfGroups--;
      avgPerGroup = totalPeople / numberOfGroups;
    }

    while (avgPerGroup > 4 && totalPeople - numberOfGroups * 4 >= 3) {
      numberOfGroups++;
      avgPerGroup = totalPeople / numberOfGroups;
    }

    let groups = [];
    let maxAttempts = 10000;
    let attempts = 0;
    let validAssignment = false;

    while (!validAssignment && attempts < maxAttempts) {
      groups = [];
      const shuffledNames = [...names].sort(() => Math.random() - 0.5);

      const baseSize = Math.floor(totalPeople / numberOfGroups);
      const remainder = totalPeople % numberOfGroups;

      let currentIndex = 0;
      for (let i = 0; i < numberOfGroups; i++) {
        const groupSize = i < remainder ? baseSize + 1 : baseSize;
        groups.push({
          id: i + 1,
          members: shuffledNames.slice(currentIndex, currentIndex + groupSize)
        });
        currentIndex += groupSize;
      }

      validAssignment = checkConstraints(groups, exclusionPairs, exclusionGroupsData);

      if (!validAssignment) {
        attempts++;
      }
    }

    if (!validAssignment) {
      console.error(`❌ ${maxAttempts}번 시도 후 실패`);
      console.error('배제 쌍:', exclusionPairs.length, '개');
      console.error('배제 그룹:', exclusionGroupsData.map(g => g.length));
      throw new Error(`제약 조건을 만족하는 조 편성을 찾을 수 없습니다. (${maxAttempts}번 시도) 다시 시도해주세요.`);
    }

    console.log(`✅ ${attempts + 1}번 만에 성공!`);

    return groups;
  };

  const checkConstraints = (groups, exclusionPairs, exclusionGroupsData) => {
    for (const group of groups) {
      // 기존 쌍 배제 조합 체크
      for (const [name1, name2] of exclusionPairs) {
        if (group.members.includes(name1) && group.members.includes(name2)) {
          return false;
        }
      }

      // 그룹 배제 체크: 같은 그룹의 인원들이 같은 조에 2명 이상 있으면 안됨
      for (const exclusionGroup of exclusionGroupsData) {
        const membersInThisGroup = group.members.filter(member =>
          exclusionGroup.includes(member)
        );
        if (membersInThisGroup.length > 1) {
          return false;
        }
      }
    }
    return true;
  };

  const isDev = window.location.hostname === 'localhost'
      || window.location.hostname === '127.0.0.1';

  return (
      <div className="min-h-screen bg-gradient-to-b from-pink-100 to-pink-200 py-12">
        <style>{`
        @keyframes fade-out {
          0% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.8); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-out {
          animation: fade-out 1.5s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>

        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-4 border-pink-300">
            <h1 className="text-3xl font-bold text-center text-pink-600 mb-2">
              청년성가대 ✨
            </h1>
            <h2 className="text-xl text-center text-pink-500 mb-8">
              찬양발표회 조 랜덤 뽑기 🪢
            </h2>

            {isDev && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl mb-6">
                  <strong>개발 모드:</strong> 임시 데이터를 사용합니다.
                </div>
            )}

            {isDev && exclusions.length > 0 && (
                <div className="bg-pink-50 border border-pink-200 text-pink-700 px-4 py-3 rounded-xl mb-6">
                  <strong>배제 조합:</strong> {exclusions.map((pair, idx) =>
                    `${pair[0]} ↔ ${pair[1]}`
                ).join(', ')}
                </div>
            )}

            {isDev && exclusionGroups.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 text-purple-700 px-4 py-3 rounded-xl mb-6">
                  <strong>배제 그룹:</strong>
                  {exclusionGroups.map((group, idx) => (
                    <div key={idx} className="mt-1">
                      그룹 {idx + 1}: {group.join(', ')}
                    </div>
                  ))}
                </div>
            )}

            {isDev && debug && (
                <div className="bg-gray-50 border border-gray-200 text-gray-600 px-4 py-3 rounded-xl mb-6 whitespace-pre-wrap font-mono text-sm">
                  {debug}
                </div>
            )}

            <div className="text-center mb-8">
              {isAnimating ? (
                  <div className={`relative mb-8 ${animationPhase === 2 ? 'animate-fade-out' : ''}`}>
                    {/* 가차 머신 */}
                    <div className="relative w-48 h-64 mx-auto bg-gradient-to-br from-pink-400 to-pink-500 rounded-lg shadow-lg border-4 border-pink-300">
                      <div className="absolute w-36 h-36 bg-white/20 rounded-full top-6 left-6"></div>
                      <div className="absolute w-32 h-32 bg-white/40 rounded-full top-8 left-8 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-pink-300 to-pink-400 rounded-full animate-bounce"></div>
                      </div>
                      {/* 레버 */}
                      <div className="absolute w-4 h-16 bg-pink-600 rounded-full right-4 top-1/2 origin-top transform -translate-y-1/2">
                        <div className="absolute w-10 h-4 bg-pink-700 rounded-full -right-6 top-8 animate-spin"></div>
                      </div>
                      {/* 다이얼 */}
                      <div className="absolute w-8 h-8 bg-white rounded-full border-4 border-pink-500 left-8 bottom-8">
                        <div className="w-1 h-6 bg-pink-500 absolute top-1 left-3.5 origin-bottom transform rotate-45 animate-spin"></div>
                      </div>
                    </div>

                    {/* 캡슐 애니메이션 */}
                    <div className="w-20 h-32 mx-auto bg-gradient-to-b from-transparent via-white to-pink-200 rounded-full shadow-lg"></div>
                  </div>
              ) : (
                  <button
                      onClick={fetchNames}
                      disabled={isLoading || isAnimating}
                      className={`px-8 py-4 rounded-full text-white font-bold text-lg transform transition-all ${
                          isLoading || isAnimating
                              ? 'bg-pink-300 cursor-not-allowed'
                              : 'bg-pink-500 hover:bg-pink-600 active:scale-95 shadow-lg'
                      }`}
                  >
                    ✨ 조 배치 뽑기 ✨
                  </button>
              )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
            )}

            {groups.length > 0 && showResults && (
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${showResults ? 'animate-fade-in' : ''}`}>
                  {groups.map((group) => (
                      <div
                          key={group.id}
                          className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border-2 border-pink-200 shadow-md transform transition-all hover:scale-105"
                      >
                        <h3 className="text-lg font-bold text-pink-700 mb-3 text-center">
                          🌸 {group.id}조 ({group.members.length}명) 🌸
                        </h3>
                        <ul className="space-y-2">
                          {group.members.map((member, index) => (
                              <li
                                  key={index}
                                  className="text-pink-700 bg-white/80 px-3 py-1 rounded-full shadow-sm text-center font-medium"
                              >
                                {member}
                              </li>
                          ))}
                        </ul>
                      </div>
                  ))}
                </div>
            )}
          </div>

          <div className="mt-8 text-center text-sm text-pink-600">
            <p>청년봉사선교회 IT부 © 2025 💖</p>
          </div>
        </div>
      </div>
  );
}

export default App;