package com.anticheat.browser

import android.content.Context
import android.os.Build
import com.google.firebase.messaging.FirebaseMessaging
import okhttp3.Callback
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.Response
import org.json.JSONObject
import java.io.IOException
import java.net.URL

private const val PUSH_PREFS_NAME = "kiu_anticheat_android"
private const val PUSH_CONFIG_JSON = "kiu_android_config"
private const val PUSH_SESSION_TOKEN = "kiu_android_portal_session_token"

object KiuMobilePushRegistration {
    private val client = OkHttpClient()

    private fun approvedBackendUrl(raw: String, configJson: String): String {
        return try {
            val url = URL(raw.trim())
            val host = url.host.lowercase()
            if (!url.toURI().userInfo.isNullOrBlank()) return ""
            val localHost = host in setOf("127.0.0.1", "localhost", "10.0.2.2")
            if (url.protocol.lowercase() != "https" && !(BuildConfig.DEBUG && localHost)) return ""
            val allowedDomains = JSONObject(configJson).optJSONArray("allowedDomains")
            val allowed = (0 until (allowedDomains?.length() ?: 0))
                .map { allowedDomains?.optString(it).orEmpty().trim().lowercase() }
                .filter { it.isNotBlank() }
            if (!allowed.any { host == it || host.endsWith(".$it") }) return ""
            raw.trim().removeSuffix("/")
        } catch (_: Exception) {
            ""
        }
    }

    fun refresh(context: Context) {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (task.isSuccessful) registerToken(context, task.result.orEmpty())
        }
    }

    fun registerToken(context: Context, token: String) {
        val normalizedToken = token.trim()
        if (normalizedToken.isBlank()) return
        val prefs = context.applicationContext.getSharedPreferences(PUSH_PREFS_NAME, Context.MODE_PRIVATE)
        val sessionToken = prefs.getString(PUSH_SESSION_TOKEN, "").orEmpty().trim()
        if (sessionToken.isBlank()) return
        val configJson = prefs.getString(PUSH_CONFIG_JSON, "{}").orEmpty()
        val backendUrl = approvedBackendUrl(
            try { JSONObject(configJson).optString("backendUrl").trim() } catch (_: Exception) { "" },
            configJson
        )
        if (backendUrl.isBlank()) return
        val body = JSONObject().apply {
            put("token", normalizedToken)
            put("platform", "android")
            put("deviceModel", Build.MODEL.orEmpty())
            put("appVersion", runCatching {
                context.packageManager.getPackageInfo(context.packageName, 0).versionName.orEmpty()
            }.getOrDefault(""))
        }.toString().toRequestBody("application/json".toMediaType())
        val request = Request.Builder()
            .url("${backendUrl.removeSuffix("/")}/api/mobile/push/register")
            .post(body)
            .addHeader("Content-Type", "application/json")
            .addHeader("X-Portal-Session", sessionToken)
            .build()
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) = Unit
            override fun onResponse(call: okhttp3.Call, response: Response) {
                response.close()
            }
        })
    }

    fun unregister(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PUSH_PREFS_NAME, Context.MODE_PRIVATE)
        val sessionToken = prefs.getString(PUSH_SESSION_TOKEN, "").orEmpty().trim()
        val configJson = prefs.getString(PUSH_CONFIG_JSON, "{}").orEmpty()
        val backendUrl = approvedBackendUrl(
            try { JSONObject(configJson).optString("backendUrl").trim() } catch (_: Exception) { "" },
            configJson
        )
        if (sessionToken.isBlank() || backendUrl.isBlank()) return
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            val token = task.result.orEmpty().trim()
            if (token.isBlank()) return@addOnCompleteListener
            val body = JSONObject().put("token", token).toString()
                .toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url("${backendUrl.removeSuffix("/")}/api/mobile/push/unregister")
                .post(body)
                .addHeader("Content-Type", "application/json")
                .addHeader("X-Portal-Session", sessionToken)
                .build()
            client.newCall(request).enqueue(object : Callback {
                override fun onFailure(call: okhttp3.Call, e: IOException) = Unit
                override fun onResponse(call: okhttp3.Call, response: Response) {
                    response.close()
                }
            })
        }
    }
}
