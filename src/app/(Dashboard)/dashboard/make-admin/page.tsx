"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { RefreshResponse, TUser, UserRole } from "@/types/auth.types";
import { useGetAllUsersQuery, useUpdateUserProfileMutation } from "@/redux/store/api/user/userApi";
import { useRefreshTokenMutation } from "@/redux/store/api/auth/authApi";
import { RootState } from "@/redux/store/store";
import { setUser } from "@/redux/store/features/auth/authSlice";

interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

export default function RoleManager() {
  const { data: users, isLoading } = useGetAllUsersQuery(undefined);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [refreshToken] = useRefreshTokenMutation();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [role, setRole] = useState<UserRole>("USER");

  const auth = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();

  // decode JWT to show current user info
  const [currentUser, setCurrentUser] = useState<JwtPayload | null>(null);
  useEffect(() => {
    // console.log("Access Token:", auth.accessToken);
    if (auth.accessToken) {
      try {
        const decoded = jwtDecode<JwtPayload>(auth.accessToken);
        // console.log("Decoded JWT:", decoded);
        setCurrentUser(decoded);
      } catch (err) {
        console.error("Failed to decode JWT:", err);
      }
    }
  }, [auth.accessToken]);

  const handleUpdateRole = async () => {
    if (!selectedUserId) return;
    try {
      await updateUser({ id: selectedUserId, updates: { role } }).unwrap();

      // console.log("Updated user:", response);

      // 2️⃣ Immediately refresh token
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

      setSelectedUserId("");
    } catch (err) {
      console.error("Error updating role:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <Card className="max-w-lg mx-auto mt-6">
      <CardHeader>
        <CardTitle>Role Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Select onValueChange={setSelectedUserId} value={selectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {(users ?? []).map((user: TUser) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} — {user.email} ({user.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select onValueChange={(val: UserRole) => setRole(val)} value={role}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUPER_ADMIN">Super_Admin</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="SALESMAN">Salesman</SelectItem>
              <SelectItem value="USER">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpdateRole}
          disabled={!selectedUserId || isUpdating}
          className="w-full"
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Role"
          )}
        </Button>

        {currentUser && (
          <p className="text-sm text-gray-600 mt-4">
            Logged in as <strong>{currentUser.email}</strong> ({currentUser.role})
          </p>
        )}
      </CardContent>
    </Card>
  );
}
