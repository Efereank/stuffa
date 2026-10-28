'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import StepProgress from './StepProgress';
import Step1Data, { type Step1Data as Step1DataShape } from './Step1Data';
import Step2Consumption from './Step2Consumption';
import Step3Payment from './Step3Payment';
import Step4Confirmation from './Step4Confirmation';
import { translateRpcError } from '@/lib/utils';
import type {
  ConsumptionProduct,
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
  consumptionProducts: ConsumptionProduct[];
}

interface CartItem {
  product_id: string;
  quantity: number;
}

export default function PurchaseFlow({
  event,
  paymentMethods,
  exchangeRate,
  consumptionProducts,
}: PurchaseFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Step1DataShape | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [finalOrder, setFinalOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [startTime, setStartTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  const ticketType = event.ticket_types[0];

  async function handleStep1Submit(formData: Step1DataShape) {
    setError(null);
    setIsExpired(false);
    setLoading(true);

    if (createdOrder) {
      await createClient()
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', createdOrder.id)
        .eq('status', 'pending');
      setCreatedOrder(null);
    }

    setData(formData);

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
        p_consumption_items: [], 
      })
      .single<CreatedOrder>();

    setLoading(false);

    if (rpcError || !order) {
      setError(translateRpcError(rpcError?.message ?? ''));
      return;
    }

    setStartTime(Date.now()); 
    setCreatedOrder(order);
    setStep(2);
  }

  async function handleStep2Next(items: CartItem[]) {
    if (isExpired) {
      setError('El tiempo expiró. Vuelve a empezar.');
      return;
    }

    setError(null);
    setLoading(true);

    if (!createdOrder) {
      setError('No se pudo recuperar la orden.');
      setLoading(false);
      return;
    }

    setCartItems(items);

    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('update_order_consumption', {
      p_access_token: createdOrder.access_token,
      p_consumption_items: items,
    });

    if (rpcError) {
      setLoading(false);
      setError(translateRpcError(rpcError?.message ?? ''));
      return;
    }

    const { data: updatedOrder } = await supabase
      .rpc('get_order_by_access_token', { p_token: createdOrder.access_token })
      .single<OrderDetail>();

    setLoading(false);

    if (!updatedOrder) {
      setError('Error al actualizar los totales.');
      return;
    }

    setCreatedOrder((prev) => ({
      ...prev!,
      total_usd: updatedOrder.total_usd,
      total_bs: updatedOrder.total_bs ?? prev!.total_bs,
      consumption_total_usd: updatedOrder.consumption_total_usd,
    }));

    setStep(3);
  }

  async function handleStep3Next(method: PaymentMethod) {
    if (isExpired) {
      setError('El tiempo expiró. Vuelve a empezar.');
      return;
    }

    setPaymentMethod(method);
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

  function handleExpire() {
    setIsExpired(true);
    setError('El tiempo para completar esta compra ha expirado. Por favor, vuelve a empezar.');
    
    setTimeout(() => {
      setStep(1);
      setCreatedOrder(null);
      setData(null);
      setCartItems([]);
      setPaymentMethod(null);
      setFinalOrder(null);
      setError(null);
      setIsExpired(false);
      setStartTime(0);
    }, 3000);
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

        {loading && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-sky-500/30 bg-sky-950/20 px-4 py-3 text-sm text-sky-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
            Procesando…
          </div>
        )}

        {step === 1 && (
          <Step1Data
            event={event}
            initialData={data ?? undefined}
            onNext={handleStep1Submit}
            onBack={() => window.location.assign(`/eventos/${event.slug}`)}
          />
        )}

        {step === 2 && data && (
          <Step2Consumption
            products={consumptionProducts}
            quantity={data.quantity}
            exchangeRate={exchangeRate}
            ticketPriceUsd={ticketType?.price_usd ?? 0}
            eventName={event.name}
            startTime={startTime}         
            onExpire={handleExpire}       
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && createdOrder && (
          <Step3Payment
            methods={paymentMethods}
            totalUsd={createdOrder.total_usd} 
            totalBs={createdOrder.total_bs}
            exchangeRate={exchangeRate}
            accessToken={createdOrder.access_token}
            cartItems={cartItems}
            startTime={startTime}         
            onExpire={handleExpire}       
            onNext={handleStep3Next}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && finalOrder && <Step4Confirmation order={finalOrder} />}
      </div>
    </div>
  );
}