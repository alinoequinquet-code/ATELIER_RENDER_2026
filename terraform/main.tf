terraform {
  required_providers {
    render = {
      source  = "render-oss/render"
      version = ">= 1.7.0"
    }
  }
}

provider "render" {
  api_key  = var.render_api_key
  owner_id = var.render_owner_id
}

locals {
  # hôte de la base, tiré de l'adresse de connexion (ex. dpg-xxxx-a), pour pré-remplir Adminer
  db_host = try(regex("@([^:/?]+)", var.database_url)[0], "")
}

# ---------- API Flask : image Docker publiée sur GHCR par GitHub Actions ----------
resource "render_web_service" "api" {
  name              = "b2t-api-${var.github_actor}"
  plan              = "free"
  region            = "frankfurt"
  health_check_path = "/health"

  runtime_source = {
    image = {
      image_url = var.image_url
      tag       = var.image_tag
    }
  }

  env_vars = {
    ENV             = { value = "production" }
    APP_VERSION     = { value = var.image_tag }
    DATABASE_URL    = { value = var.database_url }
    ACCESS_CODE     = { value = var.access_code }
    FRONTEND_ORIGIN = { value = var.frontend_origin }
  }
}

# ---------- Adminer : interface web pour consulter la base PostgreSQL ----------
resource "render_web_service" "adminer" {
  name   = "b2t-adminer-${var.github_actor}"
  plan   = "free"
  region = "frankfurt"

  runtime_source = {
    image = {
      image_url = "docker.io/library/adminer"
      tag       = var.adminer_tag
    }
  }

  env_vars = {
    PORT                   = { value = "8080" }
    ADMINER_DEFAULT_SERVER = { value = local.db_host }
  }
}
