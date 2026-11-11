"""Stable CLI entry point for MAIN01 workflow v3."""
import importlib.util
from pathlib import Path
_spec = importlib.util.spec_from_file_location('grid_workflow_v3', Path(__file__).with_name('워크플로우.py'))
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
Board = _module.Board
read_json = _module.read_json
write_json = _module.write_json
sha = _module.sha
evidence = _module.evidence
if __name__ == '__main__':
    _module.main()
