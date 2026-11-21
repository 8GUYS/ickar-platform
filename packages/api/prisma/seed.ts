import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ICKAR production database...');

  // 1. Create Default Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ickar-global' },
    update: {},
    create: {
      name: 'ICKAR Global Platform',
      slug: 'ickar-global',
      customDomain: 'app.ickar.ng',
    },
  });
  console.log(`✅ Tenant configured: ${tenant.name} (${tenant.id})`);

  // 2. Create Admin Account
  const adminPasswordHash = await bcrypt.hash('ickar_admin_2026', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ickar.ng' },
    update: {},
    create: {
      tenantId: tenant.id,
      name: 'ICKAR Admin',
      email: 'admin@ickar.ng',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin account seeded: ${admin.email}`);

  // 3. Seed Catalog
  const sampleMedia = [
    {
      slug: 'the-wealth-of-the-digital-african',
      title: 'The Wealth of the Digital African',
      author: 'Dr. Emmanuel Adeyemi',
      narrator: 'Femi Williams',
      coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
      type: 'BUNDLE' as const,
      duration: '5 hrs 24 mins',
      pages: 240,
      rating: 4.9,
      priceKobo: 350000,
      isSubscriptionIncluded: true,
      category: 'Business & Wealth',
      description: 'An eye-opening masterclass on digital sovereignty, creator monetization, and building lasting value across African markets.',
      hlsManifestKey: 'media/audio/digital-african/master.m3u8',
      pdfKey: 'media/books/digital-african.pdf',
    },
    {
      slug: 'kingdom-mind-power-of-purpose',
      title: 'Kingdom Mind: The Power of Purpose',
      author: 'Pastor Paul Johnson',
      narrator: 'Paul Johnson',
      coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800',
      type: 'AUDIOBOOK' as const,
      duration: '4 hrs 12 mins',
      rating: 4.8,
      priceKobo: 250000,
      isSubscriptionIncluded: true,
      category: 'Faith & Leadership',
      description: 'Discover how to align personal ambition with divine purpose, building an unshakeable mindset for modern leadership.',
      hlsManifestKey: 'media/audio/kingdom-mind/master.m3u8',
    },
    {
      slug: 'tech-dynasty-of-lagos',
      title: 'The Tech Dynasty of Lagos',
      author: 'Kemi Bello',
      coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&q=80&w=800',
      type: 'EBOOK' as const,
      pages: 310,
      rating: 4.7,
      priceKobo: 200000,
      isSubscriptionIncluded: true,
      category: 'Technology',
      description: 'The untold narrative of startup founders navigating currency shifts, venture capital, and engineering triumphs in Yaba.',
      pdfKey: 'media/books/tech-dynasty.pdf',
    },
    {
      slug: 'african-voices-poems-of-resilience',
      title: 'African Voices: Poems of Resilience',
      author: 'Musa Danladi',
      narrator: 'Amina Sadiq',
      coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800',
      type: 'AUDIOBOOK' as const,
      duration: '2 hrs 45 mins',
      rating: 4.9,
      priceKobo: 180000,
      isSubscriptionIncluded: true,
      category: 'Culture & Arts',
      description: 'A rich compilation of spoken word and poetry celebrating heritage, strength, and the spirit of contemporary Africa.',
      hlsManifestKey: 'media/audio/african-voices/master.m3u8',
    },
  ];

  for (const item of sampleMedia) {
    await prisma.mediaItem.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug: item.slug },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        ...item,
      },
    });
  }
  console.log(`✅ Catalog populated with ${sampleMedia.length} titles`);
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
