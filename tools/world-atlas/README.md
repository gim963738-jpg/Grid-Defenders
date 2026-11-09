# 세계관 지도와 설정집

사용자가 요청한 오대륙의 국가·두 수도·정치 세력·독립 마탑·마법사 가문·신앙·북방 부족을 지도와 문서로 함께 관리한다.

- 원본 설정: [세계관설정.json](../../자료/세계관/세계관설정.json)
- 지도와 지역별 열람: [index.html](../../output/world/atlas/index.html)
- 전체 설정집: [설정집.html](../../output/world/atlas/설정집.html)
- 문서 설정집: [세계관설정집.md](../../문서/02_세부기획/00_세계관/세계관설정집.md)
- 최신 산출물 경로: [current.json](../../output/world/current.json)

설정을 수정할 때는 JSON을 먼저 바꾸고 다음 명령으로 문서와 HTML을 함께 갱신한다.

```powershell
node tools/world-atlas/build.mjs
node tools/world-atlas/verify.mjs
```

Orca에서 열람본을 연 뒤 브라우저 페이지 ID를 지정하면 지역 전환·지도 번호·북마크·모바일 레이아웃을 확인할 수 있다.

```powershell
node tools/world-atlas/verify-browser.mjs <browserPageId>
```

지도 PNG는 생성 도구가 반환한 원본 크기와 바이트를 보관한다. 빌드는 지도를 확대·축소하거나 다시 생성하지 않는다. 각 버전의 프롬프트·생성 기록·시각 검수 기록은 PNG와 같은 폴더에 있다. 지도 변경 때는 이전 버전을 남기고 새 이미지 경로와 버전을 JSON에 반영한다. 폭·높이는 실제 PNG에서 읽어 이미지 속성과 지도 영역의 가로세로 비율에 적용하며, 표식 좌표도 새 지형에 맞춰 갱신한다. 엘프의 숲 같은 자연 거점은 JSON의 landmarks와 지도 markers에 함께 등록하며, 국가 소속을 지정받지 않았다면 political_affiliation은 null로 둔다.

대륙 내부 방향 구역은 regional_divisions에 기록한다. 각 대륙의 지역 구획 표는 빌더가 이 배열에서 만든다. 지명 없는 작은 충돌지는 minor_impact_sites에 name:null과 map_label:false로 보관하며 지도 표식과 지명 목록에 넣지 않는다.

아르케리온의 대외적 충의와 실질적 협력, 두 봉신가문 밖 마법사들의 자유, 남부의 공개되지 않은 무력, 북방 설산에 한정된 전력 우위는 이후 설정에서도 구분한다. 북부의 신성한 전승을 신앙의 신으로 바꾸지 않는다. 엘프·드워프의 소수민족 설정은 peoples에 기록하고 거점의 people_id로 연결한다. 두 민족의 국력 비교는 민족 전체를 기준으로 한다.

독립 마탑은 organizations에, 궁정의 친왕파·귀족파는 factions에 기록한다. 오르딘의 중립은 제3의 궁정 파벌을 추가하는 의미가 아니며 faction_id:null과 alignment:"중립"으로 나타낸다. 네 가문의 현재 소속은 왕국, 창립 계보는 마탑 출신으로 구분한다. 전문 마법은 families[].magic에 기록하며 미지정 학파로 되돌리지 않는다. 아르케리온 표식과 설명에서 마탑을 함께 볼 수 있으며 별도의 도시 좌표나 지도 PNG를 만들지 않는다.

발트레인 왕국의 친왕파·반왕파도 factions에 보관하되 region_id:west와 고유 ID로 중앙의 파벌과 구분한다. 세력 표는 국가별로 필터링하며 중앙의 친왕파·귀족파 표에 서부 세력을 섞지 않는다. 발레트레인 왕국은 기존 표준명 발트레인 왕국의 별칭이다.
