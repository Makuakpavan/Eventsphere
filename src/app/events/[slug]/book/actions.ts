"use server";
import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
export async function createBookingAction(formData:FormData){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); const slug=String(formData.get('slug')??''); const eventId=String(formData.get('event_id')??'');
 if(!user) redirect(`/login?next=${encodeURIComponent(`/events/${slug}/book`)}`);
 const items:{ticket_type_id:string;quantity:number}[]=[];
 for(const [key,value] of formData.entries()){if(key.startsWith('ticket_')){const quantity=Number(value);if(Number.isInteger(quantity)&&quantity>0)items.push({ticket_type_id:key.slice(7),quantity});}}
 if(!items.length) redirect(`/events/${slug}/book?error=Choose+at+least+one+ticket`);
 if(items.length>10) redirect(`/events/${slug}/book?error=Too+many+ticket+types`);
 const {data,error}=await supabase.rpc('reserve_event_tickets',{p_event_id:eventId,p_items:items});
 if(error) redirect(`/events/${slug}/book?error=${encodeURIComponent(error.message)}`);
 redirect(`/bookings/${data}`);
}
