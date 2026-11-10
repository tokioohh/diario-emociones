// Config plugin: añade al teléfono un servicio que recibe las entradas rápidas del reloj Wear OS
// (Data Layer de Google) y las deja como archivos JSON en <filesDir>/diary/inbox/.
// La app JS las importa al abrirse (src/core/store.tsx → importWatch). No usa internet.
const { withAndroidManifest, withAppBuildGradle, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const SERVICE = 'WearInboxService';
const DATA_PATH = '/diario/entrada/';

const kotlin = (pkg) => `package ${pkg}

import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class ${SERVICE} : WearableListenerService() {
    override fun onDataChanged(events: DataEventBuffer) {
        for (event in events) {
            if (event.type != DataEvent.TYPE_CHANGED) continue
            val item = event.dataItem
            if (item.uri.path?.startsWith("${DATA_PATH}") != true) continue
            val map = DataMapItem.fromDataItem(item).dataMap
            val id = (map.getString("id") ?: continue).replace(Regex("[^A-Za-z0-9_-]"), "")
            if (id.isEmpty()) continue
            val json = JSONObject()
                .put("id", id)
                .put("at", map.getString("at") ?: "")
                .put("valence", map.getDouble("valence"))
                .put("energy", map.getDouble("energy"))
                .put("labels", JSONArray(map.getStringArrayList("labels") ?: arrayListOf<String>()))
            val dir = File(filesDir, "diary/inbox").apply { mkdirs() }
            File(dir, "$id.json").writeText(json.toString())
            Wearable.getDataClient(this).deleteDataItems(item.uri)
        }
    }
}
`;

module.exports = function withWearBridge(config) {
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('play-services-wearable')) {
      c.modResults.contents = c.modResults.contents.replace(
        /dependencies\s*\{/,
        "dependencies {\n    implementation 'com.google.android.gms:play-services-wearable:19.0.0'",
      );
    }
    return c;
  });

  config = withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.service = app.service || [];
    if (!app.service.some((s) => s.$['android:name'] === `.${SERVICE}`)) {
      app.service.push({
        $: { 'android:name': `.${SERVICE}`, 'android:exported': 'true' },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'com.google.android.gms.wearable.DATA_CHANGED' } }],
            data: [{ $: { 'android:scheme': 'wear', 'android:host': '*', 'android:pathPrefix': DATA_PATH.replace(/\/$/, '') } }],
          },
        ],
      });
    }
    return c;
  });

  config = withDangerousMod(config, [
    'android',
    async (c) => {
      const pkg = c.android && c.android.package;
      if (!pkg) throw new Error('withWearBridge: define android.package en app.json');
      const dir = path.join(c.modRequest.platformProjectRoot, 'app/src/main/java', ...pkg.split('.'));
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, `${SERVICE}.kt`), kotlin(pkg));
      return c;
    },
  ]);

  return config;
};
