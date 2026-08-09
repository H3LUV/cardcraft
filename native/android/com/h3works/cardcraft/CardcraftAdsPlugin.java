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
    // Google 공식 Rewarded 테스트 광고 ID. 출시 전 실제 AdMob 광고 단위 ID로 교체한다.
    private static final String TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
    private RewardedAd cachedRewardedAd;
    private boolean loading = false;

    private interface LoadResult {
        void loaded(RewardedAd ad);
        void failed(String message);
    }

    private void loadRewarded(LoadResult result) {
        if (cachedRewardedAd != null) {
            result.loaded(cachedRewardedAd);
            return;
        }
        if (loading) {
            result.failed("AD_LOAD_IN_PROGRESS");
            return;
        }
        loading = true;
        MobileAds.initialize(getContext(), status -> {
            AdRequest request = new AdRequest.Builder().build();
            RewardedAd.load(getContext(), TEST_REWARDED_ID, request, new RewardedAdLoadCallback() {
                @Override
                public void onAdLoaded(@NonNull RewardedAd rewardedAd) {
                    loading = false;
                    cachedRewardedAd = rewardedAd;
                    result.loaded(rewardedAd);
                }

                @Override
                public void onAdFailedToLoad(@NonNull LoadAdError error) {
                    loading = false;
                    cachedRewardedAd = null;
                    result.failed("AD_LOAD_FAILED: " + error.getCode() + " / " + error.getMessage());
                }
            });
        });
    }

    private void preloadNext() {
        if (cachedRewardedAd != null || loading) return;
        loadRewarded(new LoadResult() {
            @Override public void loaded(RewardedAd ad) { }
            @Override public void failed(String message) { }
        });
    }

    @PluginMethod
    public void prepareRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> loadRewarded(new LoadResult() {
            @Override
            public void loaded(RewardedAd ad) {
                JSObject result = new JSObject();
                result.put("ready", true);
                result.put("test", true);
                result.put("adUnitId", TEST_REWARDED_ID);
                call.resolve(result);
            }

            @Override
            public void failed(String message) {
                call.reject(message);
            }
        }));
    }

    @PluginMethod
    public void adStatus(PluginCall call) {
        JSObject result = new JSObject();
        result.put("ready", cachedRewardedAd != null);
        result.put("loading", loading);
        result.put("test", true);
        result.put("adUnitId", TEST_REWARDED_ID);
        call.resolve(result);
    }

    @PluginMethod
    public void showRewarded(PluginCall call) {
        getActivity().runOnUiThread(() -> loadRewarded(new LoadResult() {
            @Override
            public void loaded(RewardedAd rewardedAd) {
                // 한 번 표시한 RewardedAd는 재사용하지 않는다.
                cachedRewardedAd = null;
                AtomicBoolean settled = new AtomicBoolean(false);
                AtomicBoolean rewarded = new AtomicBoolean(false);
                final int[] rewardAmount = {0};
                final String[] rewardType = {""};

                rewardedAd.setFullScreenContentCallback(new FullScreenContentCallback() {
                    @Override
                    public void onAdDismissedFullScreenContent() {
                        if (settled.compareAndSet(false, true)) {
                            if (rewarded.get()) {
                                JSObject response = new JSObject();
                                response.put("granted", true);
                                response.put("amount", rewardAmount[0]);
                                response.put("type", rewardType[0]);
                                response.put("test", true);
                                call.resolve(response);
                            } else {
                                call.reject("AD_CLOSED_BEFORE_REWARD");
                            }
                        }
                        preloadNext();
                    }

                    @Override
                    public void onAdFailedToShowFullScreenContent(@NonNull AdError adError) {
                        if (settled.compareAndSet(false, true)) {
                            call.reject("AD_SHOW_FAILED: " + adError.getCode() + " / " + adError.getMessage());
                        }
                        preloadNext();
                    }
                });

                rewardedAd.show(getActivity(), rewardItem -> {
                    rewarded.set(true);
                    rewardAmount[0] = rewardItem.getAmount();
                    rewardType[0] = rewardItem.getType();
                });
            }

            @Override
            public void failed(String message) {
                call.reject(message);
            }
        }));
    }
}
