# SD-STD-002 · 사용자 확정 기준 반영 결과

MAIN01-20261109-44DC56DB / 차수1 / characters. 사용자 채택한 신규2안(ID6) 정면/45/90을 향후SD의두상·몸비중·얼굴가독성·픽셀표현 마스터로 연결 완료했다. 새그림 생성0회, 게임런타임/실제유닛/사용자창 변경없음, 커밋/푸시/예약백업없음.

## 변경 결과

기준문서·프롬프트·JSON·실측·제작순서·AGENTS의해당SD지침을정리하고 승인3PNG를자기자료에원본바이트사본으로보관했다. 공용승인ID의철자 scapl도원본그대로유지했다. 은발v1JSON은바이트동일이력으로보관하고기존3개실측목록/날짜도그대로유지했다. 다른인물의얼굴틀/헤어/성별/종족체격/장비를복제하지않도록명시했다. 정수리는추정이며등신수치를확정하지않는다.

reference.native_dimensions의승인원본별1133×1388/1133×1388/1077×1460과 generation.framing_canvas의별도1254×1254납품템플릿을분리했다. 기존모발끝253/발선1178/본체926/정규화/기술검수오차는유지한다. 원본의좁은여백·유색알파·미세생성차이를공통허용결함으로승격하지않았다.

카탈로그는기존250이미지경로메타를--skip-scan으로재사용해현재다른작품/후보를일괄신규분류하지않았다. JSON/HTML의sd_standard와production.sd.standard_id를일치시켰고원본3방향/SHA/native크기/별도템플릿소비검증을추가했다.243자산중발로르1개선택본의은발예정설명만‘선택당시이력’으로정정했고선택/폐기/버전/미검증상태는바꾸지않았다. 기준뷰어는신규2안3방향을주참조로표시하고과거3개원본은접힌이력영역으로분리했다. 뷰어생성기는서로다른원본종횡비를등비등록하며원본캔버스와기술템플릿을구분한다.

## 검증

- node tools/character-catalog/build-sd-standard.mjs: 승인3/역사3, 별도template, 파일생성성공.
- node tools/character-catalog/build.mjs --skip-scan:250경로/243고유이미지/7중복/8분류 유지.
- node tools/character-catalog/verify-files.mjs:250원본해시/83기존항목/499문서링크/JSON-HTML내장일치/기준ID/승인3PNG/native크기/은발이력/SHA/프레이밍분리/미리보기산식/JS문법 통과.
- 승인3원본을view_image로실제열고사본SHA와native크기/ROI알파32의모발끝·발선을재확인했다.
- 기존실측3개/은발JSON바이트·무관한AGENTS본문·캐릭터프로필/분류/선택상태·기존다른미커밋파일·HEAD/index 보존 확인.
- 변경필독AGENTS전체를다시읽고새ACK/start통과: 결과.json/verification.json의최신readingAcknowledgement 참조.

## 검증하지 않은 범위와 남은 조건

사용자지시에따라브라우저/앱화면을열거나조작하지않았다. 뷰어갱신은파일/참조/산식/문법검증이며이번브라우저시각검수·실기기/게임검증은미수행이다. 새마스터로새캐릭터를생성한재현시험도요청범위가아니어서미수행이다. 향후생성에서는원본의유색알파·여백·미세차이를별도납품검수하며,개별캐릭터고유성과기술프레이밍통과를따로확인해야한다. 미적채택은기존사용자확정근거를적용했고새승인을요구하지않았다.

## 실제 경로

- [문서/02_세부기획/02_영웅/SD_공통제작기준.md](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/문서/02_세부기획/02_영웅/SD_공통제작기준.md)
- [문서/02_세부기획/02_영웅/SD_생성프롬프트.md](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/문서/02_세부기획/02_영웅/SD_생성프롬프트.md)
- [자료/캐릭터설정/SD_공통제작기준.json](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/자료/캐릭터설정/SD_공통제작기준.json)
- [자료/캐릭터설정/SD_공통제작기준_실측.json](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/자료/캐릭터설정/SD_공통제작기준_실측.json)
- [자료/캐릭터설정/제작순서.json](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/자료/캐릭터설정/제작순서.json)
- [output/characters/sd-standard/index.html](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/sd-standard/index.html)
- [output/characters/catalog/catalog.json](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/output/characters/catalog/catalog.json)
- [tools/character-catalog/verify-files.mjs](C:/Users/user/orca/workspaces/Grid Defenders/캐릭터디자인2/tools/character-catalog/verify-files.mjs)

전후SHA·변경이유: changes.json. 검증근거: verification.json. 수동저장전로컬상태: manual-save-state.txt.5종기록과변경전원문사본은이결과폴더에보관한다.
