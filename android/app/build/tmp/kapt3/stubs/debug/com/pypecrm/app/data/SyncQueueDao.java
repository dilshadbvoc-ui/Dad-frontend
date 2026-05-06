package com.pypecrm.app.data;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\bg\u0018\u00002\u00020\u0001J\u0010\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\'J\u000e\u0010\u0006\u001a\b\u0012\u0004\u0012\u00020\u00050\u0007H\'J\u0010\u0010\b\u001a\u00020\u00032\u0006\u0010\t\u001a\u00020\nH\'J\u0010\u0010\u000b\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\'\u00a8\u0006\f"}, d2 = {"Lcom/pypecrm/app/data/SyncQueueDao;", "", "delete", "", "entry", "Lcom/pypecrm/app/data/SyncQueueEntry;", "getAllPending", "", "incrementAttempts", "id", "", "insert", "app_debug"})
@androidx.room.Dao()
public abstract interface SyncQueueDao {
    
    @androidx.room.Query(value = "SELECT * FROM sync_queue ORDER BY createdAt ASC")
    @org.jetbrains.annotations.NotNull()
    public abstract java.util.List<com.pypecrm.app.data.SyncQueueEntry> getAllPending();
    
    @androidx.room.Insert(onConflict = 1)
    public abstract void insert(@org.jetbrains.annotations.NotNull()
    com.pypecrm.app.data.SyncQueueEntry entry);
    
    @androidx.room.Delete()
    public abstract void delete(@org.jetbrains.annotations.NotNull()
    com.pypecrm.app.data.SyncQueueEntry entry);
    
    @androidx.room.Query(value = "UPDATE sync_queue SET attempts = attempts + 1 WHERE id = :id")
    public abstract void incrementAttempts(int id);
}