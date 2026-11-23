"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function createTicketTypeAction(formData: FormData) {
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user) redirect('/login');
 const eventId=String(formData.get('event_id')??''); const name=String(formData.get('name')??'').trim(); const description=String(formData.get('description')??'').trim();
 const price=Number(formData.get('price')); const quantity=Number(formData.get('quantity')); const max=Number(formData.get('max_per_order')??6);
 if(!eventId||name.length<2||name.length>80||!Number.isFinite(price)||price<0||price>10000000||!Number.isInteger(quantity)||quantity<1||quantity>1000000||!Number.isInteger(max)||max<1||max>20) redirect(`/organizer/events/tickets?event=${encodeURIComponent(eventId)}&error=Check+the+ticket+details`);
 const {data:event}=await supabase.from('events').select('id,currency_exponent,organizer_id').eq('id',eventId).maybeSingle(); const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(!event||!profile||!['organizer','admin'].includes(profile.role)||(event.organizer_id!==user.id&&profile.role!=='admin')) redirect('/organizer/dashboard');
 const exponent=event.currency_exponent??2; const {error}=await supabase.from('ticket_types').insert({event_id:eventId,name,description,price_minor:Math.round(price*10**exponent),quantity_total:quantity,max_per_order:max,is_active:true});
 if(error) redirect(`/organizer/events/tickets?event=${encodeURIComponent(eventId)}&error=${encodeURIComponent(error.message)}`);
 redirect(`/organizer/events/tickets?event=${encodeURIComponent(eventId)}&created=1`);
}
