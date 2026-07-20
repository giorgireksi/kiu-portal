#!/usr/bin/env bash

ensure_launcher_terminal() {
    if [[ -t 1 ]] || [[ -n "${KIU_LAUNCHER_IN_TERMINAL:-}" ]]; then
        return 0
    fi
    if [[ -z "${KIU_LAUNCHER_OPEN_TERMINAL:-}" ]] || [[ -z "${DISPLAY:-}" ]]; then
        return 0
    fi
    export KIU_LAUNCHER_IN_TERMINAL=1
    local script_path="$1"
    shift || true
    if command -v konsole >/dev/null 2>&1; then
        exec konsole --hold -e bash "$script_path" "$@"
    fi
    if command -v kgx >/dev/null 2>&1; then
        exec kgx -e bash -lc "bash $(printf '%q' "$script_path") $(printf ' %q' "$@"); echo; read -r -p 'Press Enter to close...' _"
    fi
    if command -v gnome-terminal >/dev/null 2>&1; then
        exec gnome-terminal -- bash -lc "bash $(printf '%q' "$script_path") $(printf ' %q' "$@"); echo; read -r -p 'Press Enter to close...' _"
    fi
    if command -v xfce4-terminal >/dev/null 2>&1; then
        exec xfce4-terminal --hold -e bash "$script_path" "$@"
    fi
    if command -v xterm >/dev/null 2>&1; then
        exec xterm -hold -e bash "$script_path" "$@"
    fi
    return 0
}

pause_launcher_on_error() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]] && [[ -t 0 ]]; then
        read -r -p "Press Enter to close..." _ </dev/tty || true
    fi
    return "$exit_code"
}

kill_pid_tree() {
    local pid="$1"
    local pgid
    pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ' || true)"
    if [[ -n "$pgid" ]]; then
        kill -- "-${pgid}" 2>/dev/null || true
    fi
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
}

kill_pid_file() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] || return 0
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        kill_pid_tree "$pid"
    fi
    rm -f "$pid_file"
}

pids_on_port() {
    local port="$1"
    local pid

    if command -v ss >/dev/null 2>&1; then
        while IFS= read -r pid; do
            [[ -n "$pid" ]] && printf '%s\n' "$pid"
        done < <(ss -ltnp "( sport = :${port} )" 2>/dev/null | sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p')
    fi

    if command -v lsof >/dev/null 2>&1; then
        lsof -ti ":${port}" -sTCP:LISTEN 2>/dev/null || true
    fi
}

kill_port_listeners() {
    local port="$1"
    local signal="${2:-TERM}"
    local killed=false
    local pid

    if command -v fuser >/dev/null 2>&1; then
        if [[ "$signal" == "KILL" ]]; then
            fuser -k -KILL "${port}/tcp" 2>/dev/null && killed=true
        else
            fuser -k -TERM "${port}/tcp" 2>/dev/null && killed=true
        fi
    fi

    while IFS= read -r pid; do
        [[ -z "$pid" ]] && continue
        if kill "-${signal}" "$pid" 2>/dev/null; then
            killed=true
        fi
    done < <(pids_on_port "$port" | sort -u)

    if [[ "$killed" == "true" ]]; then
        if [[ "$signal" == "KILL" ]]; then
            echo "Force-killed process on port ${port}"
        else
            echo "Stopped process on port ${port}"
        fi
    fi
}

kill_ports() {
    local port
    local seen_ports=""
    for port in "$@"; do
        [[ -z "$port" ]] && continue
        case " ${seen_ports} " in
            *" ${port} "*) continue ;;
        esac
        seen_ports="${seen_ports} ${port}"
        kill_port_listeners "$port" TERM
    done
    sleep 1
    seen_ports=""
    for port in "$@"; do
        [[ -z "$port" ]] && continue
        case " ${seen_ports} " in
            *" ${port} "*) continue ;;
        esac
        seen_ports="${seen_ports} ${port}"
        if port_in_use "$port"; then
            kill_port_listeners "$port" KILL
        fi
    done
}

port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -ltn "( sport = :${port} )" 2>/dev/null | grep -q ":${port}"
        return $?
    fi
    if command -v fuser >/dev/null 2>&1; then
        fuser "${port}/tcp" >/dev/null 2>&1
        return $?
    fi
    return 1
}

kill_anticheat_processes() {
    local ac_root="$1"
    if ! command -v pkill >/dev/null 2>&1; then
        return 0
    fi
    pkill -f "${ac_root}/node_modules/electron/cli.js" 2>/dev/null || true
    pkill -f "${ac_root}/dist/main" 2>/dev/null || true
    pkill -f "${ac_root}/" 2>/dev/null || true
}

read_pid_if_running() {
    local pid_file="$1"
    [[ -f "$pid_file" ]] || return 1
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
        printf '%s\n' "$pid"
        return 0
    fi
    return 1
}