import { getDictionary } from './dictionaries';
import HeroSection from '../../components/HeroSection';

export default async function Page({ params }: { params: { lang: 'en' | 'mr' } }) {
  const dict = await getDictionary(params.lang);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <HeroSection/>
    </main>
  );
}
