'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import StepProgress from './StepProgress';
import Step1Data, { type Step1Data as Step1DataShape } from './Step1Data';
import Step2Payment from './Step2Payment';
import Step3Proof from './Step3Proof';
import Step4Confirmation from './Step4Confirmation';
import { translateRpcError } from '@/lib/utils';
import type {
  CreatedOrder,
  EventDetail,
  OrderDetail,
  PaymentConfig,
  PaymentMethod,
} from '@/lib/types';

interface PurchaseFlowProps {
  event: EventDetail;
  paymentMethods: PaymentConfig[];
  exchangeRate: number;
}

export default function PurchaseFlow({
  event,
  paymentMethods,
  exchangeRate,
}: PurchaseFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Step1DataShape | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [finalOrder, setFinalOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Scroll to top al cambiar de paso
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const ticketType = event.ticket_types[0];
  const totalUsd = (ticketType?.price_usd ?? 0) * (data?.quantity ?? 1);
  const totalBs = totalUsd * exchangeRate;

  async function handleStep1Submit(formData: Step1DataShape) {
    setData(formData);
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: order, error: rpcError } = await supabase
      .rpc('create_order', {
        p_event_slug: event.slug,
        p_ticket_type_id: ticketType.id,
        p_customer_name: formData.name,
        p_customer_cedula: formData.cedula,
        p_customer_email: formData.email || null,
        p_customer_phone: formData.phone,
        p_customer_age: formData.age,
        p_customer_gender: formData.gender,
        p_quantity: formData.quantity,
        p_men_count: formData.menCount,
        p_women_count: formData.womenCount,
        p_exchange_rate: exchangeRate,
      })
      .single<CreatedOrder>();

    setLoading(false);

    if (rpcError || !order) {
      setError(translateRpcError(rpcError?.message ?? ''));
      return;
    }

    setCreatedOrder(order);
    setStep(2);
  }

  function handleStep2Next(method: PaymentMethod) {
    setPaymentMethod(method);
    setStep(3);
  }

  async function handleStep3Next() {
    if (!createdOrder) return;
    setLoading(true);

    const supabase = createClient();
    const { data: order } = await supabase
      .rpc('get_order_by_access_token', { p_token: createdOrder.access_token })
      .single<OrderDetail>();

    setLoading(false);

    if (!order) {
      setError('No se pudo recuperar la orden.');
      return;
    }

    setFinalOrder(order);
    setStep(4);
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <StepProgress current={step} />

      <div className="rounded-2xl border border-red-950/60 bg-black/60 p-5 shadow-2xl shadow-red-950/20 sm:p-7">
        {error && (
          <p className="mb-5 rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {step === 1 && (
          <Step1Data
            event={event}
            initialData={data ?? undefined}
            onNext={handleStep1Submit}
            onBack={() => router.push(`/eventos/${event.slug}`)}
          />
        )}

        {step === 2 && data && (
          <Step2Payment
            methods={paymentMethods}
            totalUsd={totalUsd}
            exchangeRate={exchangeRate}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && createdOrder && paymentMethod && (
          <Step3Proof
            accessToken={createdOrder.access_token}
            paymentMethod={paymentMethod}
            totalBs={totalBs}
            onNext={handleStep3Next}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && finalOrder && <Step4Confirmation order={finalOrder} />}
      </div>
    </div>
  );
}