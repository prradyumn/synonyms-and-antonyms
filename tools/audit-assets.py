"""What ships, how big it is, and what of it nothing uses.

    python tools/audit-assets.py

Run it whenever a scene is added or removed. An asset map outlives the code that
drew from it: the idle breathing loop sat in the boot preload long after its last
caller went, at 888KB a load.

Conservative by design -- a file counts as referenced if its basename appears
anywhere in the source, the build or the docs, so it under-reports rather than
proposing a live file for deletion. The converse does NOT hold: a file that IS
mentioned can still be dead, because a map entry outlives its consumer. Check that
something actually calls the code path before removing anything.
"""
import pathlib, re, fnmatch, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent

ignore = []
for line in (ROOT / '.vercelignore').read_text(encoding='utf-8').splitlines():
    line = line.strip()
    if line and not line.startswith('#'):
        ignore.append(line.rstrip('/'))

def shipped(rel):
    for pat in ignore:
        if rel == pat or rel.startswith(pat + '/') or fnmatch.fnmatch(rel, pat):
            return False
    return True

# everything git tracks, minus what vercel skips
tracked = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True,
                         text=True).stdout.splitlines()

# haystack: every source file that could name an asset
hay = ''
for p in ROOT.rglob('*'):
    if p.suffix.lower() in ('.js', '.html', '.css', '.py', '.md', '.json') \
            and '.git' not in p.parts:
        try:
            hay += p.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            pass

ship, skip = [], []
for rel in tracked:
    p = ROOT / rel
    if not p.exists():
        continue
    (ship if shipped(rel) else skip).append((rel, p.stat().st_size))

print(f"  SHIPS : {len(ship):4d} files  {sum(s for _, s in ship)/1024/1024:7.2f} MB")
print(f"  SKIPS : {len(skip):4d} files  {sum(s for _, s in skip)/1024/1024:7.2f} MB  (sources, docs, tools)")

print("\n  --- shipped assets, by size ---")
assets = sorted([(r, s) for r, s in ship if r.startswith('assets/')],
                key=lambda t: -t[1])
unref = []
for rel, size in assets:
    name = pathlib.Path(rel).name
    stem = pathlib.Path(rel).stem
    n = hay.count(name)
    # a build OUTPUT is referenced if its stem appears (levels.js builds paths)
    if n <= 0:
        n = hay.count(stem)
    flag = '' if n > 1 else ('  <-- UNREFERENCED' if n == 0 else '  <-- only 1 mention')
    print(f"    {size/1024:8.1f} KB  {rel:52s} mentions {n}{flag}")
    if n == 0:
        unref.append((rel, size))

print("\n  --- non-webp files that SHIP ---")
for rel, size in ship:
    ext = pathlib.Path(rel).suffix.lower()
    if ext in ('.png', '.jpg', '.jpeg', '.gif', '.bmp'):
        print(f"    {size/1024:8.1f} KB  {rel}")

if unref:
    print(f"\n  {len(unref)} unreferenced, {sum(s for _, s in unref)/1024:.0f} KB")
