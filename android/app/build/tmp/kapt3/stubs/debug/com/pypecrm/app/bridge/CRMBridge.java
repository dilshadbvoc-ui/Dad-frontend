package com.pypecrm.app.bridge;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u000e\u0018\u00002\u00020\u0001B\r\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\b\u0010\u0007\u001a\u00020\bH\u0007J\b\u0010\t\u001a\u00020\nH\u0007J\n\u0010\u000b\u001a\u0004\u0018\u00010\nH\u0007J\u0018\u0010\f\u001a\u00020\b2\u0006\u0010\r\u001a\u00020\n2\u0006\u0010\u000e\u001a\u00020\nH\u0007J\b\u0010\u000f\u001a\u00020\bH\u0007J\u0010\u0010\u0010\u001a\u00020\b2\u0006\u0010\u0011\u001a\u00020\nH\u0007J\u0010\u0010\u0012\u001a\u00020\b2\u0006\u0010\u0013\u001a\u00020\nH\u0007J\u0018\u0010\u0014\u001a\u00020\b2\u0006\u0010\u0015\u001a\u00020\n2\u0006\u0010\u0016\u001a\u00020\nH\u0007J\u0010\u0010\u0017\u001a\u00020\b2\u0006\u0010\u0013\u001a\u00020\nH\u0007R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0005\u0010\u0006\u00a8\u0006\u0018"}, d2 = {"Lcom/pypecrm/app/bridge/CRMBridge;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "getContext", "()Landroid/content/Context;", "clearToken", "", "getRecordingStatus", "", "getToken", "initiateCall", "phone", "sessionId", "requestLocationPermission", "saveApiUrl", "url", "saveToken", "token", "showNotification", "title", "message", "syncLeads", "app_debug"})
public final class CRMBridge {
    @org.jetbrains.annotations.NotNull()
    private final android.content.Context context = null;
    
    public CRMBridge(@org.jetbrains.annotations.NotNull()
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final android.content.Context getContext() {
        return null;
    }
    
    @android.webkit.JavascriptInterface()
    public final void syncLeads(@org.jetbrains.annotations.NotNull()
    java.lang.String token) {
    }
    
    @android.webkit.JavascriptInterface()
    @org.jetbrains.annotations.NotNull()
    public final java.lang.String getRecordingStatus() {
        return null;
    }
    
    @android.webkit.JavascriptInterface()
    public final void saveToken(@org.jetbrains.annotations.NotNull()
    java.lang.String token) {
    }
    
    @android.webkit.JavascriptInterface()
    public final void saveApiUrl(@org.jetbrains.annotations.NotNull()
    java.lang.String url) {
    }
    
    @android.webkit.JavascriptInterface()
    @org.jetbrains.annotations.Nullable()
    public final java.lang.String getToken() {
        return null;
    }
    
    @android.webkit.JavascriptInterface()
    public final void clearToken() {
    }
    
    @android.webkit.JavascriptInterface()
    public final void requestLocationPermission() {
    }
    
    @android.webkit.JavascriptInterface()
    public final void showNotification(@org.jetbrains.annotations.NotNull()
    java.lang.String title, @org.jetbrains.annotations.NotNull()
    java.lang.String message) {
    }
    
    @android.webkit.JavascriptInterface()
    public final void initiateCall(@org.jetbrains.annotations.NotNull()
    java.lang.String phone, @org.jetbrains.annotations.NotNull()
    java.lang.String sessionId) {
    }
}