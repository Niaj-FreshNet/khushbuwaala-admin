"use client";

import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShieldCheck, UserCheck, UserX, Percent, Wallet, BadgeDollarSign } from "lucide-react";
import { TUser, UserRole } from "@/types/auth.types";
import { useGetAllUsersQuery } from "@/redux/store/api/user/userApi";
import { useApproveOrUpdateRoleMutation, useRefreshTokenMutation } from "@/redux/store/api/auth/authApi";
import { RootState } from "@/redux/store/store";
import { setUser } from "@/redux/store/features/auth/authSlice";
import { toast } from "sonner";

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export default function RoleManager() {
  const { data: usersRes, isLoading, refetch } = useGetAllUsersQuery(undefined);
  const [approveOrUpdateRole, { isLoading: isUpdating }] = useApproveOrUpdateRoleMutation();
  const [refreshToken] = useRefreshTokenMutation();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [role, setRole] = useState<UserRole>("USER");
  const [isApproved, setIsApproved] = useState<string>("true");
  
  // Investor specific states
  const [profitPercentage, setProfitPercentage] = useState<string>("0");

  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  const rawUsers = Array.isArray(usersRes) ? usersRes : (usersRes as any)?.data || [];

  const users = useMemo(() => {
    return rawUsers.filter((user: any) => user.role !== "USER");
  }, [rawUsers]);

  // Auto-fill role, approval status, and all investor fields
  useEffect(() => {
    if (selectedUserId) {
      const selected = users.find((u: any) => u.id === selectedUserId);
      if (selected) {
        setRole(selected.role || "USER");
        setIsApproved(selected.isApproved ? "true" : "false");
        
        // Safely extract from the nested Prisma 'investor' relation
        setProfitPercentage(String(selected.investor?.profitSharePercentage || 0));
      }
    }
  }, [selectedUserId, users]);

  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  useEffect(() => {
    if (auth.accessToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(auth.accessToken);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Failed to decode JWT:", err);
      }
    }
  }, [auth.accessToken]);

  const handleUpdateApprovalAndRole = async () => {
    if (!selectedUserId) return;
    try {
      const approvalBool = isApproved === "true";

      // Send all investor financial parameters
      await approveOrUpdateRole({
        userId: selectedUserId,
        role,
        isApproved: approvalBool,
        investorProfitPercentage: Number(profitPercentage),
        totalInvested: Number(totalInvested),
        currentBalance: Number(currentBalance),
      }).unwrap();

      toast.success("User access and profile updated successfully!");
      refetch();

      if (currentUser?.id === selectedUserId) {
        const resArray = await refreshToken(undefined).unwrap();
        const res = Array.isArray(resArray) ? resArray[0] : resArray;

        if (res && res.accessToken) {
          const decoded = jwtDecode<TUser>(res.accessToken);
          dispatch(
            setUser({
              user: decoded,
              accessToken: res.accessToken,
              refreshToken: res.refreshToken,
            })
          );
        }
      }

      setSelectedUserId("");
    } catch (err: any) {
      console.error("Error updating user:", err);
      toast.error(err?.data?.message || "Failed to update user profile.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
        <span className="ml-2 font-medium text-stone-600">Loading users...</span>
      </div>
    );
  }

  return (
    <Card className="max-w-xl mx-auto mt-6 shadow-xl border-stone-200">
      <CardHeader className="border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-green-50 text-green-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-stone-900">Role Manager</CardTitle>
            <p className="text-xs text-stone-500 mt-0.5">Approve pending roles and assign portal permissions.</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* User Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Select User</label>
          <Select onValueChange={setSelectedUserId} value={selectedUserId}>
            <SelectTrigger className="w-full bg-white h-11 text-xs font-medium">
              <SelectValue placeholder="Choose a registered user..." />
            </SelectTrigger>

            <SelectContent className="max-w-[calc(100vw-2rem)] z-50 bg-white">
              {users.map((user: any) => (
                <SelectItem
                  key={user.id}
                  value={user.id}
                  className="py-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1.5 sm:gap-4 min-w-0">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold text-stone-900 truncate text-xs">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-stone-500 truncate">
                        {user.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-stone-500 bg-stone-100 px-2 py-0.5 rounded font-mono">
                        {user.role.replace(/_/g, " ")}
                      </span>

                      {/* Updated from investorProfile to investor */}
                      {user.role === 'INVESTOR' && (
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-bold border border-blue-200">
                          {user.investor?.profitSharePercentage || 0}% Share
                        </span>
                      )}

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${user.isApproved
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-800"
                          }`}
                      >
                        {user.isApproved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Role Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Assign Role</label>
          <Select onValueChange={(val: UserRole) => setRole(val)} value={role}>
            <SelectTrigger className="w-full bg-white h-11 text-xs font-medium">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="INVESTOR" className="cursor-pointer">Investor</SelectItem>
              <SelectItem value="SALESMAN" className="cursor-pointer">Salesman</SelectItem>
              <SelectItem value="ADMIN" className="cursor-pointer">Admin</SelectItem>
              <SelectItem value="USER" className="cursor-pointer">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 📈 Investor Configuration Block */}
        {role === "INVESTOR" && (
          <div className="space-y-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            
            {/* Profit Share */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                Profit Share (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={profitPercentage}
                onChange={(e) => setProfitPercentage(e.target.value)}
                placeholder="e.g. 15.5"
                className="w-full h-10 px-3 bg-white border border-blue-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Approval Status Toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Approval Status</label>
          <Select onValueChange={(val) => setIsApproved(val)} value={isApproved}>
            <SelectTrigger className="w-full bg-white h-11 text-xs font-medium">
              <SelectValue placeholder="Select approval status" />
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="true" className="cursor-pointer">
                <span className="flex items-center gap-2 text-green-700 font-semibold">
                  <UserCheck className="w-4 h-4" /> Approved
                </span>
              </SelectItem>
              <SelectItem value="false" className="cursor-pointer">
                <span className="flex items-center gap-2 text-amber-700 font-semibold">
                  <UserX className="w-4 h-4" /> Pending
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleUpdateApprovalAndRole}
          disabled={!selectedUserId || isUpdating}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 h-11 rounded-xl shadow-md shadow-green-600/20 transition-all cursor-pointer"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Changes...
            </>
          ) : (
            "Update Role"
          )}
        </Button>

        {currentUser && (
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Logged in as:</span>
            <span className="font-semibold text-stone-800">{currentUser.email}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}