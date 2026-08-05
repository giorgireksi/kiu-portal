package com.anticheat.browser

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

private const val LMS_NOTIFICATION_CHANNEL = "kiu_lms_updates"

class KiuFirebaseMessagingService : FirebaseMessagingService() {
    override fun onNewToken(token: String) {
        KiuMobilePushRegistration.registerToken(this, token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val data = message.data
        val title = data["title"].orEmpty().ifBlank { message.notification?.title.orEmpty() }.ifBlank { "KIU LMS" }
        val body = data["body"].orEmpty().ifBlank { message.notification?.body.orEmpty() }
        if (body.isBlank()) return

        createNotificationChannel()
        val targetUrl = data["url"].orEmpty()
        val openUri = Uri.Builder()
            .scheme("anticheat")
            .authority("open")
            .appendQueryParameter("screen", "lms")
            .appendQueryParameter("launchUrl", targetUrl)
            .appendQueryParameter("source", "notification")
            .build()
        val intent = Intent(this, MainActivity::class.java).apply {
            this.data = openUri
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            (data["notificationId"] ?: body).hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val notification = NotificationCompat.Builder(this, LMS_NOTIFICATION_CHANNEL)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify((data["notificationId"] ?: body).hashCode(), notification)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel(
                LMS_NOTIFICATION_CHANNEL,
                "LMS updates",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifications from the KIU LMS"
            }
        )
    }
}
