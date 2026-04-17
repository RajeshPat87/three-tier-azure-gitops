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
| CI/CD Pipelines    | Azure DevOps Pipelines                    |
| Infrastructure     | Terraform                                 |
| Source Mirror       | GitHub (read-only mirror)                 |

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
├── pipelines/              # Azure DevOps pipeline definitions
│   ├── pr-build.yml        # PR validation (lint, test, scan)
│   ├── infra-provision.yml # Terraform plan & apply
│   ├── app-deploy.yml      # Build images, push to ACR, deploy to AKS
│   └── infra-destroy.yml   # Terraform destroy (safety-gated)
├── scripts/                # DevOps helper scripts
│   ├── setup-tf-backend.sh # Bootstrap Terraform Azure backend
│   └── install-tool.sh     # Install DevOps tools with checksum verification
└── docker-compose.yml      # Local development orchestration
```

## CI/CD Architecture (Azure DevOps + ArgoCD)

All CI/CD runs through **Azure DevOps Pipelines**. GitHub serves only as a read-only mirror of the repository.

### Azure DevOps Pipelines

| Pipeline               | Trigger              | Purpose                                           |
|------------------------|----------------------|---------------------------------------------------|
| **PR-Build-Validation** | PR to main/develop   | Hadolint, npm test, Docker build, Trivy scan, TF validate |
| **Infra-Provision**     | Manual (parameterized) | Terraform plan/apply for AKS, ACR, PostgreSQL, VNet |
| **App-Deploy**          | Push to main         | Build & push images to ACR, deploy to AKS via Kustomize |
| **Infra-Destroy**       | Manual (safety-gated) | Terraform destroy with keyword confirmation        |

### GitOps Flow (ArgoCD)

1. **Developer pushes code** → Azure DevOps PR pipeline validates
2. **Merge to main** → App-Deploy pipeline builds images, pushes to ACR
3. **Pipeline updates K8s manifests** → Image tags updated in `k8s/` directory
4. **ArgoCD detects change** → Pulls new state and syncs AKS cluster
5. **Drift healing** → ArgoCD reverts any manual `kubectl` changes

### Deployment Environments (with approval gates)

| Environment  | Infra          | App            | Destroy          |
|-------------|----------------|----------------|------------------|
| **Dev**     | dev-infra       | dev-app        | dev-destroy      |
| **Staging** | staging-infra   | staging-app    | staging-destroy  |
| **Prod**    | prod-infra      | prod-app       | prod-destroy     |

## Azure DevOps Prerequisites

| Resource             | Name                       | Purpose                                |
|----------------------|----------------------------|----------------------------------------|
| Service Connection   | `azure-service-connection` | ARM access for Terraform & AKS/ACR     |
| Variable Group       | `three-tier-secrets`       | Contains `DB_ADMIN_PASSWORD` (secret)  |
| Deployment Environments | 9 environments           | Approval gates per stage & environment |

## Infrastructure Deployment (via Pipeline)

Run the **Infra-Provision** pipeline in Azure DevOps with parameter `environment: dev|staging|prod`.

For manual/local use:
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init
terraform plan
terraform apply
```
