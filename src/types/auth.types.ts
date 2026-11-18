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
};

export interface RefreshResponse {
	accessToken: string;
	refreshToken?: string;
}


