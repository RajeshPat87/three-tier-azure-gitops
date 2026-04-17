# Three-Tier Azure GitOps Application

A production-ready, three-tier containerized application deployed to **Azure Kubernetes Service (AKS)** using a **pull-based GitOps** delivery model with **ArgoCD** and **Azure DevOps Pipelines**.

---

## Architecture Overview

```
  Developer          Azure DevOps              ACR               AKS Cluster
  ────────          ────────────              ───               ───────────
      │                  │                      │                    │
      │  push code       │                      │                    │
      ├─────────────────▶│                      │                    │
      │                  │  build & scan        │                    │
      │                  ├─────────────────────▶│                    │
      │                  │  push images         │                    │
      │                  │                      │                    │
      │                  │  commit image tags   │                    │
      │                  ├──────────┐           │                    │
      │                  │          │ (git)     │                    │
      │                  │◀─────────┘           │                    │
      │                  │                      │     ┌──────────┐  │
      │                  │                      │     │  ArgoCD   │  │
      │                  │  monitors repo       │     │ (pull     │  │
      │                  │◀───────────────────────────│  model)   │  │
      │                  │                      │     └─────┬────┘  │
      │                  │                      │           │       │
      │                  │                      │  pull img │       │
      │                  │                      │◀──────────┤       │
      │                  │                      │           │       │
      │                  │                      │    sync   ▼       │
      │                  │                      │  ┌──────────────┐ │
      │                  │                      │  │  Frontend    │ │
      │                  │                      │  │  Backend     │ │
      │                  │                      │  │  ─ ─ ─ ─ ─  │ │
      │                  │                      │  │  PostgreSQL  │ │
      │                  │                      │  │  (Azure Flex)│ │
      │                  │                      │  └──────────────┘ │
```

### Technology Stack

| Component            | Technology                                     |
|----------------------|------------------------------------------------|
| **Frontend**         | React SPA served via Nginx (multi-stage build) |
| **Backend API**      | Node.js / Express                              |
| **Database**         | Azure Database for PostgreSQL – Flexible Server|
| **Container Registry** | Azure Container Registry (ACR)              |
| **Orchestration**    | Azure Kubernetes Service (AKS)                 |
| **GitOps Operator**  | ArgoCD (Helm-installed on AKS)                 |
| **CI/CD Pipelines**  | Azure DevOps Pipelines (5 pipelines)           |
| **Infrastructure**   | Terraform (remote state in Azure Storage)      |
| **Networking**       | Azure VNet with AKS + PostgreSQL integration   |
| **Secrets**          | Azure Key Vault + Secrets Store CSI Driver     |
| **Source Mirror**    | GitHub (read-only mirror)                      |

---

## Quick Start (Local Development)

```bash
# Clone the repository
git clone https://github.com/RajeshPat87/three-tier-azure-gitops.git
cd three-tier-azure-gitops

# Start all services (PostgreSQL + Backend + Frontend)
docker compose up --build

# Access the application
# Frontend:    http://localhost:8080
# Backend API: http://localhost:3000/api/health
# PostgreSQL:  localhost:5432
```

> **Note:** Local development uses a containerized PostgreSQL. Production uses Azure Database for PostgreSQL Flexible Server.

---

## Project Structure

```
three-tier-azure-gitops/
├── frontend/                       # React SPA + multi-stage Nginx Dockerfile
│   ├── src/                        # React source code
│   ├── Dockerfile                  # Multi-stage: node build → nginx serve
│   ├── nginx.conf                  # Production Nginx config
│   └── .dockerignore
├── backend/                        # Express API + Dockerfile
│   ├── src/                        # Express source code
│   ├── Dockerfile                  # Multi-stage: node build → node runtime
│   ├── package.json
│   └── .dockerignore
├── k8s/                            # Kubernetes manifests (Kustomize)
│   ├── base/                       # Base deployments, services, configmaps
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── backend-deployment.yaml
│   │   ├── backend-service.yaml
│   │   ├── frontend-deployment.yaml
│   │   └── frontend-service.yaml
│   └── overlays/                   # Environment-specific overrides
│       ├── dev/                    # 1 replica, dev config
│       ├── staging/                # 2 replicas, staging config
│       └── prod/                   # 3 replicas, prod config
├── terraform/                      # Azure infrastructure as code
│   ├── main.tf                     # Provider + backend config
│   ├── network.tf                  # VNet, subnets
│   ├── aks.tf                      # AKS cluster
│   ├── database.tf                 # PostgreSQL Flexible Server
│   ├── keyvault.tf                 # Azure Key Vault
│   ├── outputs.tf                  # Terraform outputs
│   ├── variables.tf                # Input variables
│   └── terraform.tfvars.example    # Example variable values
├── argocd/                         # ArgoCD GitOps configuration
│   ├── base/
│   │   └── namespace.yaml          # ArgoCD namespace
│   ├── application-dev.yaml        # ArgoCD App – dev (auto-sync, prune)
│   ├── application-staging.yaml    # ArgoCD App – staging (auto-sync, prune)
│   ├── application-prod.yaml       # ArgoCD App – prod (auto-sync, NO prune)
│   ├── argocd-project.yaml         # ArgoCD AppProject (RBAC boundaries)
│   └── argocd-repo-secret.yaml     # ADO repo credential template
├── pipelines/                      # Azure DevOps pipeline definitions
│   ├── pr-build.yml                # PR validation (lint, test, scan)
│   ├── infra-provision.yml         # Terraform plan & apply
│   ├── app-deploy.yml              # Build → ACR → commit tags (GitOps)
│   ├── argocd-setup.yml            # Install & configure ArgoCD on AKS
│   └── infra-destroy.yml           # Terraform destroy (safety-gated)
├── scripts/                        # DevOps helper scripts
│   ├── setup-tf-backend.sh         # Bootstrap Terraform Azure Storage backend
│   └── install-tool.sh             # Install tools with checksum verification
├── docker-compose.yml              # Local development orchestration
├── .env.example                    # Environment variable template
└── .gitignore
```

---

## CI/CD Architecture

All CI/CD runs through **Azure DevOps Pipelines**. GitHub serves only as a **read-only mirror** of the source repository.

### Pipeline Overview

| ID | Pipeline                 | Trigger                | Purpose                                                           |
|----|--------------------------|------------------------|-------------------------------------------------------------------|
| 28 | **PR-Build-Validation**  | PR to `main`/`develop` | Hadolint, npm test, Docker build, Trivy scan, Terraform validate  |
| 29 | **Infra-Provision**      | Manual (parameterized) | Terraform plan/apply – AKS, ACR, PostgreSQL, VNet, Key Vault     |
| 30 | **App-Deploy**           | Push to `main`         | Build images → Push to ACR → Commit image tags (GitOps)          |
| 31 | **Infra-Destroy**        | Manual (safety-gated)  | Terraform destroy with keyword confirmation                      |
| 32 | **ArgoCD-Setup**         | Manual (parameterized) | Install, upgrade, register apps, or uninstall ArgoCD on AKS      |

### GitOps Workflow (Pull-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure DevOps (CI)                            │
│                                                                     │
│  1. Developer pushes code to main                                   │
│  2. App-Deploy pipeline triggers:                                   │
│     a. Build frontend & backend Docker images                       │
│     b. Trivy scan – fail on HIGH/CRITICAL vulnerabilities          │
│     c. Push verified images to ACR with semantic tags               │
│     d. Commit updated image tags to k8s/ manifests (git push)      │
│                                                                     │
│  ───── Pipeline ends here. No kubectl apply. ─────                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │  (git commit detected)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ArgoCD on AKS (CD)                           │
│                                                                     │
│  5. ArgoCD monitors the ADO repo continuously                       │
│  6. Detects image tag change in k8s/overlays/<env>                 │
│  7. Pulls new images from ACR                                       │
│  8. Syncs AKS deployment to match desired state                    │
│  9. Self-heals: reverts any manual kubectl changes                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **Key principle:** CI (Azure DevOps) builds and scans images. CD (ArgoCD) deploys. No pipeline ever runs `kubectl apply` against production.

---

## ArgoCD Setup & Configuration

### 1. Install ArgoCD on AKS

Run the **ArgoCD-Setup** pipeline in Azure DevOps:

| Parameter     | Options                                     | Description                            |
|---------------|---------------------------------------------|----------------------------------------|
| `environment` | `dev`, `staging`, `prod`                    | Target AKS cluster                     |
| `action`      | `install`, `upgrade`, `register-apps`, `uninstall` | What to do                       |

**First-time setup:**
```
Pipeline: ArgoCD-Setup
Parameters: environment=dev, action=install
```

This will:
- Helm-install ArgoCD (chart v7.7.10) on the AKS cluster
- Configure ADO repository credentials (PAT-based)
- Create the ArgoCD AppProject with RBAC boundaries
- Register ArgoCD Applications for the selected environment
- Expose ArgoCD server via LoadBalancer

### 2. ArgoCD Access

After installation, retrieve credentials:
```bash
# Get ArgoCD admin password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath='{.data.password}' | base64 -d

# Get ArgoCD server IP
kubectl get svc argocd-server -n argocd \
  -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

### 3. ArgoCD Application Design

| Application              | Namespace       | Auto-Sync | Prune   | Self-Heal |
|--------------------------|-----------------|-----------|---------|-----------|
| `three-tier-app-dev`     | `three-tier-app` | ✅ Yes    | ✅ Yes  | ✅ Yes    |
| `three-tier-app-staging` | `three-tier-app` | ✅ Yes    | ✅ Yes  | ✅ Yes    |
| `three-tier-app-prod`    | `three-tier-app` | ✅ Yes    | ❌ No   | ✅ Yes    |

> **Production safety:** `prune: false` means ArgoCD won't automatically delete resources that are removed from Git. Deletions require manual intervention.

---

## Deployment Environments

### Azure DevOps Environments (with Approval Gates)

| Environment  | Infra           | App             | Destroy           |
|-------------|-----------------|-----------------|-------------------|
| **Dev**     | `dev-infra`     | `dev-app`       | `dev-destroy`     |
| **Staging** | `staging-infra` | `staging-app`   | `staging-destroy` |
| **Prod**    | `prod-infra`    | `prod-app`      | `prod-destroy`    |

### Kustomize Overlays (Replica Counts)

| Environment | Frontend Replicas | Backend Replicas |
|-------------|-------------------|------------------|
| Dev         | 1                 | 1                |
| Staging     | 2                 | 2                |
| Prod        | 3                 | 3                |

---

## Azure DevOps Prerequisites

All resources below are already provisioned for this project:

| Resource                  | Name / ID                    | Purpose                                    |
|---------------------------|------------------------------|--------------------------------------------|
| **Service Connection**    | `azure-service-connection`   | ARM access for Terraform, AKS, ACR         |
| **Variable Group**        | `three-tier-secrets` (ID: 5) | Contains `DB_ADMIN_PASSWORD` (secret)      |
| **Service Principal**     | `sp-three-tier-gitops-ado`   | Contributor role on Azure subscription     |
| **Deployment Environments** | 9 environments (IDs 12–20) | Approval gates per stage & environment     |

---

## Infrastructure Deployment

### Via Azure DevOps Pipeline (Recommended)

Run **Infra-Provision** with parameter `environment: dev|staging|prod`.

The pipeline:
1. Bootstraps Terraform backend (Azure Storage) if missing
2. Runs `terraform plan` (manual review stage)
3. Runs `terraform apply` on approval

### Terraform Resources Created

| Resource                    | Details                                        |
|-----------------------------|------------------------------------------------|
| Azure Resource Group        | `threetier-<env>-rg`                           |
| AKS Cluster                 | `threetier-<env>-aks` (2 nodes, Standard_D2s_v3) |
| Azure Container Registry    | `threetieracr` (Standard SKU)                  |
| PostgreSQL Flexible Server  | `threetier-<env>-pgflex`                       |
| Virtual Network             | `threetier-<env>-vnet` (AKS + PG subnets)     |
| Azure Key Vault             | `threetier-<env>-kv`                           |

### Manual / Local Use

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

terraform init \
  -backend-config="resource_group_name=rg-terraform-state" \
  -backend-config="storage_account_name=tfstaterajesh15282" \
  -backend-config="container_name=tfstate" \
  -backend-config="key=three-tier-<env>.tfstate"

terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

---

## Dockerization

Both services use **multi-stage builds** for production-lean images:

| Service  | Base Image (build) | Base Image (runtime) | Runs as | Health Check |
|----------|-------------------|----------------------|---------|--------------|
| Frontend | `node:20-alpine`  | `nginx:1.25-alpine`  | Non-root | `curl localhost:8080` |
| Backend  | `node:20-alpine`  | `node:20-alpine`     | Non-root | `curl localhost:3000/api/health` |

### Local Development

```bash
# Full stack (frontend + backend + PostgreSQL)
docker compose up --build

# Backend only
docker compose up backend db

# Rebuild a single service
docker compose build frontend
```

---

## DevOps Helper Scripts

### `scripts/setup-tf-backend.sh`

Bootstraps the Azure Storage Account for Terraform remote state:
```bash
export TF_BACKEND_RESOURCE_GROUP_NAME="rg-terraform-state"
export TF_BACKEND_STORAGE_ACCOUNT_NAME="tfstaterajesh15282"
./scripts/setup-tf-backend.sh
```

### `scripts/install-tool.sh`

Downloads and installs DevOps tools with SHA256 checksum verification:
```bash
./scripts/install-tool.sh terraform 1.7.4
./scripts/install-tool.sh helm 3.14.2
./scripts/install-tool.sh kubectl 1.29.2
./scripts/install-tool.sh trivy 0.50.0
./scripts/install-tool.sh hadolint 2.12.0
./scripts/install-tool.sh gitleaks 8.18.2
./scripts/install-tool.sh codeql 2.16.3
```

---

## Security

- **Trivy scanning** on every image build (fail on HIGH/CRITICAL)
- **Hadolint** Dockerfile linting on PRs
- **Non-root containers** for all services
- **Azure Key Vault** with Secrets Store CSI Driver
- **Workload Identity** for pod-level Azure access
- **PostgreSQL TLS** enforced via Azure Flex Server defaults
- **Terraform state** encrypted at rest with versioning + soft-delete
- **ArgoCD RBAC** via AppProject restricting source repos and namespaces
- **Production prune protection** – ArgoCD won't auto-delete prod resources

---

## Repository Information

| Item              | URL                                                                                         |
|-------------------|---------------------------------------------------------------------------------------------|
| **GitHub (mirror)** | https://github.com/RajeshPat87/three-tier-azure-gitops                                   |
| **Azure DevOps**  | https://dev.azure.com/RajeshPatibandla1987/three-tier-azure-gitops                         |
| **ADO Repo**      | `three-tier-gitops-app` in project `three-tier-azure-gitops`                                |

---

## Step-by-Step Deployment Guide

1. **Provision Infrastructure:** Run `Infra-Provision` pipeline → `environment: dev`
2. **Install ArgoCD:** Run `ArgoCD-Setup` pipeline → `environment: dev`, `action: install`
3. **Deploy Application:** Push code to `main` → `App-Deploy` pipeline auto-triggers
4. **Verify:** ArgoCD syncs automatically. Check via ArgoCD UI or `kubectl get pods -n three-tier-app`
5. **Promote to Staging:** Run `Infra-Provision` → `staging`, then `ArgoCD-Setup` → `staging`
6. **Promote to Prod:** Run `Infra-Provision` → `prod`, then `ArgoCD-Setup` → `prod`

---

## License

This project is maintained by the DevOps team for internal use.
