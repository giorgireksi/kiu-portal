package com.anticheat.browser

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityManager
import android.view.inputmethod.EditorInfo
import android.webkit.CookieManager
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import okhttp3.Call
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException
import java.net.URL
import kotlin.math.max
import kotlin.math.min

private const val PREFS_NAME = "kiu_anticheat_android"
private const val KEY_CONFIG_JSON = "kiu_android_config"
private const val KEY_PORTAL_SESSION_JSON = "kiu_android_portal_session"
private const val KEY_PORTAL_SESSION_TOKEN = "kiu_android_portal_session_token"
private const val KEY_PENDING_OPEN_TARGET_JSON = "kiu_android_pending_open_target"
private const val KEY_PENDING_LAUNCH_JSON = "kiu_android_pending_launch"
private const val KEY_PROTECTED_LAUNCH_JSON = "kiu_android_protected_launch"
private const val KEY_EXAM_PORTAL_TOKEN = "kiu_android_exam_portal_token"
private const val KEY_EXAM_PORTAL_STUDENT_JSON = "kiu_android_exam_portal_student"
private const val KEY_PROTECTED_CLIENT_TOKEN = "KIU_PROTECTED_CLIENT_SESSION_TOKEN"

private const val DEFAULT_APP_URL = "http://127.0.0.1:8876"
private const val DEFAULT_BACKEND_URL = "http://127.0.0.1:48933"
private const val DEFAULT_QUIZ_URL = "http://127.0.0.1:8876/lms.html"
private const val DEFAULT_EXAM_PORTAL_URL = "http://127.0.0.1:8876/exam-portal.html"

private enum class Tone {
    INFO,
    SUCCESS,
    WARNING,
    DANGER
}

private enum class ActiveScreen {
    LOGIN,
    LAUNCHER,
    WEB,
    BLOCKED
}

private enum class WebMode {
    NONE,
    LMS,
    EXAM_PORTAL,
    PROTECTED
}

private fun JSONArray?.toStringList(): List<String> {
    if (this == null) return emptyList()
    val values = mutableListOf<String>()
    for (index in 0 until length()) {
        val value = optString(index).trim()
        if (value.isNotBlank()) values.add(value)
    }
    return values.distinct()
}

private fun normalizeUrl(value: String, fallback: String): String {
    val candidate = value.trim().removeSuffix("/")
    if (candidate.isBlank()) return fallback.trim().removeSuffix("/")
    return try {
        val parsed = URL(candidate)
        when (parsed.protocol.lowercase()) {
            "https" -> candidate
            "http" -> if (BuildConfig.DEBUG || parsed.host.lowercase() in setOf("127.0.0.1", "localhost", "10.0.2.2")) candidate else fallback.trim().removeSuffix("/")
            else -> fallback.trim().removeSuffix("/")
        }
    } catch (_: Exception) {
        fallback.trim().removeSuffix("/")
    }
}

private fun extractHost(value: String): String? {
    val candidate = value.trim()
    if (candidate.isBlank()) return null
    val attempts = listOf(candidate, "http://$candidate", "https://$candidate")
    for (attempt in attempts) {
        try {
            val host = URL(attempt).host.trim().lowercase()
            if (host.isNotBlank()) return host
        } catch (_: Exception) {
            // try the next form
        }
    }
    return null
}

private fun normalizeAllowedDomains(values: List<String>): List<String> {
    val domains = linkedSetOf<String>()
    values.forEach { raw ->
        val value = raw.trim()
        if (value.isBlank()) return@forEach
        val host = extractHost(value)
            ?: value.lowercase().substringBefore('/').substringBefore(':').trim()
        if (host.isNotBlank()) domains.add(host)
    }
    if (BuildConfig.DEBUG) {
        domains.add("127.0.0.1")
        domains.add("localhost")
        domains.add("10.0.2.2")
    }
    return domains.toList()
}

private fun clampInterval(value: Long, fallback: Long, minimum: Long, maximum: Long): Long {
    val base = if (value <= 0L) fallback else value
    return min(max(base, minimum), maximum)
}

private fun isTerminalAttemptStatus(status: String): Boolean {
    return status.trim().lowercase() in setOf("submitted", "auto-submitted", "graded", "completed", "finished", "closed")
}

private fun isProtectedModeHostAllowed(host: String, allowedDomains: List<String>): Boolean {
    val normalizedHost = host.trim().lowercase()
    if (normalizedHost.isBlank()) return false
    return allowedDomains.any { allowed ->
        val normalizedAllowed = allowed.trim().lowercase()
        normalizedAllowed.isNotBlank() && (
            normalizedHost == normalizedAllowed || normalizedHost.endsWith(".$normalizedAllowed")
        )
    }
}

private data class PortalAccountSummary(
    val id: String,
    val name: String,
    val nameEn: String,
    val email: String,
    val role: String,
    val faculty: String
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("id", id)
        put("name", name)
        put("nameEn", nameEn)
        put("displayName", nameEn.ifBlank { name })
        put("email", email)
        put("role", role)
        put("faculty", faculty)
        put("facultyCode", faculty)
    }

    companion object {
        fun fromJson(raw: JSONObject?): PortalAccountSummary {
            val json = raw ?: JSONObject()
            val nameEn = json.optString("nameEn").trim().ifBlank {
                json.optString("displayName").trim().ifBlank {
                    json.optString("name").trim()
                }
            }
            return PortalAccountSummary(
                id = json.optString("id").trim(),
                name = json.optString("name").trim().ifBlank { nameEn },
                nameEn = nameEn.ifBlank { json.optString("name").trim() },
                email = json.optString("email").trim().ifBlank { json.optString("microsoftEmail").trim() },
                role = json.optString("role").trim().lowercase().ifBlank { "student" },
                faculty = json.optString("facultyCode").trim().ifBlank { json.optString("faculty").trim() }
            )
        }
    }
}

private data class PortalSessionState(
    val token: String,
    val account: PortalAccountSummary,
    val actualRole: String,
    val effectiveRole: String,
    val activeSessionUserId: String
) {
    fun toPrefsJson(): String = JSONObject().apply {
        put("token", token)
        put("account", account.toJson())
        put("actualRole", actualRole)
        put("effectiveRole", effectiveRole)
        put("activeSessionUserId", activeSessionUserId)
    }.toString()

    companion object {
        fun fromLoginResponse(accountJson: JSONObject?, sessionJson: JSONObject?, token: String): PortalSessionState? {
            val account = PortalAccountSummary.fromJson(accountJson)
            val normalizedToken = token.trim()
            if (account.id.isBlank() || normalizedToken.isBlank()) return null
            val session = sessionJson ?: JSONObject()
            val actualRole = session.optString("actualRole").trim().lowercase().ifBlank { account.role.ifBlank { "student" } }
            val effectiveRole = if (actualRole == "admin") {
                session.optString("impersonatedRole").trim().lowercase().ifBlank { actualRole }
            } else {
                actualRole
            }
            val activeSessionUserId = session.optString("impersonatedUserId").trim().ifBlank { account.id }
            return PortalSessionState(
                token = normalizedToken,
                account = account,
                actualRole = actualRole,
                effectiveRole = effectiveRole.ifBlank { actualRole },
                activeSessionUserId = activeSessionUserId
            )
        }

        fun fromPrefs(raw: String?, tokenOverride: String? = null): PortalSessionState? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                val account = PortalAccountSummary.fromJson(json.optJSONObject("account"))
                val token = tokenOverride?.trim().orEmpty().ifBlank { json.optString("token").trim() }
                if (token.isBlank() || account.id.isBlank()) return null
                PortalSessionState(
                    token = token,
                    account = account,
                    actualRole = json.optString("actualRole").trim().lowercase().ifBlank { account.role },
                    effectiveRole = json.optString("effectiveRole").trim().lowercase().ifBlank { account.role },
                    activeSessionUserId = json.optString("activeSessionUserId").trim().ifBlank { account.id }
                )
            } catch (_: Exception) {
                null
            }
        }
    }
}

private data class AppConfig(
    val appUrl: String,
    val backendUrl: String,
    val quizUrl: String,
    val examPortalUrl: String,
    val reportingUrl: String,
    val heartbeatUrl: String,
    val allowedDomains: List<String>
) {
    fun normalized(): AppConfig = copy(
        appUrl = normalizeUrl(appUrl, DEFAULT_APP_URL),
        backendUrl = normalizeUrl(backendUrl, DEFAULT_BACKEND_URL),
        quizUrl = normalizeUrl(quizUrl.ifBlank { "${normalizeUrl(appUrl, DEFAULT_APP_URL)}/lms.html" }, DEFAULT_QUIZ_URL),
        examPortalUrl = normalizeUrl(examPortalUrl.ifBlank { "${normalizeUrl(appUrl, DEFAULT_APP_URL)}/exam-portal.html" }, DEFAULT_EXAM_PORTAL_URL),
        reportingUrl = normalizeUrl(reportingUrl, ""),
        heartbeatUrl = normalizeUrl(heartbeatUrl, ""),
        allowedDomains = normalizeAllowedDomains(allowedDomains + listOf(appUrl, backendUrl, quizUrl, examPortalUrl))
    )

    fun mergedWith(override: AppConfig): AppConfig = copy(
        appUrl = override.appUrl.ifBlank { appUrl },
        backendUrl = override.backendUrl.ifBlank { backendUrl },
        quizUrl = override.quizUrl.ifBlank { quizUrl },
        examPortalUrl = override.examPortalUrl.ifBlank { examPortalUrl },
        reportingUrl = override.reportingUrl.ifBlank { reportingUrl },
        heartbeatUrl = override.heartbeatUrl.ifBlank { heartbeatUrl },
        allowedDomains = normalizeAllowedDomains(allowedDomains + override.allowedDomains)
    ).normalized()

    fun toPrefsJson(): String = JSONObject().apply {
        put("appUrl", appUrl)
        put("backendUrl", backendUrl)
        put("quizUrl", quizUrl)
        put("examPortalUrl", examPortalUrl)
        put("reportingUrl", reportingUrl)
        put("heartbeatUrl", heartbeatUrl)
        put("allowedDomains", JSONArray(allowedDomains))
    }.toString()

    companion object {
        fun default(): AppConfig = AppConfig(
            appUrl = DEFAULT_APP_URL,
            backendUrl = DEFAULT_BACKEND_URL,
            quizUrl = DEFAULT_QUIZ_URL,
            examPortalUrl = DEFAULT_EXAM_PORTAL_URL,
            reportingUrl = "",
            heartbeatUrl = "",
            allowedDomains = listOf("127.0.0.1", "localhost")
        ).normalized()

        fun fromJson(raw: String?): AppConfig? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                AppConfig(
                    appUrl = json.optString("appUrl").trim(),
                    backendUrl = json.optString("backendUrl").trim(),
                    quizUrl = json.optString("quizUrl").trim(),
                    examPortalUrl = json.optString("examPortalUrl").trim(),
                    reportingUrl = json.optString("reportingUrl").trim(),
                    heartbeatUrl = json.optString("heartbeatUrl").trim(),
                    allowedDomains = json.optJSONArray("allowedDomains").toStringList()
                ).normalized()
            } catch (_: Exception) {
                null
            }
        }

        fun fromAsset(raw: String?): AppConfig = fromJson(raw) ?: default()
    }
}

private data class AntiCheatPolicy(
    val processScanning: Boolean,
    val clipboardClearing: Boolean,
    val focusProtection: Boolean,
    val inputBlocking: Boolean,
    val kioskMode: Boolean,
    val vmDetection: Boolean,
    val devToolsProtection: Boolean,
    val allowDebugTools: Boolean,
    val navigationProtection: Boolean,
    val securityDialogs: Boolean,
    val violationScreen: Boolean,
    val blockedProcesses: List<String>,
    val allowedDomains: List<String>,
    val heartbeatMs: Long,
    val processScanMs: Long
) {
    fun normalized(): AntiCheatPolicy = copy(
        blockedProcesses = blockedProcesses.map { it.trim() }.filter { it.isNotBlank() }.distinct(),
        allowedDomains = normalizeAllowedDomains(allowedDomains),
        heartbeatMs = clampInterval(heartbeatMs, 2000L, 1000L, 60000L),
        processScanMs = clampInterval(processScanMs, 1500L, 1000L, 60000L)
    )

    fun summaryLine(): String {
        val enabled = buildList {
            if (kioskMode) add("Kiosk")
            if (navigationProtection) add("Navigation")
            if (focusProtection) add("Focus")
            if (clipboardClearing) add("Clipboard")
            if (inputBlocking) add("Input")
            if (vmDetection) add("VM")
        }
        return "Policy: ${enabled.joinToString(", ").ifBlank { "Default secure policy" }} | Heartbeat ${heartbeatMs} ms | Scan ${processScanMs} ms | Blocked processes ${blockedProcesses.size}"
    }

    companion object {
        fun strict(): AntiCheatPolicy = AntiCheatPolicy(
            processScanning = true,
            clipboardClearing = true,
            focusProtection = true,
            inputBlocking = true,
            kioskMode = true,
            vmDetection = true,
            devToolsProtection = true,
            allowDebugTools = false,
            navigationProtection = true,
            securityDialogs = true,
            violationScreen = true,
            blockedProcesses = listOf(
                "TeamViewer.exe",
                "AnyDesk.exe",
                "Discord.exe",
                "obs64.exe",
                "obs32.exe",
                "Zoom.exe",
                "Skype.exe",
                "Cheat Engine.exe",
                "x64dbg.exe",
                "Wireshark.exe",
                "SnippingTool.exe",
                "ScreenClippingHost.exe",
                "discord",
                "obs",
                "wireshark",
                "anydesk",
                "teamviewer",
                "zoom",
                "x64dbg",
                "gdb"
            ),
            allowedDomains = emptyList(),
            heartbeatMs = 2000L,
            processScanMs = 1500L
        )

        fun fromJson(raw: JSONObject?): AntiCheatPolicy {
            val source = raw ?: JSONObject()
            return AntiCheatPolicy(
                processScanning = source.optBoolean("processScanning", true),
                clipboardClearing = source.optBoolean("clipboardClearing", true),
                focusProtection = source.optBoolean("focusProtection", true),
                inputBlocking = source.optBoolean("inputBlocking", true),
                kioskMode = source.optBoolean("kioskMode", true),
                vmDetection = source.optBoolean("vmDetection", true),
                devToolsProtection = source.optBoolean("devToolsProtection", true),
                allowDebugTools = source.optBoolean("allowDebugTools", false),
                navigationProtection = source.optBoolean("navigationProtection", true),
                securityDialogs = source.optBoolean("securityDialogs", true),
                violationScreen = source.optBoolean("violationScreen", true),
                blockedProcesses = source.optJSONArray("blockedProcesses").toStringList(),
                allowedDomains = source.optJSONArray("allowedDomains").toStringList(),
                heartbeatMs = source.optLong("heartbeatMs", 2000L),
                processScanMs = source.optLong("processScanMs", 1500L)
            ).normalized()
        }
    }
}

private data class PendingLaunch(
    val ticket: String,
    val backendUrl: String,
    val appUrl: String,
    val quizUrl: String,
    val source: String,
    val platform: String
) {
    fun toPrefsJson(): String = JSONObject().apply {
        put("ticket", ticket)
        put("backendUrl", backendUrl)
        put("appUrl", appUrl)
        put("quizUrl", quizUrl)
        put("source", source)
        put("platform", platform)
    }.toString()

    companion object {
        fun fromPrefs(raw: String?): PendingLaunch? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                PendingLaunch(
                    ticket = json.optString("ticket").trim(),
                    backendUrl = normalizeUrl(json.optString("backendUrl").trim(), DEFAULT_BACKEND_URL),
                    appUrl = normalizeUrl(json.optString("appUrl").trim(), DEFAULT_APP_URL),
                    quizUrl = normalizeUrl(json.optString("quizUrl").trim(), DEFAULT_QUIZ_URL),
                    source = json.optString("source").trim(),
                    platform = json.optString("platform").trim()
                ).takeIf { it.ticket.isNotBlank() }
            } catch (_: Exception) {
                null
            }
        }
    }
}

private data class PendingOpenTarget(
    val targetUrl: String,
    val source: String,
    val platform: String
) {
    fun toPrefsJson(): String = JSONObject().apply {
        put("targetUrl", targetUrl)
        put("source", source)
        put("platform", platform)
    }.toString()

    companion object {
        fun fromPrefs(raw: String?): PendingOpenTarget? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                PendingOpenTarget(
                    targetUrl = json.optString("targetUrl").trim(),
                    source = json.optString("source").trim(),
                    platform = json.optString("platform").trim()
                ).takeIf { it.targetUrl.isNotBlank() }
            } catch (_: Exception) {
                null
            }
        }
    }
}

private data class ExamPortalAuthState(
    val token: String,
    val studentJson: String
) {
    fun toPrefsJson(): String = JSONObject().apply {
        put("token", token)
        put("studentJson", studentJson)
    }.toString()

    companion object {
        fun fromResponse(payload: JSONObject): ExamPortalAuthState? {
            val token = payload.optString("token").trim()
            val student = payload.optJSONObject("student")?.toString() ?: ""
            if (token.isBlank() || student.isBlank()) return null
            return ExamPortalAuthState(token = token, studentJson = student)
        }

        fun fromPrefs(raw: String?): ExamPortalAuthState? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                val token = json.optString("token").trim()
                val student = json.optString("studentJson").trim()
                if (token.isBlank() || student.isBlank()) null else ExamPortalAuthState(token, student)
            } catch (_: Exception) {
                null
            }
        }
    }
}

private data class ProtectedLaunchState(
    val courseId: String,
    val quizId: String,
    val quizSessionUrl: String,
    val clientSessionToken: String,
    val allowedDomains: List<String>,
    val reportingUrl: String,
    val heartbeatUrl: String,
    val studentId: String,
    val studentName: String,
    val quizTitle: String,
    val policy: AntiCheatPolicy,
    val attemptStatus: String,
    val blocked: Boolean,
    val antiCheatConnected: Boolean,
    val warningCount: Int,
    val violationCount: Int,
    val lastHeartbeatAt: String,
    val disconnectAccumulatedMs: Long,
    val overrideStatus: String
) {
    fun toPrefsJson(): String = JSONObject().apply {
        put("courseId", courseId)
        put("quizId", quizId)
        put("quizSessionUrl", quizSessionUrl)
        put("clientSessionToken", clientSessionToken)
        put("allowedDomains", JSONArray(allowedDomains))
        put("reportingUrl", reportingUrl)
        put("heartbeatUrl", heartbeatUrl)
        put("studentId", studentId)
        put("studentName", studentName)
        put("quizTitle", quizTitle)
        put("policy", JSONObject(policyToJson(policy)))
        put("attemptStatus", attemptStatus)
        put("blocked", blocked)
        put("antiCheatConnected", antiCheatConnected)
        put("warningCount", warningCount)
        put("violationCount", violationCount)
        put("lastHeartbeatAt", lastHeartbeatAt)
        put("disconnectAccumulatedMs", disconnectAccumulatedMs)
        put("overrideStatus", overrideStatus)
    }.toString()

    companion object {
        fun fromPrefs(raw: String?): ProtectedLaunchState? {
            if (raw.isNullOrBlank()) return null
            return try {
                val json = JSONObject(raw)
                ProtectedLaunchState(
                    courseId = json.optString("courseId").trim(),
                    quizId = json.optString("quizId").trim(),
                    quizSessionUrl = json.optString("quizSessionUrl").trim(),
                    clientSessionToken = json.optString("clientSessionToken").trim(),
                    allowedDomains = json.optJSONArray("allowedDomains").toStringList(),
                    reportingUrl = json.optString("reportingUrl").trim(),
                    heartbeatUrl = json.optString("heartbeatUrl").trim(),
                    studentId = json.optString("studentId").trim(),
                    studentName = json.optString("studentName").trim(),
                    quizTitle = json.optString("quizTitle").trim(),
                    policy = AntiCheatPolicy.fromJson(json.optJSONObject("policy")),
                    attemptStatus = json.optString("attemptStatus").trim(),
                    blocked = json.optBoolean("blocked", false),
                    antiCheatConnected = json.optBoolean("antiCheatConnected", true),
                    warningCount = json.optInt("warningCount", 0),
                    violationCount = json.optInt("violationCount", 0),
                    lastHeartbeatAt = json.optString("lastHeartbeatAt").trim(),
                    disconnectAccumulatedMs = json.optLong("disconnectAccumulatedMs", 0L),
                    overrideStatus = json.optString("overrideStatus").trim()
                ).takeIf {
                    it.courseId.isNotBlank() && it.quizId.isNotBlank() && it.quizSessionUrl.isNotBlank() && it.clientSessionToken.isNotBlank()
                }
            } catch (_: Exception) {
                null
            }
        }

        fun fromLaunchResponse(payload: JSONObject): ProtectedLaunchState? {
            val quiz = payload.optJSONObject("quiz")
            val attempt = payload.optJSONObject("attempt")
            val policy = AntiCheatPolicy.fromJson(payload.optJSONObject("antiCheatPolicy"))
            val session = payload.optJSONObject("session")
            val student = payload.optJSONObject("studentIdentity") ?: payload.optJSONObject("student") ?: JSONObject()
            val allowedDomains = payload.optJSONArray("allowedDomains").toStringList()
            val quizId = quiz?.optString("id").orEmpty().ifBlank { attempt?.optString("quizId").orEmpty() }
            val courseId = quiz?.optString("courseId").orEmpty().ifBlank { attempt?.optString("courseId").orEmpty() }
            val sessionUrl = payload.optString("quizSessionUrl").trim()
            val token = payload.optString("clientSessionToken").trim()
            if (quizId.isBlank() || courseId.isBlank() || sessionUrl.isBlank() || token.isBlank()) return null
            return ProtectedLaunchState(
                courseId = courseId,
                quizId = quizId,
                quizSessionUrl = sessionUrl,
                clientSessionToken = token,
                allowedDomains = normalizeAllowedDomains(
                    allowedDomains + policy.allowedDomains + listOfNotNull(
                        extractHost(sessionUrl),
                        extractHost(payload.optString("reportingUrl")),
                        extractHost(payload.optString("heartbeatUrl"))
                    )
                ),
                reportingUrl = payload.optString("reportingUrl").trim(),
                heartbeatUrl = payload.optString("heartbeatUrl").trim(),
                studentId = student.optString("id").trim().ifBlank { session?.optString("studentId").orEmpty() },
                studentName = student.optString("name").trim().ifBlank { session?.optString("studentName").orEmpty() },
                quizTitle = quiz?.optString("title").orEmpty(),
                policy = policy,
                attemptStatus = attempt?.optString("status").orEmpty(),
                blocked = attempt?.optBoolean("blocked", false) ?: false,
                antiCheatConnected = attempt?.optBoolean("antiCheatConnected", true) ?: true,
                warningCount = attempt?.optInt("warningCount", 0) ?: 0,
                violationCount = attempt?.optInt("violationCount", 0) ?: 0,
                lastHeartbeatAt = attempt?.optString("lastHeartbeatAt").orEmpty(),
                disconnectAccumulatedMs = attempt?.optLong("disconnectAccumulatedMs", 0L) ?: 0L,
                overrideStatus = attempt?.optString("overrideStatus").orEmpty()
            )
        }
    }
}

private fun policyToJson(policy: AntiCheatPolicy): String = JSONObject().apply {
    put("processScanning", policy.processScanning)
    put("clipboardClearing", policy.clipboardClearing)
    put("focusProtection", policy.focusProtection)
    put("inputBlocking", policy.inputBlocking)
    put("kioskMode", policy.kioskMode)
    put("vmDetection", policy.vmDetection)
    put("devToolsProtection", policy.devToolsProtection)
    put("allowDebugTools", policy.allowDebugTools)
    put("navigationProtection", policy.navigationProtection)
    put("securityDialogs", policy.securityDialogs)
    put("violationScreen", policy.violationScreen)
    put("blockedProcesses", JSONArray(policy.blockedProcesses))
    put("allowedDomains", JSONArray(policy.allowedDomains))
    put("heartbeatMs", policy.heartbeatMs)
    put("processScanMs", policy.processScanMs)
}.toString()

private data class BrowserBootstrap(
    val backendUrl: String,
    val portalToken: String,
    val authStateJson: String,
    val actualRole: String,
    val effectiveRole: String,
    val activeSessionUserId: String,
    val currentFaculty: String,
    val persistentStateJson: String,
    val examPortalToken: String = "",
    val examPortalStudentJson: String = "",
    val protectedClientSessionToken: String = ""
)

class MainActivity : AppCompatActivity() {

    private val httpClient = OkHttpClient.Builder()
        .followRedirects(true)
        .followSslRedirects(true)
        .build()
    private val mainHandler = Handler(Looper.getMainLooper())
    private val prefs by lazy { getSharedPreferences(PREFS_NAME, MODE_PRIVATE) }

    private lateinit var statusBanner: TextView
    private lateinit var securityBanner: TextView
    private lateinit var controlsScroll: View
    private lateinit var webContainer: View
    private lateinit var loginPanel: LinearLayout
    private lateinit var launcherPanel: LinearLayout
    private lateinit var blockedPanel: LinearLayout
    private lateinit var staffPanel: LinearLayout
    private lateinit var emailInput: EditText
    private lateinit var passwordInput: EditText
    private lateinit var loginButton: Button
    private lateinit var userSummary: TextView
    private lateinit var roleBadge: TextView
    private lateinit var sessionSummary: TextView
    private lateinit var policySummary: TextView
    private lateinit var openLmsButton: Button
    private lateinit var openExamPortalButton: Button
    private lateinit var systemCheckButton: Button
    private lateinit var clearCacheButton: Button
    private lateinit var refreshSessionButton: Button
    private lateinit var logoutButton: Button
    private lateinit var staffUrlInput: EditText
    private lateinit var staffOpenUrlButton: Button
    private lateinit var configSummary: TextView
    private lateinit var staffDiagnosticsSummary: TextView
    private lateinit var blockedMessage: TextView
    private lateinit var webView: WebView

    private var appConfig: AppConfig = AppConfig.default()
    private var portalSession: PortalSessionState? = null
    private var pendingOpenTarget: PendingOpenTarget? = null
    private var pendingLaunch: PendingLaunch? = null
    private var protectedLaunch: ProtectedLaunchState? = null
    private var examPortalAuth: ExamPortalAuthState? = null
    private var activeWebMode: WebMode = WebMode.NONE
    private var activeBootstrap: BrowserBootstrap? = null
    private var activeBootstrapTargetUrl: String = ""
    private var bootstrapApplied: Boolean = false
    private var currentPageTitle: String = ""
    private var activeSecurityIssues: List<String> = emptyList()
    private var heartbeatRunnable: Runnable? = null
    private var pollRunnable: Runnable? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
        setContentView(R.layout.activity_main)

        bindViews()
        loadRuntimeConfig()
        loadSavedState()
        applyIntentOverrides(intent?.data)
        setupWebView()
        setupHandlers()
        refreshSecuritySummary()
        showLoadingState("Validating saved session...")
        handleIncomingIntent(intent)
        restorePortalSessionOrShowLogin()
    }

    override fun onNewIntent(intent: android.content.Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        applyIntentOverrides(intent?.data)
        handleIncomingIntent(intent)
    }

    override fun onResume() {
        super.onResume()
        refreshSecuritySummary()
        if (portalSession != null) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
        if (protectedLaunch != null && activeWebMode == WebMode.PROTECTED) {
            startProtectedTimers()
            sendProtectedHeartbeat()
        }
    }

    override fun onPause() {
        super.onPause()
        if (protectedLaunch?.policy?.focusProtection == true && protectedLaunch != null && activeWebMode == WebMode.PROTECTED) {
            reportProtectedEvent(
                event = "violation_focus_lost",
                note = "Student left the protected Android app."
            )
        }
        stopProtectedTimers(preserveState = true)
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (!hasFocus && protectedLaunch?.policy?.focusProtection == true && protectedLaunch != null && activeWebMode == WebMode.PROTECTED) {
            reportProtectedEvent(
                event = "violation_focus_lost",
                note = "Student left the protected Android app."
            )
        }
    }

    override fun onBackPressed() {
        when {
            protectedLaunch != null && activeWebMode == WebMode.PROTECTED -> {
                reportProtectedEvent(
                    event = "security_violation",
                    note = "Student attempted to leave the protected session."
                )
            }
            activeWebMode == WebMode.LMS && webView.canGoBack() -> {
                webView.goBack()
            }
            activeWebMode == WebMode.LMS -> {
                showLauncherState("Returned from the web view.")
            }
            portalSession != null -> {
                showLauncherState()
            }
            else -> {
                super.onBackPressed()
            }
        }
    }

    override fun onDestroy() {
        stopProtectedTimers(preserveState = false)
        super.onDestroy()
    }

    private fun bindViews() {
        statusBanner = findViewById(R.id.status_banner)
        securityBanner = findViewById(R.id.security_banner)
        controlsScroll = findViewById(R.id.controls_scroll)
        webContainer = findViewById(R.id.web_container)
        loginPanel = findViewById(R.id.login_panel)
        launcherPanel = findViewById(R.id.launcher_panel)
        blockedPanel = findViewById(R.id.blocked_panel)
        staffPanel = findViewById(R.id.staff_panel)
        emailInput = findViewById(R.id.email_input)
        passwordInput = findViewById(R.id.password_input)
        loginButton = findViewById(R.id.login_button)
        userSummary = findViewById(R.id.user_summary)
        roleBadge = findViewById(R.id.role_badge)
        sessionSummary = findViewById(R.id.session_summary)
        policySummary = findViewById(R.id.policy_summary)
        openLmsButton = findViewById(R.id.open_lms_button)
        openExamPortalButton = findViewById(R.id.open_exam_portal_button)
        systemCheckButton = findViewById(R.id.system_check_button)
        clearCacheButton = findViewById(R.id.clear_cache_button)
        refreshSessionButton = findViewById(R.id.refresh_session_button)
        logoutButton = findViewById(R.id.logout_button)
        staffUrlInput = findViewById(R.id.staff_url_input)
        staffOpenUrlButton = findViewById(R.id.staff_open_url_button)
        configSummary = findViewById(R.id.config_summary)
        staffDiagnosticsSummary = findViewById(R.id.staff_diagnostics_summary)
        blockedMessage = findViewById(R.id.blocked_message)
        webView = findViewById(R.id.webview)
    }

    private fun loadRuntimeConfig() {
        val assetConfig = try {
            assets.open("config.json").bufferedReader().use { it.readText() }
        } catch (_: Exception) {
            ""
        }
        val persisted = AppConfig.fromJson(prefs.getString(KEY_CONFIG_JSON, null))
        val asset = AppConfig.fromAsset(assetConfig)
        appConfig = (persisted?.mergedWith(asset) ?: asset).normalized()
        persistConfig(appConfig)
        updateConfigSummary()
        if (staffUrlInput.text.isNullOrBlank()) {
            staffUrlInput.setText(appConfig.quizUrl.ifBlank { appConfig.appUrl })
        }
    }

    private fun loadSavedState() {
        portalSession = PortalSessionState.fromPrefs(
            prefs.getString(KEY_PORTAL_SESSION_JSON, null),
            prefs.getString(KEY_PORTAL_SESSION_TOKEN, null)
        )
        pendingOpenTarget = PendingOpenTarget.fromPrefs(prefs.getString(KEY_PENDING_OPEN_TARGET_JSON, null))
        pendingLaunch = PendingLaunch.fromPrefs(prefs.getString(KEY_PENDING_LAUNCH_JSON, null))
        protectedLaunch = ProtectedLaunchState.fromPrefs(prefs.getString(KEY_PROTECTED_LAUNCH_JSON, null))
        examPortalAuth = ExamPortalAuthState.fromPrefs(
            prefs.getString(KEY_EXAM_PORTAL_TOKEN, null)?.let { token ->
                if (token.isBlank()) null else JSONObject().apply {
                    put("token", token)
                    put("studentJson", prefs.getString(KEY_EXAM_PORTAL_STUDENT_JSON, null).orEmpty())
                }.toString()
            }
        )
    }

    private fun isApprovedConfigUrl(value: String): Boolean {
        return try {
            val url = URL(value.trim())
            val protocol = url.protocol.lowercase()
            val localHttp = protocol == "http" && url.host.lowercase() in setOf("127.0.0.1", "localhost", "10.0.2.2")
            if (!url.toURI().userInfo.isNullOrBlank()) return false
            (protocol == "https" || (BuildConfig.DEBUG && localHttp) || localHttp)
                && isProtectedModeHostAllowed(url.host, appConfig.allowedDomains)
        } catch (_: Exception) {
            false
        }
    }

    private fun applyIntentOverrides(uri: Uri?) {
        if (uri == null || uri.scheme != "anticheat") return
        val appUrl = uri.getQueryParameter("appUrl").orEmpty().trim()
        val backendUrl = uri.getQueryParameter("backendUrl").orEmpty().trim()
        val quizUrl = uri.getQueryParameter("quizUrl").orEmpty().trim()
        val examPortalUrl = uri.getQueryParameter("examPortalUrl").orEmpty().trim()
        val reportingUrl = uri.getQueryParameter("reportingUrl").orEmpty().trim()
        val heartbeatUrl = uri.getQueryParameter("heartbeatUrl").orEmpty().trim()
        val override = AppConfig(
            appUrl = appUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            backendUrl = backendUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            quizUrl = quizUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            examPortalUrl = examPortalUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            reportingUrl = reportingUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            heartbeatUrl = heartbeatUrl.takeIf { isApprovedConfigUrl(it) }.orEmpty(),
            allowedDomains = emptyList()
        )
        val hasOverride = listOf(
            override.appUrl,
            override.backendUrl,
            override.quizUrl,
            override.examPortalUrl,
            override.reportingUrl,
            override.heartbeatUrl
        ).any { it.isNotBlank() } || override.allowedDomains.isNotEmpty()
        if (!hasOverride) return
        appConfig = appConfig.mergedWith(override)
        persistConfig(appConfig)
        updateConfigSummary()
    }

    private fun handleIncomingIntent(intent: android.content.Intent?) {
        val uri = intent?.data ?: return
        if (uri.scheme != "anticheat") return
        when (uri.host.orEmpty().lowercase()) {
            "launch" -> {
                val ticket = uri.getQueryParameter("ticket").orEmpty().trim()
                if (ticket.isBlank()) return
                savePendingLaunch(
                    PendingLaunch(
                        ticket = ticket,
                            backendUrl = uri.getQueryParameter("backendUrl").orEmpty().trim()
                                .takeIf { isApprovedConfigUrl(it) }
                                ?: appConfig.backendUrl,
                            appUrl = uri.getQueryParameter("appUrl").orEmpty().trim()
                                .takeIf { isApprovedConfigUrl(it) }
                                ?: appConfig.appUrl,
                            quizUrl = uri.getQueryParameter("quizUrl").orEmpty().trim()
                                .takeIf { isApprovedConfigUrl(it) }
                                ?: appConfig.quizUrl,
                        source = uri.getQueryParameter("source").orEmpty(),
                        platform = uri.getQueryParameter("platform").orEmpty()
                    )
                )
                if (portalSession != null) {
                    redeemPendingLaunchIfPossible()
                } else {
                    showLoginState("A protected launch is waiting for sign-in.")
                }
            }
            "open" -> {
                val screen = uri.getQueryParameter("screen").orEmpty().trim().lowercase()
                val launchUrl = uri.getQueryParameter("launchUrl").orEmpty().trim()
                if (launchUrl.isNotBlank()) {
                    savePendingOpenTarget(
                        PendingOpenTarget(
                            targetUrl = launchUrl,
                            source = uri.getQueryParameter("source").orEmpty(),
                            platform = uri.getQueryParameter("platform").orEmpty()
                        )
                    )
                }
                when {
                    screen == "lms" -> {
                        if (portalSession != null) {
                            if (!openPendingOpenTargetIfPossible()) {
                                openLms()
                            }
                        } else {
                            showLoginState("Sign in to continue.")
                        }
                    }
                    screen == "login" -> showLoginState("Sign in with your university account.")
                    else -> {
                        if (portalSession != null) {
                            if (!openPendingOpenTargetIfPossible()) {
                                showLauncherState("Anti-Cheat App ready.")
                            }
                        } else {
                            showLoginState("Sign in with your university account.")
                        }
                    }
                }
            }
        }
    }

    private fun setupHandlers() {
        loginButton.setOnClickListener { performLogin() }
        passwordInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                performLogin()
                true
            } else {
                false
            }
        }
        openLmsButton.setOnClickListener { openLms() }
        openExamPortalButton.setOnClickListener { openExamPortal() }
        systemCheckButton.setOnClickListener { runSystemCheck() }
        clearCacheButton.setOnClickListener { clearWebBrowserData() }
        refreshSessionButton.setOnClickListener { refreshSession() }
        logoutButton.setOnClickListener { performLogout() }
        staffOpenUrlButton.setOnClickListener { openCustomUrl() }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            cacheMode = WebSettings.LOAD_NO_CACHE
            userAgentString = "AntiCheatBrowser/Android"
        }
        CookieManager.getInstance().setAcceptCookie(true)
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true)
        webView.setOnLongClickListener {
            if (protectedLaunch?.policy?.inputBlocking == true) {
                reportProtectedEvent(
                    event = "security_violation",
                    note = "Student attempted long-press interactions inside the protected session."
                )
                true
            } else {
                false
            }
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val target = request?.url ?: return false
                return handleNavigationRequest(target)
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                currentPageTitle = view?.title?.trim().orEmpty()
                maybeApplyBrowserBootstrap(url.orEmpty())
                updateWebModeBanner()
            }
        }
    }

    private fun handleNavigationRequest(url: Uri): Boolean {
        val scheme = url.scheme.orEmpty().lowercase()
        if (scheme == "anticheat") {
            handleAntiCheatScheme(url)
            return true
        }
        if (scheme != "http" && scheme != "https") {
            if (protectedLaunch != null && activeWebMode == WebMode.PROTECTED) {
                reportProtectedEvent(
                    event = "security_violation",
                    note = "Blocked navigation to unsupported scheme: $url"
                )
            } else {
                showStatus("Only web links can be opened here.", Tone.WARNING)
            }
            return true
        }
        val localHttp = scheme == "http" && url.host.orEmpty().lowercase() in setOf("127.0.0.1", "localhost", "10.0.2.2")
        if (scheme != "https" && !(BuildConfig.DEBUG && localHttp) && !localHttp) {
            showStatus("Secure HTTPS navigation is required.", Tone.WARNING)
            return true
        }
        if (!isProtectedModeHostAllowed(url.host.orEmpty(), getProtectedAllowedDomains())) {
            showStatus("Navigation outside the university LMS is blocked.", Tone.WARNING)
            return true
        }
        if (protectedLaunch != null && activeWebMode == WebMode.PROTECTED && protectedLaunch?.policy?.navigationProtection == true) {
            val host = url.host.orEmpty().lowercase()
            val allowed = getProtectedAllowedDomains().let { domains ->
                isProtectedModeHostAllowed(host, domains)
            }
            if (!allowed) {
                reportProtectedEvent(
                    event = "security_violation",
                    note = "Attempted unauthorized navigation to: $url"
                )
                showSecurityWarning("Navigation blocked by anti-cheat policy.")
                return true
            }
        }
        return false
    }

    private fun handleAntiCheatScheme(uri: Uri) {
        when (uri.host.orEmpty().lowercase()) {
            "launch" -> {
                val ticket = uri.getQueryParameter("ticket").orEmpty().trim()
                if (ticket.isBlank()) return
                savePendingLaunch(
                    PendingLaunch(
                        ticket = ticket,
                        backendUrl = uri.getQueryParameter("backendUrl").orEmpty().trim()
                            .takeIf { isApprovedConfigUrl(it) }
                            ?: appConfig.backendUrl,
                        appUrl = uri.getQueryParameter("appUrl").orEmpty().trim()
                            .takeIf { isApprovedConfigUrl(it) }
                            ?: appConfig.appUrl,
                        quizUrl = uri.getQueryParameter("quizUrl").orEmpty().trim()
                            .takeIf { isApprovedConfigUrl(it) }
                            ?: appConfig.quizUrl,
                        source = uri.getQueryParameter("source").orEmpty(),
                        platform = uri.getQueryParameter("platform").orEmpty()
                    )
                )
                if (portalSession != null) {
                    redeemPendingLaunchIfPossible()
                } else {
                    showLoginState("A protected launch is waiting for sign-in.")
                }
            }
            "open" -> {
                val screen = uri.getQueryParameter("screen").orEmpty().trim().lowercase()
                val launchUrl = uri.getQueryParameter("launchUrl").orEmpty().trim()
                if (launchUrl.isNotBlank()) {
                    savePendingOpenTarget(
                        PendingOpenTarget(
                            targetUrl = launchUrl,
                            source = uri.getQueryParameter("source").orEmpty(),
                            platform = uri.getQueryParameter("platform").orEmpty()
                        )
                    )
                }
                when {
                    screen == "lms" -> {
                        if (portalSession != null) {
                            if (!openPendingOpenTargetIfPossible()) {
                                openLms()
                            }
                        } else {
                            showLoginState("Sign in to continue.")
                        }
                    }
                    screen == "login" -> showLoginState("Sign in with your university account.")
                    else -> {
                        if (portalSession != null) {
                            if (!openPendingOpenTargetIfPossible()) {
                                showLauncherState("Anti-Cheat App ready.")
                            }
                        } else {
                            showLoginState("Sign in with your university account.")
                        }
                    }
                }
            }
        }
    }

    private fun performLogin() {
        val email = emailInput.text?.toString().orEmpty().trim()
        val password = passwordInput.text?.toString().orEmpty()
        if (email.isBlank() || password.isBlank()) {
            showStatus("Enter your university email and password.", Tone.WARNING)
            return
        }
        showStatus("Signing in...", Tone.INFO)
        loginButton.isEnabled = false

        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
        }.toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("${appConfig.backendUrl.removeSuffix("/")}/api/portal/session/login")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    loginButton.isEnabled = true
                    showStatus("Sign-in failed. Check the backend and try again.", Tone.DANGER)
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val raw = response.body?.string().orEmpty()
                    if (!response.isSuccessful || raw.isBlank()) {
                        runOnUiThread {
                            loginButton.isEnabled = true
                            showStatus("Invalid email or password.", Tone.DANGER)
                        }
                        return
                    }
                    val payload = try {
                        JSONObject(raw)
                    } catch (_: Exception) {
                        null
                    }
                    val session = payload?.optJSONObject("session")
                    val account = payload?.optJSONObject("account")
                    val token = session?.optString("token").orEmpty()
                    val state = PortalSessionState.fromLoginResponse(account, session, token)
                    runOnUiThread {
                        loginButton.isEnabled = true
                        if (state == null) {
                            showStatus("Sign-in could not be completed.", Tone.DANGER)
                            return@runOnUiThread
                        }
                        portalSession = state
                        persistPortalSession(state)
                        clearPasswordField()
                        showLauncherState("Signed in as ${state.account.nameEn.ifBlank { state.account.name }}.")
                        if (!restoreProtectedLaunchIfPossible()) {
                            if (!redeemPendingLaunchIfPossible()) {
                                openPendingOpenTargetIfPossible()
                            }
                        }
                    }
                }
            }
        })
    }

    private fun refreshSession() {
        val token = portalSession?.token ?: prefs.getString(KEY_PORTAL_SESSION_TOKEN, "").orEmpty()
        if (token.isBlank()) {
            showLoginState("Sign in to continue.")
            return
        }
        showStatus("Refreshing portal session...", Tone.INFO)
        validatePortalSession(token) { validated ->
            if (validated == null) {
                clearPortalSessionStorage()
                showLoginState("Your saved session expired. Sign in again.")
                return@validatePortalSession
            }
            portalSession = validated
            persistPortalSession(validated)
            showLauncherState("Session refreshed.")
            if (!restoreProtectedLaunchIfPossible()) {
                if (!redeemPendingLaunchIfPossible()) {
                    openPendingOpenTargetIfPossible()
                }
            }
        }
    }

    private fun validatePortalSession(token: String, onComplete: (PortalSessionState?) -> Unit) {
        val normalizedToken = token.trim()
        if (normalizedToken.isBlank()) {
            onComplete(null)
            return
        }
        val request = Request.Builder()
            .url("${appConfig.backendUrl.removeSuffix("/")}/api/portal/session")
            .get()
            .addHeader("X-Portal-Session", normalizedToken)
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { onComplete(null) }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val raw = response.body?.string().orEmpty()
                    if (!response.isSuccessful || raw.isBlank()) {
                        runOnUiThread { onComplete(null) }
                        return
                    }
                    val payload = try {
                        JSONObject(raw)
                    } catch (_: Exception) {
                        null
                    }
                    val state = PortalSessionState.fromLoginResponse(
                        payload?.optJSONObject("account"),
                        payload?.optJSONObject("session"),
                        normalizedToken
                    )
                    runOnUiThread { onComplete(state) }
                }
            }
        })
    }

    private fun performLogout() {
        val token = portalSession?.token ?: prefs.getString(KEY_PORTAL_SESSION_TOKEN, "").orEmpty()
        if (token.isNotBlank()) {
            KiuMobilePushRegistration.unregister(this)
            val request = Request.Builder()
                .url("${appConfig.backendUrl.removeSuffix("/")}/api/portal/session/logout")
                .post("{}".toRequestBody("application/json".toMediaType()))
                .addHeader("Content-Type", "application/json")
                .addHeader("X-Portal-Session", token)
                .build()
            httpClient.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {}
                override fun onResponse(call: Call, response: Response) { response.close() }
            })
        }
        clearAllState()
        showLoginState("Signed out.")
    }

    private fun openLms() {
        val session = portalSession ?: run {
            showLoginState("Sign in to open the LMS.")
            return
        }
        val target = appConfig.quizUrl.ifBlank { "${appConfig.appUrl.removeSuffix("/")}/lms.html" }
        showStatus("Opening LMS...", Tone.INFO)
        loadWebPage(
            targetUrl = target,
            mode = WebMode.LMS,
            bootstrap = buildBrowserBootstrap(examPortalState = null, protectedToken = ""),
            explicitTitle = "LMS"
        )
        showStatus("Opening LMS for ${session.account.nameEn.ifBlank { session.account.name }}.", Tone.INFO)
    }

    private fun openExamPortal() {
        val session = portalSession ?: run {
            showLoginState("Sign in to open the exam portal.")
            return
        }
        if (!canUseStudentActions(session)) {
            showStatus("Exam portal access is available for student accounts only.", Tone.WARNING)
            return
        }
        showStatus("Preparing exam portal session...", Tone.INFO)
        val body = JSONObject().apply {
            put("email", session.account.email.ifBlank { session.account.id })
            put("studentId", session.account.id)
        }.toString().toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url("${appConfig.backendUrl.removeSuffix("/")}/api/exam-portal/auth")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { showStatus("Exam portal sign-in failed.", Tone.DANGER) }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val raw = response.body?.string().orEmpty()
                    if (!response.isSuccessful || raw.isBlank()) {
                        runOnUiThread { showStatus("Exam portal could not be opened.", Tone.DANGER) }
                        return
                    }
                    val payload = try {
                        JSONObject(raw)
                    } catch (_: Exception) {
                        null
                    }
                    val auth = payload?.let { ExamPortalAuthState.fromResponse(it) }
                    if (auth == null) {
                        runOnUiThread { showStatus("Exam portal session could not be created.", Tone.DANGER) }
                        return
                    }
                    runOnUiThread {
                        examPortalAuth = auth
                        persistExamPortalState(auth)
                        val target = appConfig.examPortalUrl.ifBlank { "${appConfig.appUrl.removeSuffix("/")}/exam-portal.html" }
                        loadWebPage(
                            targetUrl = target,
                            mode = WebMode.EXAM_PORTAL,
                            bootstrap = buildBrowserBootstrap(examPortalState = auth, protectedToken = ""),
                            explicitTitle = "Exam Portal"
                        )
                        showStatus("Opening exam portal.", Tone.SUCCESS)
                    }
                }
            }
        })
    }

    private fun openCustomUrl() {
        val session = portalSession ?: run {
            showLoginState("Sign in to use staff tools.")
            return
        }
        if (!isStaffRole(session.actualRole)) {
            showStatus("Custom URLs are available to staff accounts only.", Tone.WARNING)
            return
        }
        val raw = staffUrlInput.text?.toString().orEmpty().trim()
        if (raw.isBlank()) {
            showStatus("Enter a URL to open.", Tone.WARNING)
            return
        }
        val target = sanitizeBrowserUrl(raw)
        if (target.isBlank()) {
            showStatus("Only http and https URLs can be opened.", Tone.DANGER)
            return
        }
        showStatus("Opening staff URL...", Tone.INFO)
        loadWebPage(
            targetUrl = target,
            mode = WebMode.LMS,
            bootstrap = buildBrowserBootstrap(examPortalState = null, protectedToken = ""),
            explicitTitle = "Staff URL"
        )
    }

    private fun runSystemCheck() {
        refreshSecuritySummary()
        if (activeSecurityIssues.isEmpty()) {
            showStatus("System check passed.", Tone.SUCCESS)
        } else {
            showStatus("System check found security issues.", Tone.WARNING)
        }
    }

    private fun clearWebBrowserData() {
        try {
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
        } catch (_: Exception) {}
        webView.clearCache(true)
        webView.clearHistory()
        showStatus("Browser cache cleared.", Tone.SUCCESS)
    }

    private fun redeemPendingLaunchIfPossible(): Boolean {
        val launch = pendingLaunch ?: loadPendingLaunch() ?: return false
        val session = portalSession ?: return false
        if (session.token.isBlank()) return false
        if (!isApprovedConfigUrl(launch.backendUrl)) {
            showStatus("Protected launch backend is not approved.", Tone.DANGER)
            savePendingLaunch(null)
            return false
        }
        showStatus("Redeeming protected launch ticket...", Tone.INFO)
        val body = JSONObject().apply { put("ticket", launch.ticket) }.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("${launch.backendUrl.removeSuffix("/")}/api/protected-client/redeem-launch")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .build()

        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread { showStatus("Protected launch could not be redeemed.", Tone.DANGER) }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val raw = response.body?.string().orEmpty()
                    if (!response.isSuccessful || raw.isBlank()) {
                        runOnUiThread { showStatus("Protected launch ticket was rejected.", Tone.DANGER) }
                        return
                    }
                    val payload = try {
                        JSONObject(raw)
                    } catch (_: Exception) {
                        null
                    }
                    val state = payload?.let { ProtectedLaunchState.fromLaunchResponse(it) }
                    runOnUiThread {
                        if (state == null) {
                            showStatus("Protected launch payload was incomplete.", Tone.DANGER)
                            return@runOnUiThread
                        }
                        protectedLaunch = state
                        persistProtectedLaunchState(state)
                        savePendingLaunch(null)
                        clearProtectedClientToken()
                        openProtectedLaunch(state)
                    }
                }
            }
        })
        return true
    }

    private fun restoreProtectedLaunchIfPossible(): Boolean {
        val saved = loadProtectedLaunchState() ?: return false
        val session = portalSession ?: return false
        if (saved.clientSessionToken.isBlank()) return false
        protectedLaunch = saved
        persistProtectedLaunchState(saved)
        openProtectedLaunch(saved, restore = true)
        showStatus("Restored protected session for ${session.account.nameEn.ifBlank { session.account.name }}.", Tone.INFO)
        return true
    }

    private fun openProtectedLaunch(state: ProtectedLaunchState, restore: Boolean = false) {
        protectedLaunch = state
        persistProtectedLaunchState(state)
        val bootstrap = buildBrowserBootstrap(
            examPortalState = null,
            protectedToken = state.clientSessionToken
        )
        loadWebPage(
            targetUrl = state.quizSessionUrl,
            mode = WebMode.PROTECTED,
            bootstrap = bootstrap,
            explicitTitle = state.quizTitle.ifBlank { "Protected Quiz" }
        )
        startProtectedTimers()
        if (!restore) {
            sendProtectedHeartbeat()
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        if (state.policy.clipboardClearing) {
            clearClipboard()
        }
        if (state.blocked) {
            showBlockedState("This protected session is blocked by staff.")
        } else {
            showProtectedState()
        }
    }

    private fun loadWebPage(
        targetUrl: String,
        mode: WebMode,
        bootstrap: BrowserBootstrap?,
        explicitTitle: String = ""
    ) {
        val sanitized = sanitizeBrowserUrl(targetUrl)
        if (sanitized.isBlank()) {
            showStatus("Invalid web address.", Tone.DANGER)
            return
        }
        activeWebMode = mode
        activeBootstrap = bootstrap
        activeBootstrapTargetUrl = sanitized
        bootstrapApplied = false
        currentPageTitle = explicitTitle
        showScreen(ActiveScreen.WEB)
        webView.stopLoading()
        webView.loadUrl(sanitized)
    }

    private fun maybeApplyBrowserBootstrap(currentUrl: String) {
        val bootstrap = activeBootstrap ?: return
        val target = activeBootstrapTargetUrl
        if (target.isBlank()) return
        if (sanitizeBrowserUrl(currentUrl) != target) return
        if (bootstrapApplied) {
            clearBootstrapState()
            return
        }
        bootstrapApplied = true
        webView.evaluateJavascript(buildBootstrapScript(bootstrap), null)
        webView.post { webView.reload() }
    }

    private fun clearBootstrapState() {
        activeBootstrap = null
        activeBootstrapTargetUrl = ""
        bootstrapApplied = false
    }

    private fun buildBootstrapScript(bootstrap: BrowserBootstrap): String {
        val examPortalStudent = bootstrap.examPortalStudentJson.ifBlank { "{}" }
        val protectedToken = bootstrap.protectedClientSessionToken.trim()
        return """
            (function () {
                try {
                    var portalToken = ${jsQuote(bootstrap.portalToken)};
                    var backendUrl = ${jsQuote(bootstrap.backendUrl)};
                    var authState = ${jsQuote(bootstrap.authStateJson)};
                    var role = ${jsQuote(bootstrap.effectiveRole.ifBlank { bootstrap.actualRole.ifBlank { "student" } })};
                    var faculty = ${jsQuote(bootstrap.currentFaculty)};
                    var activeSessionUserId = ${jsQuote(bootstrap.activeSessionUserId)};
                    var persistentState = ${jsQuote(bootstrap.persistentStateJson)};
                    var examPortalToken = ${jsQuote(bootstrap.examPortalToken)};
                    var examPortalStudent = ${jsQuote(examPortalStudent)};
                    var protectedToken = ${jsQuote(protectedToken)};

                    localStorage.setItem('KIU_PORTAL_BACKEND_URL', backendUrl);
                    if (portalToken) localStorage.setItem('KIU_PORTAL_SESSION_TOKEN', portalToken);
                    else localStorage.removeItem('KIU_PORTAL_SESSION_TOKEN');
                    localStorage.setItem('KIU_AUTH_STATE', authState);
                    localStorage.setItem('currentUserRole', role);
                    if (faculty) {
                        localStorage.setItem('KIU_FACULTY_CONTEXT', faculty);
                        localStorage.setItem('currentFaculty', faculty);
                    } else {
                        localStorage.removeItem('KIU_FACULTY_CONTEXT');
                        localStorage.removeItem('currentFaculty');
                    }
                    localStorage.setItem('KIU_PERSISTENT_STATE', persistentState);
                    if (activeSessionUserId) sessionStorage.setItem('KIU_ACTIVE_SESSION_USER_ID', activeSessionUserId);
                    else sessionStorage.removeItem('KIU_ACTIVE_SESSION_USER_ID');
                    if (examPortalToken) {
                        localStorage.setItem('KIU_EXAM_PORTAL_TOKEN', examPortalToken);
                        sessionStorage.setItem('KIU_EXAM_PORTAL_TOKEN', examPortalToken);
                    } else {
                        localStorage.removeItem('KIU_EXAM_PORTAL_TOKEN');
                        sessionStorage.removeItem('KIU_EXAM_PORTAL_TOKEN');
                    }
                    if (examPortalStudent) {
                        localStorage.setItem('KIU_EXAM_PORTAL_STUDENT', examPortalStudent);
                        sessionStorage.setItem('KIU_EXAM_PORTAL_STUDENT', examPortalStudent);
                    } else {
                        localStorage.removeItem('KIU_EXAM_PORTAL_STUDENT');
                        sessionStorage.removeItem('KIU_EXAM_PORTAL_STUDENT');
                    }
                    if (protectedToken) {
                        localStorage.setItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN', protectedToken);
                        sessionStorage.setItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN', protectedToken);
                    } else {
                        localStorage.removeItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN');
                        sessionStorage.removeItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN');
                    }
                    sessionStorage.removeItem('KIU_SESSION_EXPIRED');
                } catch (error) {}
            })();
        """.trimIndent()
    }

    private fun startProtectedTimers() {
        stopProtectedTimers(preserveState = true)
        val launch = protectedLaunch ?: return
        val heartbeatMs = clampInterval(launch.policy.heartbeatMs, 2000L, 1000L, 60000L)
        val pollMs = clampInterval(launch.policy.processScanMs, 2500L, 1000L, 60000L)

        heartbeatRunnable = object : Runnable {
            override fun run() {
                if (protectedLaunch == null || activeWebMode != WebMode.PROTECTED) return
                sendProtectedHeartbeat()
                mainHandler.postDelayed(this, heartbeatMs)
            }
        }
        pollRunnable = object : Runnable {
            override fun run() {
                if (protectedLaunch == null || activeWebMode != WebMode.PROTECTED) return
                refreshProtectedAttemptState()
                mainHandler.postDelayed(this, pollMs)
            }
        }
        heartbeatRunnable?.let { mainHandler.post(it) }
        pollRunnable?.let { mainHandler.post(it) }
    }

    private fun stopProtectedTimers(preserveState: Boolean) {
        heartbeatRunnable?.let { mainHandler.removeCallbacks(it) }
        pollRunnable?.let { mainHandler.removeCallbacks(it) }
        heartbeatRunnable = null
        pollRunnable = null
        if (!preserveState && protectedLaunch != null) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    private fun sendProtectedHeartbeat() {
        val launch = protectedLaunch ?: return
        val body = JSONObject().apply {
            put("courseId", launch.courseId)
            put("quizId", launch.quizId)
            put("clientSessionToken", launch.clientSessionToken)
            put("clientType", "mobile-app")
            put("securityLevel", "mobile-limited")
            put("studentId", launch.studentId)
            put("studentName", launch.studentName)
            put("event", "heartbeat")
            put("status", "active")
            put("details", JSONObject().apply {
                put("platform", "Android")
                put("note", "Active")
            })
        }.toString().toRequestBody("application/json".toMediaType())
        val url = launch.heartbeatUrl.ifBlank {
            "${appConfig.backendUrl.removeSuffix("/")}/api/protected-quizzes/${launch.quizId}/heartbeat?courseId=${encodeURIComponent(launch.courseId)}"
        }
        if (!isApprovedConfigUrl(url)) return
        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("X-Protected-Client-Session", launch.clientSessionToken)
            .build()
        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {}
            override fun onResponse(call: Call, response: Response) { response.close() }
        })
    }

    private fun reportProtectedEvent(event: String, note: String, status: String? = null) {
        val launch = protectedLaunch ?: return
        val url = launch.reportingUrl.ifBlank {
            "${appConfig.backendUrl.removeSuffix("/")}/api/protected-quizzes/${launch.quizId}/events?courseId=${encodeURIComponent(launch.courseId)}"
        }
        if (!isApprovedConfigUrl(url)) return
        val body = JSONObject().apply {
            put("courseId", launch.courseId)
            put("quizId", launch.quizId)
            put("studentId", launch.studentId)
            put("studentName", launch.studentName)
            put("clientSessionToken", launch.clientSessionToken)
            put("clientType", "mobile-app")
            put("securityLevel", "mobile-limited")
            put("event", event)
            put("note", note)
            put("details", JSONObject().apply {
                put("platform", "Android")
                put("note", note)
            })
            if (!status.isNullOrBlank()) put("status", status)
            put("timestamp", System.currentTimeMillis())
        }.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url(url)
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("X-Protected-Client-Session", launch.clientSessionToken)
            .build()
        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {}
            override fun onResponse(call: Call, response: Response) { response.close() }
        })
    }

    private fun refreshProtectedAttemptState() {
        val launch = protectedLaunch ?: return
        val request = Request.Builder()
            .url("${appConfig.backendUrl.removeSuffix("/")}/api/protected-quizzes/${launch.quizId}/attempt?courseId=${encodeURIComponent(launch.courseId)}")
            .get()
            .addHeader("X-Protected-Client-Session", launch.clientSessionToken)
            .build()
        httpClient.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                runOnUiThread {
                    showStatus("Protected session disconnected from the backend.", Tone.WARNING)
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    val raw = response.body?.string().orEmpty()
                    if (response.code == 403 || response.code == 404) {
                        runOnUiThread { handleProtectedSessionRevoked("Protected session expired or was revoked.") }
                        return
                    }
                    if (!response.isSuccessful || raw.isBlank()) {
                        runOnUiThread { showStatus("Protected session state could not be refreshed.", Tone.WARNING) }
                        return
                    }
                    val payload = try {
                        JSONObject(raw)
                    } catch (_: Exception) {
                        null
                    }
                    val attempt = payload?.optJSONObject("attempt") ?: payload
                    val updatedPolicy = payload?.optJSONObject("quiz")?.optJSONObject("antiCheatPolicy")?.let { AntiCheatPolicy.fromJson(it) }
                        ?: payload?.optJSONObject("antiCheatPolicy")?.let { AntiCheatPolicy.fromJson(it) }
                        ?: protectedLaunch?.policy
                    if (attempt == null) return
                    val previousBlocked = protectedLaunch?.blocked == true
                    val previousStatus = protectedLaunch?.attemptStatus.orEmpty()
                    runOnUiThread {
                        protectedLaunch = protectedLaunch?.copy(
                            policy = updatedPolicy ?: protectedLaunch?.policy ?: AntiCheatPolicy.strict(),
                            attemptStatus = attempt.optString("status").trim().ifBlank { protectedLaunch?.attemptStatus.orEmpty() },
                            blocked = attempt.optBoolean("blocked", false),
                            antiCheatConnected = attempt.optBoolean("antiCheatConnected", true),
                            warningCount = attempt.optInt("warningCount", 0),
                            violationCount = attempt.optInt("violationCount", 0),
                            lastHeartbeatAt = attempt.optString("lastHeartbeatAt").trim(),
                            disconnectAccumulatedMs = attempt.optLong("disconnectAccumulatedMs", 0L),
                            overrideStatus = attempt.optString("overrideStatus").trim()
                        )
                        protectedLaunch?.let { persistProtectedLaunchState(it) }
                        policySummary.text = protectedLaunch?.policy?.summaryLine() ?: "No active protected policy."
                        updateWebModeBanner()
                        when {
                            isTerminalAttemptStatus(protectedLaunch?.attemptStatus.orEmpty()) -> {
                                completeProtectedSession("Protected session finished with status ${protectedLaunch?.attemptStatus.orEmpty()}.")
                            }
                            protectedLaunch?.blocked == true || protectedLaunch?.attemptStatus.orEmpty() == "blocked" -> {
                                showBlockedState("This protected session is blocked by staff.")
                            }
                            protectedLaunch?.antiCheatConnected != true -> {
                                showStatus("Protected session is waiting for reconnect approval.", Tone.WARNING)
                            }
                            else -> {
                                if (previousBlocked && protectedLaunch?.blocked == false) {
                                    showStatus("Protected session has been unblocked.", Tone.SUCCESS)
                                } else if (previousStatus != protectedLaunch?.attemptStatus.orEmpty() && protectedLaunch?.attemptStatus.orEmpty().isNotBlank()) {
                                    showStatus("Protected session status: ${protectedLaunch?.attemptStatus.orEmpty()}.", Tone.INFO)
                                }
                                if (activeWebMode != WebMode.PROTECTED) {
                                    openProtectedLaunch(protectedLaunch ?: return@runOnUiThread, restore = true)
                                } else {
                                    showProtectedState()
                                }
                            }
                        }
                    }
                }
            }
        })
    }

    private fun handleProtectedSessionRevoked(message: String) {
        stopProtectedTimers(preserveState = false)
        clearProtectedClientToken()
        protectedLaunch = null
        clearProtectedLaunchState()
        clearBrowserData()
        try {
            webView.loadUrl("about:blank")
        } catch (_: Exception) {}
        showLauncherState(message)
    }

    private fun completeProtectedSession(message: String) {
        stopProtectedTimers(preserveState = false)
        clearProtectedClientToken()
        protectedLaunch = null
        clearProtectedLaunchState()
        clearPendingLaunch()
        clearBrowserData()
        try {
            webView.loadUrl("about:blank")
        } catch (_: Exception) {}
        showLauncherState(message)
    }

    private fun buildBrowserBootstrap(
        examPortalState: ExamPortalAuthState?,
        protectedToken: String
    ): BrowserBootstrap {
        val session = portalSession
        val account = session?.account ?: PortalAccountSummary(
            id = "",
            name = "",
            nameEn = "",
            email = "",
            role = "student",
            faculty = ""
        )
        val actualRole = session?.actualRole.orEmpty()
        val effectiveRole = session?.effectiveRole.orEmpty().ifBlank { actualRole.ifBlank { "student" } }
        val authStateJson = session?.let {
            JSONObject().apply {
                put("id", it.account.id)
                put("name", it.account.name)
                put("nameEn", it.account.nameEn.ifBlank { it.account.name })
                put("avatar", "")
                put("email", it.account.email)
                put("role", it.actualRole)
                put("faculty", it.account.faculty)
            }.toString()
        } ?: "{}"
        val persistentStateJson = session?.let {
            JSONObject().apply {
                put("auth", JSONObject().apply {
                    put("activeUserId", it.activeSessionUserId)
                    put("role", it.actualRole)
                    put("effectiveRole", it.effectiveRole)
                })
            }.toString()
        } ?: "{}"
        return BrowserBootstrap(
            backendUrl = appConfig.backendUrl,
            portalToken = session?.token.orEmpty(),
            authStateJson = authStateJson,
            actualRole = actualRole,
            effectiveRole = effectiveRole,
            activeSessionUserId = session?.activeSessionUserId.orEmpty(),
            currentFaculty = account.faculty,
            persistentStateJson = persistentStateJson,
            examPortalToken = examPortalState?.token.orEmpty(),
            examPortalStudentJson = examPortalState?.studentJson.orEmpty(),
            protectedClientSessionToken = protectedToken
        )
    }

    private fun renderLauncherForSession(session: PortalSessionState?) {
        val active = session ?: return
        val actualRole = active.actualRole.ifBlank { "student" }
        val effectiveRole = active.effectiveRole.ifBlank { actualRole }
        val studentActionsAllowed = canUseStudentActions(active)
        val staffAllowed = isStaffRole(actualRole)

        userSummary.text = buildString {
            append(active.account.nameEn.ifBlank { active.account.name.ifBlank { active.account.email.ifBlank { active.account.id } } })
            if (active.account.email.isNotBlank()) {
                append("\n")
                append(active.account.email)
            }
            append("\nActive user ID: ")
            append(active.activeSessionUserId.ifBlank { active.account.id })
        }
        roleBadge.text = effectiveRole.uppercase()
        sessionSummary.text = buildString {
            append("Actual role: ")
            append(actualRole)
            append("\nEffective role: ")
            append(effectiveRole)
            append("\nFaculty: ")
            append(active.account.faculty.ifBlank { "—" })
        }
        policySummary.text = protectedLaunch?.policy?.summaryLine() ?: "No active protected policy."
        openLmsButton.visibility = View.VISIBLE
        openExamPortalButton.visibility = if (studentActionsAllowed) View.VISIBLE else View.GONE
        systemCheckButton.visibility = View.VISIBLE
        clearCacheButton.visibility = View.VISIBLE
        refreshSessionButton.visibility = View.VISIBLE
        logoutButton.visibility = View.VISIBLE
        staffPanel.visibility = if (staffAllowed) View.VISIBLE else View.GONE
        configSummary.text = buildString {
            append("App URL: ")
            append(appConfig.appUrl)
            append("\nBackend URL: ")
            append(appConfig.backendUrl)
            append("\nQuiz URL: ")
            append(appConfig.quizUrl)
            append("\nExam Portal URL: ")
            append(appConfig.examPortalUrl)
            append("\nAllowed domains: ")
            append(if (appConfig.allowedDomains.isEmpty()) "None" else appConfig.allowedDomains.joinToString(", "))
        }
        staffDiagnosticsSummary.text = buildString {
            append("Security issues: ")
            append(if (activeSecurityIssues.isEmpty()) "None" else activeSecurityIssues.joinToString(" | "))
            append("\nProtected session: ")
            append(protectedLaunch?.quizTitle?.ifBlank { protectedLaunch?.quizId }.orEmpty().ifBlank { "None" })
            append("\nCurrent page: ")
            append(currentPageTitle.ifBlank { "—" })
        }
        if (staffUrlInput.text.isNullOrBlank()) {
            staffUrlInput.setText(appConfig.quizUrl.ifBlank { appConfig.appUrl })
        }
    }

    private fun updateConfigSummary() {
        configSummary.text = buildString {
            append("App URL: ")
            append(appConfig.appUrl)
            append("\nBackend URL: ")
            append(appConfig.backendUrl)
            append("\nQuiz URL: ")
            append(appConfig.quizUrl)
            append("\nExam Portal URL: ")
            append(appConfig.examPortalUrl)
            append("\nAllowed domains: ")
            append(if (appConfig.allowedDomains.isEmpty()) "None" else appConfig.allowedDomains.joinToString(", "))
        }
    }

    private fun updateWebModeBanner() {
        val text = when (activeWebMode) {
            WebMode.PROTECTED -> {
                val title = protectedLaunch?.quizTitle.orEmpty().ifBlank { protectedLaunch?.quizId.orEmpty() }
                val status = protectedLaunch?.attemptStatus.orEmpty().ifBlank { "in-progress" }
                "Protected session: ${title.ifBlank { "Quiz" }} | Status: $status"
            }
            WebMode.EXAM_PORTAL -> "Exam portal session"
            WebMode.LMS -> "LMS session"
            WebMode.NONE -> ""
        }
        if (text.isBlank()) {
            statusBanner.visibility = View.GONE
            return
        }
        statusBanner.visibility = View.VISIBLE
        statusBanner.text = text
        statusBanner.setBackgroundColor(
            when (activeWebMode) {
                WebMode.PROTECTED -> Color.parseColor("#1F2937")
                WebMode.EXAM_PORTAL -> Color.parseColor("#0F172A")
                WebMode.LMS -> Color.parseColor("#102A43")
                else -> Color.parseColor("#111827")
            }
        )
    }

    private fun refreshSecuritySummary() {
        activeSecurityIssues = collectSecurityIssues()
        updateSecurityBanner()
        if (activeSecurityIssues.isNotEmpty()) {
            staffDiagnosticsSummary.text = buildString {
                append("Security issues: ")
                append(activeSecurityIssues.joinToString(" | "))
            }
        }
    }

    private fun collectSecurityIssues(): List<String> {
        val issues = mutableListOf<String>()
        try {
            val adbEnabled = Settings.Global.getInt(contentResolver, Settings.Global.ADB_ENABLED, 0) != 0
            if (adbEnabled) issues.add("USB debugging is enabled.")
        } catch (_: Exception) {}
        try {
            val devMode = Settings.Global.getInt(contentResolver, Settings.Global.DEVELOPMENT_SETTINGS_ENABLED, 0) != 0
            if (devMode) issues.add("Developer options are enabled.")
        } catch (_: Exception) {}
        if (isProbablyEmulator()) {
            issues.add("The device appears to be an emulator.")
        }
        try {
            val accessibilityManager = getSystemService(ACCESSIBILITY_SERVICE) as AccessibilityManager
            val services = accessibilityManager.getEnabledAccessibilityServiceList(android.accessibilityservice.AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            services.forEach { service ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (!service.isAccessibilityTool) {
                        issues.add("Untrusted accessibility service: ${service.id}")
                    }
                } else {
                    val packageName = service.resolveInfo.serviceInfo.packageName
                    if (!packageName.startsWith("com.google.") && !packageName.startsWith("com.android.")) {
                        issues.add("Third-party accessibility service: $packageName")
                    }
                }
            }
        } catch (_: Exception) {}
        return issues.distinct()
    }

    private fun isProbablyEmulator(): Boolean {
        val fingerprint = Build.FINGERPRINT.lowercase()
        val model = Build.MODEL.lowercase()
        val manufacturer = Build.MANUFACTURER.lowercase()
        val brand = Build.BRAND.lowercase()
        val product = Build.PRODUCT.lowercase()
        return fingerprint.contains("generic")
            || fingerprint.contains("unknown")
            || model.contains("google_sdk")
            || model.contains("emulator")
            || model.contains("android sdk built for")
            || manufacturer.contains("genymotion")
            || (brand.startsWith("generic") && product.contains("sdk"))
    }

    private fun updateSecurityBanner() {
        if (activeSecurityIssues.isEmpty()) {
            securityBanner.visibility = View.GONE
            return
        }
        securityBanner.visibility = View.VISIBLE
        securityBanner.text = activeSecurityIssues.joinToString("\n")
    }

    private fun showLoginState(message: String = "") {
        activeWebMode = WebMode.NONE
        showScreen(ActiveScreen.LOGIN)
        loginPanel.visibility = View.VISIBLE
        launcherPanel.visibility = View.GONE
        blockedPanel.visibility = View.GONE
        webContainer.visibility = View.GONE
        if (message.isNotBlank()) showStatus(message, Tone.INFO) else hideStatus()
        updateSecurityBanner()
    }

    private fun showLauncherState(message: String = "") {
        activeWebMode = WebMode.NONE
        showScreen(ActiveScreen.LAUNCHER)
        loginPanel.visibility = View.GONE
        launcherPanel.visibility = View.VISIBLE
        blockedPanel.visibility = View.GONE
        webContainer.visibility = View.GONE
        renderLauncherForSession(portalSession)
        if (message.isNotBlank()) {
            showStatus(message, Tone.INFO)
        } else if (portalSession != null) {
            showStatus(
                "Signed in as ${(portalSession?.account?.nameEn?.ifBlank { portalSession?.account?.name }.orEmpty())} (${portalSession?.effectiveRole.orEmpty()}).",
                Tone.INFO
            )
        }
        updateSecurityBanner()
    }

    private fun showProtectedState() {
        activeWebMode = WebMode.PROTECTED
        showScreen(ActiveScreen.WEB)
        loginPanel.visibility = View.GONE
        launcherPanel.visibility = View.GONE
        blockedPanel.visibility = View.GONE
        webContainer.visibility = View.VISIBLE
        updateWebModeBanner()
        updateSecurityBanner()
    }

    private fun showBlockedState(message: String) {
        showScreen(ActiveScreen.BLOCKED)
        loginPanel.visibility = View.GONE
        launcherPanel.visibility = View.GONE
        blockedPanel.visibility = View.VISIBLE
        webContainer.visibility = View.GONE
        blockedMessage.text = message
        showStatus(message, Tone.DANGER)
        updateSecurityBanner()
    }

    private fun showScreen(screen: ActiveScreen) {
        when (screen) {
            ActiveScreen.LOGIN, ActiveScreen.LAUNCHER, ActiveScreen.BLOCKED -> {
                controlsScroll.visibility = View.VISIBLE
                webContainer.visibility = View.GONE
            }
            ActiveScreen.WEB -> {
                controlsScroll.visibility = View.GONE
                webContainer.visibility = View.VISIBLE
            }
        }
    }

    private fun showStatus(message: String, tone: Tone) {
        statusBanner.visibility = View.VISIBLE
        statusBanner.text = message
        statusBanner.setBackgroundColor(
            when (tone) {
                Tone.INFO -> Color.parseColor("#1E293B")
                Tone.SUCCESS -> Color.parseColor("#123D2E")
                Tone.WARNING -> Color.parseColor("#4B2E0C")
                Tone.DANGER -> Color.parseColor("#4B1111")
            }
        )
    }

    private fun hideStatus() {
        statusBanner.visibility = View.GONE
    }

    private fun showLoadingState(message: String) {
        showStatus(message, Tone.INFO)
        controlsScroll.visibility = View.VISIBLE
        webContainer.visibility = View.GONE
        loginPanel.visibility = View.VISIBLE
        launcherPanel.visibility = View.GONE
        blockedPanel.visibility = View.GONE
    }

    private fun showSecurityWarning(message: String) {
        securityBanner.visibility = View.VISIBLE
        securityBanner.text = message
    }

    private fun clearPasswordField() {
        passwordInput.setText("")
    }

    private fun persistConfig(config: AppConfig) {
        try {
            prefs.edit().putString(KEY_CONFIG_JSON, config.toPrefsJson()).apply()
        } catch (_: Exception) {}
    }

    private fun persistPortalSession(session: PortalSessionState) {
        try {
            prefs.edit()
                .putString(KEY_PORTAL_SESSION_JSON, session.toPrefsJson())
                .putString(KEY_PORTAL_SESSION_TOKEN, session.token)
                .apply()
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
                && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 4101)
            }
            KiuMobilePushRegistration.refresh(this)
        } catch (_: Exception) {}
    }

    private fun clearPortalSessionStorage() {
        try {
            prefs.edit()
                .remove(KEY_PORTAL_SESSION_JSON)
                .remove(KEY_PORTAL_SESSION_TOKEN)
                .apply()
        } catch (_: Exception) {}
        portalSession = null
    }

    private fun savePendingOpenTarget(target: PendingOpenTarget?) {
        pendingOpenTarget = target
        try {
            val editor = prefs.edit()
            if (target == null) editor.remove(KEY_PENDING_OPEN_TARGET_JSON) else editor.putString(KEY_PENDING_OPEN_TARGET_JSON, target.toPrefsJson())
            editor.apply()
        } catch (_: Exception) {}
    }

    private fun loadPendingOpenTarget(): PendingOpenTarget? {
        if (pendingOpenTarget != null) return pendingOpenTarget
        val loaded = PendingOpenTarget.fromPrefs(prefs.getString(KEY_PENDING_OPEN_TARGET_JSON, null))
        pendingOpenTarget = loaded
        return loaded
    }

    private fun clearPendingOpenTarget() {
        pendingOpenTarget = null
        try {
            prefs.edit().remove(KEY_PENDING_OPEN_TARGET_JSON).apply()
        } catch (_: Exception) {}
    }

    private fun savePendingLaunch(launch: PendingLaunch?) {
        pendingLaunch = launch
        try {
            val editor = prefs.edit()
            if (launch == null) editor.remove(KEY_PENDING_LAUNCH_JSON)
            else editor.putString(KEY_PENDING_LAUNCH_JSON, launch.toPrefsJson())
            editor.apply()
        } catch (_: Exception) {}
    }

    private fun loadPendingLaunch(): PendingLaunch? {
        if (pendingLaunch != null) return pendingLaunch
        val loaded = PendingLaunch.fromPrefs(prefs.getString(KEY_PENDING_LAUNCH_JSON, null))
        pendingLaunch = loaded
        return loaded
    }

    private fun clearPendingLaunch() {
        pendingLaunch = null
        try {
            prefs.edit().remove(KEY_PENDING_LAUNCH_JSON).apply()
        } catch (_: Exception) {}
    }

    private fun persistProtectedLaunchState(state: ProtectedLaunchState?) {
        try {
            val editor = prefs.edit()
            if (state == null) {
                editor.remove(KEY_PROTECTED_LAUNCH_JSON)
                editor.remove(KEY_PROTECTED_CLIENT_TOKEN)
            } else {
                editor.putString(KEY_PROTECTED_LAUNCH_JSON, state.toPrefsJson())
                editor.putString(KEY_PROTECTED_CLIENT_TOKEN, state.clientSessionToken)
            }
            editor.apply()
        } catch (_: Exception) {}
    }

    private fun loadProtectedLaunchState(): ProtectedLaunchState? {
        return ProtectedLaunchState.fromPrefs(prefs.getString(KEY_PROTECTED_LAUNCH_JSON, null))
    }

    private fun clearProtectedLaunchState() {
        protectedLaunch = null
        persistProtectedLaunchState(null)
    }

    private fun persistExamPortalState(state: ExamPortalAuthState?) {
        examPortalAuth = state
        try {
            val editor = prefs.edit()
            if (state == null) {
                editor.remove(KEY_EXAM_PORTAL_TOKEN)
                editor.remove(KEY_EXAM_PORTAL_STUDENT_JSON)
            } else {
                editor.putString(KEY_EXAM_PORTAL_TOKEN, state.token)
                editor.putString(KEY_EXAM_PORTAL_STUDENT_JSON, state.studentJson)
            }
            editor.apply()
        } catch (_: Exception) {}
    }

    private fun clearProtectedClientToken() {
        try {
            prefs.edit().remove(KEY_PROTECTED_CLIENT_TOKEN).apply()
        } catch (_: Exception) {}
        try {
            webView.evaluateJavascript(
                "(function(){try{sessionStorage.removeItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN');localStorage.removeItem('KIU_PROTECTED_CLIENT_SESSION_TOKEN');}catch(e){}})();",
                null
            )
        } catch (_: Exception) {}
    }

    private fun clearBrowserDataForLogout() {
        clearProtectedClientToken()
        persistExamPortalState(null)
        clearPendingOpenTarget()
        clearPendingLaunch()
        clearProtectedLaunchState()
        clearBrowserData()
    }

    private fun clearBrowserData() {
        try {
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
        } catch (_: Exception) {}
        webView.clearCache(true)
        webView.clearHistory()
    }

    private fun clearClipboard() {
        try {
            val clipboard = getSystemService(CLIPBOARD_SERVICE) as android.content.ClipboardManager
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("", ""))
        } catch (_: Exception) {}
    }

    private fun clearAllState() {
        stopProtectedTimers(preserveState = false)
        clearPortalSessionStorage()
        clearPendingOpenTarget()
        clearPendingLaunch()
        clearProtectedLaunchState()
        persistExamPortalState(null)
        clearProtectedClientToken()
        activeWebMode = WebMode.NONE
        activeBootstrap = null
        activeBootstrapTargetUrl = ""
        bootstrapApplied = false
        currentPageTitle = ""
        try {
            webView.loadUrl("about:blank")
        } catch (_: Exception) {}
        clearBrowserData()
    }

    private fun loadPendingLaunchStateIfNeeded() {
        pendingLaunch = pendingLaunch ?: loadPendingLaunch()
        pendingOpenTarget = pendingOpenTarget ?: loadPendingOpenTarget()
        protectedLaunch = protectedLaunch ?: loadProtectedLaunchState()
        examPortalAuth = examPortalAuth ?: ExamPortalAuthState.fromPrefs(
            prefs.getString(KEY_EXAM_PORTAL_TOKEN, null)?.let { token ->
                if (token.isBlank()) null else JSONObject().apply {
                    put("token", token)
                    put("studentJson", prefs.getString(KEY_EXAM_PORTAL_STUDENT_JSON, null).orEmpty())
                }.toString()
            }
        )
    }

    private fun restorePortalSessionOrShowLogin() {
        val stored = PortalSessionState.fromPrefs(
            prefs.getString(KEY_PORTAL_SESSION_JSON, null),
            prefs.getString(KEY_PORTAL_SESSION_TOKEN, null)
        )
        if (stored == null) {
            portalSession = null
            showLoginState("Sign in with your university account.")
            return
        }
        showStatus("Validating saved session...", Tone.INFO)
        validatePortalSession(stored.token) { validated ->
            if (validated == null) {
                clearPortalSessionStorage()
                persistProtectedLaunchState(null)
                showLoginState("Saved session expired. Sign in again.")
                return@validatePortalSession
            }
            portalSession = validated
            persistPortalSession(validated)
            showLauncherState()
            if (!restoreProtectedLaunchIfPossible()) {
                if (!redeemPendingLaunchIfPossible()) {
                    openPendingOpenTargetIfPossible()
                }
            }
        }
    }

    private fun openPendingOpenTargetIfPossible(): Boolean {
        val session = portalSession ?: return false
        val target = loadPendingOpenTarget() ?: return false
        val sanitized = sanitizeBrowserUrl(target.targetUrl)
        if (sanitized.isBlank()) {
            clearPendingOpenTarget()
            return false
        }
        savePendingOpenTarget(null)
        showStatus("Opening requested page...", Tone.INFO)
        loadWebPage(
            targetUrl = sanitized,
            mode = WebMode.LMS,
            bootstrap = buildBrowserBootstrap(examPortalState = null, protectedToken = ""),
            explicitTitle = target.source.ifBlank { session.account.nameEn.ifBlank { session.account.name } }
        )
        return true
    }

    private fun getProtectedAllowedDomains(): List<String> {
        val launch = protectedLaunch ?: return normalizeAllowedDomains(appConfig.allowedDomains)
        val configured = normalizeAllowedDomains(appConfig.allowedDomains)
        return configured + normalizeAllowedDomains(launch.allowedDomains)
            .filter { requested -> configured.any { base -> requested == base || requested.endsWith(".$base") } }
            .distinct()
    }

    private fun canUseStudentActions(session: PortalSessionState): Boolean {
        val actualRole = session.actualRole.lowercase()
        val effectiveRole = session.effectiveRole.lowercase()
        return effectiveRole == "student" || actualRole in setOf("admin", "professor", "ta")
    }

    private fun isStaffRole(role: String): Boolean {
        return role.lowercase() in setOf("admin", "professor", "ta")
    }

    private fun sanitizeBrowserUrl(value: String): String {
        val normalized = value.trim()
        if (normalized.isBlank()) return ""
        return try {
            val url = URL(normalized)
            val protocol = url.protocol.lowercase()
            if (!url.toURI().userInfo.isNullOrBlank()) return ""
            if (protocol != "https" && !(protocol == "http" && (BuildConfig.DEBUG || url.host.lowercase() in setOf("127.0.0.1", "localhost", "10.0.2.2")))) return ""
            if (!isProtectedModeHostAllowed(url.host, getProtectedAllowedDomains())) return ""
            normalized.removeSuffix("/")
        } catch (_: Exception) {
            ""
        }
    }

    private fun encodeURIComponent(value: String): String = Uri.encode(value)

    private fun jsQuote(value: String): String = JSONObject.quote(value)

    private fun antiCheatSchemeSummary(): String = buildString {
        append("App URL: ")
        append(appConfig.appUrl)
        append("\nBackend URL: ")
        append(appConfig.backendUrl)
        append("\nQuiz URL: ")
        append(appConfig.quizUrl)
        append("\nExam Portal URL: ")
        append(appConfig.examPortalUrl)
    }
}
