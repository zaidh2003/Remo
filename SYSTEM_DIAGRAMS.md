# REMO System Diagrams & Visual Documentation
## For Thesis Presentation & Research

---

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Frontend["🖥️ Frontend Layer (Next.js React)"]
        Landing["Landing Page"]
        Login["Login/Auth"]
        Dashboard["Dashboard UI"]
        Components["Components Library"]
    end
    
    subgraph Business["🧠 Business Logic Layer"]
        GroqService["Groq Service"]
        UserService["User Service"]
        TaxiService["Taxi Service"]
        NotifService["Notification Service"]
    end
    
    subgraph APIs["⚙️ API Layer"]
        GroqAPI["/api/groq Endpoint"]
    end
    
    subgraph External["☁️ External Services"]
        GroqCloud["Groq Cloud<br/>Llama 3.3 70B"]
        GoogleAuth["Google OAuth"]
    end
    
    subgraph Database["🗄️ Firebase Backend"]
        Firestore["Firestore Database<br/>(Collections)"]
        FirebaseAuth["Firebase Auth"]
        SecurityRules["Security Rules<br/>(RBAC)"]
        RTListeners["Real-Time<br/>Listeners"]
    end
    
    Landing --> Login
    Login --> FirebaseAuth
    FirebaseAuth --> Dashboard
    Dashboard --> Components
    Components --> GroqService
    Components --> UserService
    Components --> TaxiService
    Components --> NotifService
    
    GroqService --> GroqAPI
    UserService --> Firestore
    TaxiService --> Firestore
    NotifService --> RTListeners
    
    GroqAPI --> GroqCloud
    FirebaseAuth --> GoogleAuth
    
    Firestore --> SecurityRules
    RTListeners --> Components
```

---

## 2. Emergency Shift Workflow (Detailed)

```mermaid
graph TD
    A["👨‍💼 Employee Sick Leave<br/>Time: 17:30<br/>Shift: 18:00-23:00 Meat Zone"]
    
    B["📱 Manager Opens REMO<br/>Reports: 'Staff sick'"]
    
    C["⚙️ System Auto-Creates<br/>ShortageAlert"]
    C -->|priority| HighPriority["HIGH (Sudden Illness)"]
    C -->|status| Open["OPEN"]
    C -->|broadcast| Multi["Multi-branch broadcast"]
    
    D["🤖 Groq AI Analysis<br/>Time: 17:36"]
    D -->|Input| Skills["Available staff skills<br/>Zone: Meat<br/>Time available"]
    D -->|Filter| Expert["🟢 John - Meat Expert"]
    D -->|Filter| Intermediate["🟡 Tom - Meat Intermediate"]
    D -->|Filter| NoSkill["🔴 Sarah - No Meat skill"]
    
    E["📊 AI Ranking<br/>1. John (95%)<br/>2. Tom (60%)<br/>3. Others (0%)"]
    
    F["📢 Notification Broadcast<br/>To: All Branch Staff"]
    F --> John["John receives alert"]
    F --> Tom["Tom receives alert"]
    F --> Sarah["Sarah receives alert"]
    
    G["John Accepts - 17:37"]
    H["Tom Accepts - 17:38"]
    I["Sarah Accepts - 17:39"]
    
    J["🎯 Manager Reviews<br/>Selects: John (first)"]
    
    K["✅ Alert Status: FILLED<br/>Shift Assigned: John"]
    
    L["🚕 John Requests Pickup<br/>Time: 17:45"]
    
    M["🛡️ Groq Policy Check<br/>- Is emergency shift? YES ✓<br/>- Within shift window? YES ✓"]
    
    N["✅ Pickup Eligible"]
    
    O["👨‍⚖️ Manager Approves"]
    
    P["🚗 Taxi Confirmed<br/>Pickup time: 18:00"]
    
    Q["✅ John Completes Shift<br/>23:15 - Dropoff requested"]
    
    R["✅ Request Approved<br/>Shift end >= 22:00"]
    
    S["🎉 Transaction Complete<br/>Alert: FILLED<br/>Shift: COMPLETED<br/>Taxi: COMPLETED"]
    
    A --> B --> C
    C --> HighPriority
    C --> Open
    C --> Multi
    C --> D
    D --> Expert
    D --> Intermediate
    D --> NoSkill
    D --> E
    E --> F
    F --> John
    F --> Tom
    F --> Sarah
    John --> G
    Tom --> H
    Sarah --> I
    G --> J
    H --> J
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N
    N --> O
    O --> P
    P --> Q
    Q --> R
    R --> S
```

---

## 3. Data Flow: Shortage Alert Creation to Assignment

```mermaid
sequenceDiagram
    actor Manager as Manager
    participant UI as REMO UI
    participant Service as Service Layer
    participant API as API Route
    participant Groq as Groq AI
    participant DB as Firestore DB
    participant Employee as Employee Apps
    
    Manager->>UI: Click "Create Shortage Alert"
    Manager->>UI: Fill form (zone, time, reason)
    
    UI->>Service: Call createShortageAlert()
    Service->>DB: Write new ShortageAlert document
    DB-->>Service: Alert ID returned
    
    Service->>API: POST /api/groq
    Note over API: action: "match_shortage"
    
    API->>Groq: Send alert + available staff data
    Groq->>Groq: Analyze skills, availability, history
    Groq-->>API: Return recommendations [{ uid, reason }]
    
    API-->>Service: Recommendation with highest score
    Service->>DB: Update ShortageAlert.aiSuggestedUid
    
    DB-->>Service: Update confirmed
    Service-->>UI: Show AI recommendation
    
    UI->>Employee: Broadcast real-time notification
    Employee->>Employee: Employee sees alert (Firebase listener)
    
    Employee->>UI: Click "Accept Shift"
    UI->>Service: Call respondToAlert(alertId, employeeId)
    
    Service->>DB: Create ShortageResponse (ACCEPTED)
    DB-->>Service: Response ID
    
    Note over Employee: First to accept is selected
    
    UI->>Manager: Show "John accepted" notification
    Manager->>UI: Click "Assign to John"
    
    UI->>Service: Call assignShift()
    Service->>DB: Update: shift.staffId = John
    Service->>DB: Update: alert.status = FILLED
    
    DB-->>Service: Updates confirmed
    UI->>Employee: Notify John: "Shift assigned to you"
    UI->>Employee: Notify Tom: "Shift filled by another"
```

---

## 4. Role-Based Access Control Matrix

```mermaid
graph TB
    User["👤 Logged In User"]
    
    User -->|Auth| Role{Role Check}
    
    Role -->|ADMIN| AdminDash["ADMIN Dashboard"]
    Role -->|MANAGER| ManagerDash["MANAGER Dashboard"]
    Role -->|EMPLOYEE| EmpDash["EMPLOYEE Dashboard"]
    
    AdminDash -->|See| Nav1["📊 Dashboard"]
    AdminDash -->|See| Nav2["📅 Scheduler"]
    AdminDash -->|See| Nav3["🚨 Emergencies"]
    AdminDash -->|See| Nav4["🔔 Shortage"]
    AdminDash -->|See| Nav5["🚖 Transport"]
    AdminDash -->|See| Nav6["👥 Staff Dir"]
    AdminDash -->|See| Nav7["👤 Users"]
    AdminDash -->|See| Nav8["⚙️ Settings"]
    
    ManagerDash -->|See| Nav1
    ManagerDash -->|See| Nav2
    ManagerDash -->|See| Nav3
    ManagerDash -->|See| Nav4
    ManagerDash -->|See| Nav5
    ManagerDash -->|See| Nav6
    ManagerDash -->|Cannot| Nav7
    ManagerDash -->|Cannot| Nav8
    
    EmpDash -->|See| Nav1
    EmpDash -->|Cannot| Nav2
    EmpDash -->|See| Nav3
    EmpDash -->|See| Nav4
    EmpDash -->|See| Nav5
    EmpDash -->|See| Nav6
    EmpDash -->|Cannot| Nav7
    EmpDash -->|Cannot| Nav8
    
    Nav1 -->|Permission| View["VIEW"]
    Nav2 -->|Permission| Modify["CREATE/UPDATE"]
    Nav3 -->|Permission| Action["VIEW/ACCEPT"]
    Nav4 -->|Permission| Manage["CREATE/UPDATE"]
    Nav5 -->|Permission| Approve["APPROVE"]
    Nav6 -->|Permission| ViewAll["VIEW ALL"]
    Nav7 -->|Permission| FullControl["CRUD"]
    Nav8 -->|Permission| System["SYSTEM CONTROL"]
```

---

## 5. Taxi Policy Decision Tree

```mermaid
graph TD
    A["🚕 Taxi Request Received"]
    
    B{Request Type?}
    
    B -->|PICKUP| C["Check Pickup Policy"]
    B -->|DROPOFF| G["Check Dropoff Policy"]
    
    C --> C1{Is Emergency<br/>Shift?}
    
    C1 -->|No| C_REJECT["❌ REJECTED<br/>Reason: Regular shift"]
    C1 -->|Yes| C2{Within Shift<br/>Window?}
    
    C2 -->|No| C_REJECT2["❌ REJECTED<br/>Reason: Outside window"]
    C2 -->|Yes| C_APPROVE["✅ APPROVED<br/>Automatic approval"]
    
    G --> G1{Shift End<br/>Time >= 22:00?}
    
    G1 -->|No| G_REJECT["❌ REJECTED<br/>Reason: Early shift"]
    G1 -->|Yes| G2{Within 30min<br/>of shift end?}
    
    G2 -->|No| G_REJECT2["❌ REJECTED<br/>Reason: Too late"]
    G2 -->|Yes| G_APPROVAL["⏳ PENDING<br/>Needs manager approval"]
    
    C_APPROVE --> EXECUTE["🎯 Execute Taxi"]
    G_APPROVAL --> MANAGER["👨‍⚖️ Manager Reviews"]
    
    MANAGER --> DECISION{Manager<br/>Decision?}
    
    DECISION -->|Approve| EXECUTE
    DECISION -->|Reject| FINAL_REJECT["❌ REJECTED<br/>By manager"]
    
    C_REJECT --> NOTIFY["📢 Notify Employee<br/>with reason"]
    C_REJECT2 --> NOTIFY
    G_REJECT --> NOTIFY
    G_REJECT2 --> NOTIFY
    FINAL_REJECT --> NOTIFY
    
    EXECUTE --> LOG["📝 Log to Firestore"]
    NOTIFY --> END["Complete"]
    LOG --> END
```

---

## 6. AI Recommendation Scoring System

```mermaid
graph LR
    A["🧑‍💼 Available Staff"]
    
    A -->|Skill Check| S1["Zone Skill?"]
    S1 -->|Expert| S1_SCORE["100 pts"]
    S1 -->|Intermediate| S1_SCORE2["60 pts"]
    S1 -->|Beginner| S1_SCORE3["20 pts"]
    S1 -->|None| S1_SCORE4["0 pts"]
    
    A -->|Availability| S2["Available Now?"]
    S2 -->|Yes| S2_SCORE["50 pts"]
    S2 -->|Busy| S2_SCORE2["0 pts"]
    
    A -->|History| S3["Worked Zone?"]
    S3 -->|Week| S3_SCORE["40 pts"]
    S3 -->|Month| S3_SCORE2["20 pts"]
    S3 -->|Never| S3_SCORE3["0 pts"]
    
    A -->|Distance| S4["Close to Venue?"]
    S4 -->|< 5 km| S4_SCORE["30 pts"]
    S4 -->|5-10 km| S4_SCORE2["15 pts"]
    S4 -->|> 10 km| S4_SCORE3["0 pts"]
    
    S1_SCORE --> TOTAL["📊 Total Score"]
    S1_SCORE2 --> TOTAL
    S1_SCORE3 --> TOTAL
    S1_SCORE4 --> TOTAL
    S2_SCORE --> TOTAL
    S2_SCORE2 --> TOTAL
    S3_SCORE --> TOTAL
    S3_SCORE2 --> TOTAL
    S3_SCORE3 --> TOTAL
    S4_SCORE --> TOTAL
    S4_SCORE2 --> TOTAL
    S4_SCORE3 --> TOTAL
    
    TOTAL -->|Rank| R1["🥇 #1: John<br/>190 pts"]
    TOTAL -->|Rank| R2["🥈 #2: Tom<br/>120 pts"]
    TOTAL -->|Rank| R3["🥉 #3: Sarah<br/>80 pts"]
    
    R1 --> DISPLAY["📤 Display to Manager<br/>with reasoning"]
    R2 --> DISPLAY
    R3 --> DISPLAY
```

---

## 7. Multi-Branch Emergency Coordination

```mermaid
graph TB
    subgraph Branch_A["🏢 Branch A"]
        Alert["🔴 Emergency Alert<br/>Bar zone, 16:05"]
        Staff_A["👥 Available Staff<br/>(0 qualified)"]
    end
    
    subgraph Branch_B["🏢 Branch B"]
        Staff_B["👥 Available Staff<br/>Sarah - Bar Expert"]
    end
    
    subgraph Branch_C["🏢 Branch C"]
        Staff_C["👥 Available Staff<br/>Tom - Bar Beginner"]
    end
    
    Alert -->|Local Broadcast<br/>16:05-16:10| Staff_A
    
    Staff_A -->|No Accept<br/>5 min timeout| Escalate["📢 Escalate to<br/>other branches"]
    
    Escalate -->|Cross-Branch<br/>16:10| Staff_B
    Escalate -->|Cross-Branch<br/>16:10| Staff_C
    
    Staff_B -->|Sarah Accepts<br/>16:18| Accept["✅ ACCEPTED"]
    
    Accept -->|Transport<br/>16:30| Pickup["🚗 Pickup from<br/>Branch B"]
    
    Pickup -->|16:50| Arrive["🏢 Arrive at<br/>Branch A"]
    
    Arrive -->|Work| Shift["📅 Bar Zone<br/>16:50-22:00"]
    
    Shift -->|22:00| Dropoff_Req["🚕 Dropoff<br/>request"]
    
    Dropoff_Req -->|Approved<br/>22:15| Transport_Back["🚗 Transport back<br/>to Branch B"]
    
    Transport_Back -->|22:45| Return["🏢 Arrive at<br/>Branch B"]
    
    Return -->|Log| Complete["✅ COMPLETE<br/>Cross-branch shift"]
```

---

## 8. Firestore Collections Schema

```mermaid
graph TD
    FB["🗄️ Firestore Database"]
    
    FB -->|Collection| Users["users/"]
    Users -->|Doc| User1["{uid}"]
    User1 -->|Fields| UF1["email, name, role"]
    User1 -->|Fields| UF2["branchId, skills[]"]
    User1 -->|Fields| UF3["availability, language"]
    
    FB -->|Collection| Branches["branches/"]
    Branches -->|Doc| Branch1["{branchId}"]
    Branch1 -->|Fields| BF1["name, address"]
    Branch1 -->|Fields| BF2["managerId, createdAt"]
    
    FB -->|Collection| Alerts["shortageAlerts/"]
    Alerts -->|Doc| Alert1["{alertId}"]
    Alert1 -->|Fields| AF1["createdBy, zone"]
    Alert1 -->|Fields| AF2["date, startTime, endTime"]
    Alert1 -->|Fields| AF3["priority, status"]
    Alert1 -->|Fields| AF4["aiSuggestedUid, aiReason"]
    Alert1 -->|SubCollection| Responses["responses/"]
    Responses -->|Doc| Response1["{responseId}"]
    Response1 -->|Fields| RF1["employeeUid, status"]
    Response1 -->|Fields| RF2["respondedAt"]
    
    FB -->|Collection| Taxis["taxiRequests/"]
    Taxis -->|Doc| Taxi1["{taxiId}"]
    Taxi1 -->|Fields| TF1["staffId, shiftId"]
    Taxi1 -->|Fields| TF2["type (PICKUP/DROPOFF)"]
    Taxi1 -->|Fields| TF3["status, approvedBy"]
    
    FB -->|Collection| Shifts["shifts/"]
    Shifts -->|Doc| Shift1["{shiftId}"]
    Shift1 -->|Fields| SF1["staffId (null=vacant)"]
    Shift1 -->|Fields| SF2["branchId, zone"]
    Shift1 -->|Fields| SF3["date, startTime, endTime"]
    Shift1 -->|Fields| SF4["status, isEmergency"]
    
    FB -->|Collection| Inventory["inventory/"]
    Inventory -->|Doc| Item1["{itemId}"]
    Item1 -->|Fields| IF1["name, category"]
    Item1 -->|Fields| IF2["currentStock, minimumStock"]
    Item1 -->|Fields| IF3["status, unit"]
```

---

## 9. Feature Implementation Status

```mermaid
graph TB
    subgraph Complete["✅ COMPLETE (100%)"]
        F1["✓ Role-Based Access"]
        F2["✓ Groq AI Engine"]
        F3["✓ Firebase Auth"]
        F4["✓ Firestore Integration"]
    end
    
    subgraph HighComplete["⚠️ HIGH (90-95%)"]
        F5["✓ Smart Scheduling"]
        F6["✓ Emergency Response"]
        F7["✓ Shortage Alerts"]
        F8["✓ Taxi Management"]
        F9["✓ Demand Forecast"]
        F10["✓ Quick Actions"]
    end
    
    subgraph Partial["⚠️ PARTIAL (30-50%)"]
        F11["○ Multilingual (30%)"]
        F12["○ Inventory (40%)"]
    end
    
    subgraph Missing["❌ MISSING (0%)"]
        F13["✗ Shift Swap UI"]
        F14["✗ Mobile App"]
        F15["✗ SMS Notifications"]
        F16["✗ Analytics Dashboard"]
    end
    
    Complete -->|Overall| Score1["87.5% COMPLETE"]
    HighComplete -->|Overall| Score1
    Partial -->|Overall| Score1
    Missing -->|Overall| Score1
```

---

## 10. User Journey: First-Time Manager

```mermaid
graph LR
    A["🌐 Lands on<br/>Landing Page"]
    B["📝 Clicks 'Sign In'"]
    C["✍️ Creates Account<br/>(Auto ADMIN)"]
    D["🏢 Add First Branch"]
    E["👥 Add Staff Members"]
    F["📅 Create Schedule"]
    G["⚙️ Optimize with AI"]
    H["✅ Publish Schedule"]
    I["📊 Monitor Dashboard"]
    J["🚨 Handle Emergencies<br/>(Real-time alerts)"]
    K["✅ Taxi Approvals"]
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K -->|Ready| Loop["🔄 Daily Operations"]
```

---

**END OF DIAGRAMS**
