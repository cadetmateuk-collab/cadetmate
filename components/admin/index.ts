/**
 * Admin feature barrel.
 * Prefer `@/components/admin` for new imports; root `@/components/Admin*` paths remain compatible.
 */
export { default as AdminModal } from '@/components/AdminModal';
export { default as AdminModuleManagementTab } from '@/components/AdminModuleManagementTab';
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
} from '@/components/admin/ui';
export {
  AdminPermissionsProvider,
  useAdminPermissions,
  useCanDelete,
} from '@/components/admin/permissions-context';
export { AdminShell } from '@/components/admin/AdminShell';
export {
  AdminPageHeader,
  AdminStatCard,
  AdminPanel,
  AdminEmptyState,
  AdminLoadingState,
} from '@/components/admin/AdminChrome';
