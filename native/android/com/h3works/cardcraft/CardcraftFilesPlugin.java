package com.h3works.cardcraft;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(name = "CardcraftFiles")
public class CardcraftFilesPlugin extends Plugin {
    @PluginMethod
    public void save(PluginCall call) {
        String name = sanitize(call.getString("name", "cardcraft-file"));
        String mimeType = call.getString("mimeType", "application/octet-stream");
        String base64 = call.getString("base64", "");
        if (base64.isEmpty()) {
            call.reject("FILE_DATA_REQUIRED");
            return;
        }
        try {
            byte[] bytes = Base64.decode(base64, Base64.DEFAULT);
            JSObject out = new JSObject();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentResolver resolver = getContext().getContentResolver();
                ContentValues values = new ContentValues();
                values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
                values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Cardcraft");
                values.put(MediaStore.MediaColumns.IS_PENDING, 1);
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri == null) throw new IllegalStateException("MEDIASTORE_INSERT_FAILED");
                try (OutputStream stream = resolver.openOutputStream(uri)) {
                    if (stream == null) throw new IllegalStateException("MEDIASTORE_STREAM_FAILED");
                    stream.write(bytes);
                    stream.flush();
                }
                ContentValues done = new ContentValues();
                done.put(MediaStore.MediaColumns.IS_PENDING, 0);
                resolver.update(uri, done, null, null);
                out.put("saved", true);
                out.put("name", name);
                out.put("uri", uri.toString());
                out.put("location", "Downloads/Cardcraft");
            } else {
                File root = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (root == null) throw new IllegalStateException("DOWNLOAD_DIR_UNAVAILABLE");
                File dir = new File(root, "Cardcraft");
                if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("CREATE_DIR_FAILED");
                File file = new File(dir, name);
                try (FileOutputStream stream = new FileOutputStream(file)) {
                    stream.write(bytes);
                    stream.flush();
                }
                out.put("saved", true);
                out.put("name", name);
                out.put("uri", Uri.fromFile(file).toString());
                out.put("location", file.getAbsolutePath());
            }
            call.resolve(out);
        } catch (Exception error) {
            call.reject("FILE_SAVE_FAILED: " + error.getMessage(), error);
        }
    }

    private String sanitize(String value) {
        String cleaned = value == null ? "cardcraft-file" : value.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        return cleaned.isEmpty() ? "cardcraft-file" : cleaned;
    }
}
