export type ProfileCompletionValues = {
  displayName: string;
  displaySurname: string;
};

export type ProfileCompletionValidation =
  | {
      ok: true;
      values: ProfileCompletionValues;
    }
  | {
      ok: false;
      error: string;
    };

export type ProfileCompletionSubmitState = {
  disabled: boolean;
  busy: boolean;
  label: "Save and continue" | "Saving...";
};

export type ProfileCompletionCopy = {
  title: string;
  description: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
};

export function validateProfileCompletionInput({
  name,
  surname,
}: {
  name: string;
  surname: string;
}): ProfileCompletionValidation {
  const displayName = name.trim();
  const displaySurname = surname.trim();

  if (!displayName || !displaySurname) {
    return {
      ok: false,
      error: "Please enter both first and last name.",
    };
  }

  return {
    ok: true,
    values: {
      displayName,
      displaySurname,
    },
  };
}

export function buildProfileCompletionSubmitState({ saving }: { saving: boolean }): ProfileCompletionSubmitState {
  return {
    disabled: saving,
    busy: saving,
    label: saving ? "Saving..." : "Save and continue",
  };
}

export function buildProfileCompletionCopy(): ProfileCompletionCopy {
  return {
    title: "Complete profile",
    description: "Enter your first and last name to continue.",
    firstNameLabel: "First name",
    firstNamePlaceholder: "Ada",
    lastNameLabel: "Last name",
    lastNamePlaceholder: "Lovelace",
  };
}
