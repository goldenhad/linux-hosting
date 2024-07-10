
export interface Role {
    isCompany?: boolean,
    canEditCompanyDetails?: boolean,
    canSetupCompany?: boolean,
    canManageUser?: boolean,
    canViewAnalytics?: boolean,
    canUseEditor?: boolean
}