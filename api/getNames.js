// api/getNames.js
export default function handler(req, res) {
  // 환경변수에서 이름 목록 가져오기
  const namesString = process.env.YOUTH_NAMES;
  const exclusionsString = process.env.EXCLUSION_PAIRS;
  const exclusionGroup1String = process.env.EXCLUSION_GROUP_1;
  const exclusionGroup2String = process.env.EXCLUSION_GROUP_2;
  const exclusionGroup3String = process.env.EXCLUSION_GROUP_3;

  if (!namesString) {
    return res.status(500).json({
      error: '환경변수에서 이름 목록을 찾을 수 없습니다.'
    });
  }

  try {
    // 이름 목록 분리
    const names = namesString.split(',').map(name => name.trim());
    const nameSet = new Set(names);

    // 명단에 있는 사람들만 필터링
    let exclusions = [];
    if (exclusionsString) {
      exclusions = exclusionsString.split(',')
      .map(pair => pair.split('-').map(name => name.trim()))
      .filter(pair => pair.length === 2 && nameSet.has(pair[0]) && nameSet.has(pair[1]));
    }

    // 명단에 있는 사람들만 필터링
    let exclusionGroups = [];
    if (exclusionGroup1String) {
      const group1 = exclusionGroup1String.split(',')
        .map(name => name.trim())
        .filter(name => name && nameSet.has(name));
      if (group1.length > 0) {
        exclusionGroups.push(group1);
      }
    }
    if (exclusionGroup2String) {
      const group2 = exclusionGroup2String.split(',')
        .map(name => name.trim())
        .filter(name => name && nameSet.has(name));
      if (group2.length > 0) {
        exclusionGroups.push(group2);
      }
    }
    if (exclusionGroup3String) {
      const group3 = exclusionGroup3String.split(',')
        .map(name => name.trim())
        .filter(name => name && nameSet.has(name));
      if (group3.length > 0) {
        exclusionGroups.push(group3);
      }
    }

    res.status(200).json({ names, exclusions, exclusionGroups });
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({
      error: '데이터를 처리하는 중 오류가 발생했습니다.'
    });
  }
}