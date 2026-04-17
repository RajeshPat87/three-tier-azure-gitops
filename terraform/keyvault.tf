data "azurerm_client_config" "current" {}

# ────────────────────────────────────────────────────────────
# Azure Key Vault
# ────────────────────────────────────────────────────────────
resource "azurerm_key_vault" "main" {
  name                        = "kv-${var.project_name}-${var.environment}"
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

# Store DB credentials in Key Vault
resource "azurerm_key_vault_secret" "db_host" {
  name         = "db-host"
  value        = azurerm_postgresql_flexible_server.main.fqdn
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_user" {
  name         = "db-user"
  value        = var.db_admin_username
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "db_password" {
  name         = "db-password"
  value        = var.db_admin_password
  key_vault_id = azurerm_key_vault.main.id
}
