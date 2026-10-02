"""Integration smoke test: build first, then python3 scripts/test-mvc.py.
Uses a temporary workspace and fixture runner; never starts a real model run.
"""
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
import io

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='qa-mvc-') as folder:
    workspace = Path(folder)
    shutil.copy2(ROOT / 'server.mjs', workspace)
    shutil.copytree(ROOT / 'lib', workspace / 'lib')
    (workspace / '.github').mkdir()
    (workspace / 'input').mkdir()
    fixture = workspace / 'fixture-runner'
    fixture.write_text('''#!/usr/bin/env python3
import pathlib
if '--version' in __import__('sys').argv:
    print('fixture'); raise SystemExit()
root = pathlib.Path('output')
(root / 'testcraft').mkdir(parents=True)
(root / 'testcraft/cases.md').write_text('# Fixture cases')
(root / 'bddautomator').mkdir()
(root / 'bddautomator/README.md').write_text('Fixture automation pack')
print('Fixture runner completed. No real tests executed.')
''')
    fixture.chmod(0o700)
    env = {**os.environ, 'QaBackend__WorkspaceRoot': str(workspace),
           'QA_RUNNER': 'copilot', 'QA_COPILOT_BIN': str(fixture),
           'ASPNETCORE_URLS': 'http://127.0.0.1:0'}
    with (workspace / 'mvc.log').open('w+') as log:
        process = subprocess.Popen(['dotnet', 'run', '--no-build', '--project', str(ROOT / 'QaStudio.Web')],
                                   cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
        try:
            base = None
            for _ in range(200):
                log.seek(0)
                output = log.read()
                match = re.search(r'Now listening on: (http://127\.0\.0\.1:\d+)', output)
                if match:
                    base = match[1]
                    break
                if process.poll() is not None:
                    raise AssertionError(output)
                time.sleep(.1)
            assert base, 'MVC startup timed out: ' + output

            def request(path, payload=None, headers=None):
                data = json.dumps(payload).encode() if payload is not None else None
                req = urllib.request.Request(base + path, data=data,
                    headers={'Content-Type': 'application/json', **(headers or {})})
                try:
                    response = urllib.request.urlopen(req, timeout=15)
                except urllib.error.HTTPError as error:
                    response = error
                return response.status, response.headers, response.read()

            status, headers, html = request('/')
            assert status == 200, html
            assert "frame-ancestors 'none'" in headers['Content-Security-Policy']
            html = html.decode()
            for page in ['generation', 'execution', 'data', 'dashboard', 'recent']:
                assert f'id="{page}-page"' in html
            assert 'data-workflow="4" class="selected"' in html
            assert '<partial ' not in html and '@Model' not in html
            for asset in ['/app.js', '/workflows.js', '/progress.js', '/dashboard.js', '/costs.js', '/styles.css']:
                assert request(asset)[0] == 200, asset
            for private in ['/.env', '/server.mjs', '/Views/Workspace/Index.cshtml', '/.qa-runs/run.json']:
                assert request(private)[0] == 404, private
            assert request('/api/runs', headers={'Origin': 'https://foreign.example'})[0] == 403
            assert request('/api/runs', headers={'Host': 'foreign.example'})[0] in [400, 403]
            assert request('/api/config')[0] == 200
            assert request('/api/resources')[0] == 200
            assert request('/api/runs', {'pattern': '99'})[0] == 400
            status, _, data = request('/api/runs', {'pattern': '2', 'prompt': 'MVC fixture'})
            assert status == 201, data
            run_id = json.loads(data)['id']
            for _ in range(100):
                _, _, data = request('/api/runs/' + run_id)
                run = json.loads(data)
                if run['status'] != 'running':
                    break
                time.sleep(.1)
            assert run['status'] == 'finished', run
            path = '/api/runs/' + run_id
            assert request(path + '/dashboard')[0] == 200
            status, headers, data = request(path + '/artifact?path=testcraft/cases.md&download=1')
            assert status == 200 and data == b'# Fixture cases'
            assert 'attachment' in headers['Content-Disposition']
            status, headers, data = request(path + '/automation-pack')
            assert status == 200 and headers['Content-Type'] == 'application/zip'
            assert zipfile.ZipFile(io.BytesIO(data)).namelist() == ['bddautomator/README.md']
            assert request(path + '/cancel', {})[0] == 200
            assert request(path + '/artifact?path=../../server.mjs')[0] == 404
            print('MVC integration passed: Razor rendering, assets, access restrictions, API validation, fixture run, dashboard, downloads, ZIP, and cancellation route.')
        finally:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()
