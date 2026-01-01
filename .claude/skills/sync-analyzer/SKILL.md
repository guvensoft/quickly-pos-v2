---
name: sync-analyzer
description: Offline/online senkronizasyonunu analiz eder, data consistency problemlerini bulur, conflict resolution stratejileri önerir ve sync logic'i optimize eder.
---

# Synchronization Analyzer

Bu skill, POS sistemindeki data senkronizasyonunu analiz ederken:
- Offline/online detection
- Data conflict detection
- Consistency checking
- Sync queue management
- Last write wins vs. merge strategies
- Timestamp management
- Rollback strategies
- Network failure recovery

## Senkronizasyon Akışı

```
┌─────────────┐
│   Offline   │
│   Local DB  │
└──────┬──────┘
       │ (Queue Changes)
       │
   ╔═══╧════════════════╗
   ║  Network Status?   ║
   ║  Online/Offline    ║
   ╚═══╦════════════════╝
       │
   ┌───┴─────────────┐
   │                 │
   │ Offline    Online
   │  (Queue)   (Sync)
   │
   │         ┌──────────────────┐
   │         │ Check Conflicts  │
   │         └────────┬─────────┘
   │                  │
   │         ┌────────┴────────┐
   │         │                 │
   │       No Conflict    Conflict Exists
   │       (Merge)        (Resolve)
   │          │               │
   │      Remote DB      Ask User / Auto-Resolve
   │          │               │
   │          └───────┬───────┘
   │                  │
   │          ┌───────▼────────┐
   │          │  Sync Local    │
   │          │ Update UI      │
   │          └────────────────┘
```

## Conflict Resolution Strategies

### 1. Last Write Wins (LWW)
```typescript
if (local.timestamp > remote.timestamp) {
  // Yerel veriyi tut
  updateRemote(local);
} else {
  // Remote veriyi al
  updateLocal(remote);
}
```

### 2. User Decides
```typescript
if (conflict) {
  this.dialogFacade.openConfirmModal({
    title: 'Veri Çatışması',
    message: 'Yerel mi, sunucu mu kullanılsın?'
  }).subscribe(choice => {
    if (choice === 'local') {
      updateRemote(local);
    } else {
      updateLocal(remote);
    }
  });
}
```

### 3. Three-way Merge
```typescript
const merged = merge3(base, local, remote);
if (merged.hasConflicts) {
  // Manual resolution gerekli
  presentMergeConflicts(merged);
} else {
  applyMerge(merged);
}
```

## Veri Tutarlılığı Kontrol Listesi

### Offline Mode
- [ ] Tüm CRUD işlemleri offline'da çalışıyor mu?
- [ ] Veriler local DB'ye kaydediliyor mu?
- [ ] Queue merkezi bir yerde mi?
- [ ] Status göstergesi var mı?

### Sync Operation
- [ ] Network durumu kontrol edildi mi?
- [ ] Conflict detection var mı?
- [ ] Retry logic var mı?
- [ ] Sync progress gösterildi mi?

### Data Validation
- [ ] Sync öncesi data doğrulanmış mı?
- [ ] Timestamp'ler tutarlı mı?
- [ ] Version tracking var mı?

## Sync Queue Örneği

```typescript
interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  resource: string;
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'synced' | 'failed';
}

// Queue'yu kalıcı hale getir (localStorage/indexedDB)
private syncQueue: SyncQueueItem[] = [];

async addToQueue(item: SyncQueueItem) {
  this.syncQueue.push(item);
  await this.persistQueue();
}

async syncQueue() {
  for (const item of this.syncQueue) {
    try {
      await this.sync(item);
      item.status = 'synced';
    } catch (error) {
      item.retryCount++;
      if (item.retryCount > 3) {
        item.status = 'failed';
        this.notifyUser('Sync başarısız: ' + item.resource);
      }
    }
  }
  await this.persistQueue();
}
```

## Network Detection

```typescript
// Online/Offline detector
private setupNetworkListener() {
  window.addEventListener('online', () => {
    this.isOnline$.next(true);
    this.syncPendingChanges();
  });

  window.addEventListener('offline', () => {
    this.isOnline$.next(false);
    this.showOfflineNotice();
  });
}
```

## Rollback Stratejisi

```typescript
async saveWithRollback(data: any) {
  const backup = { ...this.localData };

  try {
    // Optimistic update
    this.localData = data;
    this.updateUI();

    // Sunucuya gönder
    await this.api.save(data);
  } catch (error) {
    // Rollback
    this.localData = backup;
    this.updateUI();
    throw error;
  }
}
```

"Offline'da çalışamıyor" veya "Veri senkronizasyonunda sorun" gibi raporlarda çalışacağım.
