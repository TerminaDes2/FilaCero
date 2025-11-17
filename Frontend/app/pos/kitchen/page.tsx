import { redirect } from 'next/navigation';

export default function KitchenPage() {
  redirect('/pos?view=kitchen');
}
