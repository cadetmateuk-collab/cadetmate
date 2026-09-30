/**
 * Admin feature barrel.
 * Import from `@/components/feature/admin`.
 */
export { default as AdminModal } from '@/components/feature/admin/AdminModal';
export { default as AdminModuleManagementTab } from '@/components/feature/admin/AdminModuleManagementTab';
export {
  C,
  adminColors,
  AdminBtn,
  AdminBadge,
  AdminLabel,
  AdminInfoBanner,
  AdminIconBtn,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  AdminCard,
} from '@/components/feature/admin/ui';
export {
  AdminPermissionsProvider,
  useAdminPermissions,
  useCanDelete,
} from '@/components/feature/admin/permissions-context';
export { AdminShell } from '@/components/feature/admin/AdminShell';
export {
  AdminPageHeader,
  AdminStatCard,
  AdminPanel,
  AdminEmptyState,
  AdminLoadingState,
} from '@/components/feature/admin/AdminChrome';
