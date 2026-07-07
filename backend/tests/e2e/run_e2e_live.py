import sys
import os
import time
import pytest
from rich.live import Live
from rich.console import Console
from rich.text import Text
from rich.console import Group
from rich.panel import Panel

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
console = Console()


def build_display(state):
    all_tests = state.get("all_tests", [])
    results = state.get("results", {})
    current = state.get("current")
    total = len(all_tests) or 1
    done = len(results)
    progress = int(done / total * 100)

    elements = []

    for node_id in all_tests:
        name = node_id.split("::")[-1]

        if node_id == current:
            icon = "▶"
            style = "bold yellow"
        elif node_id in results:
            status = results[node_id][0]
            icon = "✓" if status == "passed" else "✗"
            style = "green" if status == "passed" else "red"
        else:
            icon = "○"
            style = "dim white"

        elements.append(Text(f"{icon} {name}", style=style))

    if elements:
        elements.append(Text(""))

    elements.append(Text(f"[{progress:3d}%]", style="bold cyan"))

    return Group(*elements)


class LivePlugin:
    def __init__(self, state, live):
        self.state = state
        self.live = live

    @pytest.hookimpl
    def pytest_load_initial_conftests(self, early_config, parser, args):
        early_config.pluginmanager.set_blocked("terminalreporter")

    @pytest.hookimpl(trylast=True)
    def pytest_collection_modifyitems(self, items):
        self.state["all_tests"] = [item.nodeid for item in items]
        self.live.update(build_display(self.state))

    @pytest.hookimpl(hookwrapper=True)
    def pytest_runtest_protocol(self, item, nextitem):
        self.state["current"] = item.nodeid
        self.live.update(build_display(self.state))
        yield
        self.state["current"] = None
        self.live.update(build_display(self.state))

    @pytest.hookimpl
    def pytest_runtest_logreport(self, report):
        node_id = report.nodeid
        if report.when == "call":
            status = "passed" if report.passed else "failed"
            self.state["results"][node_id] = (status, report.duration)
            if report.passed:
                self.state["passed"] += 1
            else:
                self.state["failed"] += 1
            self.live.update(build_display(self.state))
        elif report.when == "setup" and report.failed:
            seen = self.state.setdefault("_seen_setup_fail", set())
            if node_id not in seen:
                seen.add(node_id)
                self.state["results"][node_id] = ("failed", 0.0)
                self.state["failed"] += 1
                self.live.update(build_display(self.state))


def main():
    headless = any(a.lower() == "--headless" for a in sys.argv)
    pytest_args = [a for a in sys.argv[1:] if a.lower() != "--headless"]

    if headless:
        os.environ["HEADLESS"] = "1"

    if not pytest_args:
        pytest_args = ["tests/e2e/tests", "--rootdir=tests/e2e"]

    pytest_args = [a for a in pytest_args if a != "-v"]

    if "-s" not in pytest_args and "--capture=no" not in pytest_args:
        pytest_args.append("-s")

    state = {
        "all_tests": [],
        "results": {},
        "current": None,
        "passed": 0,
        "failed": 0,
        "start_time": time.time(),
    }

    with Live(build_display(state), refresh_per_second=10, console=console) as live:
        plugin = LivePlugin(state, live)
        exit_code = pytest.main(pytest_args, plugins=[plugin])

    total_time = time.time() - state["start_time"]
    n_passed = state["passed"]
    n_failed = state["failed"]
    n_total = len(state["all_tests"])

    if n_failed == 0:
        summary_text = Text(
            f"✓ {n_passed}/{n_total} pruebas exitosas · {total_time:.0f}s",
            style="bold green",
        )
        border_style = "green"
    else:
        summary_text = Text(
            f"X {n_passed}/{n_total} pruebas · {total_time:.0f}s",
            style="bold red",
        )
        border_style = "red"

    console.print()
    panel = Panel(summary_text, border_style=border_style)
    console.print(panel)

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
