// The saved arrangement, exactly as the server stores it: opaque preview ids in
// display order plus the ones turned off. The server never interprets them, so
// anything read back has to be reconciled against the catalog before use — see
// reconcile() in previews.tsx.
export interface DashboardLayout {
  order: string[];
  hidden: string[];
}

// The sidebar's module order, exactly as the server stores it: module paths,
// empty when the user has never customised anything. See sidebarOrder.ts in
// the layout folder for reconciling it against the module catalog.
export interface SidebarOrder {
  order: string[];
}
