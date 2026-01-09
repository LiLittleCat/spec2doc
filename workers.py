from __future__ import annotations

from typing import Any, Callable, Optional, Tuple
from PySide6.QtCore import QObject, QRunnable, QThreadPool, Signal, Slot


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


def run_in_threadpool(
    fn: Callable,
    args: Tuple[Any, ...] = (),
    kwargs: Optional[dict[str, Any]] = None,
    on_done: Optional[Callable[[Any, Optional[Exception]], None]] = None
):
    pool = QThreadPool.globalInstance()
    task = _Task(fn, args, kwargs or {})
    if on_done:
        task.signals.done.connect(on_done)
    pool.start(task)
