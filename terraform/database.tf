# ────────────────────────────────────────────────────────────
# Azure Database for PostgreSQL — Flexible Server
# ────────────────────────────────────────────────────────────
resource "azurerm_postgresql_flexible_server" "main" {
  name                          = "psql-${var.project_name}-${var.environment}"
  resource_group_name           = azurerm_resource_group.main.name
  location                      = azurerm_resource_group.main.location
  version                       = "16"
  delegated_subnet_id           = azurerm_subnet.db.id
  private_dns_zone_id           = azurerm_private_dns_zone.postgres.id
  administrator_login           = var.db_admin_username
  administrator_password        = var.db_admin_password
  storage_mb                    = 32768
  sku_name                      = "GP_Standard_D2s_v3"
  backup_retention_days         = 7
  geo_redundant_backup_enabled  = false
  zone                          = "1"

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgres]

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "azurerm_postgresql_flexible_server_database" "appdb" {
  name      = "appdb"
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}
