# Garmin Integration Roadmap

## Current State

The FinalClimb Connect IQ app syncs pacing data via a sync code system:
- User generates code on web (`FC-XXXX-XXXX`, valid 30 days)
- Connect IQ app fetches race plan using code
- Data cached on device for offline use

### Current App Screens (3 pages)
1. **Overview** - Race name, distance, goal time, athlete name
2. **Power** - FTP, adjusted FTP, Safe/Tempo/Push targets, climb/flat zones
3. **Checkpoints** - Paginated list with name, mile, target time, effort level

### What Syncs Currently
- Checkpoint names and cumulative target times
- Power targets (if FTP set)
- Effort levels per segment

### What Does NOT Sync
- Nutrition plan (only available as copy-paste text or PDF sticker)

---

## Proposed Enhancements

### Phase 1: Add Nutrition to Sync (Quick Win)
- Add nutrition data to sync payload
- Add 1-2 nutrition pages to Connect IQ app
- No customization - syncs everything

New screens:
- **Nutrition Now** - Current hour's products to eat
- **Nutrition Next** - Next hour preview

### Phase 2: User Choice / Modular Sync
Add checkboxes in GarminExportModal:
```
☑ Checkpoint splits & times
☑ Power targets  
☐ Nutrition plan (hour-by-hour)
```

API includes flags:
```json
{
  "includes": {
    "checkpoints": true,
    "power": true,
    "nutrition": false
  }
}
```

Connect IQ app shows/hides pages based on what was synced.

### Phase 3: Garmin Data Fields (Advanced)
Build actual data fields for during-activity display:
- **Split ETA** - time to next checkpoint
- **Current Nutrition** - what to eat this hour
- **Power Target** - based on current terrain

Requires more Connect IQ development work.

---

## Technical Notes

### Supported Devices
- Edge: 530, 540, 830, 840, 1030, 1040, 1050
- Fenix: 6/6s/6xpro, 7/7s/7x, 8
- Forerunner: 255, 265, 945, 955, 965
- Enduro: Original, Enduro 2
- Epix 2: All sizes

### Key Files
- `/src/components/garmin/GarminExportModal.tsx` - Web UI
- `/src/app/api/garmin/sync-code/route.ts` - Code generation
- `/src/app/api/garmin/sync/[code]/route.ts` - Code validation (public)
- `/garmin-app/` - Connect IQ MonkeyC source
