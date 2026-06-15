"use client";

import {
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
import { notifications } from "@mantine/notifications";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { PageContainer } from "@/components/PageContainer/PageContainer";

export default function ProfilePage() {
  const { user, refresh } = useAuth();

  const profileForm = useForm({
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm({
    initialValues: { currentPassword: "", newPassword: "" },
    validate: {
      newPassword: (v) =>
        v.length < 6 ? "Password must be at least 6 characters" : null,
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (values: typeof profileForm.values) =>
      api.put(`/auth/profile`, values),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Profile updated" });
      refresh();
    },
  });

  const pwMutation = useMutation({
    mutationFn: async (values: typeof passwordForm.values) =>
      api.put(`/auth/change-password`, values),
    onSuccess: (res) => {
      if (!res.success) {
        notifications.show({ color: "red", message: res.message || "Failed" });
        return;
      }
      notifications.show({ color: "green", message: "Password changed" });
      passwordForm.reset();
    },
  });

  return (
    <PageContainer title="Profile & Settings">
      <Stack gap="lg">
        <Card withBorder p="lg" radius="md" data-testid="profile-info-card">
          <Title order={5} mb="md">Profile Information</Title>
          <form onSubmit={profileForm.onSubmit((v) => profileMutation.mutate(v))}>
            <Stack>
              <Group grow>
                <TextInput label="Name" {...profileForm.getInputProps("name")} />
                <TextInput label="Email" type="email" {...profileForm.getInputProps("email")} />
              </Group>
              <Text size="xs" c="dimmed">
                Role: <b>{user?.role}</b> · Status: <b>{user?.status}</b>
              </Text>
              <Button
                type="submit"
                loading={profileMutation.isPending}
                style={{ alignSelf: "flex-start" }}
                data-testid="profile-save-btn"
              >
                Save Profile
              </Button>
            </Stack>
          </form>
        </Card>

        <Card withBorder p="lg" radius="md" data-testid="password-card">
          <Title order={5} mb="md">Change Password</Title>
          <form onSubmit={passwordForm.onSubmit((v) => pwMutation.mutate(v))}>
            <Stack>
              <PasswordInput
                label="Current Password"
                required
                {...passwordForm.getInputProps("currentPassword")}
              />
              <PasswordInput
                label="New Password"
                required
                {...passwordForm.getInputProps("newPassword")}
              />
              <Button
                type="submit"
                loading={pwMutation.isPending}
                style={{ alignSelf: "flex-start" }}
                data-testid="password-save-btn"
              >
                Change Password
              </Button>
            </Stack>
          </form>
        </Card>
      </Stack>
    </PageContainer>
  );
}
