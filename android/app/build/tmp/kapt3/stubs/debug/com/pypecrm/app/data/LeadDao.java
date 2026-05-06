package com.pypecrm.app.data;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010 \n\u0002\b\u0002\n\u0002\u0010\u0011\n\u0002\b\u0002\bg\u0018\u00002\u00020\u0001J\b\u0010\u0002\u001a\u00020\u0003H\'J\u0012\u0010\u0004\u001a\u0004\u0018\u00010\u00052\u0006\u0010\u0006\u001a\u00020\u0007H\'J\u000e\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00050\tH\'J!\u0010\n\u001a\u00020\u00032\u0012\u0010\u000b\u001a\n\u0012\u0006\b\u0001\u0012\u00020\u00050\f\"\u00020\u0005H\'\u00a2\u0006\u0002\u0010\r\u00a8\u0006\u000e"}, d2 = {"Lcom/pypecrm/app/data/LeadDao;", "", "deleteAll", "", "findLeadByPhone", "Lcom/pypecrm/app/data/LeadEntity;", "phoneNumber", "", "getAllLeads", "", "insertAll", "leads", "", "([Lcom/pypecrm/app/data/LeadEntity;)V", "app_debug"})
@androidx.room.Dao()
public abstract interface LeadDao {
    
    @androidx.room.Query(value = "SELECT * FROM leads WHERE phone = :phoneNumber OR phone LIKE \'%\' || :phoneNumber OR :phoneNumber LIKE \'%\' || phone LIMIT 1")
    @org.jetbrains.annotations.Nullable()
    public abstract com.pypecrm.app.data.LeadEntity findLeadByPhone(@org.jetbrains.annotations.NotNull()
    java.lang.String phoneNumber);
    
    @androidx.room.Insert(onConflict = 1)
    public abstract void insertAll(@org.jetbrains.annotations.NotNull()
    com.pypecrm.app.data.LeadEntity... leads);
    
    @androidx.room.Query(value = "DELETE FROM leads")
    public abstract void deleteAll();
    
    @androidx.room.Query(value = "SELECT * FROM leads")
    @org.jetbrains.annotations.NotNull()
    public abstract java.util.List<com.pypecrm.app.data.LeadEntity> getAllLeads();
}