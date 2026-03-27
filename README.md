<div align="center">

# ⚡ DevOps Automation

**Full infrastructure provisioning & deployment — powered by Pulumi + GitHub Actions**

[![Pulumi](https://img.shields.io/badge/Pulumi-IaC-8A3391?style=flat-square&logo=pulumi&logoColor=white)](https://pulumi.com)
[![AWS](https://img.shields.io/badge/AWS-Lambda%20%2B%20RDS-FF9900?style=flat-square&logo=amazonaws&logoColor=white)](https://aws.amazon.com)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=flat-square&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Bash](https://img.shields.io/badge/Bash-Automation-4EAA25?style=flat-square&logo=gnubash&logoColor=white)](https://www.gnu.org/software/bash/)

</div>

---

## 📌 Overview

This repository is the **DevOps automation backbone** for cloud infrastructure — combining config-driven Pulumi IaC with GitHub Actions CI/CD and intelligent sprint tracking automation.

| Capability | Details |
|---|---|
| 🏗 **Infrastructure** | AWS Lambda, RDS, IAM, Networking via Pulumi |
| 🔁 **CI/CD** | Automated preview → deploy pipeline via GitHub Actions |
| 🧠 **Sprint Tracking** | GraphQL-powered GitHub Project automation |
| 🌍 **Environments** | Dev / Stage / Prod with YAML-driven config |

---

## 🏗 Architecture

```
GitHub Repository
       │
       ▼
GitHub Actions (CI/CD Trigger)
       │
       ▼
Pulumi (Infrastructure as Code)
       │
       ▼
AWS Resources
  ├── Lambda Functions
  ├── Databases (RDS)
  ├── IAM Roles & Permissions
  └── Supporting Networking
```

---

## ☁️ Infrastructure

Infrastructure is fully declarative and config-driven — no hardcoding, no manual clicks.

### Managed Resources

- **AWS Lambda** — Serverless functions with configurable runtime & memory
- **Databases** — RDS / managed DB provisioned from config (engine, size, etc.)
- **IAM** — Roles and permissions defined as code
- **Networking** — Supporting resources for full reproducibility

### Pulumi Configuration

Environment behavior is controlled via YAML config files:

```yaml
# Pulumi.dev.yaml

environment: dev

lambdas:
  - name: function1
    runtime: nodejs18.x
    memory: 256
  - name: function2
    runtime: python3.11
    memory: 512

database:
  engine: postgres
  size: small
```

> Config files are environment-specific (`dev`, `stage`, `prod`) and drive all resource provisioning dynamically.

---

## 🔁 CI/CD Pipeline

```
Push / Pull Request
        │
        ▼
  GitHub Actions Trigger
        │
        ▼
  Pulumi Preview ──── validates changes before applying
        │
        ▼
  Pulumi Deploy ──── applies infrastructure to AWS
        │
        ▼
  AWS Infrastructure Updated ✅
```

### Workflow Highlights

- ✅ Every push/PR triggers automatic validation
- ✅ Pulumi Preview runs first — no blind deployments
- ✅ Environment-driven config prevents any hardcoded values
- ✅ Fully reproducible across dev / stage / prod

---

## 🧠 Sprint Automation Script

An advanced GitHub Project tracking script that automatically detects sprint changes and keeps your issues consistent.

### How It Works

| Step | Action |
|------|--------|
| `01` | Query GitHub ProjectV2 items via **GraphQL API** |
| `02` | Extract issue numbers and sprint field values using `jq` |
| `03` | Compare **yesterday vs today** sprint snapshots |
| `04` | Detect issues that lost their sprint assignment |
| `05` | Auto-comment on affected issues via **GitHub CLI** |

### Example Auto-Comment

When an issue loses its sprint assignment, this is automatically posted:

```
⚠️ Sprint was removed from this issue
```

### Technologies Used

| Tool | Purpose |
|------|---------|
| `gh` (GitHub CLI) | Posting comments & interacting with GitHub |
| GitHub GraphQL API | Querying ProjectV2 data |
| `jq` | JSON parsing and field extraction |
| Bash | Script orchestration |

---

## 🔐 Security

| Area | Approach |
|------|----------|
| **Credentials** | Stored in GitHub Actions Secrets — never in source code |
| **Pulumi State** | Managed and encrypted via Pulumi's state backend |
| **AWS Auth** | Handled via CI environment — no long-lived keys checked in |

---

## ⚡ Tech Stack

| Technology | Role |
|---|---|
| [Pulumi](https://pulumi.com) | Infrastructure as Code |
| [AWS](https://aws.amazon.com) | Cloud provider (Lambda, RDS, IAM) |
| [GitHub Actions](https://github.com/features/actions) | CI/CD automation |
| [GitHub CLI (`gh`)](https://cli.github.com) | Issue & project interaction |
| [GraphQL API](https://docs.github.com/en/graphql) | GitHub Project querying |
| `jq` | JSON processing |
| Bash | Scripting & automation |

---

## 🚀 Key Strengths

- **Fully automated** — infrastructure deploys without manual intervention
- **Config-driven** — change a YAML value, not source code
- **GitHub-native** — CI/CD, project tracking, and sprint automation all live here
- **Scalable** — environment-based config scales cleanly across dev/stage/prod
- **Reproducible** — every deployment is deterministic and auditable

---

<div align="center">

*DevOps Automation Backbone · Built with Pulumi + GitHub Actions + AWS*

</div>
