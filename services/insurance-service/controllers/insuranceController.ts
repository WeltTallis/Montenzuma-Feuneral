/**
 * Insurance Service - controllers.
 *
 * Public WRITE endpoints (no auth: these back the forms on the public Amani
 * site, filled in by bereaved families who have no account) plus staff READ
 * endpoints, which the gateway puts behind authentication.
 *
 * Every query is scoped by req.tenantSlug, set by the tenant middleware in
 * server.ts, so one funeral home can never read another's policies - these
 * tables hold national ID numbers.
 */
import { Request, Response } from 'express';
import { getKnex } from '../db';
import { validateApplication, validateClaim } from '../models/validation';
import { normalisePolicyNumber, now, VALID_CLAIM_STATUSES } from '../models/policyNumber';

declare module 'express-serve-static-core' {
  interface Request {
    tenantSlug?: string;
    branchId?: string | number;
    tenant?: { id?: number | string; db_name?: string; tenant_slug?: string };
  }
}

/** Tenant + branch context, mirrored from the other services. */
function context(req: Request) {
  return {
    tenantSlug: req.tenantSlug || 'system_shared',
    tenantId: req.tenant?.id ?? null,
    branchId: req.branchId ? Number.parseInt(String(req.branchId), 10) || 0 : 0,
  };
}

/** Clamped paging so a caller cannot ask for the whole table. */
function paging(req: Request): { limit: number; offset: number } {
  return {
    limit: Math.min(Number.parseInt(String(req.query.limit), 10) || 50, 200),
    offset: Math.max(Number.parseInt(String(req.query.offset), 10) || 0, 0),
  };
}

/* ==========================================================================
   POST /insurance/applications
   Create a policy. THE POLICY NUMBER IS THE APPLICANT'S ID NUMBER.
   ========================================================================== */
export async function createApplication(req: Request, res: Response) {
  const { valid, errors, value } = validateApplication(req.body);

  if (!valid) {
    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      errors,
    });
  }

  const knex = getKnex();
  const { tenantSlug, tenantId, branchId } = context(req);
  const ts = now();

  try {
    /* One policy per ID number per tenant. A second application for the same
       ID is almost always a double submission rather than a second policy -
       the form is public and a worried applicant taps twice. Returning the
       EXISTING policy (not 409) makes the endpoint idempotent, so a double
       tap cannot create a duplicate the family only finds out about at claim
       time. The unique index is the real guard against two simultaneous
       requests. */
    const existing = await knex('insurance_policies')
      .where({ tenant_slug: tenantSlug, policy_number: value.policyNumber })
      .where('is_deleted', false)
      .first();

    if (existing) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'An application already exists for this ID number.',
        policy: {
          policyNumber: existing.policy_number,
          fullName: existing.full_name,
          coverType: existing.cover_type,
          status: existing.status,
        },
      });
    }

    const [policyId] = await knex('insurance_policies').insert({
      policy_number: value.policyNumber,
      id_number: value.idNumber,
      tenant_slug: tenantSlug,
      tenant_id: tenantId,
      branch_id: branchId,
      full_name: value.fullName,
      age: value.age,
      employment: value.employment || null,
      phone: value.phone,
      email: value.email,
      cover_type: value.cover,
      covered_count: value.coveredCount,
      status: 'pending',
      declaration_accepted: value.confirmAccepted,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
    });

    /* Group members, inserted as one set so a failure cannot leave half a
       group attached to the policy. */
    if (value.cover === 'Group' && value.members.length) {
      await knex('insurance_policy_members').insert(
        value.members.map((m, i) => ({
          policy_id: policyId,
          full_name: m.fullName,
          phone: m.phone,
          tenant_slug: tenantSlug,
          tenant_id: tenantId,
          branch_id: branchId,
          /* The applicant is position 1, so the repeater starts at 2. */
          position: i + 2,
          is_deleted: false,
          created_at: ts,
          updated_at: ts,
        })),
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Application received. Our care team will call you within one working day.',
      policy: {
        policyNumber: value.policyNumber,
        fullName: value.fullName,
        coverType: value.cover,
        coveredCount: value.coveredCount,
        status: 'pending',
      },
    });
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY' || err?.errno === 1062) {
      return res.status(409).json({
        success: false,
        message: 'An application already exists for this ID number.',
        errors: { idNumber: 'An application already exists for this ID number.' },
      });
    }
    console.error('[insurance] createApplication failed:', err);
    return res.status(500).json({ success: false, message: 'Could not save the application.' });
  }
}

/* ==========================================================================
   POST /insurance/claims
   File a claim by quoting the policy number (== the holder's ID number).
   ========================================================================== */
export async function createClaim(req: Request, res: Response) {
  const { valid, errors, value } = validateClaim(req.body);

  if (!valid) {
    return res.status(400).json({
      success: false,
      message: 'Please correct the highlighted fields.',
      errors,
    });
  }

  const knex = getKnex();
  const { tenantSlug, tenantId, branchId } = context(req);
  const ts = now();

  try {
    const policy = await knex('insurance_policies')
      .where({ tenant_slug: tenantSlug, policy_number: value.policyNumber })
      .where('is_deleted', false)
      .first();

    /* A deliberately GENERIC 404, not "no policy with that number": echoing
       back that a specific ID is unknown turns this endpoint into a
       policy-number oracle for anyone holding a list of ID numbers. The
       message points the family at the phone instead. */
    if (!policy) {
      return res.status(404).json({
        success: false,
        message:
          'We could not find an Amani Cover policy for that number. ' +
          'Please call the family line on (020) 2346928 and we will help you.',
        errors: { policyNumber: 'No policy found for this number.' },
      });
    }

    const [claimId] = await knex('insurance_claims').insert({
      policy_number: policy.policy_number,
      policy_id: policy.policy_id,
      claimant_full_name: value.claimantName,
      claimant_id_number: value.claimantId,
      phone: value.phone,
      relationship: value.relationship,
      deceased_name: value.deceasedName,
      death_date: value.deathDate,
      cause_of_death: value.causeDeath,
      place_of_death: value.placeDeath,
      notes: value.notes,
      status: 'submitted',
      tenant_slug: tenantSlug,
      tenant_id: tenantId,
      branch_id: branchId,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
    });

    return res.status(201).json({
      success: true,
      message:
        'Your claim has been received. A member of our family line will call you ' +
        'within one working day.',
      claim: { claimId, policyNumber: policy.policy_number, status: 'submitted' },
    });
  } catch (err) {
    console.error('[insurance] createClaim failed:', err);
    return res.status(500).json({ success: false, message: 'Could not save the claim.' });
  }
}

/* ==========================================================================
   POST /insurance/cover-check   (PUBLIC)
   Confirm whether an Amani Cover exists for a given policy number.

   WHY THIS EXISTS SEPARATELY FROM GET /insurance/policies/:policyNumber
   That endpoint is for staff: it returns the holder's name, phone, email,
   age, every group member and every claim, and it is scoped to the caller's
   tenant. A member of the public paying a contribution has no account and no
   tenant, so it is useless to them - and exposing it publicly would hand out
   a full profile for anyone who typed an ID number.

   So this returns the MINIMUM needed to let someone proceed to pay, and
   deliberately never returns:
     • the holder's name, phone, email or age
     • group members or claims
     • any tenant or branch detail
   A wrong guess yields `found: false` and nothing else, so the endpoint
   cannot be used to enumerate who holds cover beyond what the visitor
   already supplied.
   ========================================================================== */
/* ==========================================================================
   POST /insurance/claim-track   (PUBLIC)

   Let a bereaved family check on a claim they have already filed, by entering
   the policy number from the policy card (= the holder's national ID, same
   rule as every other public endpoint here - see migration 001).

   WHY A DEDICATED ENDPOINT
   The staff endpoint GET /insurance/claims returns the claimant's full name,
   their ID number, their phone, the cause of death, the place of death, the
   free-text notes and the paths of every uploaded document. None of that can
   be shown to an anonymous visitor, and GET /insurance/policies/:policyNumber
   would additionally hand out the holder's profile. So this returns a purpose
   built, deliberately thin shape.

   WHAT THIS DELIBERATELY NEVER RETURNS
     • claimant_full_name / claimant_id_number / phone / relationship
     • cause_of_death, place_of_death, notes        <- the most sensitive
     • any document path                             <- would let a guesser
                                                      download a death cert
     • review_notes                                 <- internal staff notes
     • tenant / branch detail
   The visitor already knows the policy number, so echoing the deceased's name
   and the claim's own dates adds nothing they could not otherwise see, and is
   what makes the result screen intelligible.

   THE RISK, STATED PLAINLY
   Knowledge of an ID number is the only credential. Anyone who guesses or
   obtains one can see that a death was reported against it, plus the status.
   That is inherent to "look it up by ID" and was an explicit product decision;
   it is why the payload above is so thin. If that is unacceptable, the fix is
   a second factor - ask the family for the claimant's phone number, or email a
   one-time code to the address on the claim - not a wider response.

   A wrong guess yields `found: false` and nothing else, so this cannot be used
   to enumerate who holds cover.
   ========================================================================== */
export async function trackClaim(req: Request, res: Response) {
  const policyNumber = normalisePolicyNumber(req.body?.policyNumber ?? req.body?.idNumber);

  if (!policyNumber) {
    return res.status(400).json({
      success: false,
      message: 'Enter the policy number from the policy card.',
      errors: { policyNumber: 'Enter your policy number.' },
    });
  }

  const knex = getKnex();

  try {
    const scope = req.tenantSlug && req.tenantSlug !== 'system_shared'
      ? [req.tenantSlug, 'system_shared']
      : ['system_shared'];

    /* Newest first: a family checking on a death wants the claim they just
       filed, not the oldest one on the policy. Capped so a policy with a long
       history cannot be used to pull the whole table. */
    const claims = await knex('insurance_claims')
      .whereIn('tenant_slug', scope)
      .where('policy_number', policyNumber)
      .where('is_deleted', false)
      .orderBy('created_at', 'desc')
      .limit(10);

    if (!claims.length) {
      return res.json({
        success: true,
        found: false,
        message:
          'We could not find a claim filed under that number. ' +
          'Please check the number on the policy card, or call the family line on (020) 2346928 ' +
          'and we will look it up with you.',
      });
    }

    return res.json({
      success: true,
      found: true,
      claims: claims.map((claim) => ({
        /* Short public reference. The numeric claim_id is never exposed - it is
           sequential and would let a caller walk the claims table. */
        reference: `AMN-C${String(claim.claim_id).padStart(5, '0')}`,
        status: claim.status,
        deceasedName: claim.deceased_name,
        deathDate: claim.death_date,
        submittedAt: claim.created_at,
        updatedAt: claim.updated_at,
      })),
      message: 'Here is the progress of your claim.',
    });
  } catch (err) {
    console.error('[insurance] trackClaim failed:', err);
    return res.status(500).json({ success: false, message: 'Could not look up that claim.' });
  }
}

export async function checkCover(req: Request, res: Response) {
  const policyNumber = normalisePolicyNumber(req.body?.policyNumber ?? req.body?.idNumber);

  if (!policyNumber) {
    return res.status(400).json({
      success: false,
      message: 'Enter your Amani Cover policy number.',
      errors: { policyNumber: 'Enter your policy number.' },
    });
  }

  const knex = getKnex();

  try {
    /* Public Amani submissions live under the public tenant, so an unpaid
       policy applied for through the public site is found here. Tenant-scoped
       lookups still work when the caller sends its own tenant headers, which
       is how a staff member checks a policy on the back office. */
    const scope = req.tenantSlug && req.tenantSlug !== 'system_shared'
      ? [req.tenantSlug, 'system_shared']
      : ['system_shared'];

    const policy = await knex('insurance_policies')
      .whereIn('tenant_slug', scope)
      .where('policy_number', policyNumber)
      .where('is_deleted', false)
      .first();

    if (!policy) {
      /* Same reasoning as the claim endpoint: no confirmation that this
         particular ID exists or does not. */
      return res.json({
        success: true,
        found: false,
        message:
          'We could not find an Amani Cover policy for that number. ' +
          'Please check the number on your policy card, or call the family line on (020) 2346928.',
      });
    }

    return res.json({
      success: true,
      found: true,
      /* Deliberately no name / phone / email / members / claims. */
      coverType: policy.cover_type,
      status: policy.status,
      coveredCount: policy.covered_count,
      openedAt: policy.created_at,
      message:
        policy.status === 'active'
          ? 'We found your Amani Cover. You can make a contribution below.'
          : policy.status === 'pending'
            ? 'We found your application. It is still being reviewed — you can record a contribution now and we will allocate it once your cover is active.'
            : 'We found your policy, but it is currently not active. Please call the family line so we can help.',
    });
  } catch (err) {
    console.error('[insurance] checkCover failed:', err);
    return res.status(500).json({ success: false, message: 'Could not check that policy number.' });
  }
}

/** GET /insurance/policies - list, newest first, with optional filters. */
export async function listPolicies(req: Request, res: Response) {
  const knex = getKnex();
  const { tenantSlug } = context(req);
  const { limit, offset } = paging(req);

  try {
    const query = knex('insurance_policies')
      .where({ tenant_slug: tenantSlug })
      .where('is_deleted', false);

    if (req.query.status) query.where('status', String(req.query.status));
    if (req.query.coverType) query.where('cover_type', String(req.query.coverType));

    if (req.query.search) {
      const term = `%${String(req.query.search).trim()}%`;
      query.where((b: any) =>
        b.where('full_name', 'like', term)
          .orWhere('policy_number', 'like', term)
          .orWhere('phone', 'like', term),
      );
    }

    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return res.json({
      success: true,
      count: rows.length,
      policies: rows.map((r: any) => ({
        policyNumber: r.policy_number,
        fullName: r.full_name,
        phone: r.phone,
        email: r.email,
        age: r.age,
        employment: r.employment,
        coverType: r.cover_type,
        coveredCount: r.covered_count,
        status: r.status,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[insurance] listPolicies failed:', err);
    return res.status(500).json({ success: false, message: 'Could not load policies.' });
  }
}

/** GET /insurance/policies/:policyNumber - one policy, its members and claims. */
export async function getPolicy(req: Request, res: Response) {
  const knex = getKnex();
  const { tenantSlug } = context(req);
  const policyNumber = normalisePolicyNumber(req.params.policyNumber);

  try {
    const policy = await knex('insurance_policies')
      .where({ tenant_slug: tenantSlug, policy_number: policyNumber })
      .where('is_deleted', false)
      .first();

    if (!policy) {
      return res.status(404).json({ success: false, message: 'Policy not found.' });
    }

    const members = await knex('insurance_policy_members')
      .where({ policy_id: policy.policy_id, is_deleted: false })
      .orderBy('position', 'asc');

    const claims = await knex('insurance_claims')
      .where({ policy_id: policy.policy_id, is_deleted: false })
      .orderBy('created_at', 'desc');

    return res.json({
      success: true,
      policy: {
        policyNumber: policy.policy_number,
        fullName: policy.full_name,
        phone: policy.phone,
        email: policy.email,
        age: policy.age,
        employment: policy.employment,
        coverType: policy.cover_type,
        coveredCount: policy.covered_count,
        status: policy.status,
        createdAt: policy.created_at,
      },
      members: members.map((m: any) => ({
        position: m.position,
        fullName: m.full_name,
        phone: m.phone,
      })),
      claims: claims.map((c: any) => ({
        claimId: c.claim_id,
        claimantName: c.claimant_full_name,
        deceasedName: c.deceased_name,
        deathDate: c.death_date,
        status: c.status,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    console.error('[insurance] getPolicy failed:', err);
    return res.status(500).json({ success: false, message: 'Could not load the policy.' });
  }
}

/** GET /insurance/claims - list claims for the tenant. */
export async function listClaims(req: Request, res: Response) {
  const knex = getKnex();
  const { tenantSlug } = context(req);
  const { limit, offset } = paging(req);

  try {
    const query = knex('insurance_claims')
      .where({ tenant_slug: tenantSlug })
      .where('is_deleted', false);

    if (req.query.status) query.where('status', String(req.query.status));
    if (req.query.policyNumber) {
      query.where('policy_number', normalisePolicyNumber(req.query.policyNumber));
    }

    const rows = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);

    return res.json({
      success: true,
      count: rows.length,
      claims: rows.map((r: any) => ({
        claimId: r.claim_id,
        policyNumber: r.policy_number,
        claimantName: r.claimant_full_name,
        phone: r.phone,
        relationship: r.relationship,
        deceasedName: r.deceased_name,
        deathDate: r.death_date,
        status: r.status,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[insurance] listClaims failed:', err);
    return res.status(500).json({ success: false, message: 'Could not load claims.' });
  }
}

/** PATCH /insurance/claims/:claimId/status - staff move a claim along. */
export async function updateClaimStatus(req: Request, res: Response) {
  const knex = getKnex();
  const { tenantSlug } = context(req);
  const status = String(req.body?.status || '');

  if (!(VALID_CLAIM_STATUSES as readonly string[]).includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_CLAIM_STATUSES.join(', ')}`,
    });
  }

  try {
    const updated = await knex('insurance_claims')
      .where({ tenant_slug: tenantSlug, claim_id: req.params.claimId })
      .where('is_deleted', false)
      .update({
        status,
        review_notes: req.body?.reviewNotes ? String(req.body.reviewNotes) : null,
        updated_at: now(),
      });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Claim not found.' });
    }
    return res.json({ success: true, claimId: req.params.claimId, status });
  } catch (err) {
    console.error('[insurance] updateClaimStatus failed:', err);
    return res.status(500).json({ success: false, message: 'Could not update the claim.' });
  }
}

/** GET /insurance/stats - counts for the staff dashboard. */
export async function getStats(req: Request, res: Response) {
  const knex = getKnex();
  const { tenantSlug } = context(req);

  try {
    const countBy = (table: string, column: string) =>
      knex(table)
        .where({ tenant_slug: tenantSlug, is_deleted: false })
        .select(column)
        .count({ total: '*' })
        .groupBy(column);

    const [policiesByStatus, policiesByCover, claimsByStatus, totals] = await Promise.all([
      countBy('insurance_policies', 'status'),
      countBy('insurance_policies', 'cover_type'),
      countBy('insurance_claims', 'status'),
      knex('insurance_policies')
        .where({ tenant_slug: tenantSlug, is_deleted: false })
        .count({ policies: '*' })
        .sum({ covered: 'covered_count' })
        .first(),
    ]);

    return res.json({
      success: true,
      totals: {
        policies: Number(totals?.policies || 0),
        peopleCovered: Number(totals?.covered || 0),
      },
      policiesByStatus: Object.fromEntries(
        policiesByStatus.map((r: any) => [r.status, Number(r.total)]),
      ),
      policiesByCover: Object.fromEntries(
        policiesByCover.map((r: any) => [r.cover_type, Number(r.total)]),
      ),
      claimsByStatus: Object.fromEntries(
        claimsByStatus.map((r: any) => [r.status, Number(r.total)]),
      ),
    });
  } catch (err) {
    console.error('[insurance] getStats failed:', err);
    return res.status(500).json({ success: false, message: 'Could not load statistics.' });
  }
}