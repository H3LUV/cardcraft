package com.h3works.cardcraft;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CardcraftAdsPlugin.class);
        registerPlugin(CardcraftBillingPlugin.class);
        registerPlugin(CardcraftFilesPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
