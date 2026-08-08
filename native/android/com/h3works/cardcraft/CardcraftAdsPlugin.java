package com.h3works.cardcraft;

import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import java.util.concurrent.atomic.AtomicBoolean;

@CapacitorPlugin(name = "CardcraftAds")
public class CardcraftAdsPlugin extends Plugin {
    // Google 공식 Rewarded 테스트 광고 ID. 출시 전 실제 AdMob ID로 교체한다.
    private static final String TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";

    @PluginMethod
    public void showRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> MobileAds.initialize(getContext(), status -> {
            AdRequest request = new AdRequest.Builder().build();
            RewardedAd.load(getContext(), TEST_REWARDED_ID, request, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                    AtomicBoolean settled = new AtomicBoolean(false);
                    AtomicBoolean rewarded = new AtomicBoolean(false);
                    rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                        @Override
                        public void onAdDismissedFullScreenContent() {
                            if (!rewarded.get() && settled.compareAndSet(false, true)) {
                                call.reject("AD_CLOSED_BEFORE_REWARD");
                            }
                        }

                        @Override
                        public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                            if (settled.compareAndSet(false, true)) {
                                call.reject("AD_SHOW_FAILED: " + adError.getMessage());
                            }
                        }
                    });
                    rewardedAd.show(getActivity(), rewardItem -> {
                        rewarded.set(true);
                        if (settled.compareAndSet(false, true)) {
                            JSObject result = new JSObject();
                            result.put("granted", true);
                            result.put("amount", rewardItem.getAmount());
                            result.put("type", rewardItem.getType());
                            result.put("test", true);
                            call.resolve(result);
                        }
                    });
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError error) {
                    call.reject("AD_LOAD_FAILED: " + error.getMessage());
                }
            });
        }));
    }
}
