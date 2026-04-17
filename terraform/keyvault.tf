data "azurerm_client_config" "current" {}

# ────────────────────────────────────────────────────────────
# Azure Key Vault
# ────────────────────────────────────────────────────────────
resource "azurerm_key_vault" "main" {
  name                        = "kv${var.project_name}${var.environment}${random_string.suffix.result}"
  resource_group_name         = azurerm_resource_group.main.name
  location                    = azurerm_resource_group.main.location
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  sku_name                    = "standard"
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false
  enable_rbac_authorization   = true

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Grant Terraform SP "Key Vault Secrets Officer" so it can write secrets
resource "azurerm_role_assignment" "kv_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# Store DB credentials in Key Vault
resource "azurerm_key_vault_secret" "db_host" {
  depends_on   = [azurerm_role_assignment.kv_secrets_officer]
  name         = "db-host"
  value        = azurerm_postgresql_flexible_server.main.fqdn
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_user" {
  depends_on   = [azurerm_role_assignment.kv_secrets_officer]
  name         = "db-user"
  value        = var.db_admin_username
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_password" {
  depends_on   = [azurerm_role_assignment.kv_secrets_officer]
  name         = "db-password"
  value        = var.db_admin_password
  key_vault_id = azurerm_key_vault.main.id
}
