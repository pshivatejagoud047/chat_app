# 🚀 Deploying WhatsApp Clone on Render

This guide walks through deploying both the PostgreSQL database and the Spring Boot backend on **Render** (free tier).

---

## Step 1 — Push Code to GitHub

1. Create a new GitHub repository
2. Push this project:
```bash
git init
git add .
git commit -m "Initial commit - WhatsApp Clone"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

## Step 2 — Create PostgreSQL Database on Render

1. Go to → [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → Select **"PostgreSQL"**
3. Fill in:
   - **Name**: `chatapp-db`
   - **Database**: `chatapp`
   - **User**: `chatapp_user`
   - **Region**: Choose nearest to you
   - **Plan**: Free
4. Click **"Create Database"**
5. Wait ~2 minutes for provisioning
6. Copy the following values from the database dashboard:
   - **External Database URL** → this is your `DB_URL`
   - **Username** → `DB_USERNAME`
   - **Password** → `DB_PASSWORD`

> ⚠️ The **External Database URL** format is:
> `postgresql://chatapp_user:PASSWORD@HOST:PORT/chatapp`
>
> Spring Boot needs it with `jdbc:` prefix:\
> `jdbc:postgresql://HOST:PORT/chatapp`

---

## Step 3 — Deploy the Backend on Render

1. Go to → [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → Select **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `chatapp-backend`
   - **Environment**: `Java`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**:
     ```
     mvn clean package -DskipTests
     ```
   - **Start Command**:
     ```
     java -jar target/app.jar
     ```
   - **Plan**: Free

---

## Step 4 — Set Environment Variables

In the Web Service dashboard → **"Environment"** tab, add:

| Key            | Value                                                              |
|----------------|--------------------------------------------------------------------|
| `DB_URL`       | `jdbc:postgresql://HOST:PORT/chatapp` (from Step 2)               |
| `DB_USERNAME`  | Your database username                                             |
| `DB_PASSWORD`  | Your database password                                             |

Click **"Save Changes"** — Render will automatically redeploy.

---

## Step 5 — Update Frontend API URL

Once your backend is deployed, update **two files** with your Render URL:

**In `frontend/app.js` (line 7):**
```js
// Change:
const API_BASE = 'http://localhost:8080';
// To:
const API_BASE = 'https://chatapp-backend.onrender.com';
```

**In `frontend/chat.js` (line 7):**
```js
// Change:
const API_BASE = 'http://localhost:8080';
// To:
const API_BASE = 'https://chatapp-backend.onrender.com';
```

---

## Step 6 — Deploy Frontend (Optional: Render Static Site)

1. Click **"New +"** → Select **"Static Site"**
2. Connect your same GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: *(leave empty)*
   - **Publish Directory**: `frontend`
4. Click **"Create Static Site"**

Your frontend will be available at: `https://chatapp-frontend.onrender.com`

---

## Step 7 — Verify Everything Works

✅ **Backend health check:**
```
GET https://chatapp-backend.onrender.com/users
```
Should return `[]` (empty list initially).

✅ **Register a user:**
```json
POST https://chatapp-backend.onrender.com/auth/register
{
  "name": "Alice",
  "email": "alice@test.com",
  "password": "password123"
}
```

✅ **Open frontend** → Register 2 users → Login → Chat in real-time!

---

## 🧪 Running Locally (Development)

You need a local PostgreSQL database or can use the **Render** DB with the external URL.

### Option A: Use Render PostgreSQL remotely
```bash
# Windows PowerShell
$env:DB_URL="jdbc:postgresql://HOST:PORT/chatapp"
$env:DB_USERNAME="chatapp_user"
$env:DB_PASSWORD="your_password"
mvn spring-boot:run
```

### Option B: Local PostgreSQL
```sql
CREATE DATABASE chatapp;
CREATE USER chatapp_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE chatapp TO chatapp_user;
```
Then set env vars to `jdbc:postgresql://localhost:5432/chatapp`.

---

## 📁 Project Structure

```
chat_app/
├── pom.xml                          # Maven build file
├── Procfile                         # Render start command
├── DEPLOY.md                        # This guide
├── src/main/java/com/chatapp/
│   ├── ChatAppApplication.java
│   ├── config/
│   │   ├── WebSocketConfig.java     # STOMP + SockJS
│   │   ├── SecurityConfig.java      # BCrypt, CORS
│   │   └── CorsConfig.java
│   ├── model/
│   │   ├── User.java
│   │   └── ChatMessage.java
│   ├── repository/
│   │   ├── UserRepository.java
│   │   └── ChatMessageRepository.java
│   ├── dto/
│   │   ├── RegisterRequest.java
│   │   ├── LoginRequest.java
│   │   ├── AuthResponse.java
│   │   ├── MessageRequest.java
│   │   └── MessageResponse.java
│   ├── service/
│   │   ├── AuthService.java
│   │   ├── ChatService.java
│   │   └── UserService.java
│   ├── controller/
│   │   ├── AuthController.java
│   │   ├── ChatController.java
│   │   └── UserController.java
│   ├── websocket/
│   │   └── WebSocketController.java
│   └── exception/
│       └── GlobalExceptionHandler.java
├── src/main/resources/
│   └── application.properties
└── frontend/
    ├── index.html                   # Login / Register
    ├── chat.html                    # Chat interface
    ├── styles.css                   # WhatsApp-like styling
    ├── app.js                       # Auth logic
    └── chat.js                      # WebSocket + Chat logic
```

---

> [!NOTE]
> **Free Render Note**: The free tier spins down after 15 min inactivity. First request after sleep may take 30-60 seconds. Consider upgrading to Starter plan for always-on.
