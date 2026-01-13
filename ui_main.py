from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import QSettings, Qt, QObject, Signal, QUrl
from PySide6.QtGui import QIcon, QPixmap, QDesktopServices
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QTabWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QFileDialog, QTextEdit,
    QGroupBox, QFormLayout, QMessageBox, QProgressBar,
    QTableWidget, QTableWidgetItem, QToolButton
)

from workers import run_in_threadpool
from models import AppInputs
from generators import generate_docs


class _ProgressEmitter(QObject):
    progress = Signal(int, str)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Spec2Doc - Spec to Word")
        self.resize(980, 680)

        self.settings = QSettings("Spec2Doc", "Spec2DocApp")
        self._logo_path = Path(__file__).resolve().parent / "assets" / "logo.svg"
        if self._logo_path.exists():
            self.setWindowIcon(QIcon(str(self._logo_path)))

        root = QWidget()
        self.setCentralWidget(root)
        layout = QVBoxLayout(root)

        header = QHBoxLayout()
        # if self._logo_path.exists():
        #     logo = QLabel()
        #     pixmap = QPixmap(str(self._logo_path))
        #     if not pixmap.isNull():
        #         logo.setPixmap(pixmap.scaled(32, 32, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        #         header.addWidget(logo)
        # title = QLabel("Spec2Doc")
        # header.addWidget(title)
        header.addStretch(1)
        layout.addLayout(header)

        # Tabs
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # ---- Tab: API
        self.tab_api = QWidget()
        self.tabs.addTab(self.tab_api, "接口转文档")
        self._build_tab_api()

        # ---- Tab: Database
        self.tab_db = QWidget()
        self.tabs.addTab(self.tab_db, "数据库转文档")
        self._build_tab_db()

        self._active_callbacks: list = []
        self._active_emitters: list[_ProgressEmitter] = []
        self._load_settings()

    # ---------------- UI builders ----------------
    def _build_tab_api(self):
        layout = QVBoxLayout(self.tab_api)

        box_input = QGroupBox("OpenAPI 输入")
        layout.addWidget(box_input)
        form_input = QFormLayout(box_input)

        self.ed_openapi_path = QLineEdit()
        self.ed_openapi_path.setPlaceholderText("选择 openapi.yaml / openapi.json（可多选）")
        btn_pick = QPushButton("浏览…")
        btn_pick.clicked.connect(self.pick_openapi)
        row = QHBoxLayout()
        row.addWidget(self.ed_openapi_path, 1)
        row.addWidget(btn_pick)
        form_input.addRow(QLabel("文件:"), row)

        self.ed_openapi_text = QTextEdit()
        self.ed_openapi_text.setPlaceholderText("粘贴 OpenAPI YAML / JSON 内容")
        self.ed_openapi_text.setLineWrapMode(QTextEdit.NoWrap)
        self.ed_openapi_text.setMinimumHeight(140)
        form_input.addRow(QLabel("或粘贴内容:"), self.ed_openapi_text)

        box_meta = QGroupBox("自定义字段")
        layout.addWidget(box_meta)
        meta_layout = QVBoxLayout(box_meta)

        header = QHBoxLayout()
        header.addWidget(QLabel("模板字段"))
        help_btn = QToolButton()
        help_btn.setText("?")
        help_btn.setAutoRaise(True)
        help_btn.setToolTip(
            "每行填写一个 key 和 value（推荐：英文/下划线）。\n"
            "生成后可在模板中使用：\n"
            "  {{ ep.<key> }} 或 {{ api.<key> }}\n"
            "示例：\n"
            "  server=设备管理后台服务\n"
            "  client=设备管理 Web 页面"
        )
        header.addWidget(help_btn)
        header.addStretch(1)
        meta_layout.addLayout(header)

        self.tbl_api_kv = QTableWidget(0, 2)
        self.tbl_api_kv.setHorizontalHeaderLabels(["Key", "Value"])
        self.tbl_api_kv.horizontalHeaderItem(0).setToolTip("模板字段 key（建议英文/下划线）")
        self.tbl_api_kv.horizontalHeaderItem(1).setToolTip("模板字段 value（显示在模板中）")
        self.tbl_api_kv.horizontalHeader().setStretchLastSection(True)
        self.tbl_api_kv.setMinimumHeight(88)
        meta_layout.addWidget(self.tbl_api_kv)

        meta_actions = QHBoxLayout()
        self.btn_api_kv_add = QPushButton("新增一行")
        self.btn_api_kv_add.clicked.connect(self._add_api_kv_row)
        self.btn_api_kv_remove = QPushButton("删除选中")
        self.btn_api_kv_remove.clicked.connect(self._remove_api_kv_row)
        meta_actions.addWidget(self.btn_api_kv_add)
        meta_actions.addWidget(self.btn_api_kv_remove)
        meta_actions.addStretch(1)
        meta_layout.addLayout(meta_actions)

        box_out = QGroupBox("输出设置")
        layout.addWidget(box_out)
        form_out = QFormLayout(box_out)

        self.ed_tpl_api = QLineEdit()
        self.ed_tpl_api.setPlaceholderText("选择 .docx 模板（可选）")
        btn_tpl = QPushButton("浏览…")
        btn_tpl.clicked.connect(self.pick_template_api)
        row_tpl = QHBoxLayout()
        row_tpl.addWidget(self.ed_tpl_api, 1)
        row_tpl.addWidget(btn_tpl)
        form_out.addRow(QLabel("模板文件:"), row_tpl)

        self.ed_outdir_api = QLineEdit()
        self.ed_outdir_api.setPlaceholderText("选择输出目录")
        btn_out = QPushButton("浏览…")
        btn_out.clicked.connect(self.pick_outdir_api)
        row_out = QHBoxLayout()
        row_out.addWidget(self.ed_outdir_api, 1)
        row_out.addWidget(btn_out)
        form_out.addRow(QLabel("输出目录:"), row_out)

        box_log, self.log_api = self._build_log_group()
        layout.addWidget(box_log, 1)

        bottom = QHBoxLayout()
        self.progress_api = QProgressBar()
        self.progress_api.setRange(0, 100)
        self.progress_api.setValue(0)
        self.btn_open_outdir_api = QPushButton("打开输出文件夹")
        self.btn_open_outdir_api.clicked.connect(
            lambda: self._open_output_dir(self.ed_outdir_api.text().strip())
        )
        self.btn_generate_api = QPushButton("生成接口文档")
        self.btn_generate_api.clicked.connect(self.on_generate_api)
        bottom.addWidget(self.progress_api, 1)
        bottom.addWidget(self.btn_open_outdir_api)
        bottom.addWidget(self.btn_generate_api)
        layout.addLayout(bottom)

    def _build_tab_db(self):
        layout = QVBoxLayout(self.tab_db)

        box_db = QGroupBox("数据库连接")
        layout.addWidget(box_db)
        form_db = QFormLayout(box_db)

        self.ed_dburl = QLineEdit()
        self.ed_dburl.setPlaceholderText("例如: mysql+pymysql://user:pass@host:3306/dbname  或  postgresql+psycopg://...")
        form_db.addRow(QLabel("SQLAlchemy URL:"), self.ed_dburl)

        box_ddl = QGroupBox("DDL 输入")
        layout.addWidget(box_ddl)
        form_ddl = QFormLayout(box_ddl)

        self.ed_ddl_path = QLineEdit()
        self.ed_ddl_path.setPlaceholderText("选择 schema.sql / ddl.sql（可多选）")
        btn = QPushButton("浏览…")
        btn.clicked.connect(self.pick_ddl)
        row = QHBoxLayout()
        row.addWidget(self.ed_ddl_path, 1)
        row.addWidget(btn)
        form_ddl.addRow(QLabel("DDL 文件:"), row)

        self.ed_ddl_text = QTextEdit()
        self.ed_ddl_text.setPlaceholderText("粘贴 DDL SQL 内容")
        self.ed_ddl_text.setLineWrapMode(QTextEdit.NoWrap)
        self.ed_ddl_text.setMinimumHeight(140)
        form_ddl.addRow(QLabel("或粘贴内容:"), self.ed_ddl_text)

        box_out = QGroupBox("输出设置")
        layout.addWidget(box_out)
        form_out = QFormLayout(box_out)

        self.ed_tpl_db = QLineEdit()
        self.ed_tpl_db.setPlaceholderText("选择 .docx 模板（可选）")
        btn_tpl = QPushButton("浏览…")
        btn_tpl.clicked.connect(self.pick_template_db)
        row_tpl = QHBoxLayout()
        row_tpl.addWidget(self.ed_tpl_db, 1)
        row_tpl.addWidget(btn_tpl)
        form_out.addRow(QLabel("模板文件:"), row_tpl)

        self.ed_outdir_db = QLineEdit()
        self.ed_outdir_db.setPlaceholderText("选择输出目录")
        btn_out = QPushButton("浏览…")
        btn_out.clicked.connect(self.pick_outdir_db)
        row_out = QHBoxLayout()
        row_out.addWidget(self.ed_outdir_db, 1)
        row_out.addWidget(btn_out)
        form_out.addRow(QLabel("输出目录:"), row_out)

        box_log, self.log_db = self._build_log_group()
        layout.addWidget(box_log, 1)

        bottom = QHBoxLayout()
        self.progress_db = QProgressBar()
        self.progress_db.setRange(0, 100)
        self.progress_db.setValue(0)
        self.btn_open_outdir_db = QPushButton("打开输出文件夹")
        self.btn_open_outdir_db.clicked.connect(
            lambda: self._open_output_dir(self.ed_outdir_db.text().strip())
        )
        self.btn_generate_db = QPushButton("生成数据库文档")
        self.btn_generate_db.clicked.connect(self.on_generate_db)
        bottom.addWidget(self.progress_db, 1)
        bottom.addWidget(self.btn_open_outdir_db)
        bottom.addWidget(self.btn_generate_db)
        layout.addLayout(bottom)

    def _build_log_group(self) -> tuple[QGroupBox, QTextEdit]:
        box = QGroupBox("日志")
        layout = QVBoxLayout(box)
        log = QTextEdit()
        log.setReadOnly(True)
        log.setLineWrapMode(QTextEdit.NoWrap)
        layout.addWidget(log)

        bar = QHBoxLayout()
        layout.addLayout(bar)
        btn_clear = QPushButton("清空日志")
        btn_clear.clicked.connect(log.clear)
        bar.addWidget(btn_clear)
        bar.addStretch(1)
        return box, log

    # ---------------- file pickers ----------------
    def _pick_file(self, title: str, file_filter: str, target: QLineEdit):
        p, _ = QFileDialog.getOpenFileName(self, title, self._last_dir(), file_filter)
        if p:
            target.setText(p)
            self._set_last_dir(str(Path(p).parent))

    def _pick_files(self, title: str, file_filter: str, target: QLineEdit):
        files, _ = QFileDialog.getOpenFileNames(self, title, self._last_dir(), file_filter)
        if files:
            target.setText(";".join(files))
            self._set_last_dir(str(Path(files[0]).parent))

    def _pick_dir(self, title: str, target: QLineEdit):
        p = QFileDialog.getExistingDirectory(self, title, self._last_dir())
        if p:
            target.setText(p)
            self._set_last_dir(p)

    def pick_openapi(self):
        self._pick_files("选择 OpenAPI 文件", "OpenAPI (*.yaml *.yml *.json);;All (*.*)", self.ed_openapi_path)

    def pick_ddl(self):
        self._pick_files("选择 DDL 文件", "SQL (*.sql);;All (*.*)", self.ed_ddl_path)

    def pick_template_api(self):
        self._pick_file("选择 Word 模板", "Word (*.docx);;All (*.*)", self.ed_tpl_api)

    def pick_template_db(self):
        self._pick_file("选择 Word 模板", "Word (*.docx);;All (*.*)", self.ed_tpl_db)

    def pick_outdir_api(self):
        self._pick_dir("选择输出目录", self.ed_outdir_api)

    def pick_outdir_db(self):
        self._pick_dir("选择输出目录", self.ed_outdir_db)

    # ---------------- generate ----------------
    def on_generate_api(self):
        inputs = self._collect_api_inputs()
        if not inputs.openapi_text and not inputs.openapi_path:
            QMessageBox.warning(self, "缺少输入", "请上传或粘贴 OpenAPI 内容")
            self.tabs.setCurrentWidget(self.tab_api)
            return
        if not inputs.output_dir:
            QMessageBox.warning(self, "缺少输入", "请选择输出目录")
            self.tabs.setCurrentWidget(self.tab_api)
            return

        self._save_settings()
        self._run_generate(inputs, self.progress_api, self.log_api, self.btn_generate_api)

    def on_generate_db(self):
        inputs = self._collect_db_inputs()
        if not inputs.output_dir:
            QMessageBox.warning(self, "缺少输入", "请选择输出目录")
            self.tabs.setCurrentWidget(self.tab_db)
            return
        if not inputs.use_db and not inputs.use_ddl:
            QMessageBox.warning(self, "缺少输入", "请填写数据库连接或提供 DDL 内容")
            self.tabs.setCurrentWidget(self.tab_db)
            return
        if inputs.use_db and inputs.use_ddl:
            self._log_to(self.log_db, "检测到同时填写了 DB 和 DDL，将优先使用数据库连接。")

        self._save_settings()
        self._run_generate(inputs, self.progress_db, self.log_db, self.btn_generate_db)

    def _run_generate(self, inputs: AppInputs, bar: QProgressBar, log: QTextEdit, button: QPushButton):
        self._log_to(log, "开始生成…")
        bar.setValue(0)
        button.setEnabled(False)

        emitter = _ProgressEmitter()
        self._active_emitters.append(emitter)

        def on_progress(pct: int, msg: str):
            bar.setValue(max(0, min(100, pct)))
            if msg:
                self._log_to(log, msg)

        emitter.progress.connect(on_progress, Qt.QueuedConnection)

        def progress_cb(pct: int, msg: str):
            emitter.progress.emit(pct, msg)

        def done_cb(result: dict | None, err: Exception | None):
            if done_cb in self._active_callbacks:
                self._active_callbacks.remove(done_cb)
            if emitter in self._active_emitters:
                self._active_emitters.remove(emitter)
            button.setEnabled(True)
            if err:
                self._log_to(log, f"[ERROR] {err}")
                QMessageBox.critical(self, "生成失败", str(err))
                return
            out_files = (result or {}).get("files", [])
            self._log_to(log, "生成完成：")
            for f in out_files:
                self._log_to(log, f" - {f}")
            QMessageBox.information(self, "完成", "Word 文档已生成。")

        run_in_threadpool(
            fn=generate_docs,
            args=(inputs, progress_cb),
            on_done=done_cb
        )
        self._active_callbacks.append(done_cb)

    # ---------------- helpers ----------------
    def _collect_api_inputs(self) -> AppInputs:
        return AppInputs(
            mode="api",
            openapi_path=self.ed_openapi_path.text().strip(),
            openapi_text=self.ed_openapi_text.toPlainText().strip(),
            api_kv_text=self._api_kv_text_from_table(),
            db_url="",
            ddl_path="",
            ddl_text="",
            template_path=self.ed_tpl_api.text().strip(),
            output_dir=self.ed_outdir_api.text().strip(),
            use_db=False,
            use_ddl=False,
        )

    def _collect_db_inputs(self) -> AppInputs:
        db_url = self.ed_dburl.text().strip()
        ddl_path = self.ed_ddl_path.text().strip()
        ddl_text = self.ed_ddl_text.toPlainText().strip()
        use_db = bool(db_url)
        use_ddl = bool(ddl_path or ddl_text)
        return AppInputs(
            mode="db",
            openapi_path="",
            openapi_text="",
            api_kv_text="",
            db_url=db_url,
            ddl_path=ddl_path,
            ddl_text=ddl_text,
            template_path=self.ed_tpl_db.text().strip(),
            output_dir=self.ed_outdir_db.text().strip(),
            use_db=use_db,
            use_ddl=use_ddl,
        )

    def _log_to(self, log: QTextEdit, s: str):
        log.append(s)

    def _add_api_kv_row(self) -> None:
        row = self.tbl_api_kv.rowCount()
        self.tbl_api_kv.insertRow(row)
        self.tbl_api_kv.setCurrentCell(row, 0)

    def _remove_api_kv_row(self) -> None:
        row = self.tbl_api_kv.currentRow()
        if row >= 0:
            self.tbl_api_kv.removeRow(row)

    def _api_kv_text_from_table(self) -> str:
        lines = []
        for row in range(self.tbl_api_kv.rowCount()):
            key_item = self.tbl_api_kv.item(row, 0)
            val_item = self.tbl_api_kv.item(row, 1)
            key = key_item.text().strip() if key_item else ""
            value = val_item.text().strip() if val_item else ""
            if not key:
                continue
            lines.append(f"{key}={value}")
        return "\n".join(lines)

    def _set_api_kv_from_text(self, text: str) -> None:
        self.tbl_api_kv.setRowCount(0)
        if not text:
            return
        for raw in text.splitlines():
            line = raw.strip()
            if not line:
                continue
            if "=" in line:
                key, value = line.split("=", 1)
            elif ":" in line:
                key, value = line.split(":", 1)
            elif "：" in line:
                key, value = line.split("：", 1)
            else:
                key, value = line, ""
            row = self.tbl_api_kv.rowCount()
            self.tbl_api_kv.insertRow(row)
            self.tbl_api_kv.setItem(row, 0, QTableWidgetItem(key.strip()))
            self.tbl_api_kv.setItem(row, 1, QTableWidgetItem(value.strip()))

    def _open_output_dir(self, out_dir: str) -> None:
        if not out_dir:
            QMessageBox.warning(self, "缺少输出目录", "请先选择输出目录。")
            return
        p = Path(out_dir).expanduser().resolve()
        if not p.exists():
            QMessageBox.warning(self, "目录不存在", f"输出目录不存在：{p}")
            return
        QDesktopServices.openUrl(QUrl.fromLocalFile(str(p)))

    def _last_dir(self) -> str:
        return self.settings.value("last_dir", str(Path.home()))

    def _set_last_dir(self, p: str):
        self.settings.setValue("last_dir", p)

    def _load_settings(self):
        self.ed_openapi_path.setText(self.settings.value("openapi_path", ""))
        self.ed_dburl.setText(self.settings.value("db_url", ""))
        self.ed_ddl_path.setText(self.settings.value("ddl_path", ""))
        self._set_api_kv_from_text(self.settings.value("api_kv_text", ""))
        self.ed_tpl_api.setText(self.settings.value("template_path_api", ""))
        self.ed_outdir_api.setText(self.settings.value("output_dir_api", ""))
        self.ed_tpl_db.setText(self.settings.value("template_path_db", ""))
        self.ed_outdir_db.setText(self.settings.value("output_dir_db", ""))

    def _save_settings(self):
        self.settings.setValue("openapi_path", self.ed_openapi_path.text().strip())
        self.settings.setValue("db_url", self.ed_dburl.text().strip())
        self.settings.setValue("ddl_path", self.ed_ddl_path.text().strip())
        self.settings.setValue("api_kv_text", self._api_kv_text_from_table())
        self.settings.setValue("template_path_api", self.ed_tpl_api.text().strip())
        self.settings.setValue("output_dir_api", self.ed_outdir_api.text().strip())
        self.settings.setValue("template_path_db", self.ed_tpl_db.text().strip())
        self.settings.setValue("output_dir_db", self.ed_outdir_db.text().strip())
