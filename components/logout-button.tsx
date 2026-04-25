"use client";

import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export function LogoutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        await logout();
      }}
    >
      Log out
    </Button>
  );
}
