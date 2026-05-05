export type InviteErrorReason = "invalidCode" | "unexpected";

export type InviteSubmitState = {
  disabled: boolean;
  label: "Continue" | "Verifying...";
  busy: boolean;
};

export type InviteIntroCopy = {
  title: string;
  description: string;
};

export function buildInviteCodeInput(code: string) {
  return code.trim();
}

export function buildInviteSubmitState({
  code,
  loading,
}: {
  code: string;
  loading: boolean;
}): InviteSubmitState {
  const busy = loading;
  return {
    disabled: busy || !buildInviteCodeInput(code),
    label: busy ? "Verifying..." : "Continue",
    busy,
  };
}

export function buildInviteErrorMessage(reason: InviteErrorReason) {
  if (reason === "invalidCode") {
    return "Invalid invite code. Please try again.";
  }

  return "Something went wrong. Please try again later.";
}

export function buildInviteIntroCopy({
  appName,
  allowSignupWithoutInvite,
}: {
  appName: string;
  allowSignupWithoutInvite: boolean;
}): InviteIntroCopy {
  return {
    title: `Welcome to ${appName}`,
    description: allowSignupWithoutInvite
      ? "Enter an invite code if you have one, or wait for an admin to validate your profile."
      : "Please enter your invite code to access the app.",
  };
}
