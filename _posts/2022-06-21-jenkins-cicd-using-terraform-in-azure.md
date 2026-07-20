---
layout: post
title: "Jenkins CI/CD using Terraform in Azure"
date: 2022-06-21 10:00:00 -0300
categories: [devops]
tags: [jenkins, terraform, azure, docker, cicd, iac]
stage: mature
lang: en
image: /assets/images/jenkis-terraform/1655741099292.png
---

This article demonstrates how to create an environment to deploy your
infrastructure in a Jenkins CI/CD pipeline using Terraform in Microsoft Azure.
Running Terraform within CI/CD pipelines can boost your organization's
performance and ensure consistent deployments.

![GitHub, Jenkins, Terraform and Azure architecture overview](/assets/images/jenkis-terraform/1655735199027.png)

## Tools & Technologies

![Azure, Terraform, Jenkins, Docker and GitHub logos](/assets/images/jenkis-terraform/1655254169315.png)

- **Terraform** — open-source infrastructure as code tool by HashiCorp
- **Jenkins** — open-source automation server for CI/CD
- **Docker** — containerization platform
- **Azure** — Microsoft's cloud computing service
- **GitHub** — version control and hosting

## Infrastructure as Code (IaC)

IaC is the process of managing and provisioning computer data centers through
machine-readable definition files rather than manual configuration, enabling
version control and repeatable deployments.

## Prerequisites

- Azure subscription (free account available)
- Azure CLI installed locally
- Docker and docker-compose
- GitHub repository access

## Azure Setup

### Configure Remote State Storage

```bash
#!/bin/bash

RESOURCE_GROUP_NAME=tfstate
STORAGE_ACCOUNT_NAME=tfstate$RANDOM
CONTAINER_NAME=tfstate
echo $STORAGE_ACCOUNT_NAME

# Create resource group
az group create --name $RESOURCE_GROUP_NAME --location westeurope

# Create storage account
az storage account create --resource-group $RESOURCE_GROUP_NAME --name $STORAGE_ACCOUNT_NAME --sku Standard_LRS --encryption-services blob

# Create blob container
az storage container create --name $CONTAINER_NAME --account-name $STORAGE_ACCOUNT_NAME

# Get access key
ACCOUNT_KEY=$(az storage account keys list --resource-group $RESOURCE_GROUP_NAME --account-name $STORAGE_ACCOUNT_NAME --query '[0].value' -o tsv)
echo $ACCOUNT_KEY
```

### Create Service Principal

```bash
# Get SUBSCRIPTION_ID
az account show|grep id

# Create service principal (change SUBSCRIPTION_ID for the ID)
az ad sp create-for-rbac --name JenkinsServicePrincipal --role="Contributor" --scopes="/subscriptions/SUBSCRIPTION_ID"
```

Capture these values:

- `ARM_CLIENT_ID` = appId
- `ARM_CLIENT_SECRET` = password
- `ARM_SUBSCRIPTION_ID` = subscription ID
- `ARM_TENANT_ID` = tenant

## Terraform Configuration Files

**main.tf:**

```hcl
terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.9.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# Create a resource group
resource "azurerm_resource_group" "rg" {
  name     = "azure-lab"
  location = var.az_region
  tags = merge({ "Name" = "azure-lab" }, var.tags, )
}
```

**backend.tf:**

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate"
    storage_account_name = "<storage_account_name>"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}
```

**variables.tf:**

```hcl
# Input variable definitions
variable "az_region" {
  type        = string
  description = "Set here the region where to deploy your resource"
}

variable "tags" {
  type        = map(string)
  description = "A map of tags to add to all resources"
  default     = {}
}
```

**terraform.tfvars:**

```hcl
# Azure Region
az_region = "westeurope"

# Adding TAG's to your Azure resources (Required)
tags = {
  ProjectName = "azure-lab"
  Env         = "lab"
  Owner       = "jangs"
}
```

## Jenkins Setup

The Jenkins environment uses a master-agent architecture via Docker Compose
with two containers: Jenkins Master and Jenkins Agent (with Terraform and
Azure CLI pre-installed).

![Jenkins master-agent architecture with Docker](/assets/images/jenkis-terraform/1655732671187.png)

**docker-compose.yml:**

```yaml
version: '3.2'

services:

  jenkins-master:
    build:
      context: jenkins-master/
    container_name: jenkins-master
    environment:
      - JENKINS_ADMIN_ID=admin
      - JENKINS_ADMIN_PASSWORD=${JENKINS_ADMIN_PASSWORD}
    privileged: true
    user: root
    volumes:
      - jenkins_data:/var/jenkins_home
    networks:
      - iac-network
    ports:
      - 8080:8080
      - 50000:50000
    restart: unless-stopped

  jenkins-agent-terraform:
    build:
      context: jenkins-agent-terraform/
    container_name: jenkins-agent-terraform
    networks:
      - iac-network
    expose:
      - 22
    restart: unless-stopped
    environment:
      - JENKINS_AGENT_SSH_PUBKEY=${JENKINS_AGENT_SSH_PUBKEY}

networks:
  iac-network:

volumes:
  jenkins_data:
```

**Dockerfile for Jenkins Master:**

```dockerfile
FROM jenkins/jenkins:lts-jdk1

ENV TZ='America/Sao_Paulo'

ENV JAVA_OPTS -Djenkins.install.runSetupWizard=false
ENV CASC_JENKINS_CONFIG /usr/share/jenkins/casc.yaml
COPY conf/casc.yaml /usr/share/jenkins/casc.yaml

# Install Plugins
COPY conf/plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
```

**Dockerfile for Jenkins Agent:**

```dockerfile
FROM jenkins/ssh-agent:jdk11

USER root

# Install Terraform
RUN apt-get update && \
    apt-get -y install \
    ca-certificates \
    gnupg \
    lsb-release \
    wget \
    curl \
    git

RUN wget -qO - terraform.gpg https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/terraform-archive-keyring.gpg
RUN echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/terraform-archive-keyring.gpg] https://apt.releases.hashicorp.com \
  $(lsb_release -cs) main" > /etc/apt/sources.list.d/terraform.list

RUN apt-get update && \
    apt-get -y install terraform

# Install Azure cli
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash
```

## Jenkins Configuration

### Generate SSH Keys

```bash
# Create Keys
mkdir .ssh
ssh-keygen -b 2048 -t rsa -N '' -f .ssh/jenkins_agent

# Set Public Key
JENKINS_AGENT_SSH_PUBKEY=$(cat .ssh/jenkins_agent.pub)
echo "JENKINS_AGENT_SSH_PUBKEY=$JENKINS_AGENT_SSH_PUBKEY" > .env
```

### Build and Run

```bash
# Set Admin Password
JENKINS_ADMIN_PASSWORD=$(date | md5sum |cut -c1-16)

echo $JENKINS_ADMIN_PASSWORD
echo "JENKINS_ADMIN_PASSWORD=$JENKINS_ADMIN_PASSWORD" >> .env

docker-compose build --no-cache
docker-compose up -d --force-recreate
docker-compose ps
```

Access Jenkins at `http://0.0.0.0:8080/`.

![Jenkins login screen](/assets/images/jenkis-terraform/1655733523420.png)

## Jenkins Credentials Configuration

**Add SSH Agent Credentials:**

1. Navigate to Manage Jenkins → Manage Credentials

   ![Manage Jenkins security section](/assets/images/jenkis-terraform/1655733769543.png)

2. Add Credentials (Global)

   ![Add credentials on the global domain](/assets/images/jenkis-terraform/1655734303067.png)

3. Kind: SSH Username with private key
4. ID: `jenkins-agent`
5. Username: `jenkins`
6. Private Key: enter directly from `~/.ssh/jenkins_agent_key`

![SSH username with private key credential form](/assets/images/jenkis-terraform/1655734450682.png)

**Add Azure Storage Credentials:**

- Kind: Secret text
- Secret: `ARM_ACCESS_KEY` value
- ID: `ARM_ACCESS_KEY`

![Secret text credential for ARM_ACCESS_KEY](/assets/images/jenkis-terraform/1655734632141.png)

**Add Azure Terraform Credentials** (all as Secret text):

- `ARM_CLIENT_ID`
- `ARM_CLIENT_SECRET`
- `ARM_SUBSCRIPTION_ID`
- `ARM_TENANT_ID`

![All credentials configured in Jenkins](/assets/images/jenkis-terraform/1655734862034.png)

## Creating the Pipeline

In Jenkins, create a new item of type **Pipeline**:

![New item of type Pipeline named terraform](/assets/images/jenkis-terraform/1655735600087.png)

Configure the job description, log rotation and the GitHub project URL:

![Pipeline general configuration](/assets/images/jenkis-terraform/1655735683856.png)

## Jenkinsfile Pipeline

```groovy
pipeline {
  agent {
    node "agent-terraform"
  }

  environment {
    BRANCH = 'main'
    REPO = 'https://github.com/jansouza/terraform-azure-lab.git'

    ARM_ACCESS_KEY = credentials('ARM_ACCESS_KEY')
    ARM_CLIENT_ID = credentials('ARM_CLIENT_ID')
    ARM_CLIENT_SECRET = credentials('ARM_CLIENT_SECRET')
    ARM_SUBSCRIPTION_ID = credentials('ARM_SUBSCRIPTION_ID')
    ARM_TENANT_ID = credentials('ARM_TENANT_ID')
  }

  stages {

    stage('Checkout Source') {
      steps {
        git branch: "$BRANCH",
            url: "$REPO"
      }
    }

    stage('Terraform - init') {
      steps {
          sh 'terraform init -upgrade'
      }
    }

    stage('Terraform - validate') {
      steps {
          sh 'terraform validate'
      }
    }

    stage('Terraform - plan') {
      steps {
          sh 'terraform plan'
      }
    }

    stage('Terraform - apply') {
      steps {
          sh 'terraform apply -auto-approve'
      }
    }

  }

  post {
    always {
      cleanWs()
    }
  }
}
```

## Results

After running the pipeline, the Stage View shows each stage (checkout, init,
validate, plan, apply) executing successfully:

![Jenkins Stage View of the terraform-pipeline](/assets/images/jenkis-terraform/1655735795169.png)

And the resource group `azure-lab` appears in the Azure portal:

![Resource group azure-lab created in Azure](/assets/images/jenkis-terraform/1655811391317.png)

The pipeline successfully creates an Azure resource group named `azure-lab`,
demonstrating infrastructure deployment automation through CI/CD. While this
example creates only a resource group, the same approach could create much
more complex things, such as Virtual Networks, Subnets, Virtual Machines,
Clusters, Security Groups, etc.

## GitHub Repositories

- Terraform code: [jansouza/terraform-azure-lab](https://github.com/jansouza/terraform-azure-lab)
- Jenkins configuration: [jansouza/jenkins-terraform-azure](https://github.com/jansouza/jenkins-terraform-azure)

---

*Originally published on
[LinkedIn](https://www.linkedin.com/pulse/jenkins-cicd-using-terraform-azure-jan-souza/)
on June 21, 2022.*
