# 🛡️ Modbus Connectivity & Validation Handbook

Ye document aapko samjhata hai ki PowerBill 2.0 system mein hardware connectivity ko "Proper" tarike se kaise handle kiya gaya hai.

---

## 🚀 1. Validation ke 4 Stages (Proper Flow)

Jab aap **"Save"** ya **"Test Link"** click karte hain, toh backend in 4 stages se gujarta hai:

### Stage 1: Format Validation (The Mask)
*   **Kya check hota hai?**: IP Address ka format sahi hai ya nahi (e.g., `192.168.1.100` vs `abc.12`).
*   **Logic**: Humne "Regex" pattern lagaya hai. Agar format galat hai, toh system hardware ko touch bhi nahi karega aur turant `INVALID_IP_FORMAT` ka error de dega.

### Stage 2: Network Handshake (The Knock)
*   **Kya check hota hai?**: Kya wo IP network par active hai aur kya uski Port (502) open hai.
*   **Logic**: Backend meter ko "Knock" karta hai. Agar router ya VPN blocked hai, toh ye 2.5 seconds baad `METER_NOT_REACHABLE_ON_PORT` show karega.

### Stage 3: Protocol Ping (The Response)
*   **Kya check hota hai?**: Kya device sach mein ek "Electricity Meter" hai ya koi generic computer.
*   **Logic**: Hum Address `0` se data maangte hain. Agar device Modbus protocol nahi samajhta, toh wo reply nahi de payega, aur system `DEVICE_TIMEOUT` bol dega.

### Stage 4: Database Persistence (The Locked Save)
*   **Kya check hota hai?**: Data recording.
*   **Logic**: **Sabse IMP rule!** Agar upar ke 3 stages fail hote hain, toh Database mein naya meter save hi nahi hoga. Is se aapka system "Gande Data" (Junk Data) se hamesha saaf rahega.

---

## 🛠️ 2. Common Errors aur Unka Matlab

| Error Code | Kyun Aata Hai? | Solution |
| :--- | :--- | :--- |
| `INVALID_IP_FORMAT` | IP mein dots ya numbers galat hain. | IP sahi se check karke type karein. |
| `METER_NOT_REACHABLE` | Wire disconnected hai ya network down hai. | Physical wire aur network ping check karein. |
| `DEVICE_TIMEOUT` | IP sahi hai par device respond nahi kar raha. | Slave ID aur Device type check karein. |
| `CONNECTION_DENIED` | Backend ne safety ke liye save block kar diya. | Pehle "Test Link" ko successful karein. |

---

## ⚡ 3. Proper Connection Tips
1.  **Timeout Setting**: Humne strict 2.5s ka timeout rakha hai taaki hardware ke chakkar mein aapka dashboard hang na ho.
2.  **Slave ID**: Hamesha check karein ki Slave ID (Unit ID) meter ki settings se match kar rahi ho.
3.  **Port 502**: Ensure karein ki gateway par port forwarding enabled hai.

---

**Summary**: Ab aapka system ekdum reliable hai. Galat data daalne par system error dega, dashboard hang nahi hoga, aur database humesha clean rahega.

---
*Created for: PowerBill Infrastructure Team*
