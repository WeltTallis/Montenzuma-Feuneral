# HR service

The HR service now hosts RestPoint's existing leave-management API and its
tenant leave-table migrations. Existing leave tables and records stay in the
same tenant databases; this consolidation does not copy or transform data.

The API gateway retains the `LEAVE_SERVICE_URL` setting for compatibility,
but Compose routes it to `restpoint_hr_service`. Leave requests continue to
use the existing RestPoint authentication middleware and `/leaves` routes.

## Run and verify

```powershell
npm --workspace @montezuma/restpoint-hr-service run start
```

The service listens on `PORT` (5017 by default). Its `/health` endpoint
confirms that the process is responding. Database-backed requests require the
normal RestPoint database and tenant environment variables.

For Docker deployments, build and start `hr-service` with the root Compose
configuration. The old leave-service source should only be removed after the
HR image builds and a deployed leave API smoke test passes.

## Payroll status

The payroll UI is part of the shared RestPoint client. The cloned Go payroll
backend remains under `payroll/`, but is not wired into this service: its
current authentication and tenant model does not safely map RestPoint users
and tenants. The client API remains disabled until that boundary and the
tenant-scoped database migration are implemented and tested. Do not enable
payroll requests or payouts based on this leave-service consolidation.
