import { Request, Response, NextFunction } from 'express';

export const validateOnboarding = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body || {};

  // Accept both frontend field names (organizationName) and backend field names (tenant_name)
  const organizationName = data.organizationName || data.tenant_name || '';
  const email = data.email || '';
  const location = data.location || '';
  const password = data.password || '';
  const full_name = data.full_name || data.fullName || 'Admin';
  // Accept both termsAccepted and acceptTerms from frontend
  const termsAccepted = (data.termsAccepted === true || data.termsAccepted === 'true' || data.termsAccepted === 1) ||
    (data.acceptTerms === true || data.acceptTerms === 'true' || data.acceptTerms === 1);

  const errors: string[] = [];

  if (!organizationName) errors.push('Organization name is required');
  if (!email) errors.push('Email is required');
  if (!location) errors.push('Location is required');
  if (!password) errors.push('Password is required');
  if (!termsAccepted) errors.push('You must accept terms and conditions');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Parse branches if it's a JSON string (comes from FormData)
  let branches = data.branches || [];
  if (typeof branches === 'string') {
    try {
      branches = JSON.parse(branches);
    } catch (e) {
      branches = [];
    }
  }
  // Ensure branches is an array
  if (!Array.isArray(branches)) {
    branches = [];
  }

  // Handle single-tenant branchName: convert to branch object
  const branchName = data.branchName || data.branch_name || '';
  if (branchName && branches.length === 0) {
    branches.push({
      branch_name: branchName,
      branch_location: location || 'Main Location',
      branch_phone: data.phone || '',
      branch_email: email
    });
  }

  // Map frontend field names to backend field names for branches
  // Frontend sends: { name, location } | Backend expects: { branch_name, branch_location, branch_phone, branch_email }
  const mappedBranches = branches.map((b: any) => ({
    branch_name: b.branch_name || b.name || '',
    branch_location: b.branch_location || b.location || location || '',
    branch_phone: b.branch_phone || b.phone || data.phone || '',
    branch_email: b.branch_email || b.email || email
  })).filter((b: any) => b.branch_name.trim());

  // Determine deployment type. Prefer the value sent by the frontend so a
  // multi-branch tenant is ALWAYS provisioned as 'multi' (and every branch name
  // — e.g. "macahakos", "Nairobi Main" — gets its own DB + branch row), even
  // when only a single named branch was submitted or the branch count alone is
  // ambiguous. Fall back to derivation from branch count for backwards
  // compatibility with older clients that omit deploymentType.
  let deploymentType = data.deploymentType || data.deployment_type || '';
  if (deploymentType !== 'single' && deploymentType !== 'multi') {
    deploymentType = mappedBranches.length > 1 ? 'multi' : 'single';
  }

  // Map to what controller.createOrganization expects.
  // IMPORTANT: include `deploymentType` here — the controller reads it from
  // req.body and previously re-derived it (always falling back to branch count)
  // because the middleware dropped it, which silently collapsed some
  // multi-branch tenants to single-tenant provisioning.
  req.body = {
    tenant_name: organizationName,
    email,
    location,
    password,
    full_name,
    phone: data.phone || '',
    country: data.country || 'Kenya',
    branches: mappedBranches,
    deploymentType,
    termsAccepted
  };

  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const data = req.body || {};
  const identifier = data.identifier || data.email || '';
  const password = data.password || '';

  const errors: string[] = [];

  if (!identifier) errors.push('Email or username is required');
  if (!password) errors.push('Password is required');

  if (errors.length > 0) {
    return res.status(400).json({ success: false, errors });
  }

  // Pass identifier through to the controller (not just email)
  req.body = { identifier, password };

  next();
};
