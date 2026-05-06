package com.pypecrm.app.data;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010 \n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0002\bg\u0018\u00002\u00020\u0001J\u0010\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\'J\u0012\u0010\u0006\u001a\u0004\u0018\u00010\u00072\u0006\u0010\b\u001a\u00020\tH\'J\u000e\u0010\n\u001a\b\u0012\u0004\u0012\u00020\u00070\u000bH\'J\u0010\u0010\f\u001a\u00020\u00032\u0006\u0010\r\u001a\u00020\u0007H\'J\u0010\u0010\u000e\u001a\u00020\u000f2\u0006\u0010\b\u001a\u00020\tH\'J\u0010\u0010\u0010\u001a\u00020\u00032\u0006\u0010\r\u001a\u00020\u0007H\'\u00a8\u0006\u0011"}, d2 = {"Lcom/pypecrm/app/data/CallBufferDao;", "", "cleanup", "", "timestamp", "", "getBySessionId", "Lcom/pypecrm/app/data/CallBufferEntity;", "sessionId", "", "getUnconsolidated", "", "insert", "entry", "markAsProcessing", "", "update", "app_debug"})
@androidx.room.Dao()
public abstract interface CallBufferDao {
    
    @androidx.room.Query(value = "SELECT * FROM call_buffer WHERE status = 0 ORDER BY createdAt ASC")
    @org.jetbrains.annotations.NotNull()
    public abstract java.util.List<com.pypecrm.app.data.CallBufferEntity> getUnconsolidated();
    
    @androidx.room.Query(value = "SELECT * FROM call_buffer WHERE callSessionId = :sessionId LIMIT 1")
    @org.jetbrains.annotations.Nullable()
    public abstract com.pypecrm.app.data.CallBufferEntity getBySessionId(@org.jetbrains.annotations.NotNull()
    java.lang.String sessionId);
    
    @androidx.room.Insert(onConflict = 1)
    public abstract void insert(@org.jetbrains.annotations.NotNull()
    com.pypecrm.app.data.CallBufferEntity entry);
    
    @androidx.room.Query(value = "UPDATE call_buffer SET status = 1 WHERE callSessionId = :sessionId AND status = 0")
    public abstract int markAsProcessing(@org.jetbrains.annotations.NotNull()
    java.lang.String sessionId);
    
    @androidx.room.Update()
    public abstract void update(@org.jetbrains.annotations.NotNull()
    com.pypecrm.app.data.CallBufferEntity entry);
    
    @androidx.room.Query(value = "DELETE FROM call_buffer WHERE isConsolidated = 1 OR createdAt < :timestamp")
    public abstract void cleanup(long timestamp);
}