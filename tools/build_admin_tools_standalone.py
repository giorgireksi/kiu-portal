from __future__ import annotations

import argparse
import base64
import mimetypes
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_HTML = ROOT / "admin-tools.html"
DEFAULT_OUTPUT_HTML = ROOT / "artifacts" / "generated" / "admin-tools" / "admin-tools-standalone.html"
GENERATED_BANNER = (
    "<!-- GENERATED FILE: built from admin-tools.html by "
    "tools/build_admin_tools_standalone.py. Do not edit by hand. -->\n"
)


mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/ttf", ".ttf")

LOCAL_SCHEME_RE = re.compile(r"^(?:[a-z]+:|//|data:)", re.IGNORECASE)
CSS_URL_RE = re.compile(r"url\((?P<quote>['\"]?)(?P<url>.*?)(?P=quote)\)")
LINK_STYLESHEET_RE = re.compile(
    r"""<link(?P<before>[^>]*?\brel=["']stylesheet["'][^>]*?\bhref=["'])(?P<href>[^"']+)(?P<after>["'][^>]*)>""",
    re.IGNORECASE,
)
SCRIPT_SRC_RE = re.compile(
    r"""<script(?P<before>[^>]*?\bsrc=["'])(?P<src>[^"']+)(?P<after>["'][^>]*)></script>""",
    re.IGNORECASE,
)
BODY_OPEN_RE = re.compile(r"<body\b[^>]*>", re.IGNORECASE)
MISSING_REFERENCES: list[str] = []

STANDALONE_BOOTSTRAP = """
<script>
(function seedStandaloneAdminSession() {
    var adminUser = {
        id: 'admin-standalone',
        name: 'Standalone Admin',
        nameEn: 'Standalone Admin',
        email: 'admin.tools@kiu.local',
        role: 'admin',
        faculty: 'ECON',
        facultyCode: 'ECON',
        status: 'Active',
        effectivePrivileges: ['*'],
        grantedPrivileges: ['*']
    };
    try {
        localStorage.setItem('currentUserRole', 'admin');
        localStorage.setItem('currentFaculty', 'ECON');
        localStorage.setItem('KIU_FACULTY_CONTEXT', 'ECON');
        localStorage.removeItem('KIU_PENDING_ROLE_SWITCH_ROLE');
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify({
            id: adminUser.id,
            name: adminUser.name,
            nameEn: adminUser.nameEn,
            email: adminUser.email,
            role: adminUser.role,
            faculty: adminUser.faculty
        }));

        var persisted = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || {};
        persisted.users = Array.isArray(persisted.users) ? persisted.users : [];
        if (!persisted.users.some(function(user) { return String(user && user.id || '') === adminUser.id; })) {
            persisted.users.unshift(adminUser);
        }
        persisted.auth = persisted.auth || {};
        persisted.auth.activeUserId = adminUser.id;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persisted));
    } catch (error) {}

    try {
        sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', adminUser.id);
        sessionStorage.removeItem('KIU_ACTIVE_ROLE_IMPERSONATION');
    } catch (error) {}

    function forceAdminRuntime() {
        try { currentUser = adminUser; } catch (error) {}
        try { currentUserRole = 'admin'; } catch (error) {}
        try {
            getCurrentUser = function() { return adminUser; };
            getCurrentUserId = function() { return adminUser.id; };
            getEffectiveUserRole = function() { return 'admin'; };
            getCurrentFaculty = function() { return 'ECON'; };
        } catch (error) {}
        try {
            window.currentUser = adminUser;
            window.currentUserRole = 'admin';
            window.getCurrentUser = function() { return adminUser; };
            window.getCurrentUserId = function() { return adminUser.id; };
            window.getEffectiveUserRole = function() { return 'admin'; };
            window.getCurrentFaculty = function() { return 'ECON'; };
        } catch (error) {}

        try {
            if (typeof KIU_STATE !== 'undefined' && KIU_STATE) {
                KIU_STATE.users = Array.isArray(KIU_STATE.users) ? KIU_STATE.users : [];
                if (!KIU_STATE.users.some(function(user) { return String(user && user.id || '') === adminUser.id; })) {
                    KIU_STATE.users.unshift(adminUser);
                }
                KIU_STATE.auth = KIU_STATE.auth || {};
                KIU_STATE.auth.activeUserId = adminUser.id;
            }
        } catch (error) {}

        try {
            document.body.classList.remove('role-student');
            document.body.classList.add('role-admin');
        } catch (error) {}

        try {
            if (typeof syncAll === 'function') syncAll();
        } catch (error) {}
        try {
            if (typeof renderLuxuryAdminToolsPage === 'function') renderLuxuryAdminToolsPage();
        } catch (error) {}

        try {
            var breadcrumb = document.getElementById('lux-breadcrumb-page');
            if (breadcrumb) breadcrumb.textContent = 'Admin Tools';
            var roleValue = document.getElementById('lux-role-picker-value');
            if (roleValue) roleValue.textContent = 'Admin View';
            var chipRole = document.getElementById('lux-chip-role');
            if (chipRole) chipRole.textContent = 'Admin View / University Portal';
            var userName = document.getElementById('lux-user-name');
            if (userName) userName.textContent = adminUser.name;
            var userRole = document.getElementById('lux-user-role');
            if (userRole) userRole.textContent = 'Administration Workspace';
            var avatar = document.getElementById('lux-avatar');
            if (avatar) avatar.textContent = 'SA';
        } catch (error) {}
    }

    document.addEventListener('DOMContentLoaded', function() {
        forceAdminRuntime();
        setTimeout(forceAdminRuntime, 120);
        setTimeout(forceAdminRuntime, 800);
    }, { once: true });
    window.addEventListener('load', function() {
        forceAdminRuntime();
        setTimeout(forceAdminRuntime, 120);
        setTimeout(forceAdminRuntime, 800);
    }, { once: true });
})();
</script>
""".strip()


def strip_query(ref: str) -> str:
    return ref.split("?", 1)[0].split("#", 1)[0]


def is_local_ref(ref: str) -> bool:
    value = ref.strip()
    return bool(value) and not LOCAL_SCHEME_RE.match(value)


def guess_mime(path: Path) -> str:
    mime, _ = mimetypes.guess_type(path.name)
    return mime or "application/octet-stream"


def file_to_data_uri(path: Path) -> str:
    mime = guess_mime(path)
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def inline_css_urls(css_text: str, css_path: Path) -> str:
    def replace(match: re.Match[str]) -> str:
        raw_url = match.group("url").strip()
        if not is_local_ref(raw_url):
            return match.group(0)
        target = (css_path.parent / strip_query(raw_url)).resolve()
        if not target.exists():
            MISSING_REFERENCES.append(f"{css_path.relative_to(ROOT)} -> {raw_url}")
            return "url('data:,')"
        return f"url('{file_to_data_uri(target)}')"

    return CSS_URL_RE.sub(replace, css_text)


def inline_stylesheets(html_text: str) -> str:
    def replace(match: re.Match[str]) -> str:
        href = match.group("href")
        if not is_local_ref(href):
            return match.group(0)
        css_path = (ROOT / strip_query(href)).resolve()
        if not css_path.exists():
            raise FileNotFoundError(f"Missing stylesheet: {href}")
        css_text = css_path.read_text(encoding="utf-8")
        css_text = inline_css_urls(css_text, css_path)
        data_uri = "data:text/css;base64," + base64.b64encode(css_text.encode("utf-8")).decode("ascii")
        return f"<link{match.group('before')}{data_uri}{match.group('after')}>"

    return LINK_STYLESHEET_RE.sub(replace, html_text)


def inline_scripts(html_text: str) -> str:
    def replace(match: re.Match[str]) -> str:
        src = match.group("src")
        if not is_local_ref(src):
            return match.group(0)
        script_path = (ROOT / strip_query(src)).resolve()
        if not script_path.exists():
            raise FileNotFoundError(f"Missing script: {src}")
        script_text = script_path.read_text(encoding="utf-8")
        data_uri = "data:application/javascript;base64," + base64.b64encode(script_text.encode("utf-8")).decode("ascii")
        return f"<script{match.group('before')}{data_uri}{match.group('after')}></script>"

    return SCRIPT_SRC_RE.sub(replace, html_text)


def inject_bootstrap(html_text: str) -> str:
    return BODY_OPEN_RE.sub(lambda match: match.group(0) + "\n" + STANDALONE_BOOTSTRAP, html_text, count=1)


def prepend_generated_banner(html_text: str) -> str:
    if html_text.startswith("<!-- GENERATED FILE:"):
        return html_text
    return GENERATED_BANNER + html_text


def resolve_output_path(raw_output: str) -> Path:
    output_path = Path(raw_output).expanduser()
    if not output_path.is_absolute():
        output_path = (ROOT / output_path).resolve()
    return output_path


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build the generated standalone admin-tools artifact outside the live source page."
    )
    parser.add_argument(
        "--output",
        default=str(DEFAULT_OUTPUT_HTML),
        help="Output HTML path. Defaults to artifacts/generated/admin-tools/admin-tools-standalone.html",
    )
    return parser.parse_args()


def build(output_html: Path) -> None:
    html_text = SOURCE_HTML.read_text(encoding="utf-8")
    html_text = inject_bootstrap(html_text)
    html_text = inline_stylesheets(html_text)
    html_text = inline_scripts(html_text)
    html_text = prepend_generated_banner(html_text)
    output_html.parent.mkdir(parents=True, exist_ok=True)
    output_html.write_text(html_text, encoding="utf-8")


if __name__ == "__main__":
    args = parse_args()
    output_html = resolve_output_path(args.output)
    build(output_html)
    print(f"Wrote standalone file: {output_html}")
    if MISSING_REFERENCES:
        print("Replaced missing fallback references with empty data URIs:")
        for item in MISSING_REFERENCES:
            print(f" - {item}")
