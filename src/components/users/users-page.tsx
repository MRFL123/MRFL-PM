"use client";

import { UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/page-header";
import { StatusPill } from "@/components/app/status-pill";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDisplayDate } from "@/lib/dates";
import { SAMPLE_USERS, USER_STATUS_STYLES, userInitials } from "@/lib/users";

export function UsersPage() {
  const users = SAMPLE_USERS;

  const comingSoon = () => toast.info("User management is coming soon.");

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage who has access to the workspace."
        actions={
          <Button onClick={comingSoon}>
            <UserPlus data-icon="inline-start" />
            Add User
          </Button>
        }
      />

      <div className="mx-auto w-full max-w-[88rem] px-4 py-8 sm:px-6 lg:px-8">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
              <Users className="size-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-semibold">No users yet</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Invite teammates to collaborate on projects.
            </p>
            <Button className="mt-5" onClick={comingSoon}>
              <UserPlus data-icon="inline-start" />
              Add User
            </Button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[11px] font-semibold text-zinc-600">
                          {userInitials(user.name)}
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <StatusPill label={user.status} className={USER_STATUS_STYLES[user.status]} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDisplayDate(user.joined)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={comingSoon}>
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
