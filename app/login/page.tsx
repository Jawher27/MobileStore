"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, signup } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"client" | "supplier">("client");
  const [companyName, setCompanyName] = useState("");
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    if (!isLogin) {
      formData.set("role", role);
      if (role === "client") {
        formData.set("company_name", companyName);
      }
    }

    const action = isLogin ? login : signup;

    try {
      const response = await action(formData);
      if (response?.error) {
        toast({
          title: "Authentication Error",
          description: response.error,
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (e: any) {
      if (e.message !== "NEXT_REDIRECT") {
        toast({
          title: "Something went wrong",
          description: e.message || "Please try again",
          variant: "destructive",
        });
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? "Login" : "Create an Account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access the Phone Part Store"
              : "Sign up for a new account to start ordering parts"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "client" | "supplier")
                  }
                  disabled={loading}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="client">Repair Shop (Client)</option>
                  <option value="supplier">Parts Supplier</option>
                </select>
              </div>
            )}
            {!isLogin && role === "client" && (
              <div className="space-y-2">
                <Label htmlFor="company_name">Nom de l'entreprise</Label>
                <Input
                  id="company_name"
                  name="company_name"
                  type="text"
                  required
                  placeholder="Ex: Auto Repair Mobile"
                  disabled={loading}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Sign In" : "Sign Up"}
            </Button>
            <div className="text-sm text-center text-muted-foreground w-full">
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {isLogin ? "Sign Up" : "Log In"}
              </button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
