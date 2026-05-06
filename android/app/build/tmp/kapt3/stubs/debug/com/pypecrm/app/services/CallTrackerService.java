package com.pypecrm.app.services;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000b\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\t\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0013\u0018\u00002\u00020\u0001:\u0001<B\u0005\u00a2\u0006\u0002\u0010\u0002JU\u0010\u0012\u001a\u00020\u00132\u0006\u0010\u0014\u001a\u00020\u00042\u0006\u0010\u0015\u001a\u00020\u00062\u0006\u0010\u0016\u001a\u00020\u00042\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\b2\n\b\u0002\u0010\u0018\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u0010\u0019\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u0010\u001a\u001a\u0004\u0018\u00010\nH\u0002\u00a2\u0006\u0002\u0010\u001bJ\u0018\u0010\u001c\u001a\u00020\u001d2\u0006\u0010\u001e\u001a\u00020\u00042\u0006\u0010\u001f\u001a\u00020\u0004H\u0002J\b\u0010 \u001a\u00020\u0013H\u0002J\u0016\u0010!\u001a\u0010\u0012\u0004\u0012\u00020\u0004\u0012\u0004\u0012\u00020\u0004\u0018\u00010\"H\u0002J\n\u0010#\u001a\u0004\u0018\u00010\u0004H\u0002J\u0014\u0010$\u001a\u0004\u0018\u00010%2\b\u0010&\u001a\u0004\u0018\u00010\u0004H\u0002J\u0014\u0010\'\u001a\u0004\u0018\u00010(2\b\u0010)\u001a\u0004\u0018\u00010*H\u0016J\b\u0010+\u001a\u00020\u0013H\u0016J\"\u0010,\u001a\u00020\u00062\b\u0010)\u001a\u0004\u0018\u00010*2\u0006\u0010-\u001a\u00020\u00062\u0006\u0010.\u001a\u00020\u0006H\u0016JS\u0010/\u001a\u00020\u00132\b\u00100\u001a\u0004\u0018\u00010\u00042\u0006\u00101\u001a\u00020\u00042\u0006\u0010\u0015\u001a\u00020\u00062\u0006\u0010\u0016\u001a\u00020\u00042\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\b2\n\b\u0002\u0010\u0018\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u00102\u001a\u0004\u0018\u00010\u0006H\u0002\u00a2\u0006\u0002\u00103J\"\u00104\u001a\u00020\u00132\u0006\u00105\u001a\u00020\u00042\b\u00106\u001a\u0004\u0018\u00010\u00042\u0006\u0010\u000f\u001a\u00020\u000eH\u0002J\u001a\u00107\u001a\u00020\u00132\b\u00106\u001a\u0004\u0018\u00010\u00042\u0006\u0010\u000f\u001a\u00020\u000eH\u0002J\b\u00108\u001a\u00020\u0013H\u0002J\u0018\u00109\u001a\u00020\u00132\u0006\u0010\u001e\u001a\u00020\u00042\u0006\u0010\u001f\u001a\u00020\u0004H\u0002Jk\u0010:\u001a\u00020\u00132\b\u00100\u001a\u0004\u0018\u00010\u00042\u0006\u00101\u001a\u00020\u00042\u0006\u0010\u0015\u001a\u00020\u00062\n\b\u0002\u00102\u001a\u0004\u0018\u00010\u00062\u0006\u0010\u0016\u001a\u00020\u00042\n\b\u0002\u0010\u0017\u001a\u0004\u0018\u00010\b2\n\b\u0002\u0010\u0018\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u0010\u0019\u001a\u0004\u0018\u00010\u00042\n\b\u0002\u0010\u001a\u001a\u0004\u0018\u00010\nH\u0002\u00a2\u0006\u0002\u0010;R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082D\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082D\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\t\u001a\u0004\u0018\u00010\nX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u000b\u001a\u0004\u0018\u00010\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\f\u001a\u0004\u0018\u00010\u0004X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\u000eX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082.\u00a2\u0006\u0002\n\u0000\u00a8\u0006="}, d2 = {"Lcom/pypecrm/app/services/CallTrackerService;", "Landroid/app/Service;", "()V", "CHANNEL_ID", "", "NOTIFICATION_ID", "", "callStartTime", "", "currentCallFile", "Ljava/io/File;", "currentNumber", "currentSessionId", "isCallActive", "", "isOutgoing", "recorderService", "Lcom/pypecrm/app/services/AudioRecorderService;", "checkLeadAndUpload", "", "phone", "durationSecs", "callType", "officialTimestamp", "hardwareId", "callSessionId", "recordingFile", "(Ljava/lang/String;ILjava/lang/String;Ljava/lang/Long;Ljava/lang/String;Ljava/lang/String;Ljava/io/File;)V", "createNotification", "Landroid/app/Notification;", "title", "message", "createNotificationChannel", "getAuthData", "Lkotlin/Pair;", "getLastCallLogNumber", "getLatestCallDetails", "Lcom/pypecrm/app/services/CallTrackerService$CallDetails;", "expectedNumber", "onBind", "Landroid/os/IBinder;", "intent", "Landroid/content/Intent;", "onCreate", "onStartCommand", "flags", "startId", "queueForSync", "leadId", "phoneNumber", "carrierDurationSecs", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/String;Ljava/lang/Long;Ljava/lang/String;Ljava/lang/Integer;)V", "sendCallStateBroadcast", "action", "number", "startTrackingLogic", "stopTracking", "updateNotification", "uploadMetadataToCrm", "(Ljava/lang/String;Ljava/lang/String;ILjava/lang/Integer;Ljava/lang/String;Ljava/lang/Long;Ljava/lang/String;Ljava/lang/String;Ljava/io/File;)V", "CallDetails", "app_debug"})
public final class CallTrackerService extends android.app.Service {
    private final int NOTIFICATION_ID = 101;
    @org.jetbrains.annotations.NotNull()
    private final java.lang.String CHANNEL_ID = "call_tracker_channel";
    private boolean isCallActive = false;
    private long callStartTime = 0L;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String currentNumber;
    private boolean isOutgoing = false;
    @org.jetbrains.annotations.Nullable()
    private java.lang.String currentSessionId;
    private com.pypecrm.app.services.AudioRecorderService recorderService;
    @org.jetbrains.annotations.Nullable()
    private java.io.File currentCallFile;
    
    public CallTrackerService() {
        super();
    }
    
    @java.lang.Override()
    public void onCreate() {
    }
    
    @java.lang.Override()
    public int onStartCommand(@org.jetbrains.annotations.Nullable()
    android.content.Intent intent, int flags, int startId) {
        return 0;
    }
    
    private final void startTrackingLogic(java.lang.String number, boolean isOutgoing) {
    }
    
    private final void stopTracking() {
    }
    
    private final com.pypecrm.app.services.CallTrackerService.CallDetails getLatestCallDetails(java.lang.String expectedNumber) {
        return null;
    }
    
    private final void updateNotification(java.lang.String title, java.lang.String message) {
    }
    
    private final void sendCallStateBroadcast(java.lang.String action, java.lang.String number, boolean isOutgoing) {
    }
    
    private final kotlin.Pair<java.lang.String, java.lang.String> getAuthData() {
        return null;
    }
    
    private final void checkLeadAndUpload(java.lang.String phone, int durationSecs, java.lang.String callType, java.lang.Long officialTimestamp, java.lang.String hardwareId, java.lang.String callSessionId, java.io.File recordingFile) {
    }
    
    private final void uploadMetadataToCrm(java.lang.String leadId, java.lang.String phoneNumber, int durationSecs, java.lang.Integer carrierDurationSecs, java.lang.String callType, java.lang.Long officialTimestamp, java.lang.String hardwareId, java.lang.String callSessionId, java.io.File recordingFile) {
    }
    
    private final void queueForSync(java.lang.String leadId, java.lang.String phoneNumber, int durationSecs, java.lang.String callType, java.lang.Long officialTimestamp, java.lang.String hardwareId, java.lang.Integer carrierDurationSecs) {
    }
    
    private final java.lang.String getLastCallLogNumber() {
        return null;
    }
    
    private final android.app.Notification createNotification(java.lang.String title, java.lang.String message) {
        return null;
    }
    
    private final void createNotificationChannel() {
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public android.os.IBinder onBind(@org.jetbrains.annotations.Nullable()
    android.content.Intent intent) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\t\n\u0002\b\u0011\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0082\b\u0018\u00002\u00020\u0001B-\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0003\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\u0006\u0010\t\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0013\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\bH\u00c6\u0003J\t\u0010\u0017\u001a\u00020\u0003H\u00c6\u0003J;\u0010\u0018\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00032\b\b\u0002\u0010\u0007\u001a\u00020\b2\b\b\u0002\u0010\t\u001a\u00020\u0003H\u00c6\u0001J\u0013\u0010\u0019\u001a\u00020\u001a2\b\u0010\u001b\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001c\u001a\u00020\u0005H\u00d6\u0001J\t\u0010\u001d\u001a\u00020\u0003H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\t\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u000eR\u0011\u0010\u0007\u001a\u00020\b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\u0011R\u0011\u0010\u0006\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u000e\u00a8\u0006\u001e"}, d2 = {"Lcom/pypecrm/app/services/CallTrackerService$CallDetails;", "", "number", "", "duration", "", "type", "timestamp", "", "hardwareId", "(Ljava/lang/String;ILjava/lang/String;JLjava/lang/String;)V", "getDuration", "()I", "getHardwareId", "()Ljava/lang/String;", "getNumber", "getTimestamp", "()J", "getType", "component1", "component2", "component3", "component4", "component5", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
    static final class CallDetails {
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String number = null;
        private final int duration = 0;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String type = null;
        private final long timestamp = 0L;
        @org.jetbrains.annotations.NotNull()
        private final java.lang.String hardwareId = null;
        
        public CallDetails(@org.jetbrains.annotations.NotNull()
        java.lang.String number, int duration, @org.jetbrains.annotations.NotNull()
        java.lang.String type, long timestamp, @org.jetbrains.annotations.NotNull()
        java.lang.String hardwareId) {
            super();
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getNumber() {
            return null;
        }
        
        public final int getDuration() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getType() {
            return null;
        }
        
        public final long getTimestamp() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String getHardwareId() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component1() {
            return null;
        }
        
        public final int component2() {
            return 0;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component3() {
            return null;
        }
        
        public final long component4() {
            return 0L;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final java.lang.String component5() {
            return null;
        }
        
        @org.jetbrains.annotations.NotNull()
        public final com.pypecrm.app.services.CallTrackerService.CallDetails copy(@org.jetbrains.annotations.NotNull()
        java.lang.String number, int duration, @org.jetbrains.annotations.NotNull()
        java.lang.String type, long timestamp, @org.jetbrains.annotations.NotNull()
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