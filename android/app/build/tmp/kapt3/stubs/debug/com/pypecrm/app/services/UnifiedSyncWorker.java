package com.pypecrm.app.services;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000j\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\t\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\n\u0018\u0000 -2\u00020\u0001:\u0002-.B\u0015\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u000e\u0010\u0007\u001a\u00020\bH\u0082@\u00a2\u0006\u0002\u0010\tJ\u000e\u0010\n\u001a\u00020\u000bH\u0096@\u00a2\u0006\u0002\u0010\tJ\u0010\u0010\f\u001a\u00020\r2\u0006\u0010\u000e\u001a\u00020\u000fH\u0002J\u0016\u0010\u0010\u001a\u0010\u0012\u0004\u0012\u00020\u0012\u0012\u0004\u0012\u00020\u0012\u0018\u00010\u0011H\u0002J\u001a\u0010\u0013\u001a\u0004\u0018\u00010\u00142\u0006\u0010\u0015\u001a\u00020\u00122\u0006\u0010\u0016\u001a\u00020\u0017H\u0002J\b\u0010\u0018\u001a\u00020\bH\u0002J\u0016\u0010\u0019\u001a\u00020\r2\u0006\u0010\u001a\u001a\u00020\u001bH\u0082@\u00a2\u0006\u0002\u0010\u001cJ\u0016\u0010\u001d\u001a\u00020\b2\u0006\u0010\u001e\u001a\u00020\u001fH\u0082@\u00a2\u0006\u0002\u0010 J(\u0010!\u001a\u00020\r2\u0006\u0010\"\u001a\u00020#2\u0006\u0010$\u001a\u00020%2\u0006\u0010&\u001a\u00020\u00172\u0006\u0010\'\u001a\u00020\u0012H\u0002J\u0010\u0010(\u001a\u00020\r2\u0006\u0010)\u001a\u00020\u0012H\u0002J\u001a\u0010*\u001a\u00020\r2\u0006\u0010)\u001a\u00020\u00122\b\u0010+\u001a\u0004\u0018\u00010\u0012H\u0002J\u0010\u0010,\u001a\u00020\r2\u0006\u0010)\u001a\u00020\u0012H\u0002\u00a8\u0006/"}, d2 = {"Lcom/pypecrm/app/services/UnifiedSyncWorker;", "Landroidx/work/CoroutineWorker;", "context", "Landroid/content/Context;", "workerParams", "Landroidx/work/WorkerParameters;", "(Landroid/content/Context;Landroidx/work/WorkerParameters;)V", "consolidateCallBuffer", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "doWork", "Landroidx/work/ListenableWorker$Result;", "executeRequest", "", "request", "Lokhttp3/Request;", "getAuthData", "Lkotlin/Pair;", "", "getTalkTimeFromCallLog", "Lcom/pypecrm/app/services/UnifiedSyncWorker$LogResult;", "phoneNumber", "startTime", "", "performSelfHealingCallLogSync", "processSyncItem", "item", "Lcom/pypecrm/app/data/SyncQueueEntry;", "(Lcom/pypecrm/app/data/SyncQueueEntry;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "recoverWhatsAppFallbackQueue", "db", "Lcom/pypecrm/app/data/AppDatabase;", "(Lcom/pypecrm/app/data/AppDatabase;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "uploadConsolidatedReport", "buffer", "Lcom/pypecrm/app/data/CallBufferEntity;", "duration", "", "timestamp", "hwId", "uploadMetadata", "payload", "uploadRecording", "filePath", "uploadWhatsApp", "Companion", "LogResult", "app_debug"})
public final class UnifiedSyncWorker extends androidx.work.CoroutineWorker {
    @org.jetbrains.annotations.NotNull()
    public static final com.pypecrm.app.services.UnifiedSyncWorker.Companion Companion = null;
    
    public UnifiedSyncWorker(@org.jetbrains.annotations.NotNull()
    android.content.Context context, @org.jetbrains.annotations.NotNull()
    androidx.work.WorkerParameters workerParams) {
        super(null, null);
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.Nullable()
    public java.lang.Object doWork(@org.jetbrains.annotations.NotNull()
    kotlin.coroutines.Continuation<? super androidx.work.ListenableWorker.Result> $completion) {
        return null;
    }
    
    private final java.lang.Object processSyncItem(com.pypecrm.app.data.SyncQueueEntry item, kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    private final java.lang.Object recoverWhatsAppFallbackQueue(com.pypecrm.app.data.AppDatabase db, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    private final kotlin.Pair<java.lang.String, java.lang.String> getAuthData() {
        return null;
    }
    
    private final boolean uploadMetadata(java.lang.String payload) {
        return false;
    }
    
    private final boolean uploadWhatsApp(java.lang.String payload) {
        return false;
    }
    
    private final boolean uploadRecording(java.lang.String payload, java.lang.String filePath) {
        return false;
    }
    
    private final boolean executeRequest(okhttp3.Request request) {
        return false;
    }
    
    private final java.lang.Object consolidateCallBuffer(kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    private final com.pypecrm.app.services.UnifiedSyncWorker.LogResult getTalkTimeFromCallLog(java.lang.String phoneNumber, long startTime) {
        return null;
    }
    
    private final boolean uploadConsolidatedReport(com.pypecrm.app.data.CallBufferEntity buffer, int duration, long timestamp, java.lang.String hwId) {
        return false;
    }
    
    private final void performSelfHealingCallLogSync() {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0018\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u0006\u00a8\u0006\u0007"}, d2 = {"Lcom/pypecrm/app/services/UnifiedSyncWorker$Companion;", "", "()V", "schedule", "", "context", "Landroid/content/Context;", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        public final void schedule(@org.jetbrains.annotations.NotNull()
        android.content.Context context) {
        }
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u000e\n\u0002\b\f\n\u0002\u0010\u000b\n\u0002\b\u0004\b\u0082\b\u0018\u00002\u00020\u0001B\u001d\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\t\u0010\u000f\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0010\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0011\u001a\u00020\u0007H\u00c6\u0003J\'\u0010\u0012\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0013\u001a\u00020\u00142\b\u0010\u0015\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0016\u001a\u00020\u0003H\u00d6\u0001J\t\u0010\u0017\u001a\u00020\u0007H\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000e\u00a8\u0006\u0018"}, d2 = {"Lcom/pypecrm/app/services/UnifiedSyncWorker$LogResult;", "", "duration", "", "timestamp", "", "hardwareId", "", "(IJLjava/lang/String;)V", "getDuration", "()I", "getHardwareId", "()Ljava/lang/String;", "getTimestamp", "()J", "component1", "component2", "component3", "copy", "equals", "", "other", "hashCode", "toString", "app_debug"})
    static final class LogResult {
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
        public final com.pypecrm.app.services.UnifiedSyncWorker.LogResult copy(int duration, long timestamp, @org.jetbrains.annotations.NotNull()
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