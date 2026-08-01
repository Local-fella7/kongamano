import { z } from 'zod';
import type { ApiResponse } from '~/types/api';
import type { ForgotPasswordData, ResetPasswordPayload } from '~/types/auth';

const requestOtpSchema = z.object({
  username: z.string().min(1, 'Username is required.'),
  mobile: z.string().min(1, 'Mobile number is required.'),
});

const resetPinSchema = z
  .object({
    username: z.string().min(1, 'Username is required.'),
    otp: z.string().min(1, 'Reset code is required.'),
    pin: z
      .string()
      .min(1, 'New PIN is required.')
      .regex(/^\d+$/, 'PIN must contain only numeric digits (0-9).'),
    pin_confirmation: z.string().min(1, 'PIN confirmation is required.'),
  })
  .refine((data) => data.pin === data.pin_confirmation, {
    message: 'PIN confirmation does not match.',
    path: ['pin_confirmation'],
  });

export function usePasswordReset(initial?: { username?: string; mobile?: string }) {
  const push = usePush();

  const step = ref(1);
  const loading = ref(false);
  const errorMessage = ref('');
  const successMessage = ref('');
  const expiresAt = ref('');
  const devOtp = ref('');

  const username = ref(initial?.username || '');
  const mobile = ref(initial?.mobile || '');
  const otp = ref('');
  const pin = ref('');
  const pinConfirmation = ref('');

  const errors = ref<Record<string, string>>({});

  function resetMessages() {
    errorMessage.value = '';
    successMessage.value = '';
    errors.value = {};
  }

  function resetFlow() {
    step.value = 1;
    otp.value = '';
    pin.value = '';
    pinConfirmation.value = '';
    expiresAt.value = '';
    devOtp.value = '';
    resetMessages();
  }

  async function requestOtp() {
    resetMessages();

    const validation = requestOtpSchema.safeParse({
      username: username.value,
      mobile: mobile.value,
    });

    if (!validation.success) {
      const formatted = validation.error.format();
      errors.value = {
        username: formatted.username?._errors[0] || '',
        mobile: formatted.mobile?._errors[0] || '',
      };
      return false;
    }

    loading.value = true;
    try {
      const response = await $fetch<ApiResponse<ForgotPasswordData>>('/api/auth/forgot-password', {
        method: 'POST',
        body: {
          username: username.value.trim(),
          mobile: mobile.value.trim(),
        },
      });

      successMessage.value =
        response?.message || 'If the account details are correct, a reset code has been sent to the registered mobile number.';
      expiresAt.value = response?.data?.expires_at || '';
      devOtp.value = response?.data?.otp || '';
      step.value = 2;

      push.success({
        title: 'Reset Code Sent',
        message: successMessage.value,
      });

      return true;
    } catch (err: any) {
      errorMessage.value = err?.data?.message || 'Failed to request reset code. Please try again.';
      push.error({ title: 'Request Failed', message: errorMessage.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function resetPin() {
    resetMessages();

    const validation = resetPinSchema.safeParse({
      username: username.value,
      otp: otp.value,
      pin: pin.value,
      pin_confirmation: pinConfirmation.value,
    });

    if (!validation.success) {
      const formatted = validation.error.format();
      errors.value = {
        otp: formatted.otp?._errors[0] || '',
        pin: formatted.pin?._errors[0] || '',
        pin_confirmation: formatted.pin_confirmation?._errors[0] || '',
      };
      return false;
    }

    loading.value = true;
    try {
      const payload: ResetPasswordPayload = {
        username: username.value.trim(),
        otp: otp.value.trim(),
        pin: pin.value.trim(),
        pin_confirmation: pinConfirmation.value.trim(),
      };

      const response = await $fetch<ApiResponse>('/api/auth/reset-password', {
        method: 'POST',
        body: payload,
      });

      push.success({
        title: 'PIN Updated',
        message: response?.message || 'Your PIN has been reset successfully.',
      });

      return true;
    } catch (err: any) {
      errorMessage.value = err?.data?.message || 'Failed to reset PIN. Please verify your reset code and try again.';
      push.error({ title: 'Reset Failed', message: errorMessage.value });
      return false;
    } finally {
      loading.value = false;
    }
  }

  function filterNumericInput(value: string) {
    return value.replace(/\D/g, '');
  }

  return {
    step,
    loading,
    errorMessage,
    successMessage,
    expiresAt,
    devOtp,
    username,
    mobile,
    otp,
    pin,
    pinConfirmation,
    errors,
    requestOtp,
    resetPin,
    resetFlow,
    resetMessages,
    filterNumericInput,
  };
}
