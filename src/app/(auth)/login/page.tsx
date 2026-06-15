"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  Group,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconBuildingStore } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const form = useForm({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) => (v.length < 3 ? "Password too short" : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setError(null);
    setSubmitting(true);
    const res = await login(values.email, values.password);
    setSubmitting(false);
    if (res.ok) {
      router.replace("/dashboard");
    } else {
      setError(res.error || "Login failed");
    }
  });

  return (
    <Card
      withBorder
      shadow="lg"
      p={32}
      radius="lg"
      style={{ width: "100%", maxWidth: 420 }}
      data-testid="login-card"
    >
      <Stack gap="lg">
        <Group justify="center">
          <Box
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#3a4bdd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBuildingStore size={32} color="#fff" />
          </Box>
        </Group>
        <Box ta="center">
          <Title order={2}>Liquidity Admin</Title>
          <Text c="dimmed" size="sm" mt={4}>
            Sign in to manage your dashboard
          </Text>
        </Box>

        {error && (
          <Alert color="red" data-testid="login-error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              label="Email"
              placeholder="Your email"
              required
              data-testid="login-email-input"
              {...form.getInputProps("email")}
            />
            <PasswordInput
              label="Password"
              placeholder="Your password"
              required
              data-testid="login-password-input"
              {...form.getInputProps("password")}
            />
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              size="md"
              mt="sm"
              data-testid="login-submit-btn"
            >
              Sign In
            </Button>
          </Stack>
        </form>
      </Stack>
    </Card>
  );
}
