from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from PySide6.QtCore import QSettings, Qt
from PySide6.QtWidgets import (
    QMainWindow, QWidget, QTabWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QLineEdit, QPushButton, QFileDialog, QTextEdit,
    QGroupBox, QFormLayout, QMessageBox, QProgressBar, QCheckBox
)

from workers import run_in_threadpool
from models import AppInputs
from generators import generate_docs


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Spec2Doc - Spec to Word")
        self.resize(980, 680)

        self.settings = QSettings("Spec2Doc", "Spec2DocApp")

        root = QWidget()
        self.setCentralWidget(root)
        layout = QVBoxLayout(root)

        # Tabs
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # Bottom bar: progress + generate
        bottom = QHBoxLayout()
        layout.addLayout(bottom)

        self.progress = QProgressBar()
        self.progress.setRange(0, 100)
        self.progress.setValue(0)
        bottom.addWidget(self.progress, 1)

        self.btn_generate = QPushButton("一键生成 Word")
        self.btn_generate.clicked.connect(self.on_generate)
        bottom.addWidget(self.btn_generate)

        # ---- Tab: OpenAPI
        self.tab_api = QWidget()
        self.tabs.addTab(self.tab_api, "OpenAPI")
        self._build_tab_openapi()

        # ---- Tab: Database
        self.tab_db = QWidget()
        self.tabs.addTab(self.tab_db, "数据库")
        self._build_tab_db()

        # ---- Tab: Template & Output
        self.tab_out = QWidget()
        self.tabs.addTab(self.tab_out, "模板 & 输出")
        self._build_tab_output()

        # ---- Tab: Logs
        self.tab_log = QWidget()
        self.tabs.addTab(self.tab_log, "日志")
        self._build_tab_logs()

        self._load_settings()

    # ---------------- UI builders ----------------
    def _build_tab_openapi(self):
        layout = QVBoxLayout(self.tab_api)

        box = QGroupBox("OpenAPI 规范")
        layout.addWidget(box)
        form = QFormLayout(box)

        self.ed_openapi = QLineEdit()
        self.ed_openapi.setPlaceholderText("选择 openapi.yaml / openapi.json")
        btn = QPushButton("浏览…")
        btn.clicked.connect(self.pick_openapi)

        row = QHBoxLayout()
        row.addWidget(self.ed_openapi, 1)
        row.addWidget(btn)
        form.addRow(QLabel("OpenAPI 文件:"), row)

        layout.addStretch(1)

    def _build_tab_db(self):
        layout = QVBoxLayout(self.tab_db)

        # DB Connection
        box_db = QGroupBox("数据库连接（推荐）")
        layout.addWidget(box_db)
        form_db = QFormLayout(box_db)

        self.ck_use_db = QCheckBox("使用数据库连接反射结构")
        self.ck_use_db.setChecked(True)
        form_db.addRow(self.ck_use_db)

        self.ed_dburl = QLineEdit()
        self.ed_dburl.setPlaceholderText("例如: mysql+pymysql://user:pass@host:3306/dbname  或  postgresql+psycopg://...")
        form_db.addRow(QLabel("SQLAlchemy URL:"), self.ed_dburl)

        # DDL
        box_ddl = QGroupBox("DDL 文件（可选备份）")
        layout.addWidget(box_ddl)
        form_ddl = QFormLayout(box_ddl)

        self.ck_use_ddl = QCheckBox("使用 DDL 文件解析")
        self.ck_use_ddl.setChecked(False)
        form_ddl.addRow(self.ck_use_ddl)

        self.ed_ddl = QLineEdit()
        self.ed_ddl.setPlaceholderText("选择 schema.sql / ddl.sql")
        btn = QPushButton("浏览…")
        btn.clicked.connect(self.pick_ddl)

        row = QHBoxLayout()
        row.addWidget(self.ed_ddl, 1)
        row.addWidget(btn)
        form_ddl.addRow(QLabel("DDL 文件:"), row)

        layout.addStretch(1)

    def _build_tab_output(self):
        layout = QVBoxLayout(self.tab_out)

        box_tpl = QGroupBox("Word 模板（docxtpl）")
        layout.addWidget(box_tpl)
        form_tpl = QFormLayout(box_tpl)

        self.ed_tpl = QLineEdit()
        self.ed_tpl.setPlaceholderText("选择 .docx 模板（可选；不选则用 python-docx 生成简版）")
        btn = QPushButton("浏览…")
        btn.clicked.connect(self.pick_template)
        row = QHBoxLayout()
        row.addWidget(self.ed_tpl, 1)
        row.addWidget(btn)
        form_tpl.addRow(QLabel("模板文件:"), row)

        box_out = QGroupBox("输出")
        layout.addWidget(box_out)
        form_out = QFormLayout(box_out)

        self.ed_outdir = QLineEdit()
        self.ed_outdir.setPlaceholderText("选择输出目录")
        btn2 = QPushButton("浏览…")
        btn2.clicked.connect(self.pick_outdir)
        row2 = QHBoxLayout()
        row2.addWidget(self.ed_outdir, 1)
        row2.addWidget(btn2)
        form_out.addRow(QLabel("输出目录:"), row2)

        layout.addStretch(1)

    def _build_tab_logs(self):
        layout = QVBoxLayout(self.tab_log)
        self.log = QTextEdit()
        self.log.setReadOnly(True)
        self.log.setLineWrapMode(QTextEdit.NoWrap)
        layout.addWidget(self.log)

        bar = QHBoxLayout()
        layout.addLayout(bar)

        btn_clear = QPushButton("清空日志")
        btn_clear.clicked.connect(lambda: self.log.clear())
        bar.addWidget(btn_clear)
        bar.addStretch(1)

    # ---------------- file pickers ----------------
    def pick_openapi(self):
        p, _ = QFileDialog.getOpenFileName(self, "选择 OpenAPI 文件", self._last_dir(), "OpenAPI (*.yaml *.yml *.json);;All (*.*)")
        if p:
            self.ed_openapi.setText(p)
            self._set_last_dir(str(Path(p).parent))

    def pick_ddl(self):
        p, _ = QFileDialog.getOpenFileName(self, "选择 DDL 文件", self._last_dir(), "SQL (*.sql);;All (*.*)")
        if p:
            self.ed_ddl.setText(p)
            self._set_last_dir(str(Path(p).parent))

    def pick_template(self):
        p, _ = QFileDialog.getOpenFileName(self, "选择 Word 模板", self._last_dir(), "Word (*.docx);;All (*.*)")
        if p:
            self.ed_tpl.setText(p)
            self._set_last_dir(str(Path(p).parent))

    def pick_outdir(self):
        p = QFileDialog.getExistingDirectory(self, "选择输出目录", self._last_dir())
        if p:
            self.ed_outdir.setText(p)
            self._set_last_dir(p)

    # ---------------- generate ----------------
    def on_generate(self):
        inputs = self._collect_inputs()
        if not inputs.openapi_path:
            QMessageBox.warning(self, "缺少输入", "请先选择 OpenAPI 文件")
            self.tabs.setCurrentWidget(self.tab_api)
            return
        if not inputs.output_dir:
            QMessageBox.warning(self, "缺少输入", "请选择输出目录")
            self.tabs.setCurrentWidget(self.tab_out)
            return
        if inputs.use_db and not inputs.db_url.strip():
            QMessageBox.warning(self, "缺少输入", "你选择了“使用数据库连接”，但没有填写 DB URL")
            self.tabs.setCurrentWidget(self.tab_db)
            return
        if inputs.use_ddl and not inputs.ddl_path.strip():
            QMessageBox.warning(self, "缺少输入", "你选择了“使用 DDL 文件”，但没有选择 DDL")
            self.tabs.setCurrentWidget(self.tab_db)
            return

        self._save_settings()

        self._log("开始生成…")
        self.progress.setValue(0)
        self.btn_generate.setEnabled(False)

        def progress_cb(pct: int, msg: str):
            self.progress.setValue(max(0, min(100, pct)))
            if msg:
                self._log(msg)

        def done_cb(result: dict | None, err: Exception | None):
            self.btn_generate.setEnabled(True)
            if err:
                self._log(f"[ERROR] {err}")
                QMessageBox.critical(self, "生成失败", str(err))
                return
            out_files = (result or {}).get("files", [])
            self._log("生成完成：")
            for f in out_files:
                self._log(f" - {f}")
            QMessageBox.information(self, "完成", "Word 文档已生成。")

        run_in_threadpool(
            fn=generate_docs,
            args=(inputs, progress_cb),
            on_done=done_cb
        )

    # ---------------- helpers ----------------
    def _collect_inputs(self) -> AppInputs:
        return AppInputs(
            openapi_path=self.ed_openapi.text().strip(),
            db_url=self.ed_dburl.text().strip(),
            ddl_path=self.ed_ddl.text().strip(),
            template_path=self.ed_tpl.text().strip(),
            output_dir=self.ed_outdir.text().strip(),
            use_db=self.ck_use_db.isChecked(),
            use_ddl=self.ck_use_ddl.isChecked(),
        )

    def _log(self, s: str):
        self.log.append(s)
        self.tabs.setCurrentWidget(self.tab_log)

    def _last_dir(self) -> str:
        return self.settings.value("last_dir", str(Path.home()))

    def _set_last_dir(self, p: str):
        self.settings.setValue("last_dir", p)

    def _load_settings(self):
        self.ed_openapi.setText(self.settings.value("openapi_path", ""))
        self.ed_dburl.setText(self.settings.value("db_url", ""))
        self.ed_ddl.setText(self.settings.value("ddl_path", ""))
        self.ed_tpl.setText(self.settings.value("template_path", ""))
        self.ed_outdir.setText(self.settings.value("output_dir", ""))
        self.ck_use_db.setChecked(self.settings.value("use_db", True, type=bool))
        self.ck_use_ddl.setChecked(self.settings.value("use_ddl", False, type=bool))

    def _save_settings(self):
        self.settings.setValue("openapi_path", self.ed_openapi.text().strip())
        self.settings.setValue("db_url", self.ed_dburl.text().strip())
        self.settings.setValue("ddl_path", self.ed_ddl.text().strip())
        self.settings.setValue("template_path", self.ed_tpl.text().strip())
        self.settings.setValue("output_dir", self.ed_outdir.text().strip())
        self.settings.setValue("use_db", self.ck_use_db.isChecked())
        self.settings.setValue("use_ddl", self.ck_use_ddl.isChecked())
