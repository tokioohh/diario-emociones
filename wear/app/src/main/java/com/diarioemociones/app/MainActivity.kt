package com.diarioemociones.app

import android.Manifest
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.ListHeader
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Text
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import kotlinx.coroutines.delay
import java.time.Instant
import java.util.UUID

/** Cuadrantes y palabras: subconjunto del catálogo del teléfono (src/core/emotions.ts). */
enum class Quadrant(val title: String, val color: Color, val valence: Double, val energy: Double, val labels: List<String>) {
    ANIMADO("Animado", Color(0xFFFFC857), 0.6, 0.6, listOf("Alegre", "Emocionado", "Orgulloso", "Motivado")),
    TENSO("Tenso", Color(0xFFFF6B81), -0.6, 0.6, listOf("Ansioso", "Enojado", "Estresado", "Frustrado")),
    APAGADO("Apagado", Color(0xFF6F8FE8), -0.6, -0.6, listOf("Triste", "Cansado", "Solo", "Desanimado")),
    SERENO("Sereno", Color(0xFF7FD6B8), 0.6, -0.6, listOf("Tranquilo", "Agradecido", "Contento", "Relajado")),
}

private val OnMood = Color(0xFF1A1633)

class MainActivity : ComponentActivity() {
    private val askNotifications = registerForActivityResult(ActivityResultContracts.RequestPermission()) {}

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= 33) askNotifications.launch(Manifest.permission.POST_NOTIFICATIONS)
        Reminder.schedule(this)
        setContent { MaterialTheme { QuickEntry(onSend = ::send) } }
    }

    /** Publica la entrada en el Data Layer; se sincroniza con el teléfono aunque esté fuera de alcance. */
    private fun send(q: Quadrant, label: String?) {
        val id = UUID.randomUUID().toString()
        val req = PutDataMapRequest.create("/diario/entrada/$id").apply {
            dataMap.putString("id", id)
            dataMap.putString("at", Instant.now().toString())
            dataMap.putDouble("valence", q.valence)
            dataMap.putDouble("energy", q.energy)
            dataMap.putStringArrayList("labels", arrayListOf<String>().apply { if (label != null) add(label) })
        }.asPutDataRequest().setUrgent()
        Wearable.getDataClient(this).putDataItem(req)
    }
}

@Composable
fun QuickEntry(onSend: (Quadrant, String?) -> Unit) {
    var quadrant by remember { mutableStateOf<Quadrant?>(null) }
    var sent by remember { mutableStateOf(false) }

    LaunchedEffect(sent) {
        if (sent) {
            delay(1500)
            sent = false
            quadrant = null
        }
    }

    ScalingLazyColumn(modifier = Modifier.fillMaxWidth()) {
        when {
            sent -> item { ListHeader { Text("Guardado ✓") } }
            quadrant == null -> {
                item { ListHeader { Text("¿Cómo te sientes?") } }
                items(Quadrant.entries.size) { i ->
                    val q = Quadrant.entries[i]
                    Chip(
                        onClick = { quadrant = q },
                        label = { Text(q.title) },
                        colors = ChipDefaults.chipColors(backgroundColor = q.color, contentColor = OnMood),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
            else -> {
                val q = quadrant!!
                item { ListHeader { Text(q.title) } }
                items(q.labels.size) { i ->
                    Chip(
                        onClick = { onSend(q, q.labels[i]); sent = true },
                        label = { Text(q.labels[i]) },
                        colors = ChipDefaults.chipColors(backgroundColor = q.color, contentColor = OnMood),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
                item {
                    Chip(
                        onClick = { onSend(q, null); sent = true },
                        label = { Text("Sin palabra") },
                        colors = ChipDefaults.secondaryChipColors(),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}
