import { ProjectFile } from './fileManager';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export interface DeploymentResult {
  success: boolean;
  url?: string;
  error?: string;
  deploymentId?: string;
}

export interface DeploymentStatus {
  status: 'idle' | 'deploying' | 'success' | 'error';
  url?: string;
  error?: string;
}

/**
 * Create a zip file from project files (simplified - uses backend)
 */
async function createProjectZip(files: ProjectFile[]): Promise<string> {
  // Send files to backend to create zip
  const response = await fetch(`${API_BASE}/deploy/zip`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });

  if (!response.ok) {
    throw new Error('Failed to create project zip');
  }

  const data = await response.json();
  return data.zipBase64; // Base64 encoded zip
}

/**
 * Deploy code to Vercel (supports both single-file and multi-file)
 */
export async function deployToVercel(
  code: string | ProjectFile[],
  projectName: string,
  apiToken?: string
): Promise<DeploymentResult> {
  try {
    // Check if it's multi-file or single-file
    const isMultiFile = Array.isArray(code);

    let payload: any;
    if (isMultiFile) {
      // Multi-file: create zip and send
      const zipBase64 = await createProjectZip(code);
      payload = {
        files: code,
        zipBase64,
        platform: 'vercel',
        projectName: projectName || `noir-${Date.now()}`,
        apiToken,
        isMultiFile: true,
      };
    } else {
      // Single-file: send as before
      payload = {
        code,
        platform: 'vercel',
        projectName: projectName || `noir-${Date.now()}`,
        apiToken,
        isMultiFile: false,
      };
    }

    const response = await fetch(`${API_BASE}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Deployment failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      deploymentId: data.deploymentId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to deploy to Vercel',
    };
  }
}

/**
 * Deploy code to Netlify (supports both single-file and multi-file)
 */
export async function deployToNetlify(
  code: string | ProjectFile[],
  siteName: string,
  apiToken?: string
): Promise<DeploymentResult> {
  try {
    // Check if it's multi-file or single-file
    const isMultiFile = Array.isArray(code);

    let payload: any;
    if (isMultiFile) {
      // Multi-file: create zip and send
      const zipBase64 = await createProjectZip(code);
      payload = {
        files: code,
        zipBase64,
        platform: 'netlify',
        projectName: siteName || `noir-${Date.now()}`,
        apiToken,
        isMultiFile: true,
      };
    } else {
      // Single-file: send as before
      payload = {
        code,
        platform: 'netlify',
        projectName: siteName || `noir-${Date.now()}`,
        apiToken,
        isMultiFile: false,
      };
    }

    const response = await fetch(`${API_BASE}/deploy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error || 'Deployment failed',
      };
    }

    const data = await response.json();
    return {
      success: true,
      url: data.url,
      deploymentId: data.deploymentId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to deploy to Netlify',
    };
  }
}

/**
 * Get deployment status
 */
export async function getDeploymentStatus(
  deploymentId: string,
  platform: 'vercel' | 'netlify'
): Promise<DeploymentStatus> {
  try {
    const response = await fetch(`${API_BASE}/deploy/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deploymentId,
        platform,
      }),
    });

    if (!response.ok) {
      return {
        status: 'error',
        error: 'Failed to get deployment status',
      };
    }

    const data = await response.json();
    return {
      status: data.status === 'ready' ? 'success' : 'deploying',
      url: data.url,
    };
  } catch (error: any) {
    return {
      status: 'error',
      error: error.message || 'Failed to get deployment status',
    };
  }
}
