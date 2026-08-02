# OneClass - Collaborative Virtual Classroom & Whiteboard Platform

**OneClass** is a modern educational platform that combines interactive real-time collaborative whiteboards with virtual classroom capabilities. Built using **React**, **KonvaJS**, **Tailwind CSS**, and a **Java 21 Spring Boot** WebSockets backend (`com.oneclass.app`) following **Clean Feature-Based Architecture**.

---

## 🌟 Key Features

- 🎨 **Real-Time Collaborative Whiteboard**: Draw freehand strokes, shapes (rectangles, circles), straight lines, and text labels synchronized instantly across all connected clients via WebSocket STOMP.
- 🔐 **Role-Based Access Control (RBAC)**:
  - **`HOST` / Teacher**: Room creator with administrative permission to promote or demote user roles in real time.
  - **`CAN_EDIT` (Editor)**: Full drawing privileges, tool selection, clear canvas capabilities, and live cursor broadcasting.
  - **`CAN_WATCH` (Watcher / Student)**: Default role when joining a room via a 6-character room code. Canvas interactions and toolbars are locked in read-only mode.
- 🖱️ **Editor-Only Live Remote Cursors**: Live floating pointer cursors labeled with user display names and custom colors are broadcast exclusively for users with edit permissions.
- 🛠️ **Rich Canvas Tools**:
  - **Dynamic Object Eraser**: Click or hold and drag over any individual stroke, line, shape, or text element to delete that specific element instantly.
  - **Custom Color Swatch Picker**: Choose from vibrant preset swatches or pick any custom HEX/RGB color using the interactive color wheel swatch picker.
  - Rectangles, Circles, Lines, and Insertable Text Labels.
  - Adjustable stroke thickness slider & synchronized canvas clearing.
- 🔑 **Room Code System**: Shareable 6-character room codes with one-click copy feedback.

---

## 🛠️ Technology Stack & Architecture

### **Frontend Stack**
- **Framework**: React (JavaScript `.jsx` format) + Vite
- **Canvas Library**: KonvaJS (`react-konva` & `konva`)
- **Styling**: Vanilla CSS + Tailwind CSS
- **Real-Time Client**: `@stomp/stompjs` + `sockjs-client`
- **Iconography**: Lucide React (`lucide-react`)

### **Backend Stack**
- **Language**: Java 21
- **Framework**: Spring Boot 3.4.2
- **Main Package**: `com.oneclass.app` (`OneClassApplication`)
- **Architecture**: Modular Feature-Based Clean Architecture
- **Messaging**: Spring WebSocket with STOMP Broker & SockJS fallback
- **Build Tool**: Maven Wrapper (`mvnw`)

---

## 🏗️ Project Structure

```
project/
├── backend/                                  # Spring Boot Application
│   └── src/main/java/com/oneclass/app/
│       ├── OneClassApplication.java
│       ├── common/                           # Common shared domain & config
│       │   ├── config/WebSocketConfig.java
│       │   └── model/User.java
│       └── features/whiteboard/             # Whiteboard Feature Module
│           ├── room/                         # Room management (Controllers, Services, DTOs)
│           ├── presence/                     # Live pointer cursors
│           └── drawing/                      # Canvas drawing engine & Object Eraser
│
└── frontend/                                 # React Vite Application
    └── src/
        ├── App.jsx
        ├── common/components/Header.jsx     # Shared Header
        └── features/whiteboard/             # Whiteboard Feature Module
            ├── room/components/             # RoomJoinModal, UserListSidebar
            ├── presence/components/         # LiveCursors
            └── drawing/                      # WhiteboardCanvas, Toolbar, stompClient
```

---

## 🚀 Getting Started & How to Run

### **Prerequisites**
Make sure you have the following installed:
- **Java 21 JDK** (`javac -version`)
- **Node.js 18+ & npm** (`node -v` and `npm -v`)

---

### **Step 1: Start the OneClass Spring Boot Backend Server**

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Run the Spring Boot application using Maven Wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
   *The backend server will start on `http://localhost:8080` with the WebSocket STOMP endpoint registered at `/ws-whiteboard`.*

---

### **Step 2: Start the React Frontend Dev Server**

1. Open a second terminal window and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend application will start on `http://localhost:5173`.*

---

### **Step 3: Test Real-Time Collaboration**

1. Open `http://localhost:5173` in **Browser Window A**.
2. Select **Create Room**, enter your name (e.g., "Alice"), and click **Launch New Room**. Alice becomes the `HOST`.
3. Copy the 6-character **Room Code** from the top header.
4. Open `http://localhost:5173` in a second tab or **Browser Window B**.
5. Select **Join Room**, enter the Room Code, enter a name (e.g., "Bob"), and click **Join Board**.
6. Bob joins in **Watcher** mode (read-only).
7. In Window A, Alice can open the **People** sidebar and click **Make Editor** to grant Bob editing permissions. Bob can now draw and transmit live cursors in real time!

---

## 🧪 Running Tests & Production Builds

### **Run Backend Unit Tests**:
```bash
cd backend
./mvnw test
```

### **Build Frontend Production Bundle**:
```bash
cd frontend
npm run build
```
