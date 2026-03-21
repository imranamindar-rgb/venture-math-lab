#!/usr/bin/env node

const deployHookUrl = process.env.RENDER_DEPLOY_HOOK_URL;
const apiKey = process.env.RENDER_API_KEY;
const serviceId = process.env.RENDER_SERVICE_ID;

async function triggerWithHook(url) {
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Deploy hook returned ${response.status} ${response.statusText}`);
  }
  return "Triggered via deploy hook.";
}

async function triggerWithApi(key, id) {
  const response = await fetch(`https://api.render.com/v1/services/${id}/deploys`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Render API returned ${response.status} ${response.statusText}`);
  }

  return "Triggered via Render API.";
}

async function main() {
  try {
    let message;

    if (deployHookUrl) {
      message = await triggerWithHook(deployHookUrl);
    } else if (apiKey && serviceId) {
      message = await triggerWithApi(apiKey, serviceId);
    } else {
      throw new Error(
        "No deploy credentials found. Set RENDER_DEPLOY_HOOK_URL or both RENDER_API_KEY and RENDER_SERVICE_ID. Auto-deploy on commit is enabled in render.yaml for push-based deploys.",
      );
    }

    console.log(message);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
