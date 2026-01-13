# models.py
from dataclasses import dataclass

@dataclass
class AppInputs:
    mode: str
    openapi_path: str
    openapi_text: str
    api_server: str
    api_client: str
    db_url: str
    ddl_path: str
    ddl_text: str
    template_path: str
    output_dir: str
    use_db: bool
    use_ddl: bool
