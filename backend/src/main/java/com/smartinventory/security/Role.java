package com.smartinventory.security;

public enum Role {
    ADMIN,
    INVENTORY_MANAGER,
    SALES_STAFF,
    VIEWER;

    public String getAuthority() {
        return "ROLE_" + name();
    }
}
