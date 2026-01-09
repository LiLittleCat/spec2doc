# models.py
from dataclasses import dataclass

@dataclass
class AppInputs:
    openapi_path: str
    db_url: str
    ddl_path: str
    template_path: str
    output_dir: str
    use_db: bool
    use_ddl: bool
