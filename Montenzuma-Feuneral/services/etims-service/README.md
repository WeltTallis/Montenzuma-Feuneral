# KRA eTIMS TypeScript SDK and service

The TypeScript SDK in `src/sdk` supports submitting sales transactions through:

- OSCU: KRA HTTPS API, OAuth client-credentials token, and `Authorization`, `tin`, `bhfId`, and `cmcKey` headers.
- VSCU: the locally deployed VSCU service at `/trnsSales/saveSales`; VSCU performs its own KRA communication.

The client validates sales payloads with Joi, keeps OSCU tokens in memory per client, coalesces concurrent token requests, and does not retry sales submissions. VSCU payloads follow the KRA VSCU v2 `TrnsSalesSaveWrReq` structure.

```ts
import { createEtimsClient } from '@montezuma/etims-service';

const client = createEtimsClient({
  mode: 'vscu',
  baseUrl: 'http://127.0.0.1:8088/',
  tin: 'P123456789Z',
  bhfId: '00',
  allowInsecureVscu: true,
});

const result = await client.sendSalesTransaction(vscuSalesRequest);
```

## Queued sales service

The HTTP sales submission endpoint queues work in Redis and waits for the KRA
result before returning it. Sales jobs are processed one at a time by the
dedicated worker; only sales submissions are queued. Reads, authentication,
initialization, and other API calls remain synchronous.

Configure `ETIMS_MODE`, `ETIMS_BASE_URL`, `ETIMS_TIN`, and `ETIMS_BHF_ID`.
OSCU additionally requires `ETIMS_USERNAME`, `ETIMS_PASSWORD`, and
`ETIMS_COMMUNICATION_KEY`. Configure Redis with `REDIS_URL` or the
`REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` variables. These settings must come
from a trusted secret/configuration source and must not be sent in the sales
request body or committed to source control.

Build the service, then run one API process and exactly one sales worker process:

```sh
npm run build --workspace=@montezuma/etims-service
npm run start --workspace=@montezuma/etims-service
npm run worker --workspace=@montezuma/etims-service
```

The sales queue does not retry KRA submissions automatically. It uses a stable
invoice-derived job ID so repeated requests for a retained job return the same
result instead of creating a second submission. A request timeout does not
cancel the queued job; check the invoice status with KRA before any manual
resubmission. Failed jobs are retained for seven days for reconciliation.
The worker uses a single-job concurrency limit; deploy only one worker process.

Only allow VSCU HTTP traffic to a trusted, isolated VSCU host. OSCU HTTP is rejected.

The invoice service currently reports `etims_submission.status: "not_configured"`
and does not send sales. Automatic submission must remain disabled until a secure
tenant configuration source and KRA item/tax mappings are connected.
