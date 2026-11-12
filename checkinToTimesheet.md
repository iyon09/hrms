# Check-in / Check-out → Timesheet

Dokumen ini menerangkan macam mana check-in dan check-out dari portal HR (`/hrms`) terus mengisi **Timesheet bulanan** pekerja. Ia merangkumi aliran pengguna, peraturan pengiraan jam, kod yang terlibat, keperluan sistem, cara deploy dan cara uji.

---

## 1. Ringkasan

| Perkara | Peraturan |
|---|---|
| Satu Timesheet | Satu untuk setiap pekerja, setiap **tempoh 26hb hingga 25hb** bulan berikutnya |
| Satu hari | Masa dari **check-in pertama** hingga **check-out terakhir** hari tu. Hari kerja berakhir **3 pagi** keesokannya, jadi check-out pukul 1 pagi masih dikira untuk hari sebelumnya. |
| Lupa check-out | Selepas 3 pagi, popup minta masa balik, charge code dan sebab. Sistem tulis row Timesheet dan cipta **Attendance Request** untuk HR (lihat bahagian 2). |
| Charge code | Pilih **satu masa check-in**. Masa check-out boleh **tambah** code lain yang dibuat hari tu. |
| Pembahagian jam | Jam sehari **dibahagi sama rata** antara semua charge code yang dipilih |
| Bila Timesheet dikemas kini | Setiap kali **check-out**. Check-out semula pada hari yang sama akan tulis semula row hari tu. |
| Sumber | Portal PWA (`/hrms`) sahaja |
| Status Timesheet | Kekal **Draft**. Pekerja atau HR hantar melalui workflow "Timesheet -Workflow" seperti biasa. |

Contoh: check-in pukul 08:00, check-out pukul 17:00, dengan code `T1077` dan `S2000`. Hasilnya dua row:

| Tarikh | From | To | Jam | Charge Code |
|---|---|---|---|---|
| 14 Nov | 08:00 | 12:30 | 4.5 | T1077 |
| 14 Nov | 12:30 | 17:00 | 4.5 | S2000 |

Kalau pekerja check-out semula dengan 3 code, row hari tu ditulis semula jadi 3 + 3 + 3 jam.

---

## 2. Aliran pengguna

### Check-in
1. Di Home, tekan **Check In**. Popup akan keluar.
2. Pilih **Charge Code** (wajib). Code terakhir yang digunakan dah dipilih secara automatik.
3. Pilih **Activity Type** (pilihan; yang terakhir digunakan juga dah dipilih).
4. Tekan **Confirm Check In**. Sistem cipta rekod Employee Checkin.

Semasa check-in, Timesheet **belum diubah**.

### Check-out
1. Tekan **Check Out**. Popup tunjuk senarai **"Charge codes worked on today"**, yang diisi awal seperti berikut:
   - code yang dah ada dalam Timesheet hari ni (kalau ini check-out kedua), atau
   - code yang dipilih masa check-in.
2. Tambah code lain melalui **"+ Add another charge code"**, atau buang dengan ✕.
3. Popup tunjuk anggaran, contohnya "9.0 hrs today, split equally between 2 charge code(s)", dan jam untuk setiap code.
4. Tekan **Confirm Check Out**. Sistem akan:
   - cipta rekod Employee Checkin (OUT),
   - cari atau cipta Timesheet untuk tempoh tersebut,
   - tulis semula row hari ni,
   - tunjuk toast **"Timesheet updated"**.

Kalau tiada charge code dipilih, butang Confirm tak aktif dan keluar amaran *"Pick at least one charge code to check out"*.

Kalau check-out berjaya tapi Timesheet gagal dikemas kini (contohnya Timesheet tempoh tu dah di-submit), rekod check-out **tetap disimpan**. Toast merah *"Timesheet not updated"* akan keluar dengan sebabnya.

### Lupa check-out
Kalau check-in masih terbuka selepas **3 pagi** keesokan harinya, panel tunjuk *"Not checked in yet — You didn't check out on 4 Nov"*. Bila pekerja tekan **Check In**:

1. Popup tunjuk amaran **"You forgot to check out"** dengan tarikh dan masa check-in hari tu.
2. Pekerja isi:
   - **Check-out time** (wajib). Masa sebelum 3 pagi dikira sebagai pagi keesokannya. Ia mesti selepas check-in terakhir hari tu.
   - **Charge code** (sekurang-kurangnya satu, boleh lebih).
   - **Activity Type** (pilihan).
   - **Reason** (wajib).
3. Pekerja tekan **Submit & Continue**. Sistem akan:
   - cipta **Attendance Request** (Reason *On Duty*, `custom_check_out_time` = masa balik, Explanation = sebab, *Include Holidays* hidup). Ia masuk workflow **Pending → Approve/Reject (HR Manager)**;
   - tulis row Timesheet hari tu (check-in pertama → masa yang diisi, bahagi sama rata), dengan description *"Missed check-out, filled in by the employee (HR-ARQ-…)"* supaya supervisor nampak semasa **Review**;
   - tutup popup amaran dan terus ke check-in biasa untuk hari ini.

Perincian:
- **Tiada Employee Checkin OUT dicipta.** Server Script *Shift Location Error* mewajibkan lokasi semasa di tapak, jadi rekod checkin kekal asal. Pembetulan hanya dalam Attendance Request dan Timesheet.
- Popup hanya keluar **sekali** untuk setiap check-in terbuka (disimpan dalam user default `hse_missed_checkout_done`).
- **Attendance Request tidak dicipta** kalau tiada apa untuk HR luluskan (contohnya hari tu sudah bertanda Present, cuti, atau sudah ada Attendance Request yang meliputi hari tu). Timesheet tetap ditulis, dan toast menerangkan sebabnya.
- Kalau HR **Reject**, row Timesheet **tidak** dibuang secara automatik. Supervisor betulkan semasa Review.

---

## 3. Bagaimana ia berfungsi (teknikal)

```
PWA (CheckInPanel.vue)
  │  buka popup ─────────────► get_checkin_context()  ── default code/activity, code hari ni, tempoh
  │  Confirm ────────────────► log_checkin(log_type, time, charge_codes, activity_type, lat, long)
  │                                 ├─ insert Employee Checkin
  │                                 ├─ simpan code/activity sebagai default user
  │                                 └─ (OUT sahaja) sync_day(employee, tarikh, codes, activity)
  │                                        ├─ ambil IN pertama & OUT terakhir hari tu
  │                                        ├─ cari/cipta Timesheet Draft tempoh 26–25
  │                                        ├─ buang row tarikh tu, tambah row baru (bahagi sama rata)
  │                                        └─ save (ikut permission pekerja)
```

### 3.1 Server: `hse_management/timesheet_checkin.py`

Kod server diletakkan dalam app **hse_management**, bukan hrms, kerana hrms dibina ke dalam image Docker manakala hse_management di-mount terus.

| Fungsi | Jenis | Kegunaan |
|---|---|---|
| `get_checkin_context()` | `@frappe.whitelist()` | Pulangkan `charge_code` dan `activity_type` terakhir user, `today_charge_codes`, `timesheet`, `period_start`, `period_end` dan `missed_checkout` (check-in terbuka yang belum diisi, atau null) |
| `log_checkin(...)` | `@frappe.whitelist(methods=["POST"])` | Semak input, cipta Employee Checkin, dan bila OUT panggil `sync_day` |
| `submit_missed_checkout(checkout_time, reason, charge_codes, activity_type)` | `@frappe.whitelist(methods=["POST"])` | Lupa check-out: cipta Attendance Request dan tulis row Timesheet hari tu |
| `work_date(time)` / `workday_window(date)` | dalaman | Hari kerja untuk sesuatu masa (sebelum 3 pagi = hari sebelumnya), dan julat 03:00–02:59:59 |
| `sync_day(employee, date, charge_codes, activity_type)` | dalaman | Tulis semula row satu hari dalam Timesheet tempoh tersebut |
| `get_period(date)` | dalaman | Pulangkan tarikh mula (26hb) dan tamat (25hb) tempoh |
| `_find_period_timesheet(employee, period_start)` | dalaman | Cari Timesheet Draft tempoh tu; `throw` kalau versi yang dah di-submit wujud |

Perincian penting:
- **Tanda Timesheet bulanan.** Field `note` diisi `Monthly timesheet <YYYY-MM-DD> to <YYYY-MM-DD>`, dan Timesheet dicari melalui teks ni. **Jangan ubah note ini.**
- **Default user.** Kunci `hse_timesheet_charge_code` dan `hse_timesheet_activity_type` (`frappe.defaults.set_user_default`) digunakan untuk isi popup seterusnya.
- **Pembahagian jam.** `(OUT terakhir − IN pertama) ÷ bilangan code`. Row disusun bersambung, dan row terakhir sentiasa tamat tepat pada OUT terakhir, jadi tiada baki saat yang hilang.
- **Semakan input.** `log_type` mesti IN atau OUT, sekurang-kurangnya satu Charge Code yang wujud, dan Activity Type yang wujud (kalau diberi). Code yang berulang dibuang.
- **Permission.** `doc.save()` biasa, jadi ia ikut permission pekerja. Role Employee perlu create/write Timesheet.
- **Ralat Timesheet tidak membatalkan check-out.** Ralat direkod dalam Error Log dengan tajuk *"Timesheet sync from check-out failed"*.

### 3.2 PWA: `frontend/src/components/CheckInPanel.vue`

- `timesheetContext`: dimuat bila popup dibuka. Kalau API tak wujud (hse_management belum di-deploy), `timesheetEnabled` = false dan popup **kembali ke check-in asal** tanpa bahagian Timesheet.
- Senarai **Charge Code** (`name`, `description`, `work_group`) dan **Activity Type** dimuat melalui `createListResource`.
- `workedHours`: dari IN pertama hari ni hingga sekarang, untuk paparan anggaran sahaja. Pengiraan sebenar dibuat di server.
- `submitLog()` hantar ke `hse_management.timesheet_checkin.log_checkin`, kemudian tunjuk toast kejayaan atau `timesheet_error`.

---

## 4. Keperluan sistem (sudah ada di prod)

| Keperluan | Butiran |
|---|---|
| DocType **Charge Code** | Custom DocType (field: `description`, `work_group`, dan lain-lain) |
| Custom Field **Timesheet Detail → `custom_charge_code`** | Link ke Charge Code |
| **Activity Type** | Contohnya HSE & Compliance, Engineering & Design, General, IT |
| Permission role **Employee** | Create/write **Timesheet**, read **Charge Code** dan **Activity Type** |
| **Projects Settings** | *Ignore employee/user time overlap* hidup, supaya row bersambung tak dikira bertindih |
| HR Settings | *Allow Employee Checkin from Mobile App* hidup |

### Workflow Timesheet
Timesheet dicipta dalam keadaan **Draft**. Untuk teruskan ke *Submit For Approval → Review → Checked → Acknowledged → Approved*, field `custom_review_by`, `custom_check_by`, `custom_ackowledged_by` dan `custom_approved_by` mesti diisi, kerana syarat workflow bergantung padanya. Ciri ini **tidak** mengisi field tersebut. Pekerja atau HR isi sebelum hantar.

---

## 5. Deploy ke prod

1. **Server (hse_management)**
   - Commit `hse_management/timesheet_checkin.py` dan push ke repo hse_management.
   - Di prod: `git pull` dalam folder hse_management, kemudian restart backend:
     ```bash
     docker compose restart backend
     ```
     Gunicorn tak auto-reload kod Python.
2. **PWA (hrms frontend)**
   - Commit perubahan `frontend/`, build PWA, dan bina semula image (`erpnext-hse-custom`) supaya `/hrms` di prod guna frontend baru.
3. **Uji di prod** dengan satu akaun pekerja: check-in, kemudian check-out dengan 2 code, kemudian semak Timesheet.

> Turutan: deploy **server dulu**. Kalau PWA baru sampai dulu tanpa API, popup tetap berfungsi tetapi tanpa bahagian Timesheet.

---

## 6. Cara uji di staging (server ini)

1. Data prod disalin ke sini setiap malam pukul **00:00** oleh `~/erp-sync/erp_sync.sh`. Email dan scheduler dimatikan secara automatik.
2. Untuk uji tanpa GPS, matikan sementara:
   - HR Settings → *Allow Geolocation Tracking*
   - Server Script **"Shift Location Error"** dan **"Location tracker"** (Employee Checkin)

   Sync malam akan **hidupkan semula** kedua-duanya dan **memadam** Timesheet ujian.
3. Buka `http://<staging>:8081/hrms` (atau domain HTTPS yang dihalakan ke port 8081). Lakukan check-in, kemudian check-out dengan 1–3 code.
4. Semak di Desk → **Timesheet** → cari note *"Monthly timesheet 2026-10-26 to 2026-11-25"*.

### Ujian automatik yang telah dijalankan (dengan rollback)
- 08:00–17:00 dengan 2 code → **4.5 + 4.5 jam** dalam satu Timesheet Draft.
- Check-out semula dengan 3 code → Timesheet **sama**, hari tu jadi **3 + 3 + 3 jam**.
- Hari seterusnya → masuk Timesheet yang **sama**.
- Penentuan tempoh: 25 Okt → 26 Sep–25 Okt, 4 Nov → 26 Okt–25 Nov, 10 Jan → 26 Dis–25 Jan.

---

## 7. Had dan perkara yang perlu diketahui

- **Masa check-in dikawal server.** Server (Server Script) menetapkan masa Employee Checkin kepada *sekarang*. Masa yang dihantar dari telefon diabaikan.
- **Hanya check-out dari PWA** yang mengemas kini Timesheet. Checkin dari Flutter, mesin biometrik atau Desk tidak, walaupun IN dari sumber lain tetap dikira sebagai "IN pertama" hari tu.
- **Flutter app** sekarang mencipta **satu Timesheet setiap hari**. Timesheet tu berasingan dan tak bercampur dengan Timesheet bulanan ni (yang dicari melalui note).
- **Timesheet tempoh dah di-submit:** check-out tetap berjaya, tapi Timesheet tak diubah dan amaran keluar.
- **Lupa check-out** diisi oleh pekerja sendiri pada kali seterusnya buka popup (selepas 3 pagi). Kalau pekerja tak buka PWA, hari tu kekal tanpa row.
- **Rehat atau keluar tengah hari tidak ditolak.** Jam ialah IN pertama hingga OUT terakhir.
