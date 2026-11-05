output "service_name" {
  value = render_web_service.api.name
}

output "api_url" {
  description = "Adresse de l'API, à mettre dans B2T_API_URL du Static Site"
  value       = render_web_service.api.url
}

output "adminer_url" {
  value = render_web_service.adminer.url
}
