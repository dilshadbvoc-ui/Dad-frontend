package com.pypecrm.app.services;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000^\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u000b\u0018\u00002\u00020\u0001:\u00012B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0016\u0010\u0017\u001a\u0010\u0012\u0004\u0012\u00020\f\u0012\u0004\u0012\u00020\f\u0018\u00010\u0018H\u0002J\u0014\u0010\u0019\u001a\u0004\u0018\u00010\u001a2\b\u0010\u001b\u001a\u0004\u0018\u00010\fH\u0002J\u0010\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u001fH\u0016J\b\u0010 \u001a\u00020\u001dH\u0016J\b\u0010!\u001a\u00020\u001dH\u0016J\b\u0010\"\u001a\u00020\u001dH\u0014J\u0018\u0010#\u001a\u00020\u001d2\u0006\u0010$\u001a\u00020\f2\u0006\u0010%\u001a\u00020\fH\u0002J\u0012\u0010&\u001a\u00020\u001d2\b\u0010\'\u001a\u0004\u0018\u00010(H\u0002J\u001a\u0010)\u001a\u00020\u001d2\b\u0010\'\u001a\u0004\u0018\u00010(2\u0006\u0010*\u001a\u00020\fH\u0002J\b\u0010+\u001a\u00020\u001dH\u0002J\u0018\u0010,\u001a\u00020\u001d2\u0006\u0010-\u001a\u00020\f2\u0006\u0010%\u001a\u00020\fH\u0002J\u0010\u0010.\u001a\u00020\u001d2\u0006\u0010/\u001a\u00020\fH\u0002J\b\u00100\u001a\u00020\u001dH\u0002J\u0018\u00101\u001a\u00020\u001d2\u0006\u0010$\u001a\u00020\f2\u0006\u0010%\u001a\u00020\fH\u0002R\u0010\u0010\u0003\u001a\u0004\u0018\u00010\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000b\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\r\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000e\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0011\u001a\u00020\u0010X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0006X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0013\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0014\u001a\u0004\u0018\u00010\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0015\u001a\u00020\u0016X\u0082.\u00a2\u0006\u0002\n\u0000\u00a8\u00063"}, d2 = {"Lcom/pypecrm/app/services/CallAccessibilityService;", "Landroid/accessibilityservice/AccessibilityService;", "()V", "callHistoryObserver", "Landroid/database/ContentObserver;", "callStartTime", "", "callStateReceiver", "Landroid/content/BroadcastReceiver;", "currentCallFile", "Ljava/io/File;", "currentLeadId", "", "currentPhoneNum", "currentSessionId", "isCallActive", "", "isOutgoing", "lastInboundSignalTime", "lastWhatsAppContact", "lastWhatsAppMessage", "recorderService", "Lcom/pypecrm/app/services/AudioRecorderService;", "getAuthData", "Lkotlin/Pair;", "getTalkTimeFromCallLog", "Lcom/pypecrm/app/services/CallAccessibilityService$LogResult;", "phoneNumber", "onAccessibilityEvent", "", "event", "Landroid/view/accessibility/AccessibilityEvent;", "onDestroy", "onInterrupt", "onServiceConnected", "queueWhatsAppForSync", "contact", "message", "scanForPhoneNumberAndState", "node", "Landroid/view/accessibility/AccessibilityNodeInfo;", "scanWhatsAppUI", "pkg", "setupCallLogObserver", "showNotification", "title", "startRecordingSync", "number", "stopRecordingSync", "syncWhatsAppToCrm", "LogResult", "app_debug"})
public final class CallAccessibilityService extends android.accessibilityservice.AccessibilityService {
    private boolean isCallActive = false;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String currentLeadId;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String currentPhoneNum;
    private long callStartTime = 0L;
    @org.jetbrains.annotations.Nullable()
    private java.io.File currentCallFile;
    private com.pypecrm.app.services.AudioRecorderService recorderService;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String currentSessionId;
    private boolean isOutgoing = false;
    @org.jetbrains.annotations.Nullable()
    private android.database.ContentObserver callHistoryObserver;
    @org.jetbrains.annotations.NotNull()
    private final android.content.BroadcastReceiver callStateReceiver = null;
    private long lastInboundSignalTime = 0L;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String lastWhatsAppMessage;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String lastWhatsAppContact;
    
    public CallAccessibilityService() {
        super();
    }
    
    @java.lang.Override()
    protected void onServiceConnected() {
    }
    
    private final void setupCallLogObserver() {
    }
    
    @java.lang.Override()
    public void onDestroy() {
    }
    
    private final void startRecordingSync(java.lang.String number) {
    }
    
    private final void stopRecordingSync() {
    }
    
    private final com.pypecrm.app.services.CallAccessibilityService.LogResult getTalkTimeFromCallLog(java.lang.String phoneNumber) {
        return null;
    }
    
    @java.lang.Override()
    public void onAccessibilityEvent(@org.jetbrains.annotations.NotNull()
    android.view.accessibility.AccessibilityEvent event) {
    }
    
    private final void scanWhatsAppUI(android.view.accessibility.AccessibilityNodeInfo node, java.lang.String pkg) {
    }
    
    private final void syncWhatsAppToCrm(java.lang.String contact, java.lang.String message) {
    }
    
    private final void queueWhatsAppForSync(java.lang.String contact, java.lang.String message) {
    }
    
    private final void scanForPhoneNumberAndState(android.view.accessibility.AccessibilityNodeInfo node) {
    }
    
    private final void showNotification(java.lang.String title, java.lang.String message) {
    }
    
    @java.lang.Override()
    public void onInterrupt() {
    }
    
    private final kotlin.Pair<java.lang.String, java.lang.String> getAuthData() {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u000e\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0086\b\u0018\u00002\u00020\u0001B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0007H\u00c6\u0003J\'\u0010\u0012\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0013\u001a\u00020\u00142\b\u0010\u0015\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0016\u001a\u00020\u0003H\u00d6\u0001J\t\u0010\u0017\u001a\u00020\u0007H\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000e\u00a8\u0006\u0018"}, d2 = {"Lcom/pypecrm/app/services/CallAccessibilityService$LogResult;", "", "duration", "", "timestamp", "", "hardwareId", "", "(IJLjava/lang/String;)V", "getDuration", "()I", "getHardwareId", "()Ljava/lang/String;", "getTimestamp", "()J", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
    public static final class LogResult {
        private final int duration = 0;
        private final long timestamp = 0L;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String hardwareId = null;
        
        public LogResult(int duration, long timestamp, @org.jetbrains.annotations.NotNull()
        java.lang.String hardwareId) {
            super();
        }
        
        public final int getDuration() {
            return 0;
        }
        
        public final long getTimestamp() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getHardwareId() {
            return null;
        }
        
        public final int component1() {
            return 0;
        }
        
        public final long component2() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component3() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.pypecrm.app.services.CallAccessibilityService.LogResult copy(int duration, long timestamp, @org.jetbrains.annotations.NotNull()
        java.lang.String hardwareId) {
            return null;
        }
        
        @java.lang.Override()
        public boolean equals(@org.jetbrains.annotations.Nullable()
        java.lang.Object other) {
            return false;
        }
        
        @java.lang.Override()
        public int hashCode() {
            return 0;
        }
        
        @java.lang.Override()
        @org.jetbrains.annotations.NotNull()
        public java.lang.String toString() {
            return null;
        }
    }
}