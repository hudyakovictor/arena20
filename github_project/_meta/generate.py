#!/usr/bin/env python3
"""Validate and render SIGNAL ARENA project-control documents.

`tasks.json` is the only mutable source of truth. Generated Markdown is never
edited by hand.

Examples:
  python3 github_project/_meta/generate.py
  python3 github_project/_meta/generate.py check
  python3 github_project/_meta/generate.py set-status T000 in_progress --agent agent-frontend-01 --note "Started scaffold"
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import re
import sys
import tempfile
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
META_PATH = ROOT / "_meta" / "tasks.json"
TASKS_DIR = ROOT / "tasks"
TRACKS_DIR = ROOT / "tracks"
VALID_STATUSES = ("todo", "in_progress", "blocked", "done", "review", "approved")
TRANSITIONS = {
    "todo": {"in_progress", "blocked"},
    "in_progress": {"done", "blocked"},
    "blocked": {"in_progress"},
    "done": {"review", "in_progress"},
    "review": {"approved", "in_progress"},
    "approved": set(),
}
TASK_ID_RE = re.compile(r"^T(\d{3})$")
GENERATED_FILES = ("03_MASTER_PLAN.md", "04_STATUS_LOG.md")


def today() -> str:
    return dt.date.today().isoformat()


def load_model(path: Path = META_PATH) -> dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SystemExit(f"ERROR: source file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SystemExit(f"ERROR: invalid JSON in {path}: {exc}") from exc


def task_ref(value: str) -> int:
    match = TASK_ID_RE.fullmatch(value.upper())
    if not match:
        raise SystemExit(f"ERROR: expected task id like T040, got {value!r}")
    return int(match.group(1))


def validate(model: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    for key in ("schema_version", "status", "phases", "tracks", "tasks"):
        if key not in model:
            errors.append(f"missing top-level key: {key}")
    if errors:
        return errors

    phases = {int(key): value for key, value in model["phases"].items()}
    tracks = model["tracks"]
    tasks = model["tasks"]
    ids = [task.get("id") for task in tasks]
    for task_id, count in Counter(ids).items():
        if count > 1:
            errors.append(f"duplicate task id: {task_id}")
    known_ids = {task_id for task_id in ids if isinstance(task_id, int)}

    required = {"id", "phase", "slug", "title", "track", "deps", "goal", "acceptance", "test", "ceo_gate", "status", "assignee", "updated", "log"}
    for task in tasks:
        prefix = f"T{task.get('id', -1):03d}" if isinstance(task.get("id"), int) else "task<?>"
        missing = required - task.keys()
        if missing:
            errors.append(f"{prefix}: missing fields {sorted(missing)}")
            continue
        if task["phase"] not in phases:
            errors.append(f"{prefix}: unknown phase {task['phase']}")
        if task["track"] not in tracks:
            errors.append(f"{prefix}: unknown track {task['track']!r}")
        if task["status"] not in VALID_STATUSES:
            errors.append(f"{prefix}: invalid status {task['status']!r}")
        if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", task["slug"]):
            errors.append(f"{prefix}: invalid slug {task['slug']!r}")
        for dep in task["deps"]:
            if dep not in known_ids:
                errors.append(f"{prefix}: missing dependency T{dep:03d}")
            if dep == task["id"]:
                errors.append(f"{prefix}: depends on itself")
        if task["status"] == "in_progress" and not task["assignee"]:
            errors.append(f"{prefix}: in_progress requires assignee")
        if not isinstance(task["log"], list) or not task["log"]:
            errors.append(f"{prefix}: log must be a non-empty list")

    graph = {task["id"]: task["deps"] for task in tasks if isinstance(task.get("id"), int)}
    visiting: set[int] = set()
    visited: set[int] = set()

    def visit(node: int, path: list[int]) -> None:
        if node in visiting:
            cycle = path[path.index(node):] + [node]
            errors.append("dependency cycle: " + " -> ".join(f"T{x:03d}" for x in cycle))
            return
        if node in visited:
            return
        visiting.add(node)
        for dep in graph.get(node, []):
            visit(dep, path + [dep])
        visiting.remove(node)
        visited.add(node)

    for node in graph:
        visit(node, [node])
    return errors


def require_valid(model: dict[str, Any]) -> None:
    errors = validate(model)
    if errors:
        raise SystemExit("VALIDATION FAILED:\n- " + "\n- ".join(errors))


def task_name(task: dict[str, Any]) -> str:
    return f"T{task['id']:03d}_{task['slug']}.md"


def task_page(task: dict[str, Any], phases: dict[int, Any]) -> str:
    phase = phases[task["phase"]]
    deps = ", ".join(f"T{x:03d}" for x in task["deps"]) or "—"
    assignee = task["assignee"] or "—"
    acceptance = "\n".join(f"- [ ] {item}" for item in task["acceptance"])
    tests = "\n".join(f"- {item}" for item in task["test"])
    note = f"\n> 📌 {task['note']}\n" if task.get("note") else ""
    log_rows = "\n".join(
        "| {date} | {agent} | `{status}` | {note} |".format(
            date=row["date"],
            agent=row["agent"],
            status=row["status"],
            note=str(row["note"]).replace("|", "\\|"),
        )
        for row in task["log"]
    )
    gate = "да — требуется визуальная приёмка CEO перед `approved`" if task["ceo_gate"] else "нет"
    return f"""# T{task['id']:03d} · {task['title']}

> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.

- **Фаза:** {task['phase']} — {phase['title']}
- **Трек:** `{task['track']}`
- **Статус:** `{task['status']}`
- **Исполнитель:** {assignee}
- **Зависимости:** {deps}
- **CEO-гейт:** {gate}
- **Обновлено:** {task['updated']}

## Цель
{task['goal']}

## Критерии приёмки
{acceptance}

## Тест-план
{tests}

## Обязательные ограничения
- Следовать `github_project/02_TECH_STACK.md` и `github_project/00_CONVENTIONS.md`.
- Не подменять компонент стека молча. Сначала диагностировать и зафиксировать доказательство; затем пометить задачу `blocked`.
- Отсутствующий необязательный арт заменять manifest-заглушкой `placeholder: true`, не выдумывая финальный ассет.
- Не использовать React в игровом UI; не кодировать смысл только цветом.
{note}
## Лог статуса
| Дата | Агент | Статус | Заметка |
|---|---|---|---|
{log_rows}

## Команды статуса
```bash
python3 github_project/_meta/generate.py set-status T{task['id']:03d} in_progress --agent <id> --note "что начато"
python3 github_project/_meta/generate.py set-status T{task['id']:03d} done --agent <id> --note "тесты и результат"
```
"""


def status_log(model: dict[str, Any]) -> str:
    phases = {int(key): value for key, value in model["phases"].items()}
    tasks = sorted(model["tasks"], key=lambda item: item["id"])
    lines = [
        "# 04 · STATUS LOG — статус проекта",
        "",
        "> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.",
        "",
        "## Как изменить статус",
        "```bash",
        "python3 github_project/_meta/generate.py set-status T000 in_progress --agent <id> --note \"начал работу\"",
        "python3 github_project/_meta/generate.py set-status T000 done --agent <id> --note \"npm test: ok\"",
        "python3 github_project/_meta/generate.py check",
        "```",
        "",
        "Переходы: `todo → in_progress → done → review → approved`; `in_progress → blocked → in_progress`; `review → in_progress`.",
    ]
    for phase_id in sorted(phases):
        phase = phases[phase_id]
        phase_tasks = [task for task in tasks if task["phase"] == phase_id]
        lines += [
            "",
            f"## Фаза {phase_id} — {phase['title']}{' 🔴CEO' if phase['ceo_gate'] else ''}",
            "",
            f"_{phase['goal']}_",
            "",
            "| ID | Задача | Трек | Статус | Исполнитель | Обновлено | Гейт |",
            "|---|---|---|---|---|---|---|",
        ]
        for task in phase_tasks:
            lines.append(
                f"| T{task['id']:03d} | [{task['title']}](./tasks/{task_name(task)}) | `{task['track']}` | `{task['status']}` | {task['assignee'] or '—'} | {task['updated']} | {'🔴' if task['ceo_gate'] else ''} |"
            )
    counts = Counter(task["status"] for task in tasks)
    approved = counts["approved"]
    percent = round(approved * 100 / len(tasks)) if tasks else 0
    lines += [
        "",
        "## Итого",
        f"- Задач: {len(tasks)}. Принято: {approved} ({percent}%).",
        f"- В работе: {counts['in_progress']}. На ревью: {counts['review']}. Заблокировано: {counts['blocked']}.",
        "",
    ]
    return "\n".join(lines)


def track_page(track: str, description: str, tasks: list[dict[str, Any]]) -> str:
    lines = [
        f"# Трек `{track}`",
        "",
        f"_{description}_",
        "",
        "> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.",
        "",
        "| ID | Задача | Фаза | Зависимости | Статус | Исполнитель |",
        "|---|---|---|---|---|---|",
    ]
    for task in sorted(tasks, key=lambda item: item["id"]):
        deps = ", ".join(f"T{x:03d}" for x in task["deps"]) or "—"
        lines.append(f"| T{task['id']:03d} | [${task['title']}](../tasks/{task_name(task)}) | {task['phase']} | {deps} | `{task['status']}` | {task['assignee'] or '—'} |".replace("[$", "["))
    lines += [
        "",
        "Берите первую `todo`-задачу, чьи зависимости имеют статус `approved`. Статус меняйте только CLI-командой из `05_AGENT_PROTOCOL.md`.",
        "",
    ]
    return "\n".join(lines)


def master_plan(model: dict[str, Any]) -> str:
    phases = {int(key): value for key, value in model["phases"].items()}
    tasks = model["tasks"]
    lines = [
        "# 03 · MASTER PLAN — от 0% до release-ready",
        "",
        "> Сгенерировано из `_meta/tasks.json`. Не редактировать вручную.",
        "",
        "Фазы задают продуктовые гейты; реальный порядок работы определяется зависимостями задач, а не номером фазы.",
    ]
    for phase_id in sorted(phases):
        phase = phases[phase_id]
        ids = ", ".join(f"T{x['id']:03d}" for x in tasks if x["phase"] == phase_id)
        lines += [
            "",
            f"## Фаза {phase_id} — {phase['title']}{' 🔴 CEO-гейт' if phase['ceo_gate'] else ''}",
            "",
            f"**Цель.** {phase['goal']}",
            "",
            "**Результаты:**",
            *[f"- {item}" for item in phase["deliverables"]],
            "",
            f"**Точка выхода.** {phase['exit']}",
            f"**Проверка.** {phase['test']}",
            f"**Зависимости фаз.** {', '.join(f'Фаза {x}' for x in phase['deps']) or '—'}",
            f"**Параллелизация.** {phase['parallel']}",
            f"**Задачи.** {ids}",
        ]
    return "\n".join(lines) + "\n"


def rendered_files(model: dict[str, Any]) -> dict[Path, str]:
    phases = {int(key): value for key, value in model["phases"].items()}
    tasks = model["tasks"]
    output: dict[Path, str] = {
        ROOT / "03_MASTER_PLAN.md": master_plan(model),
        ROOT / "04_STATUS_LOG.md": status_log(model),
    }
    for task in tasks:
        output[TASKS_DIR / task_name(task)] = task_page(task, phases)
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for task in tasks:
        grouped[task["track"]].append(task)
    for name, description in model["tracks"].items():
        output[TRACKS_DIR / f"{name}.md"] = track_page(name, description, grouped[name])
    return output


def write_all(model: dict[str, Any]) -> None:
    outputs = rendered_files(model)
    TASKS_DIR.mkdir(parents=True, exist_ok=True)
    TRACKS_DIR.mkdir(parents=True, exist_ok=True)
    expected_tasks = {path.name for path in outputs if path.parent == TASKS_DIR}
    expected_tracks = {path.name for path in outputs if path.parent == TRACKS_DIR}
    for path in TASKS_DIR.glob("T*.md"):
        if path.name not in expected_tasks:
            path.unlink()
    for path in TRACKS_DIR.glob("*.md"):
        if path.name not in expected_tracks:
            path.unlink()
    for path, content in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")


def save_model(model: dict[str, Any]) -> None:
    model["generated"] = today()
    payload = json.dumps(model, ensure_ascii=False, indent=2) + "\n"
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=META_PATH.parent, delete=False) as handle:
        handle.write(payload)
        temp_name = handle.name
    os.replace(temp_name, META_PATH)


def set_status(model: dict[str, Any], args: argparse.Namespace) -> None:
    wanted_id = task_ref(args.task)
    task = next((item for item in model["tasks"] if item["id"] == wanted_id), None)
    if task is None:
        raise SystemExit(f"ERROR: unknown task T{wanted_id:03d}")
    old = task["status"]
    new = args.status
    if new == old:
        raise SystemExit(f"ERROR: T{wanted_id:03d} is already {new}")
    if not args.force and new not in TRANSITIONS[old]:
        allowed = ", ".join(sorted(TRANSITIONS[old])) or "none"
        raise SystemExit(f"ERROR: transition {old} -> {new} is not allowed (allowed: {allowed})")
    if new == "in_progress" and not args.force:
        by_id = {item["id"]: item for item in model["tasks"]}
        missing = [dep for dep in task["deps"] if by_id[dep]["status"] != "approved"]
        if missing:
            refs = ", ".join(f"T{x:03d}" for x in missing)
            raise SystemExit(f"ERROR: dependencies are not approved: {refs}")
    if not args.note.strip():
        raise SystemExit("ERROR: --note must describe evidence, result, or blocker")
    task["status"] = new
    task["assignee"] = args.agent if new in {"in_progress", "blocked", "done", "review"} else (task["assignee"] or args.agent)
    task["updated"] = today()
    task["log"].append({"date": today(), "agent": args.agent, "status": new, "note": args.note.strip()})
    save_model(model)
    write_all(model)
    print(f"OK: T{wanted_id:03d} {old} -> {new}")


def check_generated(model: dict[str, Any]) -> None:
    stale: list[str] = []
    for path, expected in rendered_files(model).items():
        if not path.exists() or path.read_text(encoding="utf-8") != expected:
            stale.append(str(path.relative_to(ROOT.parent)))
    expected_tasks = {task_name(task) for task in model["tasks"]}
    extra = sorted(path.name for path in TASKS_DIR.glob("T*.md") if path.name not in expected_tasks)
    if stale or extra:
        details = [*(f"stale/missing: {item}" for item in stale), *(f"unexpected: github_project/tasks/{item}" for item in extra)]
        raise SystemExit("CHECK FAILED:\n- " + "\n- ".join(details) + "\nRun generator without arguments.")
    print(f"OK: model valid; {len(model['tasks'])} tasks; generated docs are current")


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = result.add_subparsers(dest="command")
    sub.add_parser("check", help="validate model and verify generated files")
    status = sub.add_parser("set-status", help="apply a validated status transition")
    status.add_argument("task")
    status.add_argument("status", choices=VALID_STATUSES)
    status.add_argument("--agent", required=True, help="stable agent identifier")
    status.add_argument("--note", required=True, help="short evidence/result/blocker note")
    status.add_argument("--force", action="store_true", help="administrative override; explain it in --note")
    return result


def main() -> None:
    args = parser().parse_args()
    model = load_model()
    require_valid(model)
    if args.command == "check":
        check_generated(model)
    elif args.command == "set-status":
        set_status(model, args)
    else:
        write_all(model)
        print(f"OK: rendered {len(model['tasks'])} tasks from {META_PATH.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    main()
