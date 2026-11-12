# Lupa Check-out: panduan untuk Mobile App (Flutter)

Dokumen ini menerangkan cara app Flutter (`HR-mobile-app/flutter_app`) boleh guna ciri **lupa check-out** yang sama seperti portal PWA (`/hrms`). Logiknya ada di server (app **hse_management**). App mobile hanya perlu:

1. kesan check-in yang terbuka melebihi 3 pagi,
2. tunjuk borang,
3. panggil dua API.

---

## 1. Ringkasan

| Perkara | Peraturan |
|---|---|
| Hari kerja | Bermula 03:00 dan berakhir 02:59:59 keesokan harinya. Check-out pukul 1 pagi masih dikira untuk hari sebelumnya. |
| Bila dikira "lupa check-out" | Log terakhir pekerja ialah **IN** dan hari kerja log itu **sebelum** hari kerja sekarang, iaitu sudah lepas 3 pagi keesokannya. |
| Apa yang pekerja isi | **Masa balik** (wajib), **charge code** (≥ 1), **activity type** (pilihan), **sebab** (wajib) |
| Apa yang server buat | Cipta **Attendance Request** (Pending, untuk HR) dan tulis row **Timesheet bulanan** hari tu |
| Employee Checkin | **Tidak** dicipta. Server Script *Shift Location Error* mewajibkan lokasi di tapak, jadi rekod check-in kekal asal. |
| Berapa kali ditanya | **Sekali** untuk setiap check-in terbuka. Selepas diisi, server tak pulangkan `missed_checkout` lagi. |

---

## 2. Aliran pengguna (sama seperti PWA)

```
Buka app / Dashboard
   │
   ├─ log terakhir = IN dan dah lepas 3 pagi esoknya?
   │      tidak → aliran biasa (Check Out / Check In)
   │      ya    → kad Home: "Not checked in yet — You didn't check out on 4 Nov"
   │              butang menjadi "Check In"
   │
   └─ tekan Check In
          │
          ├─ get_checkin_context() → ada missed_checkout?
          │      ya → buka borang "You forgot to check out"
          │             isi masa balik + charge code + sebab → submit_missed_checkout()
          │             toast "Attendance request HR-ARQ-… was created"
          │      ↓
          └─ teruskan dengan check-in biasa untuk hari ini (punch IN macam sekarang)
```

---

## 3. API

Kedua-dua API dipanggil sebagai user yang log masuk. Session cookie atau token sama seperti panggilan lain dalam `FrappeApi`. Server cari Employee melalui `user_id`.

### 3.1 `GET/POST /api/method/hse_management.timesheet_checkin.get_checkin_context`

Tiada argumen. Contoh respons (`message`):

```json
{
  "charge_code": "S2000",
  "activity_type": "CCTV Vehicle Tracking & LPR",
  "today_charge_codes": [],
  "timesheet": "TS-2026-00099",
  "period_start": "2026-10-26",
  "period_end": "2026-11-25",
  "missed_checkout": {
    "checkin": "EMP-CKIN-11-2026-000519",
    "date": "2026-11-04",
    "check_in_time": "2026-11-04 08:00:00",
    "last_check_in_time": "2026-11-04 08:00:00",
    "latest_checkout_time": "2026-11-05 02:59:59"
  }
}
```

| Medan `missed_checkout` | Maksud |
|---|---|
| `checkin` | Employee Checkin IN yang terbuka |
| `date` | Hari kerja yang terlupa check-out |
| `check_in_time` | IN **pertama** hari tu. Ini permulaan jam dalam Timesheet; guna untuk paparan dan kiraan jam. |
| `last_check_in_time` | IN **terakhir** hari tu. Masa balik mesti **selepas** masa ini. |
| `latest_checkout_time` | Had akhir masa balik (02:59:59 keesokannya) |

`missed_checkout` bernilai `null` kalau tiada apa yang perlu diisi.

`charge_code` dan `activity_type` ialah pilihan terakhir pekerja. Guna untuk isi awal borang.

### 3.2 `POST /api/method/hse_management.timesheet_checkin.submit_missed_checkout`

Body (JSON):

```json
{
  "checkout_time": "2026-11-04 17:30:00",
  "reason": "Phone battery died",
  "charge_codes": ["S2000", "OH001"],
  "activity_type": "CCTV Vehicle Tracking & LPR"
}
```

| Argumen | Wajib | Nota |
|---|---|---|
| `checkout_time` | ✅ | `yyyy-MM-dd HH:mm:ss`, waktu Malaysia (zon masa sistem: Asia/Kuala_Lumpur). Masa selepas tengah malam guna **tarikh esok**, contohnya `2026-11-05 01:30:00`. |
| `reason` | ✅ | Tidak boleh kosong |
| `charge_codes` | ✅ | Senarai nama Charge Code, sekurang-kurangnya satu. Yang berulang dibuang. |
| `activity_type` | | Nama Activity Type, atau `null` |

Contoh respons (`message`):

```json
{
  "attendance_request": "HR-ARQ-26-11-00012",
  "attendance_note": null,
  "timesheet": "TS-2026-00099",
  "timesheet_error": null
}
```

| Medan | Maksud |
|---|---|
| `attendance_request` | Nama Attendance Request yang dicipta, atau yang sedia ada yang meliputi hari tu. `null` kalau tak perlu. |
| `attendance_note` | Sebab tiada request baru, contohnya *"No attendance request needed: Attendance status unchanged"* (hari tu dah Present). Tunjuk sebagai toast biasa. |
| `timesheet` | Nama Timesheet bulanan yang dikemas kini |
| `timesheet_error` | Kalau Timesheet gagal dikemas kini (contohnya dah di-submit). Request tetap dicipta. Tunjuk sebagai amaran. |

### 3.3 Ralat (HTTP 417, `ValidationError`)

| Mesej | Bila |
|---|---|
| `Please give a reason for the missed check-out` | `reason` kosong |
| `Please select a Charge Code` | `charge_codes` kosong |
| `Charge Code X does not exist` / `Activity Type X does not exist` | Nama tak wujud |
| `There is no missed check-out to fill in` | Tiada check-in terbuka, atau dah diisi |
| `Check-out time must be between 8:00 AM and 2:59 AM` | Masa sebelum IN terakhir, atau selepas had 3 pagi |
| `No active Employee is linked to your user` | User tiada Employee aktif |

`FrappeApi._decode` sedia ada dah tukar ralat ni kepada `ApiException` dengan mesej server.

---

## 4. Perubahan di Flutter

### 4.1 Peraturan 3 pagi (`lib/utils/`)

```dart
const workdayCutoffHours = 3;

/// Hari kerja untuk sesuatu masa; sebelum 3 pagi dikira hari sebelumnya.
DateTime workDate(DateTime time) {
  final t = time.subtract(const Duration(hours: workdayCutoffHours));
  return DateTime(t.year, t.month, t.day);
}

/// Check-in yang masih terbuka selepas 3 pagi keesokan harinya.
bool isStaleCheckin(EmployeeCheckin? last) =>
    last != null && last.isIn && workDate(last.time).isBefore(workDate(DateTime.now()));
```

### 4.2 `dashboard_page.dart`

Sekarang (baris ~151):

```dart
final isCheckedIn = checkins.isNotEmpty && checkins.first.isIn;
```

Tukar supaya check-in lama tidak dikira sebagai "sedang bekerja":

```dart
final last = checkins.isNotEmpty ? checkins.first : null;
final isCheckedIn = last != null && last.isIn && !isStaleCheckin(last);
```

Kesannya, butang jadi **Check In**. Untuk kad status, kalau `isStaleCheckin(last)`, tunjuk *"You didn't check out on {tarikh}"*.

### 4.3 `hrms_service.dart`, dua method baru

```dart
/// Check-in terbuka melebihi 3 pagi yang belum diisi, atau null.
Future<Map<String, dynamic>?> fetchMissedCheckout() async {
  final ctx = await _api.callMethod(
      'hse_management.timesheet_checkin.get_checkin_context', {});
  return (ctx as Map<String, dynamic>)['missed_checkout'] as Map<String, dynamic>?;
}

/// Isi lupa check-out: cipta Attendance Request + row Timesheet di server.
Future<Map<String, dynamic>> submitMissedCheckout({
  required DateTime checkoutTime,
  required String reason,
  required List<String> chargeCodes,
  String? activityType,
}) async {
  final res = await _api.callMethod(
      'hse_management.timesheet_checkin.submit_missed_checkout', {
    'checkout_time': DateFormat('yyyy-MM-dd HH:mm:ss').format(checkoutTime),
    'reason': reason.trim(),
    'charge_codes': chargeCodes,
    'activity_type': activityType,
  });
  return res as Map<String, dynamic>;
}
```

Senarai Charge Code dan Activity Type boleh guna method picker sedia ada dalam `hrms_service.dart` (baris ~1026–1050).

### 4.4 Sebelum check-in

Dalam handler butang Check In (sebelum `CheckInOutSheet.show(... 'IN' ...)`):

```dart
final missed = await hrms.fetchMissedCheckout();
if (missed != null) {
  final done = await MissedCheckoutSheet.show(context, missed); // borang baru
  if (done != true) return;   // pekerja tutup borang, jadi jangan teruskan check-in
}
// ... teruskan aliran check-in sedia ada
```

### 4.5 Borang `MissedCheckoutSheet`

| Elemen | Butiran |
|---|---|
| Banner kuning | Tajuk **"You forgot to check out"**; teks *"{Tuesday, 4 Nov}, checked in at {8:00 am}. Fill in when you left; it goes to HR as an attendance request."* |
| Check-out time * | **Senarai pilihan setiap 5 minit** dari selepas `last_check_in_time` hingga sebelum 03:00 esok. Masa selepas tengah malam dilabel *"1:30 am (next day)"*. Dengan cara ni, masa yang tak sah tak boleh dipilih langsung. |
| Charge codes worked on {4 Nov} * | Multi-pilih, diisi awal dengan `charge_code` dari context. Tunjuk jam setiap code = (masa balik − `check_in_time`) ÷ bilangan code. |
| Activity Type | Pilihan, diisi awal dengan `activity_type` |
| Reason * | Teks berbilang baris |
| Butang **Submit & Continue** | Aktif hanya bila masa, ≥ 1 code dan sebab diisi |

Selepas berjaya:
- `attendance_request` ada → toast *"Sent to HR — Attendance request {name} was created"*
- `attendance_note` ada → toast biasa dengan nota tu
- `timesheet_error` ada → toast amaran *"Timesheet not updated: …"*
- `Navigator.pop(context, true)`, kemudian teruskan ke check-in hari ini

Contoh menjana senarai masa:

```dart
List<DateTime> checkoutOptions(Map<String, dynamic> missed) {
  final day = DateTime.parse(missed['date'] as String);
  final end = DateTime(day.year, day.month, day.day + 1, workdayCutoffHours);
  final lastIn = DateTime.parse(missed['last_check_in_time'] as String);
  var t = DateTime(lastIn.year, lastIn.month, lastIn.day, lastIn.hour, lastIn.minute)
      .add(Duration(minutes: 5 - lastIn.minute % 5));
  final options = <DateTime>[];
  for (; t.isBefore(end); t = t.add(const Duration(minutes: 5))) options.add(t);
  return options;
}
```

---

## 5. Perkara yang perlu diketahui

- **Timesheet harian Flutter vs Timesheet bulanan.** Flutter sekarang cipta satu Timesheet setiap hari. API ni pula tulis ke **Timesheet bulanan** (26hb–25hb, dicari melalui note *"Monthly timesheet …"*), sama seperti PWA. Kalau pekerja guna kedua-dua app, jam hari tu muncul dalam Timesheet bulanan. Selaraskan nanti kalau Flutter juga nak beralih ke Timesheet bulanan.
- **Check-out biasa dari Flutter tidak isi Timesheet bulanan.** Ia hanya cipta Employee Checkin. Hanya aliran lupa check-out ni yang guna API Timesheet dari Flutter.
- **"Sekali sahaja" dikongsi antara app.** Kalau pekerja dah isi di PWA, Flutter tak akan tanya lagi, dan sebaliknya. Ini kerana tandanya disimpan di server (user default `hse_missed_checkout_done`).
- **HR Reject tidak buang row Timesheet.** Supervisor betulkan semasa peringkat Review dalam workflow Timesheet. Row yang terlibat ada description *"Missed check-out, filled in by the employee (HR-ARQ-…)"*.
- **Attendance Request:** Reason *On Duty*, `custom_check_out_time` = masa balik, *Include Holidays* hidup, dan Explanation *"Forgot to check out. Left at 5:30 PM. Reason: …"*. Workflow: **Pending → Approve/Reject (HR Manager)**. Bila diluluskan, hrms cipta rekod Attendance hari tu.
- **Request tidak dicipta** kalau hari tu dah bertanda Present, cuti, atau sudah ada Attendance Request yang meliputinya. Timesheet tetap ditulis.
- **Perlu hse_management versi terkini** di server. Kalau API tiada (HTTP 404 atau `Failed to get method`), abaikan dan teruskan check-in biasa supaya app tak tersekat.

---

## 6. Cara uji tanpa tunggu esok (staging)

1. Cipta Employee Checkin **IN bertarikh semalam** untuk akaun ujian. Cara paling mudah ialah melalui Desk: `/app/employee-checkin/new`. Log tu mesti log **terakhir** pekerja; padam log hari ini kalau ada.
2. Buka app dan pastikan Dashboard tunjuk *"You didn't check out on …"* dan butang **Check In**.
3. Tekan Check In. Borang keluar. Isi masa, code dan sebab, kemudian Submit.
4. Semak di Desk:
   - **Attendance Request** dengan status Pending dan Check Out Time yang betul;
   - **Timesheet** bulanan dengan row hari tu yang bertanda *Missed check-out*.
5. Tekan Check In sekali lagi. Borang **tidak** keluar dan terus ke check-in biasa.

Data staging dipadam setiap malam pukul 00:00 oleh sync dari prod.
