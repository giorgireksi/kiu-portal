#!/usr/bin/env python3
"""Expand densified live CSS to human-editable pretty format.

Same property values; only whitespace/newlines change.
Validates brace balance, nested-swallow, and value preservation before write.
"""
from __future__ import annotations

import argparse
import random
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS_DIR = ROOT / "assets" / "css"
INDENT = "    "


def strip_comments_keep_map(css: str) -> tuple[str, list[tuple[int, str]]]:
    """Remove comments but record leading/standalone comment blocks to reattach."""
    comments: list[tuple[int, str]] = []
    out = []
    i, n = 0, len(css)
    while i < n:
        if css.startswith("/*", i):
            j = css.find("*/", i + 2)
            if j < 0:
                comments.append((len("".join(out)), css[i:]))
                break
            comments.append((len("".join(out)), css[i : j + 2]))
            i = j + 2
            continue
        out.append(css[i])
        i += 1
    return "".join(out), comments


def find_string_end(s: str, i: int, quote: str) -> int:
    i += 1
    n = len(s)
    while i < n:
        c = s[i]
        if c == "\\":
            i += 2
            continue
        if c == quote:
            return i + 1
        i += 1
    return n


def skip_comment(s: str, i: int) -> int:
    if s.startswith("/*", i):
        j = s.find("*/", i + 2)
        return len(s) if j < 0 else j + 2
    return i + 1


def scan_balanced(s: str, start: int, open_ch: str, close_ch: str) -> int:
    """Return index after matching close_ch; start points at open_ch."""
    depth = 0
    i, n = start, len(s)
    while i < n:
        c = s[i]
        if c in "'\"":
            i = find_string_end(s, i, c)
            continue
        if s.startswith("/*", i):
            i = skip_comment(s, i)
            continue
        if c == open_ch:
            depth += 1
            i += 1
            continue
        if c == close_ch:
            depth -= 1
            i += 1
            if depth == 0:
                return i
            continue
        i += 1
    return n


def extract_decl_values(css: str) -> list[str]:
    """Best-effort declaration values for preservation spot-check (comments stripped)."""
    bare, _ = strip_comments_keep_map(css)
    values: list[str] = []
    # property: value; inside leaf bodies — approximate via regex on densified text
    for m in re.finditer(r"(?<![-\w])([\w-]+)\s*:\s*([^;{}]+);", bare):
        val = re.sub(r"\s+", " ", m.group(2).strip())
        if val and len(val) >= 3:
            values.append(val)
    return values


def brace_balance_ok(css: str) -> bool:
    depth = 0
    i, n = 0, len(css)
    while i < n:
        c = css[i]
        if c in "'\"":
            i = find_string_end(css, i, c)
            continue
        if css.startswith("/*", i):
            i = skip_comment(css, i)
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth < 0:
                return False
        i += 1
    return depth == 0


def nested_swallow_ok(css: str) -> bool:
    """Reject if any non-@ rule body still contains `{` (leaf body corruption)."""
    bare, _ = strip_comments_keep_map(css)
    i, n = 0, len(bare)
    while i < n:
        if bare[i].isspace():
            i += 1
            continue
        start = i
        while i < n and bare[i] != "{":
            if bare[i] in "'\"":
                i = find_string_end(bare, i, bare[i])
                continue
            if bare.startswith("/*", i):
                i = skip_comment(bare, i)
                continue
            i += 1
        if i >= n:
            break
        sel = bare[start:i].strip()
        end = scan_balanced(bare, i, "{", "}")
        body = bare[i + 1 : end - 1]
        if sel.startswith("@") and "{" in body:
            # at-rule with nested rules — recurse into body only
            if not nested_swallow_ok(body):
                return False
        elif not sel.startswith("@") and "{" in body:
            return False
        i = end
    return True


def split_declarations(body: str) -> list[tuple[str, str]]:
    """Split leaf body into (prop, value) pairs; preserve value text (collapsed ws)."""
    decls: list[tuple[str, str]] = []
    i, n = 0, len(body)
    while i < n:
        while i < n and body[i].isspace():
            i += 1
        if i >= n:
            break
        # property name
        start = i
        while i < n and body[i] not in ":;{}":
            if body[i] in "'\"":
                i = find_string_end(body, i, body[i])
                continue
            if body.startswith("/*", i):
                i = skip_comment(body, i)
                continue
            i += 1
        prop = body[start:i].strip()
        if i >= n or body[i] != ":":
            # orphan junk — skip to next ;
            while i < n and body[i] != ";":
                if body[i] in "'\"":
                    i = find_string_end(body, i, body[i])
                elif body.startswith("/*", i):
                    i = skip_comment(body, i)
                else:
                    i += 1
            if i < n:
                i += 1
            continue
        i += 1  # skip :
        while i < n and body[i].isspace():
            i += 1
        vstart = i
        while i < n and body[i] != ";":
            if body[i] in "'\"":
                i = find_string_end(body, i, body[i])
                continue
            if body.startswith("/*", i):
                i = skip_comment(body, i)
                continue
            if body[i] in "{}":
                break
            i += 1
        value = re.sub(r"\s+", " ", body[vstart:i].strip())
        if prop and value:
            decls.append((prop, value))
        if i < n and body[i] == ";":
            i += 1
    return decls


def expand_block(css: str, depth: int = 0) -> str:
    """Pretty-print a CSS fragment (may contain nested at-rules)."""
    lines: list[str] = []
    pad = INDENT * depth
    pad_inner = INDENT * (depth + 1)
    i, n = 0, len(css)

    while i < n:
        while i < n and css[i].isspace():
            i += 1
        if i >= n:
            break

        # Preserve comments in-place as their own lines
        if css.startswith("/*", i):
            j = css.find("*/", i + 2)
            if j < 0:
                raise RuntimeError("unclosed comment — run repair_unclosed_comments first")
            comment = css[i : j + 2].strip()
            lines.append(pad + comment)
            i = j + 2
            continue

        start = i
        while i < n and css[i] != "{":
            if css[i] in "'\"":
                i = find_string_end(css, i, css[i])
                continue
            if css.startswith("/*", i):
                i = skip_comment(css, i)
                continue
            i += 1
        if i >= n:
            trailing = css[start:].strip()
            if trailing:
                lines.append(pad + trailing)
            break

        sel_raw = css[start:i]
        # Normalize selector whitespace but keep commas readable
        sel = re.sub(r"[ \t\r\n]+", " ", sel_raw.strip())
        end = scan_balanced(css, i, "{", "}")
        body = css[i + 1 : end - 1]

        is_nested_at = sel.startswith("@") and "{" in body
        # @keyframes / @font-face / normal rules: leaf if no `{` in body
        if is_nested_at:
            lines.append(f"{pad}{sel} {{")
            inner = expand_block(body, depth + 1)
            if inner:
                lines.append(inner)
            lines.append(f"{pad}}}")
        else:
            lines.append(f"{pad}{sel} {{")
            for prop, value in split_declarations(body):
                lines.append(f"{pad_inner}{prop}: {value};")
            lines.append(f"{pad}}}")

        i = end

    return "\n".join(lines)


def repair_unclosed_comments(css: str) -> str:
    """Close orphan /* that accidentally swallowed the first rule (densify artifact)."""
    if css.count("/*") <= css.count("*/"):
        return css
    idx = css.find("/*")
    if idx < 0:
        return css
    brace = css.find("{", idx)
    if brace < 0:
        return css + " */"
    before = css[idx:brace]
    m = re.search(r"\)\.\s+(?=[#.:@\w])", before) or re.search(
        r"(?<=\.)\s+(?=[#.@][\w-]|:root|body|html|@)", before
    )
    if not m:
        j = brace - 1
        while j > idx and css[j] not in "\n":
            j -= 1
        insert_at = j + 1
        return css[:insert_at] + "*/\n" + css[insert_at:]
    insert_at = idx + m.end()
    return css[:insert_at] + "*/ " + css[insert_at:]


def expand_css(css: str) -> str:
    css = repair_unclosed_comments(css)
    leading: list[str] = []
    rest = css
    while True:
        m = re.match(r"\s*(/\*.*?\*/)\s*", rest, flags=re.S)
        if not m:
            break
        leading.append(m.group(1).strip())
        rest = rest[m.end() :]
        if not re.match(r"\s*/\*", rest):
            break

    body = expand_block(rest, 0)
    if leading and body:
        return "\n".join(leading) + "\n\n" + body.rstrip() + "\n"
    if leading:
        return "\n".join(leading).rstrip() + "\n"
    return (body.rstrip() + "\n") if body else ""


def values_preserved(src: str, out: str, sample: int = 40) -> tuple[bool, str]:
    vals = extract_decl_values(src)
    if not vals:
        return True, ""
    k = min(sample, len(vals))
    picks = random.sample(vals, k) if len(vals) > k else vals
    # Normalize whitespace in output for comparison
    out_norm = re.sub(r"\s+", " ", out)
    missing = [v for v in picks if re.sub(r"\s+", " ", v) not in out_norm]
    if missing:
        return False, f"missing values e.g. {missing[0][:80]!r}"
    return True, ""


def process_file(path: Path, dry_run: bool = False) -> tuple[str, int, int]:
    src = path.read_text(encoding="utf-8")
    out = expand_css(src)

    if not brace_balance_ok(out):
        raise RuntimeError(f"{path.name}: brace imbalance after expand")
    if not nested_swallow_ok(out):
        raise RuntimeError(f"{path.name}: nested-swallow detected after expand")
    ok, err = values_preserved(src, out)
    if not ok:
        raise RuntimeError(f"{path.name}: value preservation failed — {err}")

    before, after = len(src.splitlines()), len(out.splitlines())
    if not dry_run:
        path.write_text(out, encoding="utf-8")
    return path.name, before, after


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "files",
        nargs="*",
        help="CSS files (default: all top-level assets/css/*.css)",
    )
    args = ap.parse_args()

    if args.files:
        paths = [Path(f) if Path(f).is_absolute() else ROOT / f for f in args.files]
    else:
        paths = sorted(CSS_DIR.glob("*.css"))

    random.seed(42)
    total_before = total_after = 0
    for path in paths:
        if not path.exists():
            print(f"SKIP missing {path}", file=sys.stderr)
            continue
        try:
            name, before, after = process_file(path, dry_run=args.dry_run)
        except RuntimeError as e:
            print(f"FAIL {e}", file=sys.stderr)
            return 1
        total_before += before
        total_after += after
        print(f"OK  {before:5d} → {after:5d}  {name}")

    print(f"TOTAL {total_before} → {total_after} ({'+' if total_after >= total_before else ''}{total_after - total_before})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
