# 📊 Getting Real Meter Readings (Endianness Guide)

Modbus hardware mein data read karte waqt sabse bada issue "Byte Order" ka hota hai. Ye guide aapko samjhati hai ki sahi readings kaise layein.

---

## 🔍 1. Proble: "Garbage Values" (0.00 ya Inf)
Agar aap Voltage read kar rahe hain aur screen par `0.00` ya `4.567e+23` dikh raha hai, toh iska matlab hai ki aapka meter aur hamara server **Byte Order** pr agree nahi kar rahe hain.

---

## 🛠️ 2. Solution: Byte Order Selection
Humne system mein 4 formats add kiye hain:

*   **ABCD (Big Endian)**: Professional meters (Schneider, ABB) zyada tar ye use karte hain.
*   **DCBA (Little Endian)**: Kuch local gateways ye format use karte hain.
*   **CDAB / BADC**: Inhe "Mid-Endian" kehte hain, uncommon hain par agar ABCD fail ho toh inhe try karein.

---

## 📈 3. How to fix it (Proper Steps)
1.  **Admin Panel** -> **Meters** par jayein.
2.  Apne meter ke **"Register Mapping"** button (Gear icon) par click karein.
3.  Naye **"ORDER"** column mein base format check karein (Default ABCD hota hai).
4.  Agar data galat hai, toh use `CDAB` ya `DCBA` karke **"Engage Payload Map"** par click karein.
5.  **Live Dashboard** par check karein—values turant real (Proper) ho jayengi.

---

## ⚡ 4. Real-time Precision
Humne backend mein numeric precision lock kar di hai:
- **Voltage/Current**: 2 Decimal points (`230.45`).
- **Power**: 2 Decimal points (`1.20 kW`).
- **Automatic Status**: Agar loop mein 3 baar error aaya, toh meter auto-offline ho jayega system ko protect karne ke liye.

---
**Status**: Real-Time Telemetry Engine Optimized & Proper.
