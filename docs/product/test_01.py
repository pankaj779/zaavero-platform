from pathlib import Path

root = Path(r"C:\Users\Pankaj_Kumar\My_documents\Applications\graphology-platform")

folders = [
    root / "docs" / "product",
    root / "docs" / "architecture",
]

for folder in folders:
    folder.mkdir(parents=True, exist_ok=True)

files = {
    root / "docs" / "product" / "05_HOMEPAGE_BLUEPRINT.md": "",
    root / "docs" / "product" / "06_STUDENT_PLATFORM_BLUEPRINT.md": "",
    root / "docs" / "product" / "07_TEACHER_PLATFORM_BLUEPRINT.md": "",
    root / "docs" / "product" / "08_ADMIN_PLATFORM_BLUEPRINT.md": "",
    root / "docs" / "architecture" / "README.md": "# Architecture\n",
}

for file, content in files.items():
    if not file.exists():
        file.write_text(content, encoding="utf-8")

print("✅ Product and Architecture folders created.")