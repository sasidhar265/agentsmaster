"""Package generated automation sources, preserving their output-relative paths."""
import io
import pathlib
import sys
import zipfile

root = pathlib.Path(sys.argv[1]).resolve()
archive = io.BytesIO()
total = 0
count = 0
excluded = {'bin', 'obj', 'node_modules', 'testresults', '.git', '__pycache__'}
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as pack:
    for folder in ('bddautomator', 'automationforge', 'gherkeningenie', 'gherkingenie'):
        source = root / folder
        if not source.is_dir() or source.is_symlink():
            continue
        for file in sorted(source.rglob('*')):
            relative = file.relative_to(root)
            if any(part.lower() in excluded for part in relative.parts):
                continue
            if file.is_symlink() or any(parent.is_symlink() for parent in file.parents if parent != root):
                continue
            if not file.is_file() or not file.resolve().is_relative_to(root):
                continue
            total += file.stat().st_size
            if total > 100 * 1024 * 1024:
                raise ValueError('Automation pack exceeds the 100 MB download limit')
            pack.write(file, relative.as_posix())
            count += 1
if not count:
    raise ValueError('No generated automation pack is available')
sys.stdout.buffer.write(archive.getvalue())
