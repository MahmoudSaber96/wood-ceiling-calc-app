package com.woodceiling.app;

import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    final WebView web = getBridge().getWebView();
    web.addJavascriptInterface(new Object() {
      @JavascriptInterface
      public void print() {
        runOnUiThread(() -> {
          PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
          PrintDocumentAdapter adapter = web.createPrintDocumentAdapter("تقرير أسقف الخشب");
          pm.print("تقرير أسقف الخشب", adapter, new PrintAttributes.Builder().build());
        });
      }
    }, "AndroidPrint");
  }
}
