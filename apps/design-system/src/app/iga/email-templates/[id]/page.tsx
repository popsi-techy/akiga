import { redirect } from 'next/navigation';

export default function EmailTemplateDetailPage({ params }: { params: { id: string } }) {
  redirect(`/iga/email-templates?template=${params.id}`);
}
