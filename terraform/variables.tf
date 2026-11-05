variable "render_api_key" {
  description = "Clé API Render (secret GitHub RENDER_API_KEY)"
  type        = string
  sensitive   = true
}

variable "render_owner_id" {
  description = "Identifiant du workspace Render (secret GitHub RENDER_OWNER_ID)"
  type        = string
}

variable "github_actor" {
  description = "Utilisateur GitHub, sert à nommer les services"
  type        = string
}

variable "image_url" {
  description = "Image Docker de l'API sur GHCR"
  type        = string
}

variable "image_tag" {
  description = "Tag de l'image (SHA du commit)"
  type        = string
}

variable "database_url" {
  description = "Internal Database URL de la base PostgreSQL Render (secret GitHub DATABASE_URL)"
  type        = string
  sensitive   = true
}

variable "access_code" {
  description = "Code d'accès de l'équipe pour l'API (secret GitHub B2T_ACCESS_CODE)"
  type        = string
  sensitive   = true
}

variable "frontend_origin" {
  description = "Adresse du front autorisée à appeler l'API (CORS), « * » pour toutes"
  type        = string
  default     = "*"
}

variable "adminer_tag" {
  description = "Version de l'image Adminer"
  type        = string
  default     = "4.8.1"
}
