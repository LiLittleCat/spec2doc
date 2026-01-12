from __future__ import annotations

from typing import Any, Callable, Optional, Tuple
from PySide6.QtCore import QObject, QRunnable, QThreadPool, Signal, Slot, Qt


class _Signals(QObject):
    done = Signal(object, object)  # (result, err)


class _Task(QRunnable):
    def __init__(self, fn: Callable, args: Tuple[Any, ...], kwargs: dict[str, Any]):
        super().__init__()
        self.fn = fn
        self.args = args
        self.kwargs = kwargs
        self.signals = _Signals()

    @Slot()
    def run(self):
        try:
            res = self.fn(*self.args, **self.kwargs)
            self.signals.done.emit(res, None)
        except Exception as e:
            self.signals.done.emit(None, e)

_active_tasks: list["_Task"] = []


def run_in_threadpool(
    fn: Callable,
    args: Tuple[Any, ...] = (),
    kwargs: Optional[dict[str, Any]] = None,
    on_done: Optional[Callable[[Any, Optional[Exception]], None]] = None
):
    pool = QThreadPool.globalInstance()
    task = _Task(fn, args, kwargs or {})
    _active_tasks.append(task)

    def _done_wrapper(result: Any, err: Optional[Exception]):
        if task in _active_tasks:
            _active_tasks.remove(task)
        if on_done:
            on_done(result, err)

    task._done_wrapper = _done_wrapper
    task.signals.done.connect(_done_wrapper, Qt.QueuedConnection)
    pool.start(task)
