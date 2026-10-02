"""Parse recorded TRX evidence; never infer successful execution from agent text."""
import json
import re
import sys
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET


def seconds(value):
    if not value:
        return None
    match = re.fullmatch(r'(?:(\d+)\.)?(\d+):(\d+):(\d+(?:\.\d+)?)', value)
    if not match:
        return None
    days, hours, minutes, secs = match.groups()
    return int(days or 0)*86400 + int(hours)*3600 + int(minutes)*60 + float(secs)


def timestamp(value):
    try:
        return datetime.fromisoformat(value.replace('Z', '+00:00')).timestamp()
    except (ValueError, AttributeError):
        return None


def text(node, name):
    child = node.find('.//' + name)
    return ''.join(child.itertext()).strip() if child is not None else ''


def parse_trx(file):
    data = file.read_bytes()
    if len(data) > 20*1024*1024:
        raise ValueError('TRX exceeds the 20 MB parser limit')
    if b'<!DOCTYPE' in data.upper() or b'<!ENTITY' in data.upper():
        raise ValueError('TRX document declarations are not supported')
    root = ET.fromstring(data)
    for node in root.iter():
        node.tag = node.tag.split('}')[-1]
    if root.tag != 'TestRun':
        raise ValueError('Expected a TRX TestRun document')
    definitions = {node.get('id'): node for node in root.findall('./TestDefinitions/UnitTest')}
    tests = {}
    seen_ids = set()
    for index, node in enumerate(root.findall('./Results/UnitTestResult')):
        test_id = node.get('testId', '')
        name = node.get('testName', test_id or 'Unnamed test')
        key = (test_id, name)
        seen_ids.add(test_id)
        raw = node.get('outcome', 'Unknown')
        status = {'passed': 'passed', 'failed': 'failed', 'error': 'failed', 'timeout': 'failed', 'aborted': 'failed', 'notexecuted': 'not_run', 'notrunnable': 'not_run', 'skipped': 'not_run', 'pending': 'not_run', 'inconclusive': 'not_run', 'inprogress': 'running'}.get(raw.lower(), 'unknown')
        definition = definitions.get(test_id)
        method = definition.find('TestMethod') if definition is not None else None
        message = text(node, 'Message')
        entry = {'id': test_id or node.get('executionId', str(index)), 'name': name, 'suite': method.get('className', '') if method is not None else '', 'status': status, 'outcome': raw, 'durationSeconds': seconds(node.get('duration')), 'startedAt': node.get('startTime'), 'endedAt': node.get('endTime'), 'failure': message if status == 'failed' else '', 'details': message, 'stackTrace': text(node, 'StackTrace'), 'attempts': tests.get(key, {}).get('attempts', 0)+1}
        # Prefer the final recorded outcome within this report, preserving attempt counts.
        if key not in tests or (timestamp(entry['endedAt']) or 0) >= (timestamp(tests[key]['endedAt']) or 0):
            tests[key] = entry
        else:
            tests[key]['attempts'] += 1
    for test_id, definition in definitions.items():
        if test_id not in seen_ids:
            tests[(test_id, definition.get('name'))] = {'id': test_id, 'name': definition.get('name', test_id), 'suite': '', 'status': 'not_run', 'outcome': 'No recorded result', 'durationSeconds': None, 'failure': '', 'details': 'Defined in this TRX report, with no execution result.', 'stackTrace': '', 'attempts': 0}
    timing = root.find('Times')
    start = timestamp(timing.get('start')) if timing is not None else None
    finish = timestamp(timing.get('finish')) if timing is not None else None
    counters = root.find('./ResultSummary/Counters')
    warnings = []
    if counters is not None and int(counters.get('total', '0')) > len(tests):
        warnings.append('TRX counters include tests without individual definitions/results. Those missing tests cannot be assigned a status; visible totals cover identifiable tests only.')
    if not tests:
        warnings.append('This TRX report contains no identifiable test results or definitions.')
    return {'tests': list(tests.values()), 'executionSeconds': max(0, finish-start) if start is not None and finish is not None else None, 'reportedCounters': dict(counters.attrib) if counters is not None else {}, 'warnings': warnings}


def feature_inventory(root):
    framework = root/'bddautomator/AutomationFramework/Reqnroll/Features'
    source = framework if framework.exists() else root/'gherkingenie'
    tests, warnings = [], []
    for file in sorted(source.rglob('*.feature')) if source.exists() else []:
        if file.is_symlink() or not file.resolve().is_relative_to(root.resolve()):
            continue
        suite = file.stem
        in_docstring = False
        for index, line in enumerate(file.read_text(errors='replace').splitlines()):
            if re.match(r'^\s*("""|```)', line):
                in_docstring = not in_docstring
            if in_docstring:
                continue
            feature = re.match(r'^\s*Feature:\s*(.+)', line)
            if feature:
                suite = feature[1]
            match = re.match(r'^\s*Scenario:\s*(.+)', line)
            if match:
                tests.append({'id': f'{file.name}:{index+1}', 'name': match[1], 'suite': suite, 'status': 'not_run', 'outcome': 'No recorded execution', 'durationSeconds': None, 'failure': '', 'details': 'Discovered in a feature file; no TRX execution evidence is available.', 'stackTrace': '', 'attempts': 0})
            if re.match(r'^\s*Scenario Outline:', line):
                warnings.append(f'{file.name}: Scenario Outline examples are not counted without a TRX report.')
    return {'tests': tests, 'executionSeconds': None, 'reportedCounters': {}, 'warnings': warnings}


if __name__ == '__main__':
    try:
        root = Path(sys.argv[1]).resolve()
        if len(sys.argv) > 2:
            file = Path(sys.argv[2]).resolve()
            if not file.is_relative_to(root):
                raise ValueError('Report path is outside this run')
            result = parse_trx(file)
        else:
            result = feature_inventory(root)
        print(json.dumps(result))
    except Exception as error:
        print(json.dumps({'tests': [], 'executionSeconds': None, 'reportedCounters': {}, 'warnings': [f'Cannot read execution evidence: {error}']}))
