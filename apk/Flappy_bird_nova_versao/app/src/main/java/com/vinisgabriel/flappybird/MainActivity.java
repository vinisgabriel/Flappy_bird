package com.vinisgabriel.flappybird;

import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);

        // Habilita JavaScript
        webView.getSettings().setJavaScriptEnabled(true);

        // Habilita localStorage / DOM Storage
        webView.getSettings().setDomStorageEnabled(true);

        // Permite reproduzir áudio
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);

        // Permite zoom
        webView.getSettings().setSupportZoom(false);

        // Força abertura dentro do app
        webView.setWebViewClient(new WebViewClient());

        // Suporte para áudio e recursos do navegador
        webView.setWebChromeClient(new WebChromeClient());

        // Carrega o jogo localmente (OFFLINE)
        webView.loadUrl("file:///android_asset/index.html");
    }

    // Botão voltar do Android: volta no WebView
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}