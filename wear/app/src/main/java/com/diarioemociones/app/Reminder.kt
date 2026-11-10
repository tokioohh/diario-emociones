package com.diarioemociones.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import java.util.Calendar

/** Recordatorio diario del reloj. Hora fija en el prototipo (ver contrato.md §9, fase 2: sincronizar con el teléfono). */
object Reminder {
    const val HOUR = 21
    const val MINUTE = 0
    private const val CHANNEL = "recordatorio"

    fun schedule(ctx: Context) {
        val alarms = ctx.getSystemService(AlarmManager::class.java)
        val pending = PendingIntent.getBroadcast(
            ctx, 1, Intent(ctx, ReminderReceiver::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val first = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, HOUR); set(Calendar.MINUTE, MINUTE); set(Calendar.SECOND, 0)
            if (before(Calendar.getInstance())) add(Calendar.DAY_OF_YEAR, 1)
        }
        // Inexacta a propósito: no requiere permiso de alarmas exactas.
        alarms.setInexactRepeating(AlarmManager.RTC_WAKEUP, first.timeInMillis, AlarmManager.INTERVAL_DAY, pending)
    }

    fun notify(ctx: Context) {
        val nm = ctx.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(NotificationChannel(CHANNEL, "Recordatorio diario", NotificationManager.IMPORTANCE_DEFAULT))
        val open = PendingIntent.getActivity(
            ctx, 2, Intent(ctx, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setContentTitle("Tu diario")
            .setContentText("¿Cómo te sientes?")
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        nm.notify(1, n)
    }
}

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) = Reminder.notify(context)
}

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) Reminder.schedule(context)
    }
}
