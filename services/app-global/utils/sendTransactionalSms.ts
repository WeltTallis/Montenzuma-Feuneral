import axios from 'axios';

const normalizePhone = (value: string): string | null => {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const digits = raw.replace(/\D/g, '');
  if (raw.startsWith('+') && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.startsWith('254') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('0') && digits.length === 10) return `+254${digits.slice(1)}`;
  if (digits.length === 9) return `+254${digits}`;
  return null;
};

export const sendTransactionalSms = async ({
  phone,
  message,
  tenantSlug,
  event,
}: {
  phone: string | null | undefined;
  message: string;
  tenantSlug?: string;
  event: string;
}): Promise<boolean> => {
  const recipient = normalizePhone(phone || '');
  if (!recipient) {
    if (String(phone || '').trim()) {
      console.warn(`[SMS] Skipped ${event}: invalid recipient phone number`);
    }
    return false;
  }

  const serviceUrl = (process.env.SMS_SERVICE_URL || 'http://restpoint_sms_service:8080').replace(/\/+$/, '');
  try {
    const response = await axios.post(
      `${serviceUrl}/send-sms`,
      { recipient, message },
      {
        timeout: 8000,
        headers: tenantSlug ? { 'x-tenant-slug': tenantSlug } : undefined,
      }
    );
    console.info(`[SMS] ${event} message accepted by SMS service (${response.data?.status || 'sent'})`);
    return true;
  } catch (error: unknown) {
    const errorMessage = axios.isAxiosError(error)
      ? (typeof error.response?.data?.error === 'string' ? error.response.data.error : error.message)
      : error instanceof Error
        ? error.message
        : String(error);
    console.warn(`[SMS] Could not send ${event} message: ${errorMessage}`);
    return false;
  }
};
