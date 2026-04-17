# Three-Tier Azure GitOps Application

A production-ready three-tier application deployed to Azure Kubernetes Service (AKS) using a GitOps delivery model with ArgoCD.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌──────────────────────────────┐
│   React SPA  │────▶│  Express API │────▶│  Azure PostgreSQL Flex Server│
│  (Nginx)     │     │  (Node.js)   │     │                              │
└─────────────┘     └─────────────┘     └──────────────────────────────┘
       │                    │
       └────────────────────┘
              AKS Cluster
```

| Component          | Technology                                |
|--------------------|-------------------------------------------|
| Frontend           | React SPA served via Nginx                |
| Backend API        | Node.js (Express)                         |
| Database           | Azure Database for PostgreSQL Flex Server  |
| Container Registry | Azure Container Registry (ACR)            |
| Orchestration      | Azure Kubernetes Service (AKS)            |
| GitOps Operator    | ArgoCD                                    |
| CI Pipeline        | GitHub Actions                            |
| Infrastructure     | Terraform                                 |

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/RajeshPatibandla1987/three-tier-azure-gitops.git
cd three-tier-azure-gitops

# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:3000/api/health
```

## Project Structure

```
├── frontend/               # React SPA + Nginx Dockerfile
├── backend/                # Express API + Dockerfile
├── k8s/
│   ├── base/               # Base Kubernetes manifests
│   └── overlays/           # Kustomize overlays (dev, staging, prod)
├── terraform/              # Azure infrastructure (AKS, ACR, PostgreSQL, VNet, Key Vault)
├── argocd/                 # ArgoCD Application manifests
├── .github/workflows/      # GitHub Actions CI pipeline
└── docker-compose.yml      # Local development orchestration
```

## CI/CD Pipeline

1. **Push to main** → GitHub Actions builds Docker images
2. **Trivy scan** → Fails on HIGH/CRITICAL vulnerabilities
3. **Push to ACR** → Tagged with commit SHA
4. **Update manifests** → Image tags updated in k8s/ directory
5. **ArgoCD syncs** → Pulls new images and deploys to AKS

## Infrastructure Deployment

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan
terraform apply
```

## Required GitHub Secrets

| Secret            | Description                    |
|-------------------|--------------------------------|
| `ACR_NAME`        | Azure Container Registry name  |
| `ACR_LOGIN_SERVER`| ACR login server URL           |
| `ACR_USERNAME`    | ACR service principal ID       |
| `ACR_PASSWORD`    | ACR service principal password |
