export type UserRole = 'USER' | 'SALESMAN' | 'ADMIN' | 'SUPER_ADMIN' | 'INVESTOR';

export type TUser = {
	id: string;
	userId: string;
	name: string;
	email: string;
	role?: UserRole;
	designation?: string;
	imageUrl?: string;
	isVerified?: boolean;
	isApproved?: boolean;
	// user list / user detail (admin)
	phone?: string | null;
	address?: string | null;
	district?: string | null;
	createdAt?: string;
	investor?: { profitSharePercentage: number } | null;
};

export interface RefreshResponse {
	accessToken: string;
	refreshToken?: string;
}


