package com.h3works.cardcraft;

import androidx.annotation.NonNull;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingFlowParams;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.ConsumeParams;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.ProductDetails;
import com.android.billingclient.api.QueryProductDetailsParams;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.PurchasesUpdatedListener;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@CapacitorPlugin(name = "CardcraftBilling")
public class CardcraftBillingPlugin extends Plugin implements PurchasesUpdatedListener {
    private BillingClient billingClient;
    private PluginCall pendingCall;
    private String pendingProductId;

    @Override
    public void load() {
        super.load();
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId", "");
        if (!"cardcraft_export_png".equals(productId) && !"cardcraft_export_source".equals(productId)) {
            call.reject("INVALID_PRODUCT");
            return;
        }
        if (pendingCall != null) {
            call.reject("PURCHASE_IN_PROGRESS");
            return;
        }
        pendingCall = call;
        pendingProductId = productId;
        connectAndLaunch();
    }

    private void connectAndLaunch() {
        if (billingClient == null) {
            failPending("BILLING_UNAVAILABLE");
            return;
        }
        if (billingClient.isReady()) {
            queryAndLaunch();
            return;
        }
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(@NonNull BillingResult result) {
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    queryAndLaunch();
                } else {
                    failPending("BILLING_SETUP_FAILED: " + result.getDebugMessage());
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                // 다음 구매 요청에서 다시 연결한다.
            }
        });
    }

    private void queryAndLaunch() {
        if (pendingCall == null || pendingProductId == null) return;
        QueryProductDetailsParams.Product product = QueryProductDetailsParams.Product.newBuilder()
            .setProductId(pendingProductId)
            .setProductType(BillingClient.ProductType.INAPP)
            .build();
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(Collections.singletonList(product))
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, queryResult) -> {
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                failPending("PRODUCT_QUERY_FAILED: " + billingResult.getDebugMessage());
                return;
            }
            List<ProductDetails> detailsList = queryResult.getProductDetailsList();
            if (detailsList == null || detailsList.isEmpty()) {
                failPending("PRODUCT_NOT_AVAILABLE");
                return;
            }
            ProductDetails details = detailsList.get(0);
            BillingFlowParams.ProductDetailsParams.Builder detailsBuilder = BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(details);

            List<ProductDetails.OneTimePurchaseOfferDetails> offers = details.getOneTimePurchaseOfferDetailsList();
            if (offers != null && !offers.isEmpty() && offers.get(0).getOfferToken() != null) {
                detailsBuilder.setOfferToken(offers.get(0).getOfferToken());
            } else {
                ProductDetails.OneTimePurchaseOfferDetails offer = details.getOneTimePurchaseOfferDetails();
                if (offer != null && offer.getOfferToken() != null && !offer.getOfferToken().isEmpty()) {
                    detailsBuilder.setOfferToken(offer.getOfferToken());
                }
            }

            List<BillingFlowParams.ProductDetailsParams> productParams = new ArrayList<>();
            productParams.add(detailsBuilder.build());
            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productParams)
                .build();

            getActivity().runOnUiThread(() -> {
                BillingResult launch = billingClient.launchBillingFlow(getActivity(), flowParams);
                if (launch.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                    failPending("PURCHASE_LAUNCH_FAILED: " + launch.getDebugMessage());
                }
            });
        });
    }

    @Override
    public void onPurchasesUpdated(@NonNull BillingResult billingResult, List<Purchase> purchases) {
        if (pendingCall == null) return;
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            failPending("USER_CANCELED");
            return;
        }
        if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || purchases == null) {
            failPending("PURCHASE_FAILED: " + billingResult.getDebugMessage());
            return;
        }
        for (Purchase purchase : purchases) {
            if (purchase.getProducts().contains(pendingProductId)) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    consumeAndGrant(purchase);
                    return;
                }
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    failPending("PURCHASE_PENDING");
                    return;
                }
            }
        }
        failPending("PURCHASE_NOT_FOUND");
    }

    private void consumeAndGrant(Purchase purchase) {
        ConsumeParams params = ConsumeParams.newBuilder().setPurchaseToken(purchase.getPurchaseToken()).build();
        billingClient.consumeAsync(params, (result, purchaseToken) -> {
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                failPending("CONSUME_FAILED: " + result.getDebugMessage());
                return;
            }
            PluginCall call = pendingCall;
            String productId = pendingProductId;
            clearPending();
            if (call == null) return;
            JSObject out = new JSObject();
            out.put("purchased", true);
            out.put("granted", true);
            out.put("productId", productId);
            out.put("purchaseToken", purchaseToken);
            if (purchase.getOrderId() != null) out.put("orderId", purchase.getOrderId());
            call.resolve(out);
        });
    }

    private void failPending(String message) {
        PluginCall call = pendingCall;
        clearPending();
        if (call != null) call.reject(message);
    }

    private void clearPending() {
        pendingCall = null;
        pendingProductId = null;
    }

    @Override
    protected void handleOnDestroy() {
        if (billingClient != null) billingClient.endConnection();
        super.handleOnDestroy();
    }
}
