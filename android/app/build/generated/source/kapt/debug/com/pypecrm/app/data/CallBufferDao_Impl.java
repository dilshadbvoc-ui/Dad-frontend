package com.pypecrm.app.data;

import android.database.Cursor;
import androidx.annotation.NonNull;
import androidx.room.EntityDeletionOrUpdateAdapter;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.SharedSQLiteStatement;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class CallBufferDao_Impl implements CallBufferDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<CallBufferEntity> __insertionAdapterOfCallBufferEntity;

  private final EntityDeletionOrUpdateAdapter<CallBufferEntity> __updateAdapterOfCallBufferEntity;

  private final SharedSQLiteStatement __preparedStmtOfMarkAsProcessing;

  private final SharedSQLiteStatement __preparedStmtOfCleanup;

  public CallBufferDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfCallBufferEntity = new EntityInsertionAdapter<CallBufferEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR REPLACE INTO `call_buffer` (`callSessionId`,`phoneNumber`,`startTime`,`type`,`recordingPath`,`isConsolidated`,`status`,`createdAt`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CallBufferEntity entity) {
        if (entity.getCallSessionId() == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.getCallSessionId());
        }
        if (entity.getPhoneNumber() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getPhoneNumber());
        }
        statement.bindLong(3, entity.getStartTime());
        if (entity.getType() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getType());
        }
        if (entity.getRecordingPath() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getRecordingPath());
        }
        final int _tmp = entity.isConsolidated() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindLong(7, entity.getStatus());
        statement.bindLong(8, entity.getCreatedAt());
      }
    };
    this.__updateAdapterOfCallBufferEntity = new EntityDeletionOrUpdateAdapter<CallBufferEntity>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "UPDATE OR ABORT `call_buffer` SET `callSessionId` = ?,`phoneNumber` = ?,`startTime` = ?,`type` = ?,`recordingPath` = ?,`isConsolidated` = ?,`status` = ?,`createdAt` = ? WHERE `callSessionId` = ?";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final CallBufferEntity entity) {
        if (entity.getCallSessionId() == null) {
          statement.bindNull(1);
        } else {
          statement.bindString(1, entity.getCallSessionId());
        }
        if (entity.getPhoneNumber() == null) {
          statement.bindNull(2);
        } else {
          statement.bindString(2, entity.getPhoneNumber());
        }
        statement.bindLong(3, entity.getStartTime());
        if (entity.getType() == null) {
          statement.bindNull(4);
        } else {
          statement.bindString(4, entity.getType());
        }
        if (entity.getRecordingPath() == null) {
          statement.bindNull(5);
        } else {
          statement.bindString(5, entity.getRecordingPath());
        }
        final int _tmp = entity.isConsolidated() ? 1 : 0;
        statement.bindLong(6, _tmp);
        statement.bindLong(7, entity.getStatus());
        statement.bindLong(8, entity.getCreatedAt());
        if (entity.getCallSessionId() == null) {
          statement.bindNull(9);
        } else {
          statement.bindString(9, entity.getCallSessionId());
        }
      }
    };
    this.__preparedStmtOfMarkAsProcessing = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "UPDATE call_buffer SET status = 1 WHERE callSessionId = ? AND status = 0";
        return _query;
      }
    };
    this.__preparedStmtOfCleanup = new SharedSQLiteStatement(__db) {
      @Override
      @NonNull
      public String createQuery() {
        final String _query = "DELETE FROM call_buffer WHERE isConsolidated = 1 OR createdAt < ?";
        return _query;
      }
    };
  }

  @Override
  public void insert(final CallBufferEntity entry) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __insertionAdapterOfCallBufferEntity.insert(entry);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public void update(final CallBufferEntity entry) {
    __db.assertNotSuspendingTransaction();
    __db.beginTransaction();
    try {
      __updateAdapterOfCallBufferEntity.handle(entry);
      __db.setTransactionSuccessful();
    } finally {
      __db.endTransaction();
    }
  }

  @Override
  public int markAsProcessing(final String sessionId) {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfMarkAsProcessing.acquire();
    int _argIndex = 1;
    if (sessionId == null) {
      _stmt.bindNull(_argIndex);
    } else {
      _stmt.bindString(_argIndex, sessionId);
    }
    try {
      __db.beginTransaction();
      try {
        final int _result = _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
        return _result;
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfMarkAsProcessing.release(_stmt);
    }
  }

  @Override
  public void cleanup(final long timestamp) {
    __db.assertNotSuspendingTransaction();
    final SupportSQLiteStatement _stmt = __preparedStmtOfCleanup.acquire();
    int _argIndex = 1;
    _stmt.bindLong(_argIndex, timestamp);
    try {
      __db.beginTransaction();
      try {
        _stmt.executeUpdateDelete();
        __db.setTransactionSuccessful();
      } finally {
        __db.endTransaction();
      }
    } finally {
      __preparedStmtOfCleanup.release(_stmt);
    }
  }

  @Override
  public List<CallBufferEntity> getUnconsolidated() {
    final String _sql = "SELECT * FROM call_buffer WHERE status = 0 ORDER BY createdAt ASC";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 0);
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfCallSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "callSessionId");
      final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
      final int _cursorIndexOfStartTime = CursorUtil.getColumnIndexOrThrow(_cursor, "startTime");
      final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
      final int _cursorIndexOfRecordingPath = CursorUtil.getColumnIndexOrThrow(_cursor, "recordingPath");
      final int _cursorIndexOfIsConsolidated = CursorUtil.getColumnIndexOrThrow(_cursor, "isConsolidated");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
      final List<CallBufferEntity> _result = new ArrayList<CallBufferEntity>(_cursor.getCount());
      while (_cursor.moveToNext()) {
        final CallBufferEntity _item;
        final String _tmpCallSessionId;
        if (_cursor.isNull(_cursorIndexOfCallSessionId)) {
          _tmpCallSessionId = null;
        } else {
          _tmpCallSessionId = _cursor.getString(_cursorIndexOfCallSessionId);
        }
        final String _tmpPhoneNumber;
        if (_cursor.isNull(_cursorIndexOfPhoneNumber)) {
          _tmpPhoneNumber = null;
        } else {
          _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
        }
        final long _tmpStartTime;
        _tmpStartTime = _cursor.getLong(_cursorIndexOfStartTime);
        final String _tmpType;
        if (_cursor.isNull(_cursorIndexOfType)) {
          _tmpType = null;
        } else {
          _tmpType = _cursor.getString(_cursorIndexOfType);
        }
        final String _tmpRecordingPath;
        if (_cursor.isNull(_cursorIndexOfRecordingPath)) {
          _tmpRecordingPath = null;
        } else {
          _tmpRecordingPath = _cursor.getString(_cursorIndexOfRecordingPath);
        }
        final boolean _tmpIsConsolidated;
        final int _tmp;
        _tmp = _cursor.getInt(_cursorIndexOfIsConsolidated);
        _tmpIsConsolidated = _tmp != 0;
        final int _tmpStatus;
        _tmpStatus = _cursor.getInt(_cursorIndexOfStatus);
        final long _tmpCreatedAt;
        _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
        _item = new CallBufferEntity(_tmpCallSessionId,_tmpPhoneNumber,_tmpStartTime,_tmpType,_tmpRecordingPath,_tmpIsConsolidated,_tmpStatus,_tmpCreatedAt);
        _result.add(_item);
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @Override
  public CallBufferEntity getBySessionId(final String sessionId) {
    final String _sql = "SELECT * FROM call_buffer WHERE callSessionId = ? LIMIT 1";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    if (sessionId == null) {
      _statement.bindNull(_argIndex);
    } else {
      _statement.bindString(_argIndex, sessionId);
    }
    __db.assertNotSuspendingTransaction();
    final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
    try {
      final int _cursorIndexOfCallSessionId = CursorUtil.getColumnIndexOrThrow(_cursor, "callSessionId");
      final int _cursorIndexOfPhoneNumber = CursorUtil.getColumnIndexOrThrow(_cursor, "phoneNumber");
      final int _cursorIndexOfStartTime = CursorUtil.getColumnIndexOrThrow(_cursor, "startTime");
      final int _cursorIndexOfType = CursorUtil.getColumnIndexOrThrow(_cursor, "type");
      final int _cursorIndexOfRecordingPath = CursorUtil.getColumnIndexOrThrow(_cursor, "recordingPath");
      final int _cursorIndexOfIsConsolidated = CursorUtil.getColumnIndexOrThrow(_cursor, "isConsolidated");
      final int _cursorIndexOfStatus = CursorUtil.getColumnIndexOrThrow(_cursor, "status");
      final int _cursorIndexOfCreatedAt = CursorUtil.getColumnIndexOrThrow(_cursor, "createdAt");
      final CallBufferEntity _result;
      if (_cursor.moveToFirst()) {
        final String _tmpCallSessionId;
        if (_cursor.isNull(_cursorIndexOfCallSessionId)) {
          _tmpCallSessionId = null;
        } else {
          _tmpCallSessionId = _cursor.getString(_cursorIndexOfCallSessionId);
        }
        final String _tmpPhoneNumber;
        if (_cursor.isNull(_cursorIndexOfPhoneNumber)) {
          _tmpPhoneNumber = null;
        } else {
          _tmpPhoneNumber = _cursor.getString(_cursorIndexOfPhoneNumber);
        }
        final long _tmpStartTime;
        _tmpStartTime = _cursor.getLong(_cursorIndexOfStartTime);
        final String _tmpType;
        if (_cursor.isNull(_cursorIndexOfType)) {
          _tmpType = null;
        } else {
          _tmpType = _cursor.getString(_cursorIndexOfType);
        }
        final String _tmpRecordingPath;
        if (_cursor.isNull(_cursorIndexOfRecordingPath)) {
          _tmpRecordingPath = null;
        } else {
          _tmpRecordingPath = _cursor.getString(_cursorIndexOfRecordingPath);
        }
        final boolean _tmpIsConsolidated;
        final int _tmp;
        _tmp = _cursor.getInt(_cursorIndexOfIsConsolidated);
        _tmpIsConsolidated = _tmp != 0;
        final int _tmpStatus;
        _tmpStatus = _cursor.getInt(_cursorIndexOfStatus);
        final long _tmpCreatedAt;
        _tmpCreatedAt = _cursor.getLong(_cursorIndexOfCreatedAt);
        _result = new CallBufferEntity(_tmpCallSessionId,_tmpPhoneNumber,_tmpStartTime,_tmpType,_tmpRecordingPath,_tmpIsConsolidated,_tmpStatus,_tmpCreatedAt);
      } else {
        _result = null;
      }
      return _result;
    } finally {
      _cursor.close();
      _statement.release();
    }
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
