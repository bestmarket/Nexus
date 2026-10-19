/**
 * Module 3.1: Dynamic Multi-Tenant Domain Router
 * Middleware & Controller processing inbound HTTP headers ('req.headers.host' / 'x-tenant-domain')
 * Resolving store tenant records, custom brand theme, and service pricing catalog.
 */
import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { Store, ServiceWithPricing } from '../../types';

export interface TenantRequest extends Request {
  tenantStore?: Store;
  tenantPricing?: ServiceWithPricing[];
}

/**
 * Express Middleware: Dynamic Domain Router
 * Inspects host header and attaches tenant store context to the request.
 */
export function dynamicDomainRouterMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // 1. Resolve host from headers, with support for custom headers and query overrides for testing
    const rawHost = 
      (req.headers['x-tenant-domain'] as string) || 
      (req.query.tenant as string) || 
      req.headers.host || 
      'socialboost.africa';

    // 2. Query stores database
    const store = db.findStoreByDomain(rawHost);

    if (store && store.is_active) {
      req.tenantStore = store;
      req.tenantPricing = db.getStoreServicesWithPricing(store.id);
      res.setHeader('X-Tenant-Resolved-Domain', store.domain_name);
      res.setHeader('X-Tenant-Store-ID', store.id);
    } else {
      // Fallback to primary store if active
      const defaultStore = db.getStores().find(s => s.is_active) || db.getStores()[0];
      req.tenantStore = defaultStore;
      if (defaultStore) {
        req.tenantPricing = db.getStoreServicesWithPricing(defaultStore.id);
        res.setHeader('X-Tenant-Resolved-Domain', defaultStore.domain_name);
        res.setHeader('X-Tenant-Store-ID', defaultStore.id);
      }
    }

    next();
  } catch (error) {
    console.error('[Tenant Router Error]:', error);
    next();
  }
}

/**
 * Controller: GET /api/tenant/resolve
 * Resolves current tenant information, theme configuration, and localized pricing grid.
 */
export async function resolveTenantHandler(req: Request, res: Response): Promise<void> {
  try {
    const rawHost = 
      (req.headers['x-tenant-domain'] as string) || 
      (req.query.tenant as string) || 
      req.headers.host || 
      'socialboost.africa';

    const store = db.findStoreByDomain(rawHost);

    if (!store) {
      res.status(404).json({
        success: false,
        error: 'TENANT_NOT_FOUND',
        message: `No active storefront found matching domain host '${rawHost}'.`
      });
      return;
    }

    const pricing = db.getStoreServicesWithPricing(store.id);
    const owner = db.findUserById(store.owner_id);

    res.status(200).json({
      success: true,
      data: {
        store: {
          id: store.id,
          owner_id: store.owner_id,
          owner_email: owner?.email,
          domain_name: store.domain_name,
          store_type: store.store_type,
          theme_settings: store.theme_settings,
          is_active: store.is_active,
          current_subscription_expiry: store.current_subscription_expiry
        },
        services_catalog: pricing,
        resolved_host: rawHost
      }
    });
  } catch (error: any) {
    console.error('[Tenant Resolve Error]:', error);
    res.status(500).json({
      success: false,
      error: 'TENANT_RESOLUTION_FAILED',
      message: error.message || 'Internal error while resolving storefront tenant.'
    });
  }
}

/**
 * Controller: GET /api/tenant/all
 * Lists all active tenant stores for administrative management or dev switcher.
 */
export async function getAllTenantsHandler(req: Request, res: Response): Promise<void> {
  try {
    const stores = db.getStores();
    const enriched = stores.map(store => {
      const owner = db.findUserById(store.owner_id);
      const pricingCount = db.getStoreServicesWithPricing(store.id).length;
      return {
        ...store,
        owner_email: owner?.email,
        active_services_count: pricingCount
      };
    });

    res.status(200).json({
      success: true,
      data: enriched
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'FETCH_TENANTS_FAILED',
      message: error.message
    });
  }
}
