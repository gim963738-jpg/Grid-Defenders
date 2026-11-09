export const DRAW_PURPOSES = {
	unassigned: "미지정 · 나중에 부여",
	direction: "방향·이동 경로",
	appearance: "완성됐을 때의 모습",
	path: "선을 따라 발생하는 연출",
	reference: "참고·위치 표시",
	custom: "직접 의미 정의"
};
export const DRAW_BEHAVIORS = {
	reference: "참고 자료로만 보관",
	direction: "이동 방향으로 적용",
	appearance: "그린 모양 그대로 표시",
	path: "선을 따라 순차 재생"
};
export const DRAW_TOOLS = {
	pen: "자유선",
	line: "직선",
	curve: "곡선"
};
export const DRAW_ROLES = {
	move: {
		name: "돌진·이동",
		color: "#f4ce55"
	},
	slash: {
		name: "검로",
		color: "#ff777b"
	},
	effect: {
		name: "이펙트",
		color: "#70baff"
	}
};
export const DRAW_STYLES = {
	trail: "빛나는 선",
	orb: "빛 이동",
	burst: "끝점 폭발",
	field: "장판·외곽 연결"
};
export const emptyDrawing = () => ({
	version: 1,
	enabled: true,
	showBase: false,
	prompt: "",
	strokes: []
});
export const newStroke = (role, points, step, color = "#9be8b3") => ({
	id: crypto.randomUUID(),
	role,
	points,
	step,
	duration: .6,
	delay: 0,
	linger: .2,
	color,
	width: role === "slash" ? .025 : .015,
	style: "trail",
	followActor: false,
	fold: false,
	note: ""
});
export const strokePurpose = (stroke) => stroke.purpose ?? (stroke.role === "move" ? "direction" : "path");
export function strokeBehavior(stroke) {
	const purpose = strokePurpose(stroke);
	if (purpose === "custom") return stroke.behavior ?? "reference";
	return purpose === "unassigned" || purpose === "reference" ? "reference" : purpose;
}
/** Legacy move paths retain actor motion; authored VFX directions default to independent effects. */
export const directionTarget = (stroke) => stroke.directionTarget ?? (stroke.role === "move" ? "actor" : "effect");
export const actorDirection = (stroke) => strokeBehavior(stroke) === "direction" && directionTarget(stroke) === "actor";
export const strokeLabel = (stroke) => stroke.meaning?.trim() || DRAW_PURPOSES[strokePurpose(stroke)];
export const guideColor = (stroke) => stroke.guideColor ?? DRAW_ROLES[stroke.role].color;
/** Spatial opacity along the axis; the soft front advances from the start toward the end. */
export function strokeFadeOpacity(fade, life, position) {
	if (life <= fade.start) return 1;
	if (life >= fade.end) return 0;
	const progress = (life - fade.start) / (fade.end - fade.start), front = progress * (1 + fade.softness) - fade.softness;
	const t = Math.max(0, Math.min(1, (position - front) / fade.softness));
	return t * t * (3 - 2 * t);
}
export function geometryPoints(tool, anchors) {
	if (tool !== "curve") return anchors.map((p) => [...p]);
	const [a, c, b] = anchors;
	return Array.from({ length: 33 }, (_, i) => {
		const t = i / 32, u = 1 - t;
		return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
	});
}
export function reverseStroke(stroke) {
	if (stroke.fadeAlong) [stroke.fadeAlong.from, stroke.fadeAlong.to] = [stroke.fadeAlong.to, stroke.fadeAlong.from];
	if (stroke.tool === "curve" && stroke.anchors) {
		stroke.anchors = [
			stroke.anchors[2],
			stroke.anchors[1],
			stroke.anchors[0]
		];
		stroke.points = geometryPoints("curve", stroke.anchors);
	} else {
		stroke.points.reverse();
		if (stroke.anchors) stroke.anchors.reverse();
	}
}
export function drawingSchedule(plan) {
	const result = [];
	let clock = 0;
	const active = plan.strokes.filter((s) => strokeBehavior(s) !== "reference");
	for (const step of [...new Set(active.map((s) => s.step))].sort((a, b) => a - b)) {
		const group = active.filter((s) => s.step === step);
		group.forEach((stroke) => result.push({
			stroke,
			start: clock + stroke.delay,
			end: clock + stroke.delay + stroke.duration,
			finish: clock + stroke.delay + stroke.duration + stroke.linger
		}));
		clock += Math.max(...group.map((s) => s.delay + s.duration));
	}
	return result;
}
export const drawingDuration = (plan) => Math.max(.1, ...drawingSchedule(plan).map((s) => s.finish));
export const drawingTime = (recipe, index) => index / Math.max(1, recipe.settings.frames - 1) * (recipe.settings.frames / recipe.settings.fps);
/** Arc-length interpolation makes a hand-drawn path independent of pointer sampling density. */
export function samplePath(points, progress) {
	if (!points.length) return [.5, .5];
	if (progress <= 0) return [...points[0]];
	if (progress >= 1) return [...points[points.length - 1]];
	const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
	const length = lengths.reduce((sum, n) => sum + n, 0);
	if (length < 1e-8) return [...points[0]];
	let distance = length * progress;
	for (let i = 0; i < lengths.length; i++) {
		if (distance <= lengths[i] && lengths[i] > 0) {
			const p = distance / lengths[i];
			return [points[i][0] + (points[i + 1][0] - points[i][0]) * p, points[i][1] + (points[i + 1][1] - points[i][1]) * p];
		}
		distance -= lengths[i];
	}
	return [...points[points.length - 1]];
}
export function drawingActor(plan, time) {
	if (!plan?.enabled) return null;
	const moves = drawingSchedule(plan).filter((s) => actorDirection(s.stroke));
	if (!moves.length) return null;
	let position = samplePath(moves[0].stroke.points, 0);
	for (const entry of moves) {
		if (time < entry.start) break;
		position = samplePath(entry.stroke.points, Math.min(1, (time - entry.start) / entry.stroke.duration));
	}
	return position;
}
export function fitDrawingTiming(recipe) {
	if (!recipe.drawing?.strokes.some((s) => strokeBehavior(s) !== "reference") || !recipe.drawing.enabled) return;
	const duration = Math.round(drawingDuration(recipe.drawing) * 1e4) / 1e4;
	recipe.settings.frames = Math.max(2, Math.min(64, Math.ceil(duration * 30 - 1e-6)));
	recipe.settings.fps = Math.floor(recipe.settings.frames / duration * 1e6) / 1e6;
	recipe.placement.impactFrame = Math.min(recipe.placement.impactFrame, recipe.settings.frames);
}
const obj = (v) => {
	if (!v || typeof v !== "object" || Array.isArray(v)) throw Error("그리기 데이터 형식이 올바르지 않습니다.");
	return v;
};
const num = (v, lo, hi, label, integer = false) => {
	if (typeof v !== "number" || !Number.isFinite(v) || v < lo || v > hi || integer && !Number.isInteger(v)) throw Error(`${label}: ${lo}~${hi} 범위를 확인해 주세요.`);
	return v;
};
const bool = (v) => {
	if (typeof v !== "boolean") throw Error("그리기 옵션은 true 또는 false여야 합니다.");
	return v;
};
const text = (v, max) => {
	if (typeof v !== "string" || v.length > max) throw Error(`그리기 설명은 ${max}자 이하로 적어 주세요.`);
	return v;
};
export function validateDrawing(raw) {
	const r = obj(raw);
	if (r.version !== 1 || !Array.isArray(r.strokes) || r.strokes.length > 24) throw Error("그리기는 version 1, 선 24개까지 지원합니다.");
	const ids = new Set(), moveSteps = new Set();
	const strokes = r.strokes.map((raw) => {
		const s = obj(raw), id = text(s.id, 80);
		if (!/^[a-z\d_-]+$/i.test(id) || ids.has(id)) throw Error("그린 선 ID는 중복 없는 영문·숫자·밑줄·하이픈이어야 합니다.");
		ids.add(id);
		if (!Object.hasOwn(DRAW_ROLES, s.role) || !Object.hasOwn(DRAW_STYLES, s.style)) throw Error("그린 선의 역할 또는 표현을 확인해 주세요.");
		if (!Array.isArray(s.points) || s.points.length < 2 || s.points.length > 256) throw Error("선마다 좌표가 2~256개 필요합니다.");
		const points = s.points.map((p) => {
			if (!Array.isArray(p) || p.length !== 2) throw Error("선 좌표는 [x,y]입니다.");
			return [num(p[0], 0, 1, "선 X"), num(p[1], 0, 1, "선 Y")];
		});
		const step = num(s.step, 1, 24, "단계", true), role = s.role;
		const color = text(s.color, 7);
		if (!/^#[\da-f]{6}$/i.test(color)) throw Error("실제 효과색은 #RRGGBB 형식입니다.");
		const result = {
			id,
			role,
			points,
			step,
			duration: num(s.duration, .1, 5, "선 재생 시간"),
			delay: num(s.delay, 0, 5, "선 시작 지연"),
			linger: num(s.linger, 0, 5, "잔상 시간"),
			color,
			width: num(s.width, .005, .06, "선 두께"),
			style: s.style,
			followActor: bool(s.followActor),
			fold: bool(s.fold),
			note: text(s.note, 600)
		};
		if (s.purpose !== undefined) {
			if (!Object.hasOwn(DRAW_PURPOSES, s.purpose)) throw Error("선의 의미를 확인해 주세요.");
			result.purpose = s.purpose;
		}
		if (s.meaning !== undefined) result.meaning = text(s.meaning, 160);
		if (s.behavior !== undefined) {
			if (!Object.hasOwn(DRAW_BEHAVIORS, s.behavior)) throw Error("미리보기 적용 방법을 확인해 주세요.");
			result.behavior = s.behavior;
		}
		if (s.guideColor !== undefined) {
			const c = text(s.guideColor, 7);
			if (!/^#[\da-f]{6}$/i.test(c)) throw Error("편집용 선 색을 확인해 주세요.");
			result.guideColor = c;
		}
		if (s.directionTarget !== undefined) {
			if (s.directionTarget !== "actor" && s.directionTarget !== "effect") throw Error("방향선의 이동 대상을 확인해 주세요.");
			result.directionTarget = s.directionTarget;
		} else if (s.purpose !== undefined && strokeBehavior(result) === "direction") result.directionTarget = directionTarget(result);
		if (s.directionId !== undefined) {
			const link = text(s.directionId, 80);
			if (!/^[a-z\d_-]+$/i.test(link)) throw Error("연결할 방향선 ID를 확인해 주세요.");
			result.directionId = link;
		}
		if (s.fadeAlong !== undefined) {
			const f = obj(s.fadeAlong), point = (v) => {
				if (!Array.isArray(v) || v.length !== 2) throw Error("소멸 방향 좌표는 [x,y]입니다.");
				return [num(v[0], 0, 1, "소멸 X"), num(v[1], 0, 1, "소멸 Y")];
			};
			const from = point(f.from), to = point(f.to), start = num(f.start, 0, .99, "소멸 시작"), end = num(f.end, .01, 1, "소멸 종료");
			if (start >= end || Math.hypot(to[0] - from[0], to[1] - from[1]) < 1e-5) throw Error("소멸 방향의 두 점과 시작·종료 시간을 구분해 주세요.");
			result.fadeAlong = {
				from,
				to,
				start,
				end,
				softness: num(f.softness, .02, .5, "소멸 경계 부드러움")
			};
		}
		if (s.tool !== undefined) {
			if (!Object.hasOwn(DRAW_TOOLS, s.tool)) throw Error("그리기 도구를 확인해 주세요.");
			result.tool = s.tool;
			if (result.tool !== "pen") {
				const count = result.tool === "curve" ? 3 : 2;
				if (!Array.isArray(s.anchors) || s.anchors.length !== count) throw Error(`이 도구는 기준점 ${count}개가 필요합니다.`);
				result.anchors = s.anchors.map((p) => {
					if (!Array.isArray(p) || p.length !== 2) throw Error("기준점은 [x,y]입니다.");
					return [num(p[0], 0, 1, "기준점 X"), num(p[1], 0, 1, "기준점 Y")];
				});
				const expected = geometryPoints(result.tool, result.anchors);
				if (points.length !== expected.length || points.some((p, i) => Math.hypot(p[0] - expected[i][0], p[1] - expected[i][1]) > 1e-5)) throw Error("직선·곡선의 기준점과 경로 좌표가 일치하지 않습니다.");
			}
		}
		if (strokeBehavior(result) === "appearance" && !["trail", "field"].includes(result.style)) throw Error("완성 모습은 그린 윤곽 또는 채운 모양으로 표시해 주세요.");
		if (actorDirection(result)) {
			if (moveSteps.has(step)) throw Error("한 캐릭터의 동시 이동 방향은 하나입니다. 빛을 여러 갈래로 분열하려면 방향선 대상을 ‘연결할 모양·이펙트의 이동’으로 지정해 주세요.");
			moveSteps.add(step);
		}
		return result;
	});
	for (const stroke of strokes) if (stroke.directionId) {
		const target = strokes.find((s) => s.id === stroke.directionId);
		if (!target || target.id === stroke.id || strokeBehavior(target) !== "direction") throw Error("연결할 방향선이 없거나 방향 용도가 아닙니다.");
		if (!["appearance", "path"].includes(strokeBehavior(stroke)) || stroke.followActor) throw Error("방향선 연결은 모양·연출 경로에만 적용하며 돌진 따라가기와 중복할 수 없습니다.");
	}
	const plan = {
		version: 1,
		enabled: bool(r.enabled),
		showBase: bool(r.showBase),
		prompt: text(r.prompt, 3e3),
		strokes
	};
	if (drawingDuration(plan) > 60) throw Error("그림 전체 길이는 잔상을 포함해 60초 이하로 맞춰 주세요.");
	return plan;
}
/** Explicit local keyword support; not an AI endpoint. Manual fields remain authoritative. */
export function applyDrawingDescription(plan) {
	const result = structuredClone(plan);
	let changed = 0;
	for (const stroke of result.strokes) {
		if (!["appearance", "path"].includes(strokeBehavior(stroke))) continue;
		const description = `${result.prompt} ${stroke.note}`.replace(/(?:노란|노랑|빨간|빨강|파란|파랑)\s*선/g, "");
		const old = JSON.stringify(stroke);
		const colors = [
			[/녹색|초록|green/i, "#65ed9a"],
			[/노란|노랑|yellow/i, "#ffe082"],
			[/빨간|빨강|적색|red/i, "#ff7979"],
			[/파란|파랑|청색|blue/i, "#7fcfff"],
			[/보라|purple/i, "#c09bff"],
			[/하얀|흰색|white/i, "#f0fff6"]
		];
		for (const [pattern, color] of colors) if (pattern.test(description)) stroke.color = color;
		if (stroke.role === "effect" && strokeBehavior(stroke) !== "appearance") {
			const styleText = /장판|외곽|다각형|폭발|폭팔|빛\s*이동|구슬|빛덩이|연결|번개|빛나는\s*선/.test(stroke.note) ? stroke.note : result.prompt;
			if (/장판|외곽|다각형/.test(styleText)) stroke.style = "field";
			else if (/폭발|폭팔/.test(styleText)) stroke.style = "burst";
			else if (/빛\s*이동|구슬|빛덩이/.test(styleText)) stroke.style = "orb";
			else if (/연결|번개|빛나는\s*선/.test(styleText)) stroke.style = "trail";
		}
		if (/접히|접힘|접어|꼬이|꼬임/.test(description)) stroke.fold = true;
		if (/잔상|유지/.test(description)) stroke.linger = Math.max(stroke.linger, .6);
		if (JSON.stringify(stroke) !== old) changed++;
	}
	return {
		plan: result,
		changed
	};
}
export function drawingExample() {
	const move = newStroke("move", [
		[.22, .62],
		[.38, .57],
		[.58, .48],
		[.72, .4]
	], 1);
	move.duration = .85;
	move.note = "노란선을 따라 돌진";
	const slash = newStroke("slash", [
		[.3, .32],
		[.42, .28],
		[.57, .32],
		[.7, .46],
		[.69, .62]
	], 1, "#b5f8d0");
	slash.duration = .85;
	slash.note = "돌진과 동시에 녹색 검격";
	const burst = newStroke("effect", [[.63, .43], [.71, .46]], 2, "#65ed9a");
	burst.style = "burst";
	burst.duration = .6;
	burst.linger = .2;
	burst.width = .025;
	burst.note = "파란선 끝점에서 녹색 폭발";
	return {
		version: 1,
		enabled: true,
		showBase: false,
		prompt: "노란선을 따라 돌진하면서 빨간 검로로 베고, 파란선 끝에서 녹색 폭발.",
		strokes: [
			move,
			slash,
			burst
		]
	};
}
export function drawingDesignExample() {
	const direction = newStroke("move", [[.24, .6], [.7, .4]], 1);
	direction.purpose = "direction";
	direction.directionTarget = "effect";
	direction.meaning = "검기의 이동 방향";
	direction.guideColor = "#f4ce55";
	direction.tool = "line";
	direction.anchors = direction.points.map((p) => [...p]);
	direction.duration = 1.2;
	const anchors = [
		[.35, .5],
		[.5, .25],
		[.65, .5]
	];
	const appearance = newStroke("effect", geometryPoints("curve", anchors), 1, "#65ed9a");
	appearance.purpose = "appearance";
	appearance.meaning = "완성됐을 때 보이는 검기 모양";
	appearance.guideColor = "#ff777b";
	appearance.tool = "curve";
	appearance.anchors = anchors;
	appearance.directionId = direction.id;
	appearance.duration = 1.2;
	const reference = newStroke("effect", [[.22, .68], [.75, .68]], 1);
	reference.purpose = "custom";
	reference.behavior = "reference";
	reference.meaning = "지면 높이 참고";
	reference.guideColor = "#70baff";
	reference.note = "이 선은 위치를 설명하는 참고선이며 화면에 표시하지 않는다.";
	reference.tool = "line";
	reference.anchors = reference.points.map((p) => [...p]);
	return {
		version: 1,
		enabled: true,
		showBase: false,
		prompt: "노란 직선은 이동 방향, 빨간 곡선은 구현됐을 때의 모습. 곡선 모양을 녹색으로 구현해 방향선을 따라 이동한다. 파란선은 지면 기준 참고다.",
		strokes: [
			direction,
			appearance,
			reference
		]
	};
}

//# sourceMappingURL=data:application/json;base64,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WSxVQUFVLFVBQVUsQ0FBQyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDO0NBQUcsVUFBVSxVQUFVO0NBQVUsVUFBVSxXQUFXO0NBQWEsVUFBVSxVQUFVO0NBQVksVUFBVSxhQUFhO0NBQVcsVUFBVSxPQUFPO0NBQXFDLFVBQVUsT0FBTztDQUFRLFVBQVUsVUFBVSxVQUFVLE9BQU8sS0FBSSxNQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDelUsT0FBTztFQUFFLFNBQVM7RUFBRyxTQUFTO0VBQU0sVUFBVTtFQUFPLFFBQVE7RUFBa0YsU0FBUztHQUFDO0dBQVc7R0FBWTtFQUFTO0NBQUU7QUFDN0wiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiZHJhd2luZ01vZGVsLnRzIl0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgRWZmZWN0UmVjaXBlIH0gZnJvbSAnLi9tb2RlbCc7XG5cbmV4cG9ydCB0eXBlIERyYXdQb2ludCA9IFtudW1iZXIsIG51bWJlcl07XG5leHBvcnQgdHlwZSBEcmF3Um9sZSA9ICdtb3ZlJyB8ICdzbGFzaCcgfCAnZWZmZWN0JztcbmV4cG9ydCB0eXBlIERyYXdTdHlsZSA9ICd0cmFpbCcgfCAnb3JiJyB8ICdidXJzdCcgfCAnZmllbGQnO1xuZXhwb3J0IHR5cGUgRHJhd1B1cnBvc2UgPSAndW5hc3NpZ25lZCcgfCAnZGlyZWN0aW9uJyB8ICdhcHBlYXJhbmNlJyB8ICdwYXRoJyB8ICdyZWZlcmVuY2UnIHwgJ2N1c3RvbSc7XG5leHBvcnQgdHlwZSBEcmF3QmVoYXZpb3IgPSAncmVmZXJlbmNlJyB8ICdkaXJlY3Rpb24nIHwgJ2FwcGVhcmFuY2UnIHwgJ3BhdGgnO1xuZXhwb3J0IHR5cGUgRHJhd1Rvb2wgPSAncGVuJyB8ICdsaW5lJyB8ICdjdXJ2ZSc7XG5leHBvcnQgaW50ZXJmYWNlIFN0cm9rZUZhZGVBbG9uZyB7IGZyb206IERyYXdQb2ludDsgdG86IERyYXdQb2ludDsgc3RhcnQ6IG51bWJlcjsgZW5kOiBudW1iZXI7IHNvZnRuZXNzOiBudW1iZXIgfVxuZXhwb3J0IGNvbnN0IERSQVdfUFVSUE9TRVM6IFJlY29yZDxEcmF3UHVycG9zZSwgc3RyaW5nPiA9IHsgdW5hc3NpZ25lZDogJ+uvuOyngOyglSDCtyDrgpjspJHsl5Ag67aA7JesJywgZGlyZWN0aW9uOiAn67Cp7ZalwrfsnbTrj5kg6rK966GcJywgYXBwZWFyYW5jZTogJ+yZhOyEseuQkOydhCDrlYzsnZgg66qo7Iq1JywgcGF0aDogJ+yEoOydhCDrlLDrnbwg67Cc7IOd7ZWY64qUIOyXsOy2nCcsIHJlZmVyZW5jZTogJ+ywuOqzoMK37JyE7LmYIO2RnOyLnCcsIGN1c3RvbTogJ+yngeygkSDsnZjrr7gg7KCV7J2YJyB9O1xuZXhwb3J0IGNvbnN0IERSQVdfQkVIQVZJT1JTOiBSZWNvcmQ8RHJhd0JlaGF2aW9yLCBzdHJpbmc+ID0geyByZWZlcmVuY2U6ICfssLjqs6Ag7J6Q66OM66Gc66eMIOuztOq0gCcsIGRpcmVjdGlvbjogJ+ydtOuPmSDrsKntlqXsnLzroZwg7KCB7JqpJywgYXBwZWFyYW5jZTogJ+q3uOumsCDrqqjslpEg6re464yA66GcIO2RnOyLnCcsIHBhdGg6ICfshKDsnYQg65Sw6528IOyInOywqCDsnqzsg50nIH07XG5leHBvcnQgY29uc3QgRFJBV19UT09MUzogUmVjb3JkPERyYXdUb29sLCBzdHJpbmc+ID0geyBwZW46ICfsnpDsnKDshKAnLCBsaW5lOiAn7KeB7ISgJywgY3VydmU6ICfqs6HshKAnIH07XG5leHBvcnQgY29uc3QgRFJBV19ST0xFUzogUmVjb3JkPERyYXdSb2xlLCB7IG5hbWU6IHN0cmluZzsgY29sb3I6IHN0cmluZyB9PiA9IHtcbiAgbW92ZTogeyBuYW1lOiAn64+M7KeEwrfsnbTrj5knLCBjb2xvcjogJyNmNGNlNTUnIH0sXG4gIHNsYXNoOiB7IG5hbWU6ICfqsoDroZwnLCBjb2xvcjogJyNmZjc3N2InIH0sXG4gIGVmZmVjdDogeyBuYW1lOiAn7J207Y6Z7Yq4JywgY29sb3I6ICcjNzBiYWZmJyB9LFxufTtcbmV4cG9ydCBjb25zdCBEUkFXX1NUWUxFUzogUmVjb3JkPERyYXdTdHlsZSwgc3RyaW5nPiA9IHsgdHJhaWw6ICfruZvrgpjripQg7ISgJywgb3JiOiAn67mbIOydtOuPmScsIGJ1cnN0OiAn64Gd7KCQIO2PreuwnCcsIGZpZWxkOiAn7J6l7YyQwrfsmbjqs70g7Jew6rKwJyB9O1xuZXhwb3J0IGludGVyZmFjZSBEcmF3U3Ryb2tlIHtcbiAgaWQ6IHN0cmluZzsgcm9sZTogRHJhd1JvbGU7IHBvaW50czogRHJhd1BvaW50W107IHN0ZXA6IG51bWJlcjtcbiAgZHVyYXRpb246IG51bWJlcjsgZGVsYXk6IG51bWJlcjsgbGluZ2VyOiBudW1iZXI7XG4gIGNvbG9yOiBzdHJpbmc7IHdpZHRoOiBudW1iZXI7IHN0eWxlOiBEcmF3U3R5bGU7IGZvbGxvd0FjdG9yOiBib29sZWFuOyBmb2xkOiBib29sZWFuOyBub3RlOiBzdHJpbmc7XG4gIHB1cnBvc2U/OiBEcmF3UHVycG9zZTsgbWVhbmluZz86IHN0cmluZzsgYmVoYXZpb3I/OiBEcmF3QmVoYXZpb3I7IGd1aWRlQ29sb3I/OiBzdHJpbmc7XG4gIGRpcmVjdGlvblRhcmdldD86ICdhY3RvcicgfCAnZWZmZWN0JzsgZGlyZWN0aW9uSWQ/OiBzdHJpbmc7XG4gIHRvb2w/OiBEcmF3VG9vbDsgYW5jaG9ycz86IERyYXdQb2ludFtdO1xuICBmYWRlQWxvbmc/OiBTdHJva2VGYWRlQWxvbmc7XG59XG5leHBvcnQgaW50ZXJmYWNlIERyYXdpbmdQbGFuIHsgdmVyc2lvbjogMTsgZW5hYmxlZDogYm9vbGVhbjsgc2hvd0Jhc2U6IGJvb2xlYW47IHByb21wdDogc3RyaW5nOyBzdHJva2VzOiBEcmF3U3Ryb2tlW10gfVxuZXhwb3J0IGNvbnN0IGVtcHR5RHJhd2luZyA9ICgpOiBEcmF3aW5nUGxhbiA9PiAoeyB2ZXJzaW9uOiAxLCBlbmFibGVkOiB0cnVlLCBzaG93QmFzZTogZmFsc2UsIHByb21wdDogJycsIHN0cm9rZXM6IFtdIH0pO1xuZXhwb3J0IGNvbnN0IG5ld1N0cm9rZSA9IChyb2xlOiBEcmF3Um9sZSwgcG9pbnRzOiBEcmF3UG9pbnRbXSwgc3RlcDogbnVtYmVyLCBjb2xvciA9ICcjOWJlOGIzJyk6IERyYXdTdHJva2UgPT4gKHtcbiAgaWQ6IGNyeXB0by5yYW5kb21VVUlEKCksIHJvbGUsIHBvaW50cywgc3RlcCwgZHVyYXRpb246IC42LCBkZWxheTogMCwgbGluZ2VyOiAuMixcbiAgY29sb3IsIHdpZHRoOiByb2xlID09PSAnc2xhc2gnID8gLjAyNSA6IC4wMTUsIHN0eWxlOiAndHJhaWwnLCBmb2xsb3dBY3RvcjogZmFsc2UsIGZvbGQ6IGZhbHNlLCBub3RlOiAnJyxcbn0pO1xuZXhwb3J0IGNvbnN0IHN0cm9rZVB1cnBvc2UgPSAoc3Ryb2tlOiBEcmF3U3Ryb2tlKTogRHJhd1B1cnBvc2UgPT4gc3Ryb2tlLnB1cnBvc2UgPz8gKHN0cm9rZS5yb2xlID09PSAnbW92ZScgPyAnZGlyZWN0aW9uJyA6ICdwYXRoJyk7XG5leHBvcnQgZnVuY3Rpb24gc3Ryb2tlQmVoYXZpb3Ioc3Ryb2tlOiBEcmF3U3Ryb2tlKTogRHJhd0JlaGF2aW9yIHtcbiAgY29uc3QgcHVycG9zZSA9IHN0cm9rZVB1cnBvc2Uoc3Ryb2tlKTtcbiAgaWYgKHB1cnBvc2UgPT09ICdjdXN0b20nKSByZXR1cm4gc3Ryb2tlLmJlaGF2aW9yID8/ICdyZWZlcmVuY2UnO1xuICByZXR1cm4gcHVycG9zZSA9PT0gJ3VuYXNzaWduZWQnIHx8IHB1cnBvc2UgPT09ICdyZWZlcmVuY2UnID8gJ3JlZmVyZW5jZScgOiBwdXJwb3NlO1xufVxuLyoqIExlZ2FjeSBtb3ZlIHBhdGhzIHJldGFpbiBhY3RvciBtb3Rpb247IGF1dGhvcmVkIFZGWCBkaXJlY3Rpb25zIGRlZmF1bHQgdG8gaW5kZXBlbmRlbnQgZWZmZWN0cy4gKi9cbmV4cG9ydCBjb25zdCBkaXJlY3Rpb25UYXJnZXQgPSAoc3Ryb2tlOiBEcmF3U3Ryb2tlKTogJ2FjdG9yJyB8ICdlZmZlY3QnID0+IHN0cm9rZS5kaXJlY3Rpb25UYXJnZXQgPz8gKHN0cm9rZS5yb2xlID09PSAnbW92ZScgPyAnYWN0b3InIDogJ2VmZmVjdCcpO1xuZXhwb3J0IGNvbnN0IGFjdG9yRGlyZWN0aW9uID0gKHN0cm9rZTogRHJhd1N0cm9rZSkgPT4gc3Ryb2tlQmVoYXZpb3Ioc3Ryb2tlKSA9PT0gJ2RpcmVjdGlvbicgJiYgZGlyZWN0aW9uVGFyZ2V0KHN0cm9rZSkgPT09ICdhY3Rvcic7XG5leHBvcnQgY29uc3Qgc3Ryb2tlTGFiZWwgPSAoc3Ryb2tlOiBEcmF3U3Ryb2tlKSA9PiBzdHJva2UubWVhbmluZz8udHJpbSgpIHx8IERSQVdfUFVSUE9TRVNbc3Ryb2tlUHVycG9zZShzdHJva2UpXTtcbmV4cG9ydCBjb25zdCBndWlkZUNvbG9yID0gKHN0cm9rZTogRHJhd1N0cm9rZSkgPT4gc3Ryb2tlLmd1aWRlQ29sb3IgPz8gRFJBV19ST0xFU1tzdHJva2Uucm9sZV0uY29sb3I7XG4vKiogU3BhdGlhbCBvcGFjaXR5IGFsb25nIHRoZSBheGlzOyB0aGUgc29mdCBmcm9udCBhZHZhbmNlcyBmcm9tIHRoZSBzdGFydCB0b3dhcmQgdGhlIGVuZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJva2VGYWRlT3BhY2l0eShmYWRlOiBTdHJva2VGYWRlQWxvbmcsIGxpZmU6IG51bWJlciwgcG9zaXRpb246IG51bWJlcik6IG51bWJlciB7XG4gIGlmIChsaWZlIDw9IGZhZGUuc3RhcnQpIHJldHVybiAxOyBpZiAobGlmZSA+PSBmYWRlLmVuZCkgcmV0dXJuIDA7XG4gIGNvbnN0IHByb2dyZXNzID0gKGxpZmUgLSBmYWRlLnN0YXJ0KSAvIChmYWRlLmVuZCAtIGZhZGUuc3RhcnQpLCBmcm9udCA9IHByb2dyZXNzICogKDEgKyBmYWRlLnNvZnRuZXNzKSAtIGZhZGUuc29mdG5lc3M7XG4gIGNvbnN0IHQgPSBNYXRoLm1heCgwLCBNYXRoLm1pbigxLCAocG9zaXRpb24gLSBmcm9udCkgLyBmYWRlLnNvZnRuZXNzKSk7IHJldHVybiB0ICogdCAqICgzIC0gMiAqIHQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdlb21ldHJ5UG9pbnRzKHRvb2w6IERyYXdUb29sLCBhbmNob3JzOiBEcmF3UG9pbnRbXSk6IERyYXdQb2ludFtdIHtcbiAgaWYgKHRvb2wgIT09ICdjdXJ2ZScpIHJldHVybiBhbmNob3JzLm1hcChwID0+IFsuLi5wXSk7XG4gIGNvbnN0IFthLCBjLCBiXSA9IGFuY2hvcnM7XG4gIHJldHVybiBBcnJheS5mcm9tKHsgbGVuZ3RoOiAzMyB9LCAoXywgaSk6IERyYXdQb2ludCA9PiB7IGNvbnN0IHQgPSBpIC8gMzIsIHUgPSAxIC0gdDsgcmV0dXJuIFt1ICogdSAqIGFbMF0gKyAyICogdSAqIHQgKiBjWzBdICsgdCAqIHQgKiBiWzBdLCB1ICogdSAqIGFbMV0gKyAyICogdSAqIHQgKiBjWzFdICsgdCAqIHQgKiBiWzFdXTsgfSk7XG59XG5leHBvcnQgZnVuY3Rpb24gcmV2ZXJzZVN0cm9rZShzdHJva2U6IERyYXdTdHJva2UpOiB2b2lkIHtcbiAgaWYgKHN0cm9rZS5mYWRlQWxvbmcpIFtzdHJva2UuZmFkZUFsb25nLmZyb20sIHN0cm9rZS5mYWRlQWxvbmcudG9dID0gW3N0cm9rZS5mYWRlQWxvbmcudG8sIHN0cm9rZS5mYWRlQWxvbmcuZnJvbV07XG4gIGlmIChzdHJva2UudG9vbCA9PT0gJ2N1cnZlJyAmJiBzdHJva2UuYW5jaG9ycykgeyBzdHJva2UuYW5jaG9ycyA9IFtzdHJva2UuYW5jaG9yc1syXSwgc3Ryb2tlLmFuY2hvcnNbMV0sIHN0cm9rZS5hbmNob3JzWzBdXTsgc3Ryb2tlLnBvaW50cyA9IGdlb21ldHJ5UG9pbnRzKCdjdXJ2ZScsIHN0cm9rZS5hbmNob3JzKTsgfVxuICBlbHNlIHsgc3Ryb2tlLnBvaW50cy5yZXZlcnNlKCk7IGlmIChzdHJva2UuYW5jaG9ycykgc3Ryb2tlLmFuY2hvcnMucmV2ZXJzZSgpOyB9XG59XG5leHBvcnQgZnVuY3Rpb24gZHJhd2luZ1NjaGVkdWxlKHBsYW46IERyYXdpbmdQbGFuKTogeyBzdHJva2U6IERyYXdTdHJva2U7IHN0YXJ0OiBudW1iZXI7IGVuZDogbnVtYmVyOyBmaW5pc2g6IG51bWJlciB9W10ge1xuICBjb25zdCByZXN1bHQ6IHsgc3Ryb2tlOiBEcmF3U3Ryb2tlOyBzdGFydDogbnVtYmVyOyBlbmQ6IG51bWJlcjsgZmluaXNoOiBudW1iZXIgfVtdID0gW107XG4gIGxldCBjbG9jayA9IDA7XG4gIGNvbnN0IGFjdGl2ZSA9IHBsYW4uc3Ryb2tlcy5maWx0ZXIocyA9PiBzdHJva2VCZWhhdmlvcihzKSAhPT0gJ3JlZmVyZW5jZScpO1xuICBmb3IgKGNvbnN0IHN0ZXAgb2YgWy4uLm5ldyBTZXQoYWN0aXZlLm1hcChzID0+IHMuc3RlcCkpXS5zb3J0KChhLCBiKSA9PiBhIC0gYikpIHtcbiAgICBjb25zdCBncm91cCA9IGFjdGl2ZS5maWx0ZXIocyA9PiBzLnN0ZXAgPT09IHN0ZXApO1xuICAgIGdyb3VwLmZvckVhY2goc3Ryb2tlID0+IHJlc3VsdC5wdXNoKHsgc3Ryb2tlLCBzdGFydDogY2xvY2sgKyBzdHJva2UuZGVsYXksIGVuZDogY2xvY2sgKyBzdHJva2UuZGVsYXkgKyBzdHJva2UuZHVyYXRpb24sIGZpbmlzaDogY2xvY2sgKyBzdHJva2UuZGVsYXkgKyBzdHJva2UuZHVyYXRpb24gKyBzdHJva2UubGluZ2VyIH0pKTtcbiAgICBjbG9jayArPSBNYXRoLm1heCguLi5ncm91cC5tYXAocyA9PiBzLmRlbGF5ICsgcy5kdXJhdGlvbikpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5leHBvcnQgY29uc3QgZHJhd2luZ0R1cmF0aW9uID0gKHBsYW46IERyYXdpbmdQbGFuKTogbnVtYmVyID0+IE1hdGgubWF4KC4xLCAuLi5kcmF3aW5nU2NoZWR1bGUocGxhbikubWFwKHMgPT4gcy5maW5pc2gpKTtcbmV4cG9ydCBjb25zdCBkcmF3aW5nVGltZSA9IChyZWNpcGU6IEVmZmVjdFJlY2lwZSwgaW5kZXg6IG51bWJlcik6IG51bWJlciA9PiBpbmRleCAvIE1hdGgubWF4KDEsIHJlY2lwZS5zZXR0aW5ncy5mcmFtZXMgLSAxKSAqIChyZWNpcGUuc2V0dGluZ3MuZnJhbWVzIC8gcmVjaXBlLnNldHRpbmdzLmZwcyk7XG5cbi8qKiBBcmMtbGVuZ3RoIGludGVycG9sYXRpb24gbWFrZXMgYSBoYW5kLWRyYXduIHBhdGggaW5kZXBlbmRlbnQgb2YgcG9pbnRlciBzYW1wbGluZyBkZW5zaXR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhbXBsZVBhdGgocG9pbnRzOiBEcmF3UG9pbnRbXSwgcHJvZ3Jlc3M6IG51bWJlcik6IERyYXdQb2ludCB7XG4gIGlmICghcG9pbnRzLmxlbmd0aCkgcmV0dXJuIFsuNSwgLjVdO1xuICBpZiAocHJvZ3Jlc3MgPD0gMCkgcmV0dXJuIFsuLi5wb2ludHNbMF1dO1xuICBpZiAocHJvZ3Jlc3MgPj0gMSkgcmV0dXJuIFsuLi5wb2ludHNbcG9pbnRzLmxlbmd0aCAtIDFdXTtcbiAgY29uc3QgbGVuZ3RocyA9IHBvaW50cy5zbGljZSgxKS5tYXAoKHAsIGkpID0+IE1hdGguaHlwb3QocFswXSAtIHBvaW50c1tpXVswXSwgcFsxXSAtIHBvaW50c1tpXVsxXSkpO1xuICBjb25zdCBsZW5ndGggPSBsZW5ndGhzLnJlZHVjZSgoc3VtLCBuKSA9PiBzdW0gKyBuLCAwKTtcbiAgaWYgKGxlbmd0aCA8IDFlLTgpIHJldHVybiBbLi4ucG9pbnRzWzBdXTtcbiAgbGV0IGRpc3RhbmNlID0gbGVuZ3RoICogcHJvZ3Jlc3M7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3Rocy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChkaXN0YW5jZSA8PSBsZW5ndGhzW2ldICYmIGxlbmd0aHNbaV0gPiAwKSB7IGNvbnN0IHAgPSBkaXN0YW5jZSAvIGxlbmd0aHNbaV07IHJldHVybiBbcG9pbnRzW2ldWzBdICsgKHBvaW50c1tpICsgMV1bMF0gLSBwb2ludHNbaV1bMF0pICogcCwgcG9pbnRzW2ldWzFdICsgKHBvaW50c1tpICsgMV1bMV0gLSBwb2ludHNbaV1bMV0pICogcF07IH1cbiAgICBkaXN0YW5jZSAtPSBsZW5ndGhzW2ldO1xuICB9XG4gIHJldHVybiBbLi4ucG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXV07XG59XG5leHBvcnQgZnVuY3Rpb24gZHJhd2luZ0FjdG9yKHBsYW46IERyYXdpbmdQbGFuIHwgdW5kZWZpbmVkLCB0aW1lOiBudW1iZXIpOiBEcmF3UG9pbnQgfCBudWxsIHtcbiAgaWYgKCFwbGFuPy5lbmFibGVkKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgbW92ZXMgPSBkcmF3aW5nU2NoZWR1bGUocGxhbikuZmlsdGVyKHMgPT4gYWN0b3JEaXJlY3Rpb24ocy5zdHJva2UpKTtcbiAgaWYgKCFtb3Zlcy5sZW5ndGgpIHJldHVybiBudWxsO1xuICBsZXQgcG9zaXRpb24gPSBzYW1wbGVQYXRoKG1vdmVzWzBdLnN0cm9rZS5wb2ludHMsIDApO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIG1vdmVzKSB7XG4gICAgaWYgKHRpbWUgPCBlbnRyeS5zdGFydCkgYnJlYWs7XG4gICAgcG9zaXRpb24gPSBzYW1wbGVQYXRoKGVudHJ5LnN0cm9rZS5wb2ludHMsIE1hdGgubWluKDEsICh0aW1lIC0gZW50cnkuc3RhcnQpIC8gZW50cnkuc3Ryb2tlLmR1cmF0aW9uKSk7XG4gIH1cbiAgcmV0dXJuIHBvc2l0aW9uO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpdERyYXdpbmdUaW1pbmcocmVjaXBlOiBFZmZlY3RSZWNpcGUpOiB2b2lkIHtcbiAgaWYgKCFyZWNpcGUuZHJhd2luZz8uc3Ryb2tlcy5zb21lKHMgPT4gc3Ryb2tlQmVoYXZpb3IocykgIT09ICdyZWZlcmVuY2UnKSB8fCAhcmVjaXBlLmRyYXdpbmcuZW5hYmxlZCkgcmV0dXJuO1xuICBjb25zdCBkdXJhdGlvbiA9IE1hdGgucm91bmQoZHJhd2luZ0R1cmF0aW9uKHJlY2lwZS5kcmF3aW5nKSAqIDEwMDAwKSAvIDEwMDAwO1xuICByZWNpcGUuc2V0dGluZ3MuZnJhbWVzID0gTWF0aC5tYXgoMiwgTWF0aC5taW4oNjQsIE1hdGguY2VpbChkdXJhdGlvbiAqIDMwIC0gLjAwMDAwMSkpKTtcbiAgcmVjaXBlLnNldHRpbmdzLmZwcyA9IE1hdGguZmxvb3IocmVjaXBlLnNldHRpbmdzLmZyYW1lcyAvIGR1cmF0aW9uICogMWU2KSAvIDFlNjtcbiAgcmVjaXBlLnBsYWNlbWVudC5pbXBhY3RGcmFtZSA9IE1hdGgubWluKHJlY2lwZS5wbGFjZW1lbnQuaW1wYWN0RnJhbWUsIHJlY2lwZS5zZXR0aW5ncy5mcmFtZXMpO1xufVxuXG5jb25zdCBvYmogPSAodjogdW5rbm93bik6IFJlY29yZDxzdHJpbmcsIHVua25vd24+ID0+IHtcbiAgaWYgKCF2IHx8IHR5cGVvZiB2ICE9PSAnb2JqZWN0JyB8fCBBcnJheS5pc0FycmF5KHYpKSB0aHJvdyBFcnJvcign6re466as6riwIOuNsOydtO2EsCDtmJXsi53snbQg7Jis67CU66W07KeAIOyViuyKteuLiOuLpC4nKTsgcmV0dXJuIHYgYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59O1xuY29uc3QgbnVtID0gKHY6IHVua25vd24sIGxvOiBudW1iZXIsIGhpOiBudW1iZXIsIGxhYmVsOiBzdHJpbmcsIGludGVnZXIgPSBmYWxzZSk6IG51bWJlciA9PiB7XG4gIGlmICh0eXBlb2YgdiAhPT0gJ251bWJlcicgfHwgIU51bWJlci5pc0Zpbml0ZSh2KSB8fCB2IDwgbG8gfHwgdiA+IGhpIHx8IGludGVnZXIgJiYgIU51bWJlci5pc0ludGVnZXIodikpIHRocm93IEVycm9yKGAke2xhYmVsfTogJHtsb31+JHtoaX0g67KU7JyE66W8IO2ZleyduO2VtCDso7zshLjsmpQuYCk7IHJldHVybiB2O1xufTtcbmNvbnN0IGJvb2wgPSAodjogdW5rbm93bik6IGJvb2xlYW4gPT4geyBpZiAodHlwZW9mIHYgIT09ICdib29sZWFuJykgdGhyb3cgRXJyb3IoJ+q3uOumrOq4sCDsmLXshZjsnYAgdHJ1ZSDrmJDripQgZmFsc2Xsl6zslbwg7ZWp64uI64ukLicpOyByZXR1cm4gdjsgfTtcbmNvbnN0IHRleHQgPSAodjogdW5rbm93biwgbWF4OiBudW1iZXIpOiBzdHJpbmcgPT4geyBpZiAodHlwZW9mIHYgIT09ICdzdHJpbmcnIHx8IHYubGVuZ3RoID4gbWF4KSB0aHJvdyBFcnJvcihg6re466as6riwIOyEpOuqheydgCAke21heH3snpAg7J207ZWY66GcIOyggeyWtCDso7zshLjsmpQuYCk7IHJldHVybiB2OyB9O1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRHJhd2luZyhyYXc6IHVua25vd24pOiBEcmF3aW5nUGxhbiB7XG4gIGNvbnN0IHIgPSBvYmoocmF3KTtcbiAgaWYgKHIudmVyc2lvbiAhPT0gMSB8fCAhQXJyYXkuaXNBcnJheShyLnN0cm9rZXMpIHx8IHIuc3Ryb2tlcy5sZW5ndGggPiAyNCkgdGhyb3cgRXJyb3IoJ+q3uOumrOq4sOuKlCB2ZXJzaW9uIDEsIOyEoCAyNOqwnOq5jOyngCDsp4Dsm5Dtlanri4jri6QuJyk7XG4gIGNvbnN0IGlkcyA9IG5ldyBTZXQ8c3RyaW5nPigpLCBtb3ZlU3RlcHMgPSBuZXcgU2V0PG51bWJlcj4oKTtcbiAgY29uc3Qgc3Ryb2tlcyA9IHIuc3Ryb2tlcy5tYXAoKHJhdyk6IERyYXdTdHJva2UgPT4ge1xuICAgIGNvbnN0IHMgPSBvYmoocmF3KSwgaWQgPSB0ZXh0KHMuaWQsIDgwKTtcbiAgICBpZiAoIS9eW2EtelxcZF8tXSskL2kudGVzdChpZCkgfHwgaWRzLmhhcyhpZCkpIHRocm93IEVycm9yKCfqt7jrprAg7ISgIElE64qUIOykkeuztSDsl4bripQg7JiB66y4wrfsiKvsnpDCt+uwkeykhMK37ZWY7J207ZSI7J207Ja07JW8IO2VqeuLiOuLpC4nKTsgaWRzLmFkZChpZCk7XG4gICAgaWYgKCFPYmplY3QuaGFzT3duKERSQVdfUk9MRVMsIHMucm9sZSBhcyBzdHJpbmcpIHx8ICFPYmplY3QuaGFzT3duKERSQVdfU1RZTEVTLCBzLnN0eWxlIGFzIHN0cmluZykpIHRocm93IEVycm9yKCfqt7jrprAg7ISg7J2YIOyXre2VoCDrmJDripQg7ZGc7ZiE7J2EIO2ZleyduO2VtCDso7zshLjsmpQuJyk7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHMucG9pbnRzKSB8fCBzLnBvaW50cy5sZW5ndGggPCAyIHx8IHMucG9pbnRzLmxlbmd0aCA+IDI1NikgdGhyb3cgRXJyb3IoJ+yEoOuniOuLpCDsooztkZzqsIAgMn4yNTbqsJwg7ZWE7JqU7ZWp64uI64ukLicpO1xuICAgIGNvbnN0IHBvaW50cyA9IHMucG9pbnRzLm1hcCgocCk6IERyYXdQb2ludCA9PiB7IGlmICghQXJyYXkuaXNBcnJheShwKSB8fCBwLmxlbmd0aCAhPT0gMikgdGhyb3cgRXJyb3IoJ+yEoCDsooztkZzripQgW3gseV3snoXri4jri6QuJyk7IHJldHVybiBbbnVtKHBbMF0sIDAsIDEsICfshKAgWCcpLCBudW0ocFsxXSwgMCwgMSwgJ+yEoCBZJyldOyB9KTtcbiAgICBjb25zdCBzdGVwID0gbnVtKHMuc3RlcCwgMSwgMjQsICfri6jqs4QnLCB0cnVlKSwgcm9sZSA9IHMucm9sZSBhcyBEcmF3Um9sZTtcbiAgICBjb25zdCBjb2xvciA9IHRleHQocy5jb2xvciwgNyk7IGlmICghL14jW1xcZGEtZl17Nn0kL2kudGVzdChjb2xvcikpIHRocm93IEVycm9yKCfsi6TsoJwg7Zqo6rO87IOJ7J2AICNSUkdHQkIg7ZiV7Iud7J6F64uI64ukLicpO1xuICAgIGNvbnN0IHJlc3VsdDogRHJhd1N0cm9rZSA9IHsgaWQsIHJvbGUsIHBvaW50cywgc3RlcCwgZHVyYXRpb246IG51bShzLmR1cmF0aW9uLCAuMSwgNSwgJ+yEoCDsnqzsg50g7Iuc6rCEJyksIGRlbGF5OiBudW0ocy5kZWxheSwgMCwgNSwgJ+yEoCDsi5zsnpEg7KeA7JewJyksIGxpbmdlcjogbnVtKHMubGluZ2VyLCAwLCA1LCAn7J6U7IOBIOyLnOqwhCcpLCBjb2xvcixcbiAgICAgIHdpZHRoOiBudW0ocy53aWR0aCwgLjAwNSwgLjA2LCAn7ISgIOuRkOq7mCcpLCBzdHlsZTogcy5zdHlsZSBhcyBEcmF3U3R5bGUsIGZvbGxvd0FjdG9yOiBib29sKHMuZm9sbG93QWN0b3IpLCBmb2xkOiBib29sKHMuZm9sZCksIG5vdGU6IHRleHQocy5ub3RlLCA2MDApIH07XG4gICAgaWYgKHMucHVycG9zZSAhPT0gdW5kZWZpbmVkKSB7IGlmICghT2JqZWN0Lmhhc093bihEUkFXX1BVUlBPU0VTLCBzLnB1cnBvc2UgYXMgc3RyaW5nKSkgdGhyb3cgRXJyb3IoJ+yEoOydmCDsnZjrr7jrpbwg7ZmV7J247ZW0IOyjvOyEuOyalC4nKTsgcmVzdWx0LnB1cnBvc2UgPSBzLnB1cnBvc2UgYXMgRHJhd1B1cnBvc2U7IH1cbiAgICBpZiAocy5tZWFuaW5nICE9PSB1bmRlZmluZWQpIHJlc3VsdC5tZWFuaW5nID0gdGV4dChzLm1lYW5pbmcsIDE2MCk7XG4gICAgaWYgKHMuYmVoYXZpb3IgIT09IHVuZGVmaW5lZCkgeyBpZiAoIU9iamVjdC5oYXNPd24oRFJBV19CRUhBVklPUlMsIHMuYmVoYXZpb3IgYXMgc3RyaW5nKSkgdGhyb3cgRXJyb3IoJ+uvuOumrOuztOq4sCDsoIHsmqkg67Cp67KV7J2EIO2ZleyduO2VtCDso7zshLjsmpQuJyk7IHJlc3VsdC5iZWhhdmlvciA9IHMuYmVoYXZpb3IgYXMgRHJhd0JlaGF2aW9yOyB9XG4gICAgaWYgKHMuZ3VpZGVDb2xvciAhPT0gdW5kZWZpbmVkKSB7IGNvbnN0IGMgPSB0ZXh0KHMuZ3VpZGVDb2xvciwgNyk7IGlmICghL14jW1xcZGEtZl17Nn0kL2kudGVzdChjKSkgdGhyb3cgRXJyb3IoJ+2OuOynkeyaqSDshKAg7IOJ7J2EIO2ZleyduO2VtCDso7zshLjsmpQuJyk7IHJlc3VsdC5ndWlkZUNvbG9yID0gYzsgfVxuICAgIGlmIChzLmRpcmVjdGlvblRhcmdldCAhPT0gdW5kZWZpbmVkKSB7IGlmIChzLmRpcmVjdGlvblRhcmdldCAhPT0gJ2FjdG9yJyAmJiBzLmRpcmVjdGlvblRhcmdldCAhPT0gJ2VmZmVjdCcpIHRocm93IEVycm9yKCfrsKntlqXshKDsnZgg7J2064+ZIOuMgOyDgeydhCDtmZXsnbjtlbQg7KO87IS47JqULicpOyByZXN1bHQuZGlyZWN0aW9uVGFyZ2V0ID0gcy5kaXJlY3Rpb25UYXJnZXQ7IH1cbiAgICBlbHNlIGlmIChzLnB1cnBvc2UgIT09IHVuZGVmaW5lZCAmJiBzdHJva2VCZWhhdmlvcihyZXN1bHQpID09PSAnZGlyZWN0aW9uJykgcmVzdWx0LmRpcmVjdGlvblRhcmdldCA9IGRpcmVjdGlvblRhcmdldChyZXN1bHQpO1xuICAgIGlmIChzLmRpcmVjdGlvbklkICE9PSB1bmRlZmluZWQpIHsgY29uc3QgbGluayA9IHRleHQocy5kaXJlY3Rpb25JZCwgODApOyBpZiAoIS9eW2EtelxcZF8tXSskL2kudGVzdChsaW5rKSkgdGhyb3cgRXJyb3IoJ+yXsOqysO2VoCDrsKntlqXshKAgSUTrpbwg7ZmV7J247ZW0IOyjvOyEuOyalC4nKTsgcmVzdWx0LmRpcmVjdGlvbklkID0gbGluazsgfVxuICAgIGlmIChzLmZhZGVBbG9uZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBmID0gb2JqKHMuZmFkZUFsb25nKSwgcG9pbnQgPSAodjogdW5rbm93bik6IERyYXdQb2ludCA9PiB7IGlmICghQXJyYXkuaXNBcnJheSh2KSB8fCB2Lmxlbmd0aCAhPT0gMikgdGhyb3cgRXJyb3IoJ+yGjOupuCDrsKntlqUg7KKM7ZGc64qUIFt4LHld7J6F64uI64ukLicpOyByZXR1cm4gW251bSh2WzBdLCAwLCAxLCAn7IaM66m4IFgnKSwgbnVtKHZbMV0sIDAsIDEsICfshozrqbggWScpXTsgfTtcbiAgICAgIGNvbnN0IGZyb20gPSBwb2ludChmLmZyb20pLCB0byA9IHBvaW50KGYudG8pLCBzdGFydCA9IG51bShmLnN0YXJ0LCAwLCAuOTksICfshozrqbgg7Iuc7J6RJyksIGVuZCA9IG51bShmLmVuZCwgLjAxLCAxLCAn7IaM66m4IOyiheujjCcpO1xuICAgICAgaWYgKHN0YXJ0ID49IGVuZCB8fCBNYXRoLmh5cG90KHRvWzBdIC0gZnJvbVswXSwgdG9bMV0gLSBmcm9tWzFdKSA8IC4wMDAwMSkgdGhyb3cgRXJyb3IoJ+yGjOupuCDrsKntlqXsnZgg65GQIOygkOqzvCDsi5zsnpHCt+yiheujjCDsi5zqsITsnYQg6rWs67aE7ZW0IOyjvOyEuOyalC4nKTtcbiAgICAgIHJlc3VsdC5mYWRlQWxvbmcgPSB7IGZyb20sIHRvLCBzdGFydCwgZW5kLCBzb2Z0bmVzczogbnVtKGYuc29mdG5lc3MsIC4wMiwgLjUsICfshozrqbgg6rK96rOEIOu2gOuTnOufrOybgCcpIH07XG4gICAgfVxuICAgIGlmIChzLnRvb2wgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCFPYmplY3QuaGFzT3duKERSQVdfVE9PTFMsIHMudG9vbCBhcyBzdHJpbmcpKSB0aHJvdyBFcnJvcign6re466as6riwIOuPhOq1rOulvCDtmZXsnbjtlbQg7KO87IS47JqULicpO1xuICAgICAgcmVzdWx0LnRvb2wgPSBzLnRvb2wgYXMgRHJhd1Rvb2w7XG4gICAgICBpZiAocmVzdWx0LnRvb2wgIT09ICdwZW4nKSB7XG4gICAgICAgIGNvbnN0IGNvdW50ID0gcmVzdWx0LnRvb2wgPT09ICdjdXJ2ZScgPyAzIDogMjtcbiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHMuYW5jaG9ycykgfHwgcy5hbmNob3JzLmxlbmd0aCAhPT0gY291bnQpIHRocm93IEVycm9yKGDsnbQg64+E6rWs64qUIOq4sOykgOygkCAke2NvdW50feqwnOqwgCDtlYTsmpTtlanri4jri6QuYCk7XG4gICAgICAgIHJlc3VsdC5hbmNob3JzID0gcy5hbmNob3JzLm1hcCgocCk6IERyYXdQb2ludCA9PiB7IGlmICghQXJyYXkuaXNBcnJheShwKSB8fCBwLmxlbmd0aCAhPT0gMikgdGhyb3cgRXJyb3IoJ+q4sOykgOygkOydgCBbeCx5XeyeheuLiOuLpC4nKTsgcmV0dXJuIFtudW0ocFswXSwgMCwgMSwgJ+q4sOykgOygkCBYJyksIG51bShwWzFdLCAwLCAxLCAn6riw7KSA7KCQIFknKV07IH0pO1xuICAgICAgICBjb25zdCBleHBlY3RlZCA9IGdlb21ldHJ5UG9pbnRzKHJlc3VsdC50b29sLCByZXN1bHQuYW5jaG9ycyk7XG4gICAgICAgIGlmIChwb2ludHMubGVuZ3RoICE9PSBleHBlY3RlZC5sZW5ndGggfHwgcG9pbnRzLnNvbWUoKHAsIGkpID0+IE1hdGguaHlwb3QocFswXSAtIGV4cGVjdGVkW2ldWzBdLCBwWzFdIC0gZXhwZWN0ZWRbaV1bMV0pID4gLjAwMDAxKSkgdGhyb3cgRXJyb3IoJ+yngeyEoMK36rOh7ISg7J2YIOq4sOykgOygkOqzvCDqsr3roZwg7KKM7ZGc6rCAIOydvOy5mO2VmOyngCDslYrsirXri4jri6QuJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChzdHJva2VCZWhhdmlvcihyZXN1bHQpID09PSAnYXBwZWFyYW5jZScgJiYgIVsndHJhaWwnLCAnZmllbGQnXS5pbmNsdWRlcyhyZXN1bHQuc3R5bGUpKSB0aHJvdyBFcnJvcign7JmE7ISxIOuqqOyKteydgCDqt7jrprAg7Jyk6rO9IOuYkOuKlCDssYTsmrQg66qo7JaR7Jy866GcIO2RnOyLnO2VtCDso7zshLjsmpQuJyk7XG4gICAgaWYgKGFjdG9yRGlyZWN0aW9uKHJlc3VsdCkpIHsgaWYgKG1vdmVTdGVwcy5oYXMoc3RlcCkpIHRocm93IEVycm9yKCftlZwg7LqQ66at7YSw7J2YIOuPmeyLnCDsnbTrj5kg67Cp7Zal7J2AIO2VmOuCmOyeheuLiOuLpC4g67mb7J2EIOyXrOufrCDqsIjrnpjroZwg67aE7Je07ZWY66Ck66m0IOuwqe2WpeyEoCDrjIDsg4HsnYQg4oCY7Jew6rKw7ZWgIOuqqOyWkcK37J207Y6Z7Yq47J2YIOydtOuPmeKAmeycvOuhnCDsp4DsoJXtlbQg7KO87IS47JqULicpOyBtb3ZlU3RlcHMuYWRkKHN0ZXApOyB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSk7XG4gIGZvciAoY29uc3Qgc3Ryb2tlIG9mIHN0cm9rZXMpIGlmIChzdHJva2UuZGlyZWN0aW9uSWQpIHtcbiAgICBjb25zdCB0YXJnZXQgPSBzdHJva2VzLmZpbmQocyA9PiBzLmlkID09PSBzdHJva2UuZGlyZWN0aW9uSWQpO1xuICAgIGlmICghdGFyZ2V0IHx8IHRhcmdldC5pZCA9PT0gc3Ryb2tlLmlkIHx8IHN0cm9rZUJlaGF2aW9yKHRhcmdldCkgIT09ICdkaXJlY3Rpb24nKSB0aHJvdyBFcnJvcign7Jew6rKw7ZWgIOuwqe2WpeyEoOydtCDsl4bqsbDrgpgg67Cp7ZalIOyaqeuPhOqwgCDslYTri5nri4jri6QuJyk7XG4gICAgaWYgKCFbJ2FwcGVhcmFuY2UnLCAncGF0aCddLmluY2x1ZGVzKHN0cm9rZUJlaGF2aW9yKHN0cm9rZSkpIHx8IHN0cm9rZS5mb2xsb3dBY3RvcikgdGhyb3cgRXJyb3IoJ+uwqe2WpeyEoCDsl7DqsrDsnYAg66qo7JaRwrfsl7Dstpwg6rK966Gc7JeQ66eMIOyggeyaqe2VmOupsCDrj4zsp4Qg65Sw65286rCA6riw7JmAIOykkeuzte2VoCDsiJgg7JeG7Iq164uI64ukLicpO1xuICB9XG4gIGNvbnN0IHBsYW46IERyYXdpbmdQbGFuID0geyB2ZXJzaW9uOiAxLCBlbmFibGVkOiBib29sKHIuZW5hYmxlZCksIHNob3dCYXNlOiBib29sKHIuc2hvd0Jhc2UpLCBwcm9tcHQ6IHRleHQoci5wcm9tcHQsIDMwMDApLCBzdHJva2VzIH07XG4gIGlmIChkcmF3aW5nRHVyYXRpb24ocGxhbikgPiA2MCkgdGhyb3cgRXJyb3IoJ+q3uOumvCDsoITssrQg6ri47J2064qUIOyelOyDgeydhCDtj6ztlajtlbQgNjDstIgg7J207ZWY66GcIOunnuy2sCDso7zshLjsmpQuJyk7XG4gIHJldHVybiBwbGFuO1xufVxuLyoqIEV4cGxpY2l0IGxvY2FsIGtleXdvcmQgc3VwcG9ydDsgbm90IGFuIEFJIGVuZHBvaW50LiBNYW51YWwgZmllbGRzIHJlbWFpbiBhdXRob3JpdGF0aXZlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5RHJhd2luZ0Rlc2NyaXB0aW9uKHBsYW46IERyYXdpbmdQbGFuKTogeyBwbGFuOiBEcmF3aW5nUGxhbjsgY2hhbmdlZDogbnVtYmVyIH0ge1xuICBjb25zdCByZXN1bHQgPSBzdHJ1Y3R1cmVkQ2xvbmUocGxhbik7IGxldCBjaGFuZ2VkID0gMDtcbiAgZm9yIChjb25zdCBzdHJva2Ugb2YgcmVzdWx0LnN0cm9rZXMpIHtcbiAgICBpZiAoIVsnYXBwZWFyYW5jZScsICdwYXRoJ10uaW5jbHVkZXMoc3Ryb2tlQmVoYXZpb3Ioc3Ryb2tlKSkpIGNvbnRpbnVlO1xuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gYCR7cmVzdWx0LnByb21wdH0gJHtzdHJva2Uubm90ZX1gLnJlcGxhY2UoLyg/OuuFuOuegHzrhbjrnpF867mo6rCEfOu5qOqwlXztjIzrnoB87YyM656RKVxccyrshKAvZywgJycpO1xuICAgIGNvbnN0IG9sZCA9IEpTT04uc3RyaW5naWZ5KHN0cm9rZSk7XG4gICAgY29uc3QgY29sb3JzOiBbUmVnRXhwLCBzdHJpbmddW10gPSBbWy/rhbnsg4l87LSI66GdfGdyZWVuL2ksICcjNjVlZDlhJ10sIFsv64W4656AfOuFuOuekXx5ZWxsb3cvaSwgJyNmZmUwODInXSwgWy/ruajqsIR867mo6rCVfOyggeyDiXxyZWQvaSwgJyNmZjc5NzknXSwgWy/tjIzrnoB87YyM656RfOyyreyDiXxibHVlL2ksICcjN2ZjZmZmJ10sIFsv67O06528fHB1cnBsZS9pLCAnI2MwOWJmZiddLCBbL+2VmOyWgHztnbDsg4l8d2hpdGUvaSwgJyNmMGZmZjYnXV07XG4gICAgZm9yIChjb25zdCBbcGF0dGVybiwgY29sb3JdIG9mIGNvbG9ycykgaWYgKHBhdHRlcm4udGVzdChkZXNjcmlwdGlvbikpIHN0cm9rZS5jb2xvciA9IGNvbG9yO1xuICAgIGlmIChzdHJva2Uucm9sZSA9PT0gJ2VmZmVjdCcgJiYgc3Ryb2tlQmVoYXZpb3Ioc3Ryb2tlKSAhPT0gJ2FwcGVhcmFuY2UnKSB7XG4gICAgICBjb25zdCBzdHlsZVRleHQgPSAv7J6l7YyQfOyZuOqzvXzri6TqsIHtmJV87Y+t67CcfO2Pre2MlHzruZtcXHMq7J2064+ZfOq1rOyKrHzruZvrjansnbR87Jew6rKwfOuyiOqwnHzruZvrgpjripRcXHMq7ISgLy50ZXN0KHN0cm9rZS5ub3RlKSA/IHN0cm9rZS5ub3RlIDogcmVzdWx0LnByb21wdDtcbiAgICAgIGlmICgv7J6l7YyQfOyZuOqzvXzri6TqsIHtmJUvLnRlc3Qoc3R5bGVUZXh0KSkgc3Ryb2tlLnN0eWxlID0gJ2ZpZWxkJztcbiAgICAgIGVsc2UgaWYgKC/tj63rsJx87Y+t7YyULy50ZXN0KHN0eWxlVGV4dCkpIHN0cm9rZS5zdHlsZSA9ICdidXJzdCc7XG4gICAgICBlbHNlIGlmICgv67mbXFxzKuydtOuPmXzqtazsiqx867mb642p7J20Ly50ZXN0KHN0eWxlVGV4dCkpIHN0cm9rZS5zdHlsZSA9ICdvcmInO1xuICAgICAgZWxzZSBpZiAoL+yXsOqysHzrsojqsJx867mb64KY64qUXFxzKuyEoC8udGVzdChzdHlsZVRleHQpKSBzdHJva2Uuc3R5bGUgPSAndHJhaWwnO1xuICAgIH1cbiAgICBpZiAoL+ygke2eiHzsoJHtnph87KCR7Ja0fOq8rOydtHzqvKzsnoQvLnRlc3QoZGVzY3JpcHRpb24pKSBzdHJva2UuZm9sZCA9IHRydWU7XG4gICAgaWYgKC/snpTsg4F87Jyg7KeALy50ZXN0KGRlc2NyaXB0aW9uKSkgc3Ryb2tlLmxpbmdlciA9IE1hdGgubWF4KHN0cm9rZS5saW5nZXIsIC42KTtcbiAgICBpZiAoSlNPTi5zdHJpbmdpZnkoc3Ryb2tlKSAhPT0gb2xkKSBjaGFuZ2VkKys7XG4gIH1cbiAgcmV0dXJuIHsgcGxhbjogcmVzdWx0LCBjaGFuZ2VkIH07XG59XG5leHBvcnQgZnVuY3Rpb24gZHJhd2luZ0V4YW1wbGUoKTogRHJhd2luZ1BsYW4ge1xuICBjb25zdCBtb3ZlID0gbmV3U3Ryb2tlKCdtb3ZlJywgW1suMjIsIC42Ml0sIFsuMzgsIC41N10sIFsuNTgsIC40OF0sIFsuNzIsIC40XV0sIDEpOyBtb3ZlLmR1cmF0aW9uID0gLjg1OyBtb3ZlLm5vdGUgPSAn64W4656A7ISg7J2EIOuUsOudvCDrj4zsp4QnO1xuICBjb25zdCBzbGFzaCA9IG5ld1N0cm9rZSgnc2xhc2gnLCBbWy4zLCAuMzJdLCBbLjQyLCAuMjhdLCBbLjU3LCAuMzJdLCBbLjcsIC40Nl0sIFsuNjksIC42Ml1dLCAxLCAnI2I1ZjhkMCcpOyBzbGFzaC5kdXJhdGlvbiA9IC44NTsgc2xhc2gubm90ZSA9ICfrj4zsp4Tqs7wg64+Z7Iuc7JeQIOuFueyDiSDqsoDqsqknO1xuICBjb25zdCBidXJzdCA9IG5ld1N0cm9rZSgnZWZmZWN0JywgW1suNjMsIC40M10sIFsuNzEsIC40Nl1dLCAyLCAnIzY1ZWQ5YScpOyBidXJzdC5zdHlsZSA9ICdidXJzdCc7IGJ1cnN0LmR1cmF0aW9uID0gLjY7IGJ1cnN0LmxpbmdlciA9IC4yOyBidXJzdC53aWR0aCA9IC4wMjU7IGJ1cnN0Lm5vdGUgPSAn7YyM656A7ISgIOuBneygkOyXkOyEnCDrhbnsg4kg7Y+t67CcJztcbiAgcmV0dXJuIHsgdmVyc2lvbjogMSwgZW5hYmxlZDogdHJ1ZSwgc2hvd0Jhc2U6IGZhbHNlLCBwcm9tcHQ6ICfrhbjrnoDshKDsnYQg65Sw6528IOuPjOynhO2VmOuptOyEnCDruajqsIQg6rKA66Gc66GcIOuyoOqzoCwg7YyM656A7ISgIOuBneyXkOyEnCDrhbnsg4kg7Y+t67CcLicsIHN0cm9rZXM6IFttb3ZlLCBzbGFzaCwgYnVyc3RdIH07XG59XG5leHBvcnQgZnVuY3Rpb24gZHJhd2luZ0Rlc2lnbkV4YW1wbGUoKTogRHJhd2luZ1BsYW4ge1xuICBjb25zdCBkaXJlY3Rpb24gPSBuZXdTdHJva2UoJ21vdmUnLCBbWy4yNCwgLjZdLCBbLjcsIC40XV0sIDEpOyBkaXJlY3Rpb24ucHVycG9zZSA9ICdkaXJlY3Rpb24nOyBkaXJlY3Rpb24uZGlyZWN0aW9uVGFyZ2V0ID0gJ2VmZmVjdCc7IGRpcmVjdGlvbi5tZWFuaW5nID0gJ+qygOq4sOydmCDsnbTrj5kg67Cp7ZalJzsgZGlyZWN0aW9uLmd1aWRlQ29sb3IgPSAnI2Y0Y2U1NSc7IGRpcmVjdGlvbi50b29sID0gJ2xpbmUnOyBkaXJlY3Rpb24uYW5jaG9ycyA9IGRpcmVjdGlvbi5wb2ludHMubWFwKHAgPT4gWy4uLnBdKTsgZGlyZWN0aW9uLmR1cmF0aW9uID0gMS4yO1xuICBjb25zdCBhbmNob3JzOiBEcmF3UG9pbnRbXSA9IFtbLjM1LCAuNV0sIFsuNSwgLjI1XSwgWy42NSwgLjVdXTtcbiAgY29uc3QgYXBwZWFyYW5jZSA9IG5ld1N0cm9rZSgnZWZmZWN0JywgZ2VvbWV0cnlQb2ludHMoJ2N1cnZlJywgYW5jaG9ycyksIDEsICcjNjVlZDlhJyk7IGFwcGVhcmFuY2UucHVycG9zZSA9ICdhcHBlYXJhbmNlJzsgYXBwZWFyYW5jZS5tZWFuaW5nID0gJ+yZhOyEseuQkOydhCDrlYwg67O07J2064qUIOqygOq4sCDrqqjslpEnOyBhcHBlYXJhbmNlLmd1aWRlQ29sb3IgPSAnI2ZmNzc3Yic7IGFwcGVhcmFuY2UudG9vbCA9ICdjdXJ2ZSc7IGFwcGVhcmFuY2UuYW5jaG9ycyA9IGFuY2hvcnM7IGFwcGVhcmFuY2UuZGlyZWN0aW9uSWQgPSBkaXJlY3Rpb24uaWQ7IGFwcGVhcmFuY2UuZHVyYXRpb24gPSAxLjI7XG4gIGNvbnN0IHJlZmVyZW5jZSA9IG5ld1N0cm9rZSgnZWZmZWN0JywgW1suMjIsIC42OF0sIFsuNzUsIC42OF1dLCAxKTsgcmVmZXJlbmNlLnB1cnBvc2UgPSAnY3VzdG9tJzsgcmVmZXJlbmNlLmJlaGF2aW9yID0gJ3JlZmVyZW5jZSc7IHJlZmVyZW5jZS5tZWFuaW5nID0gJ+yngOuptCDrhpLsnbQg7LC46rOgJzsgcmVmZXJlbmNlLmd1aWRlQ29sb3IgPSAnIzcwYmFmZic7IHJlZmVyZW5jZS5ub3RlID0gJ+ydtCDshKDsnYAg7JyE7LmY66W8IOyEpOuqhe2VmOuKlCDssLjqs6DshKDsnbTrqbAg7ZmU66m07JeQIO2RnOyLnO2VmOyngCDslYrripTri6QuJzsgcmVmZXJlbmNlLnRvb2wgPSAnbGluZSc7IHJlZmVyZW5jZS5hbmNob3JzID0gcmVmZXJlbmNlLnBvaW50cy5tYXAocCA9PiBbLi4ucF0pO1xuICByZXR1cm4geyB2ZXJzaW9uOiAxLCBlbmFibGVkOiB0cnVlLCBzaG93QmFzZTogZmFsc2UsIHByb21wdDogJ+uFuOuegCDsp4HshKDsnYAg7J2064+ZIOuwqe2WpSwg67mo6rCEIOqzoeyEoOydgCDqtaztmITrkJDsnYQg65WM7J2YIOuqqOyKtS4g6rOh7ISgIOuqqOyWkeydhCDrhbnsg4nsnLzroZwg6rWs7ZiE7ZW0IOuwqe2WpeyEoOydhCDrlLDrnbwg7J2064+Z7ZWc64ukLiDtjIzrnoDshKDsnYAg7KeA66m0IOq4sOykgCDssLjqs6Dri6QuJywgc3Ryb2tlczogW2RpcmVjdGlvbiwgYXBwZWFyYW5jZSwgcmVmZXJlbmNlXSB9O1xufVxuIl19