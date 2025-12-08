'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function LogoImage() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // 根据主题选择 logo
  const isDark = theme === 'dark';
  const logoSrc = isDark ? '/images/Logo-light.png' : '/images/Logo-dark.png';
  const altText = isDark ? 'VovBlog Logo Light' : 'VovBlog Logo Dark';

  // 防止 hydration 不匹配，未挂载时显示默认 logo
  const displaySrc = mounted ? logoSrc : '/images/Logo-dark.png';
  const displayAlt = mounted ? altText : 'VovBlog Logo';

  return (
    <Link href="/" className="hover:opacity-80 transition-opacity">
      <Image
        key={displaySrc}
        src={displaySrc}
        alt={displayAlt}
        width={1844}
        height={818}
        priority
        sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, (max-width: 1024px) 384px, 512px"
        className="h-16 sm:h-20 md:h-24 lg:h-32 w-auto"
        style={{ display: mounted ? 'block' : 'none' }}
      />
    </Link>
  );
}
