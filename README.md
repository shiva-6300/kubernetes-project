# 📝 Inkwell — Full-Stack Blogging App (Python Flask + React)

A production-ready blogging application rebuilt from Spring Boot to **Python Flask + ReactJS**, with the same DevOps pipeline: Docker, Kubernetes (AWS EKS), Jenkins, SonarQube, Trivy, Nexus & Prometheus/Grafana.

---

## 📁 Project Structure

```
blog-app/
 ├── backend/
 │    ├── app.py              # Flask REST API
 │    ├── requirements.txt
 │    └── Dockerfile
 │
 ├── frontend/
 │    ├── src/
 │    │    ├── App.js         # Root component + auth state
 │    │    ├── Login.js       # Login & Register UI
 │    │    └── Blog.js        # Post list, detail, create, edit, delete
 │    ├── nginx.conf          # Nginx SPA config
 │    ├── package.json
 │    └── Dockerfile          # Multi-stage build
 │
 ├── k8s/
 │    └── deployment-service.yaml   # K8s manifests
 ├── Jenkinsfile             # Full CI/CD pipeline
 └── docker-compose.yml      # Local dev
```

---

## 🚀 Local Development

### Option 1: Docker Compose (recommended)
```bash
docker-compose up --build
```
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Option 2: Manual
```bash
# Backend
cd backend
pip install -r requirements.txt
python app.py

# Frontend (new terminal)
cd frontend
npm install
REACT_APP_API_URL=http://localhost:5000 npm start
```

**Demo credentials:** `admin` / `admin123`

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | ❌ | Register user |
| POST | /api/auth/login | ❌ | Login → JWT token |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/posts | ❌ | List all posts |
| GET | /api/posts/:id | ❌ | Single post |
| POST | /api/posts | ✅ | Create post |
| PUT | /api/posts/:id | ✅ (author only) | Edit post |
| DELETE | /api/posts/:id | ✅ (author only) | Delete post |
| GET | /api/health | ❌ | Health check |

---

## ☁️ Deploy to AWS EKS

1. Build & push images:
```bash
docker build -t YOUR_USER/blog-backend ./backend
docker build -t YOUR_USER/blog-frontend ./frontend
docker push YOUR_USER/blog-backend
docker push YOUR_USER/blog-frontend
```

2. Update image names in `k8s/deployment-service.yaml`

3. Apply manifests:
```bash
kubectl apply -f k8s/deployment-service.yaml
kubectl get svc -n webapps   # get LoadBalancer EXTERNAL-IP
```

---

## 🔧 Jenkins CI/CD

The `Jenkinsfile` runs these stages:
1. **Git Checkout** → pull source
2. **Trivy FS Scan** → filesystem vulnerability scan
3. **SonarQube Analysis** → static code analysis
4. **Quality Gate** → fail on critical issues
5. **Build Docker Images** → backend + frontend
6. **Trivy Image Scan** → container vulnerability scan
7. **Push to DockerHub** → tag with build number + latest
8. **Deploy to Kubernetes** → rolling update on EKS
9. **Verify Deployment** → rollout status check
10. **Email Notification** → success/failure alert

Configure credentials in Jenkins: `git-cred`, `sonar-token`, `docker-cred`, `k8-cred`, `mail-cred`
