import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPath = path.join(root, "config", "bringa.config.jsonc");
const schemaPath = path.join(root, "supabase", "schema.sql");

function stripComments(input) {
  let output = "";
  let inString = false;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inLineComment) {
      if (char === "\n") {
        inLineComment = false;
        output += char;
      }
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      index += 1;
      continue;
    }

    output += char;
  }

  return output;
}

function removeTrailingCommas(input) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];

    if (inString) {
      output += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      output += char;
      continue;
    }

    if (char === ",") {
      let cursor = index + 1;
      while (/\s/.test(input[cursor])) {
        cursor += 1;
      }
      if (input[cursor] === "}" || input[cursor] === "]") {
        continue;
      }
    }

    output += char;
  }

  return output;
}

function requireMatch(content, pattern, message) {
  if (!pattern.test(content)) {
    throw new Error(message);
  }
}

function requireIncludes(content, value, message) {
  if (!content.includes(value)) {
    throw new Error(message);
  }
}

async function loadConfig() {
  const source = await readFile(configPath, "utf8");
  return JSON.parse(removeTrailingCommas(stripComments(source)));
}

async function main() {
  const config = await loadConfig();
  const schema = await readFile(schemaPath, "utf8");

  const requiredFunctions = [
    "verify_and_apply_invite",
    "create_item",
    "update_item",
    "borrow_item",
    "return_item",
    "delete_item",
    "promote_admin",
    "demote_admin",
    "get_my_invite_code",
    "set_my_invite_code",
  ];

  for (const functionName of requiredFunctions) {
    requireMatch(
      schema,
      new RegExp(`CREATE OR REPLACE FUNCTION public\\.${functionName}\\s*\\(`),
      `Missing RPC in supabase/schema.sql: ${functionName}`,
    );
  }

  const requiredPolicies = [
    "No direct item inserts",
    "No direct item updates",
    "No direct item deletes",
    "Validated users can upload item images",
  ];

  for (const policyName of requiredPolicies) {
    requireIncludes(schema, policyName, `Missing policy in supabase/schema.sql: ${policyName}`);
  }

  requireIncludes(schema, "INSERT INTO storage.buckets", "Missing Storage bucket setup in supabase/schema.sql.");
  requireIncludes(
    schema,
    String(config.media.maxUploadBytes),
    "Storage bucket file size limit is not aligned with config media.maxUploadBytes.",
  );

  for (const mimeType of config.media.acceptedImageMimeTypes) {
    requireIncludes(
      schema,
      `'${mimeType}'`,
      `Storage bucket MIME allowlist is missing config media type: ${mimeType}`,
    );
  }

  console.log("Supabase contract check passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
