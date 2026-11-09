"""Run the installed Agent Sprite Forge using its isolated Windows environment."""
from __future__ import annotations

import os
from pathlib import Path
import subprocess
import sys


PROJECT = Path(__file__).resolve().parent.parent
USER = Path.home()
SKILLS = Path(os.environ.get("CODEX_HOME", str(USER / ".codex"))) / "skills"
PYTHON = USER / ".local/share/agent-sprite-forge/venv/Scripts/python.exe"
TOOLS = {
    "doctor": "generate2dmedia/scripts/forge_doctor.py",
    "media": "generate2dmedia/scripts/route_media.py",
    "sprite": "generate2dsprite/scripts/generate2dsprite.py",
    "master": "generate2dsprite/scripts/master_still.py",
    "video": "video2dsprite/scripts/video2dsprite.py",
    "set": "video2dsprite/scripts/sprite_set.py",
}


def main() -> int:
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print("Usage: python tools/forge.py <doctor|media|sprite|master|video|set|login> [arguments]")
        print("Examples: doctor --host-tools image_gen; video doctor; media resolve --kind video")
        return 0
    mode, arguments = sys.argv[1], sys.argv[2:]
    env = os.environ.copy()
    env["PYTHONUTF8"] = "1"
    env["PYTHONIOENCODING"] = "utf-8"
    paths = [str(PYTHON.parent), str(USER / ".grok/bin")]
    if os.name == "nt":
        import winreg

        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as key:
            try:
                paths.append(os.path.expandvars(winreg.QueryValueEx(key, "Path")[0]))
            except FileNotFoundError:
                pass
    env["PATH"] = os.pathsep.join([*paths, env.get("PATH", "")])
    if mode == "login":
        command = [str(USER / ".grok/bin/grok.exe"), "login", "--device-auth", *arguments]
    elif mode in TOOLS:
        script = SKILLS / TOOLS[mode]
        if not PYTHON.is_file() or not script.is_file():
            print("Forge installation or its Python environment is missing.", file=sys.stderr)
            return 1
        if mode == "doctor" and "--host-tools" not in arguments:
            arguments = ["--host-tools", "none", *arguments]
        command = [str(PYTHON), str(script), *arguments]
    else:
        print(f"Unknown tool: {mode}", file=sys.stderr)
        return 2
    try:
        return subprocess.run(command, cwd=PROJECT, env=env).returncode
    except (OSError, KeyboardInterrupt) as error:
        print(f"Forge command stopped: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
