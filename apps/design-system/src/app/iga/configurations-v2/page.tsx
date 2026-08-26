import { redirect } from 'next/navigation';

/** Former v2 hub URL — the grid now lives at System Settings. */
export default function Page() {
  redirect('/iga/configurations');
}
